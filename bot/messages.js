import { Input } from "telegraf";
import apartmentService from '../services/apartmentService.js';
import { combineApartmentImages } from '../utils/apartmentImageCombiner.js';

export function startMessage(ctx, chat_id) {
    ctx.telegram.sendPhoto(chat_id, Input.fromLocalFile("data/images/hello.png"), {
        caption: "Привіт! Я бот для пошуку оголошень про квартири у твоєму місті.\n Щоб почати, обери будь-яку з опцій нижче.",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Пошук квартир у Києві", callback_data: "search_kyiv" }],
            [{ text: "Пошук квартир у Львові", callback_data: "search_lviv" }],
            [{ text: "Пошук квартир у Харкові", callback_data: "search_kharkiv" }],
            [{ text: "Пошук квартир у Дніпрі", callback_data: "search_dnipro" }],
            [{ text: "Пошук квартир у Одесі", callback_data: "search_odesa" }],
            [{ text: "Пошук квартир у Полтаві", callback_data: "search_poltava" }],
            [{ text: "Пошук квартир у Чернігові", callback_data: "search_chernigov" }],
            [{ text: "Пошук квартир у Житомирі", callback_data: "search_zhytomyr" }],
          ],
        },
      });
}

export async function searchApartments(ctx, chat_id, city) {
    try {
        console.log(`Starting apartment search for city: ${city}`);
        const apartments = await apartmentService.getApartments({city: city});

        if (!apartments || apartments.length === 0) {
            await ctx.reply(`На жаль, я не знайшов квартир у місті ${city}. Спробуйте інше місто або змініть параметри пошуку.`);
            return;
        }

        await ctx.reply(`Ось що я знайшов у місті ${city}:`);
        await sendApartments(ctx, chat_id, apartments);
    } catch (error) {
        console.error(`Error in searchApartments for city ${city}:`, error);
        await ctx.reply(`Виникла помилка при пошуку квартир. Будь ласка, спробуйте пізніше.`);
    }
}

export async function sendFavouriteApartmentsUpdates(bot, chat_id, apartments) {
    try {
        for (const apartment of apartments) {
            const priceChange = apartment.update_history.findLast(history => history.event_type === 'price_changed').details;
            const message = `❗ Ціна квартири змінилася!\n🏠 ${apartment.apartment.address.street}, ${apartment.apartment.address.district}, ${apartment.apartment.address.house_number}\n💰 ${priceChange}`;
            
            try {
                const combinedImage = await combineApartmentImages(apartment.apartment.photo);
                await bot.telegram.sendPhoto(chat_id, Input.fromBuffer(combinedImage), {
                    caption: message,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Подивитися", url: apartment.apartment.link }],
                        ],
                    },
                });
            } catch (error) {
                console.error(`Error sending apartment ${apartment._id}:`, error);
                // Fallback до однієї фотографії
                await bot.telegram.sendPhoto(chat_id, Input.fromURL(apartment.apartment.photo[0]), {
                    caption: message,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Подивитися", url: apartment.apartment.link }],
                        ],
                    },
                });
            }
        }
    } catch (error) {
        console.error('Error sending apartments:', error);
        await bot.telegram.sendMessage(chat_id, 'Виникла помилка при відправці інформації про квартири.');
    }
}

export async function sendApartmentsWithoutContext(bot, chat_id, apartments) {
    try {
        for (const apartment of apartments) {
            await sendApartmentWithoutContext(bot, chat_id, apartment);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    } catch (error) {
        console.error('Error sending apartments:', error);
        await bot.telegram.sendMessage(chat_id, 'Виникла помилка при відправці інформації про квартири.');
    }
}

export async function sendApartmentWithoutContext(bot, chat_id, apartment) {
    try {
        if (!apartment.apartment.photo || apartment.apartment.photo.length === 0) {
            console.warn(`No photos for apartment ${apartment._id}`);
            return;
        }

        try {
            const combinedImage = await combineApartmentImages(apartment.apartment.photo);
            await bot.telegram.sendPhoto(chat_id, Input.fromBuffer(combinedImage), {
                caption: sendApartmentDetails(apartment),
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Подивитися", url: apartment.apartment.link }],
                    ],
                },
            });
        } catch (error) {
            console.error(`Error sending apartment ${apartment._id}:`, error);
            // Fallback до однієї фотографії
            await bot.telegram.sendPhoto(chat_id, Input.fromURL(apartment.apartment.photo[0]), {
                caption: sendApartmentDetails(apartment),
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Подивитися", url: apartment.apartment.link }],
                    ],
                },
            });
        }
    } catch (error) {
        console.error(`Error sending apartment ${apartment._id}:`, error);
    }
}

async function sendApartments(ctx, chat_id, apartments) {
    try {
        for (const apartment of apartments) {
            await sendApartment(ctx, chat_id, apartment);
        }
    } catch (error) {
        console.error('Error sending apartments:', error);
        await ctx.reply('Виникла помилка при відправці інформації про квартири.');
    }
}

async function sendApartment(ctx, chat_id, apartment) {
    try {
        if (!apartment.apartment.photo || apartment.apartment.photo.length === 0) {
            console.warn(`No photos for apartment ${apartment._id}`);
            return;
        }

        await ctx.telegram.sendPhoto(chat_id, Input.fromURL(apartment.apartment.photo[0]), {
            caption: sendApartmentDetails(apartment),
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Подивитися", url: apartment.apartment.link }],
                ],
            },
        });
    } catch (error) {
        console.error(`Error sending apartment ${apartment._id}:`, error);
    }
}

function sendApartmentDetails(apartment) {
    try {
        let description = apartment.apartment.description.advert_description;
        description = description.replace(/<[^>]*>?/g, '');
        description = description.replace(/&nbsp;/g, ' ');
        description = description.replace(/&quot;/g, '"');
        description = description.replace(/&apos;/g, "'");
        description = description.replace(/&amp;/g, '&');
        description = description.replace(/&lt;/g, '<');
        description = description.replace(/&gt;/g, '>');
        description = description.replace(/<br\/>/g, '\n');
        description = description.replace(/<br>/g, '\n');
        if (description.length > 1000) {
            description = description.substring(0, 1000) + '...';
        }

        const stringBuilder = [];
        stringBuilder.push(`🏠 ${apartment.apartment.address.street}, ${apartment.apartment.address.district}, ${apartment.apartment.address.house_number}`);
        stringBuilder.push(`💰 ${apartment.apartment.price.price_number} ${apartment.apartment.price.currency}`);
        stringBuilder.push(``);
        stringBuilder.push(`${apartment.apartment.characteristics.room_count}к., ${apartment.apartment.characteristics.floor} / ${apartment.apartment.characteristics.max_floor} поверх, ${apartment.apartment.characteristics.area.total} / ${apartment.apartment.characteristics.area.living} / ${apartment.apartment.characteristics.area.kitchen} м²`);
        stringBuilder.push(`${apartment.apartment.characteristics.house_type}, ${apartment.apartment.characteristics.room_planning}`);
        stringBuilder.push(`${apartment.apartment.characteristics.state}`);
        stringBuilder.push(``);
        stringBuilder.push(`${description}`);
        return stringBuilder.join("\n");
    } catch (error) {
        console.error('Error formatting apartment details:', error);
        return 'Помилка при форматуванні деталей квартири';
    }
}
