import dotenv from 'dotenv';
dotenv.config();

import { Input } from "telegraf";
import { combineApartmentImages } from '../utils/apartmentImageCombiner.js';

const WEB_APP_URL = process.env.WEB_APP_URL;
const BOT_STARTAPP_URL = process.env.BOT_STARTAPP_URL;

// --- Початкове повідомлення ---

export function startMessage(ctx, chat_id) {
    ctx.telegram.sendPhoto(chat_id, Input.fromLocalFile("data/images/hello.png"), {
        caption: "Привіт! Я бот для пошуку оголошень про квартири у твоєму місті.\n\nОбери опцію:",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔍 Пошук", web_app: { url: `${WEB_APP_URL}/search` } }],
            [{ text: "⭐ Обране", web_app: { url: `${WEB_APP_URL}/favourites` } }],
            [{ text: "🔔 Нові", web_app: { url: `${WEB_APP_URL}/new` } }],
            [{ text: "⚙️ Налаштування підписок", web_app: { url: `${WEB_APP_URL}/subscription-settings` } }],
            [{ text: "📄 Шаблони договорів", callback_data: "share_contract" }],
          ],
        },
      });
}

function formatApartmentDetails(apartment) {
    try {
        let description = apartment.apartment.description.advert_description || '';
        description = description.replace(/<[^>]*>?/g, '');
        description = description.replace(/&nbsp;/g, ' ');
        description = description.replace(/&quot;/g, '"');
        description = description.replace(/&apos;/g, "'");
        description = description.replace(/&amp;/g, '&');
        description = description.replace(/&lt;/g, '<');
        description = description.replace(/&gt;/g, '>');
        description = description.replace(/<br\/>/g, '\n');
        description = description.replace(/<br>/g, '\n');
        if (description.length > 800) {
            description = description.substring(0, 800) + '...';
        }

        const details = [
            `📍 <b>${apartment.apartment.address.street}, ${apartment.apartment.address.district}${apartment.apartment.address.house_number ? ', ' + apartment.apartment.address.house_number : ''}</b>`,
            `💰 <b>${apartment.apartment.price.price_number} ${apartment.apartment.price.currency}</b>`,
            ``,
            `🛏️ ${apartment.apartment.characteristics.room_count}к.`,
            `🪜 ${apartment.apartment.characteristics.floor} / ${apartment.apartment.characteristics.max_floor} поверх`,
            `📐 ${apartment.apartment.characteristics.area.total} м² (заг.) / ${apartment.apartment.characteristics.area.living} м² (житл.) / ${apartment.apartment.characteristics.area.kitchen} м² (кухня)`,
            `🏗️ ${apartment.apartment.characteristics.house_type}`,
            `🛠️ ${apartment.apartment.characteristics.state}`,
            ``,
            `${description}`
        ];
        return details.join("\n").trim();
    } catch (error) {
        console.error(`Error formatting apartment details for ${apartment._id}:`, error);
        return 'Помилка при форматуванні деталей квартири';
    }
}


// --- Надсилання квартир (загальні функції) ---

async function sendSingleApartment(bot, chat_id, apartment, replyMarkup) {
    const caption = formatApartmentDetails(apartment);
    const photos = apartment.apartment.photo;

    if (!photos || photos.length === 0) {
        console.warn(`No photos for apartment ${apartment._id}, sending text message.`);
        await bot.telegram.sendMessage(chat_id, caption, {
            parse_mode: 'HTML',
            reply_markup: replyMarkup,
            disable_web_page_preview: true
        });
        return;
    }

    try {
        const combinedImage = await combineApartmentImages(photos);
        await bot.telegram.sendPhoto(chat_id, Input.fromBuffer(combinedImage), {
            caption: caption,
            parse_mode: 'HTML',
            reply_markup: replyMarkup,
        });
    } catch (combineError) {
        console.error(`Error combining images for apartment ${apartment._id}, falling back to single photo:`, combineError);
        try {
            await bot.telegram.sendPhoto(chat_id, Input.fromURL(photos[0]), {
                caption: caption,
                parse_mode: 'HTML',
                reply_markup: replyMarkup,
            });
        } catch (fallbackError) {
            console.error(`Error sending fallback single photo for apartment ${apartment._id}:`, fallbackError);
            await bot.telegram.sendMessage(chat_id, caption, {
                 parse_mode: 'HTML',
                 reply_markup: replyMarkup,
                 disable_web_page_preview: true
            });
        }
    }
}

