import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { bot } from '../server.js';
import apartmentService from '../services/apartmentService.js';
import { combineApartmentImages } from '../utils/apartmentImageCombiner.js';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// bot interaction routes do not require Telegram WebApp initData validation

// --- Допоміжна функція для екранування Markdown V1 ---
function escapeMarkdownV1(text) {
  if (!text) return '';
  // Екрануємо символи _, *, `, \ та [
  return text.replace(/([_*`[\]\\])/g, '\\$1'); // Додаємо екранування для \ та [
}

// --- Ініціалізація Firebase Admin SDK ---
try {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
         console.warn("WARNING: GOOGLE_APPLICATION_CREDENTIALS env var not set. Firebase Admin SDK might not initialize correctly if not running on Google Cloud.");
    }
     if (!admin.apps.length) {
         admin.initializeApp({
             credential: admin.credential.applicationDefault(),
             storageBucket: process.env.FIREBASE_STORAGE_BUCKET
         });
         console.log('Firebase Admin SDK initialized.');
     }
} catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
}

// Отримуємо доступ до Storage Bucket
const storageBucket = admin.storage().bucket();

// POST /api/bot/prepare-contract-share
router.post('/prepare-contract-share', async (req, res, next) => {
    const { userId } = req.body;
    const BASE_PUBLIC_URL = process.env.WEB_APP_URL;
    const BOT_STARTAPP_URL = process.env.BOT_STARTAPP_URL;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    if (!BASE_PUBLIC_URL) {
        console.error('WEB_APP_URL environment variable is not set for public files!');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const pdfPublicUrl = process.env.PDF_CONTRACT_URL;

    try {
        const inlineQueryResult = {
            type: 'document',
            id: `contract_share_pdf_${userId}_${Date.now()}`,
            title: 'Шаблон договору оренди (PDF)',
            document_url: pdfPublicUrl,
            mime_type: 'application/pdf',
            caption: '📄 Ось шаблон договору оренди у форматі PDF. Натисніть кнопку нижче, щоб відкрити сторінку з договорами та завантажити інші формати.',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '📝 Відкрити сторінку договорів',
                            url: `${BOT_STARTAPP_URL}contracts`,
                        },
                    ],
                ],
            },
            description: 'Поділитися PDF шаблоном договору оренди',
        };

        const response = await bot.telegram.callApi('savePreparedInlineMessage', {
            user_id: parseInt(userId, 10),
            result: JSON.stringify(inlineQueryResult),
            allow_user_chats: true,
            allow_bot_chats: true,
            allow_group_chats: true,
            allow_channel_chats: false,
        });

        console.log('savePreparedInlineMessage response:', response);

        if (response && response.id) {
            res.json({ success: true, preparedMessageId: response.id });
        } else {
            throw new Error('Failed to get prepared message ID from Telegram API');
        }

    } catch (error) {
        console.error('Error in /prepare-contract-share:', error);
        if (error.response && error.description) {
            console.error('Telegram API Error:', error.description);
            return res.status(500).json({ success: false, message: `Telegram API error: ${error.description}` });
        }
        next(error);
    }
});

// POST /api/bot/prepare-apartment-share
router.post('/prepare-apartment-share', async (req, res, next) => {
    const { userId, apartmentId } = req.body;
    const WEB_APP_URL = process.env.WEB_APP_URL;
    const BOT_STARTAPP_URL = process.env.BOT_STARTAPP_URL;

    if (!userId || !apartmentId) {
        return res.status(400).json({ success: false, message: 'User ID and Apartment ID are required' });
    }
    if (!storageBucket) {
        console.warn('No Firebase Storage Bucket configured; images will use direct URLs');
    }
    if (!WEB_APP_URL || !BOT_STARTAPP_URL) {
        console.error('WEB_APP_URL or BOT_STARTAPP_URL environment variable is not set!');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    let storageFilePath = null;

    try {
        const apartmentData = await apartmentService.getApartmentById(apartmentId);
        if (!apartmentData) {
            return res.status(404).json({ success: false, message: 'Apartment not found' });
        }
        const apartment = apartmentData.apartment || apartmentData;

        let combinedImageBuffer = null;
        let imageUrlForSharing = apartment.photo && apartment.photo.length ? apartment.photo[0] : null;

        if (apartment.photo && apartment.photo.length > 0) {
            if (storageBucket) {
                try {
                    combinedImageBuffer = await combineApartmentImages(apartment.photo);
                    storageFilePath = `share-images/apartments/${apartmentId}-${uuidv4()}.jpeg`;
                    const file = storageBucket.file(storageFilePath);
                    await file.save(combinedImageBuffer, {
                        metadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=300' }
                    });
                    await file.makePublic();
                    imageUrlForSharing = file.publicUrl();
                    console.log(`Uploaded image to Storage. URL: ${imageUrlForSharing}`);
                } catch (uploadError) {
                    console.error(`Failed to combine or upload image for apartment ${apartmentId}:`, uploadError);
                    console.warn('Using first photo URL as fallback');
                }
            } else {
                console.log('Skipping image upload; using direct photo URL');
            }
        }

        let descriptionText = apartment.description?.advert_description || '';
        descriptionText = descriptionText.replace(/<[^>]*>?/gm, '');
        descriptionText = descriptionText.replace(/\s+/g, ' ').trim();
        if (descriptionText.length > 300) {
            descriptionText = descriptionText.substring(0, 300) + '...';
        }

        const title = `${apartment.characteristics.room_count}к квартира, ${apartment.address.street}`;
        const locationInfo = `${apartment.address.district || ''}${apartment.address.district ? ', ' : ''}${apartment.address.city}`;
        const priceInfo = `${apartment.price.price_number} ${apartment.price.currency}/міс`;
        const apartmentIdValue = apartment._id || apartmentId;
        const apartmentShareUrl = `${BOT_STARTAPP_URL}${apartmentIdValue}`;

        const escapedTitle = escapeMarkdownV1(title);
        const escapedLocationInfo = escapeMarkdownV1(locationInfo);
        const escapedPriceInfo = escapeMarkdownV1(priceInfo);
        const escapedDescriptionText = escapeMarkdownV1(descriptionText);
        const escapedApartmentShareUrl = escapeMarkdownV1(apartmentShareUrl);

        const caption = `🏠 *${escapedTitle}*\n📍 ${escapedLocationInfo}\n💰 ${escapedPriceInfo}\n\n${escapedDescriptionText}\n\n🔗 Посилання: ${escapedApartmentShareUrl}`;

        const inlineQueryResult = {
            type: 'photo',
            id: `apt_share_photo_${apartmentId}_${userId}_${Date.now()}`,
            photo_url: imageUrlForSharing,
            thumb_url: imageUrlForSharing,
            caption: caption,
            parse_mode: 'Markdown',
            reply_markup: {
                 inline_keyboard: [
                     [
                         {
                             text: '➡️ Переглянути в додатку',
                             url: apartmentShareUrl,
                         },
                     ],
                 ],
             },
        };

        console.log(`Preparing apartment photo share message for user: ${userId}, apartment: ${apartmentId}`);

        const response = await bot.telegram.callApi('savePreparedInlineMessage', {
            user_id: parseInt(userId, 10),
            result: JSON.stringify(inlineQueryResult),
            allow_user_chats: true,
            allow_bot_chats: true,
            allow_group_chats: true,
            allow_channel_chats: false,
        });

        console.log('savePreparedInlineMessage response:', response);

        if (response && response.id) {
            res.json({ success: true, preparedMessageId: response.id });
        } else {
            throw new Error('Failed to get prepared message ID from Telegram API');
        }

    } catch (error) {
        console.error(`Error in /prepare-apartment-share for apartment ${apartmentId}:`, error);
        if (error.response && error.description) {
            console.error('Telegram API Error:', error.description);
            return res.status(500).json({ success: false, message: `Telegram API error: ${error.description}` });
        } else if (error.message === 'Apartment not found') {
             return res.status(404).json({ success: false, message: 'Apartment not found' });
        }
        next(error);
    }
});

// POST /api/bot/prepare-rieltor-share - Для кнопки "Поділитися"
router.post('/prepare-rieltor-share', async (req, res, next) => {
    const { userId, rieltorName, rieltorPhoneNumber, rieltorPhotoUrl, apartmentId } = req.body;
    const BOT_STARTAPP_URL = process.env.BOT_STARTAPP_URL;

    if (!userId || !rieltorName || !rieltorPhoneNumber) {
        return res.status(400).json({ success: false, message: 'User ID, Rieltor Name, and Phone Number are required' });
    }
    if (!BOT_STARTAPP_URL) {
        console.error('BOT_STARTAPP_URL environment variable is not set!');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    // Basic name splitting (can be improved)
    const nameParts = rieltorName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

    try {
        const keyboard = [];
        const apartmentButtonUrl = apartmentId ? `${BOT_STARTAPP_URL}${apartmentId}` : null;
        const rieltorPageUrl = `${BOT_STARTAPP_URL}rieltor/${encodeURIComponent(rieltorName)}`;

        if (apartmentButtonUrl) {
            keyboard.push([{ text: "🏠 Переглянути це оголошення", url: apartmentButtonUrl }]);
        }
        keyboard.push([{ text: "👤 Всі оголошення рієлтора", url: rieltorPageUrl }]);

        const inlineQueryResult = {
            type: 'contact',
            id: `rieltor_share_${userId}_${Date.now()}`,
            phone_number: rieltorPhoneNumber,
            first_name: firstName,
            ...(lastName && { last_name: lastName }), // Add last_name only if it exists
            ...(rieltorPhotoUrl && { thumb_url: rieltorPhotoUrl }), // Use photo as thumbnail
            reply_markup: {
                inline_keyboard: keyboard
            }
        };

        console.log(`Preparing rieltor contact share message for user: ${userId}, Rieltor: ${rieltorName}, Phone: ${rieltorPhoneNumber}`);

        const response = await bot.telegram.callApi('savePreparedInlineMessage', {
            user_id: parseInt(userId, 10),
            result: JSON.stringify(inlineQueryResult),
            allow_user_chats: true,
            allow_bot_chats: true,
            allow_group_chats: true,
            allow_channel_chats: true, // Allow sharing to channels too
        });

        console.log('savePreparedInlineMessage (rieltor) response:', response);

        if (response && response.id) {
            res.json({ success: true, preparedMessageId: response.id });
        } else {
            throw new Error('Failed to get prepared message ID from Telegram API for rieltor contact');
        }

    } catch (error) {
        console.error(`Error in /prepare-rieltor-share for rieltor ${rieltorName}:`, error);
        if (error.response && error.description) {
            console.error('Telegram API Error:', error.description);
            return res.status(500).json({ success: false, message: `Telegram API error: ${error.description}` });
        }
        next(error);
    }
});

// POST /api/bot/send-rieltor-contact-to-user - Для кнопки "Набрати"
router.post('/send-rieltor-contact-to-user', async (req, res, next) => {
    const { userId, rieltorName, rieltorPhoneNumber, rieltorPhotoUrl, apartmentId } = req.body;
    const BOT_STARTAPP_URL = process.env.BOT_STARTAPP_URL;

    if (!userId || !rieltorName || !rieltorPhoneNumber) {
        return res.status(400).json({ success: false, message: 'User ID, Rieltor Name, and Phone Number are required' });
    }
    if (!BOT_STARTAPP_URL) {
        console.error('BOT_STARTAPP_URL environment variable is not set!');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
    }
    if (!bot) {
        console.error('Bot instance is not available!');
        return res.status(500).json({ success: false, message: 'Bot service unavailable' });
    }

    const nameParts = rieltorName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

    try {
        const keyboard = [];
        const apartmentButtonUrl = apartmentId ? `${BOT_STARTAPP_URL}${apartmentId}` : null;
        const rieltorPageUrl = `${BOT_STARTAPP_URL}rieltor/${encodeURIComponent(rieltorName)}`;
        console.log(`rieltorPageUrl: ${rieltorPageUrl}`);
        if (apartmentButtonUrl) {
            keyboard.push([{ text: "🏠 Переглянути це оголошення", url: apartmentButtonUrl }]);
        }
        keyboard.push([{ text: "👤 Всі оголошення рієлтора", url: rieltorPageUrl }]);

        const replyMarkup = { inline_keyboard: keyboard };

        console.log(`Sending rieltor contact directly to user: ${userId}, Rieltor: ${rieltorName}, Phone: ${rieltorPhoneNumber}`);

        await bot.telegram.sendContact(
            parseInt(userId, 10),
            rieltorPhoneNumber,
            firstName,
            {
                last_name: lastName,
                reply_markup: replyMarkup,
            }
        );

        console.log(`Successfully sent contact to user ${userId}`);
        res.json({ success: true, message: 'Contact sent successfully' });

    } catch (error) {
        console.error(`Error in /send-rieltor-contact-to-user for user ${userId}, rieltor ${rieltorName}:`, error);
        if (error.response && error.description) {
            console.error('Telegram API Error:', error.description);
             if (error.description.includes('bot was blocked by the user')) {
                 return res.status(403).json({ success: false, message: `Помилка Telegram: Бот заблокований користувачем.` });
             } else if (error.description.includes('chat not found')) {
                  return res.status(404).json({ success: false, message: `Помилка Telegram: Чат з користувачем не знайдено.` });
             }
            return res.status(500).json({ success: false, message: `Помилка Telegram: ${error.description}` });
        }
        // Загальна помилка сервера
        return res.status(500).json({ success: false, message: 'Internal server error while sending contact' });
    }
});


export default router;