// --- Надсилання нових квартир (для підписок) ---

export async function sendApartmentsWithoutContext(bot, chat_id, apartments) {
    try {
        await bot.telegram.sendMessage(chat_id, `🔔 Знайдено нові квартири за вашими критеріями:`);
        for (const apartment of apartments) {
            const replyMarkup = {
                inline_keyboard: [
                    [
                        { text: "➡️ Детальніше в додатку", web_app: { url: `${WEB_APP_URL}/apartment/${apartment._id}` } },
                        { text: "🆕 Всі нові", web_app: { url: `${WEB_APP_URL}/new` } }
                    ],
                     [{ text: "🌐 Відкрити на сайті", url: apartment.apartment.link }]
                ],
            };
            await sendSingleApartment(bot, chat_id, apartment, replyMarkup);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    } catch (error) {
        console.error('Error sending new apartments:', error);
        await bot.telegram.sendMessage(chat_id, 'Виникла помилка при відправці інформації про нові квартири.');
    }
}

// --- Надсилання оновлень обраних квартир (зміна ціни) ---

export async function sendFavouriteApartmentsUpdates(bot, chat_id, apartments) {
    try {
        for (const apartment of apartments) {
            const priceChangeHistory = apartment.update_history?.findLast(history => history.event_type === 'price_changed');
            if (!priceChangeHistory) continue;

            const priceDetails = priceChangeHistory.details || 'Інформація про зміну ціни відсутня.';
            const message = `❗ <b>Зміна ціни для обраної квартири</b>\n${priceDetails}\n\n${formatApartmentDetails(apartment)}`;

             const replyMarkup = {
                inline_keyboard: [
                    [{ text: "➡️ Детальніше в додатку", web_app: { url: `${WEB_APP_URL}/apartment/${apartment._id}` } }],
                    [{ text: "🌐 Відкрити на сайті", url: apartment.apartment.link }]
                ],
            };

            await sendSingleApartment(bot, chat_id, apartment, replyMarkup);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    } catch (error) {
        console.error('Error sending favorite apartments updates:', error);
        await bot.telegram.sendMessage(chat_id, 'Виникла помилка при відправці оновлень обраних квартир.');
    }
}

// --- Надсилання шаблонів договорів ---

export async function sendContractTemplates(bot, chat_id) {
    try {
        await bot.telegram.sendMessage(chat_id, '📄 Ось шаблони договорів оренди:');

        const pdfPath = 'data/contracts/zrazok-dogovoru-orendy-zhytla.pdf';
        const docxPath = 'data/contracts/zrazok-dogovoru-orendy-zhytla.docx';

        try {
             await bot.telegram.sendDocument(chat_id, Input.fromLocalFile(pdfPath));
        } catch (pdfError) {
             console.error('Error sending PDF contract:', pdfError);
             await bot.telegram.sendMessage(chat_id, 'Помилка при відправці PDF шаблону.');
        }

        try {
            await bot.telegram.sendDocument(chat_id, Input.fromLocalFile(docxPath), {
                 reply_markup: {
                     inline_keyboard: [
                         [{ text: "📝 Відкрити сторінку договорів", web_app: { url: `${WEB_APP_URL}/contracts` } }]
                     ]
                 }
             });
        } catch (docxError) {
            console.error('Error sending DOCX contract:', docxError);
            await bot.telegram.sendMessage(chat_id, 'Помилка при відправці DOCX шаблону.');
             await bot.telegram.sendMessage(chat_id, 'Натисніть кнопку нижче, щоб перейти до сторінки договорів у додатку.', {
                 reply_markup: {
                     inline_keyboard: [
                         [{ text: "📝 Відкрити сторінку договорів", web_app: { url: `${WEB_APP_URL}/contracts` } }]
                     ]
                 }
             });
        }

    } catch (error) {
        console.error('Error sending contract templates:', error);
        await bot.telegram.sendMessage(chat_id, 'Виникла загальна помилка при відправці шаблонів договорів.');
    }
}