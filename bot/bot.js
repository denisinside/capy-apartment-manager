import { Telegraf } from "telegraf";
import { startMessage, sendContractTemplates } from "./messages.js";
import subscriptionService from "../services/subscriptionService.js";
import apartmentService from "../services/apartmentService.js";

let bot;

const startBot = async () => {
    try {
        bot = new Telegraf(process.env.BOT_TOKEN);
        
        bot.launch();

        bot.start((ctx) => {
            const chat_id = ctx.chat.id;
            console.log(`Received /start command from chat_id: ${chat_id}`);
            startMessage(ctx, chat_id);
        });
          
        bot.on("callback_query", async (ctx) => {
            const chat_id = ctx.chat.id;
            const data = ctx.callbackQuery.data;
            console.log(`Received callback_query: ${data} from chat_id: ${chat_id}`);

            if (data === "share_contract") {
                try {
                     await ctx.answerCbQuery('Зараз надішлю шаблони...');
                     await sendContractTemplates(bot, chat_id);
                } catch (error) {
                    console.error(`Error processing share_contract for chat_id ${chat_id}:`, error);
                    await ctx.reply('Виникла помилка при надсиланні шаблонів договорів.');
                    await ctx.answerCbQuery('Помилка при надсиланні шаблонів').catch(e => console.error("Failed to answer callback query on error:", e)); 
                }
            } else if (data.startsWith('get_rieltor_contact_')) {
                const apartmentId = data.replace('get_rieltor_contact_', '');
                try {
                     await ctx.answerCbQuery('Надсилаю контакт рієлтора...');
                    const apartmentData = await apartmentService.getApartmentById(apartmentId);

                    if (!apartmentData || !apartmentData.apartment?.rieltor?.rieltor_phone_number || !apartmentData.apartment?.rieltor?.rieltor_name) {
                        console.error(`Rieltor data not found for apartment ${apartmentId}`);
                        await ctx.reply('Вибачте, контактну інформацію рієлтора для цього оголошення не знайдено.');
                        return;
                    }

                    const rieltor = apartmentData.apartment.rieltor;
                    const rieltorName = rieltor.rieltor_name;
                    const rieltorPhoneNumber = rieltor.rieltor_phone_number;

                    // Reuse name splitting logic
                    const nameParts = rieltorName.trim().split(' ');
                    const firstName = nameParts[0];
                    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

                    // Reuse keyboard logic (optional, could simplify)
                    const BOT_STARTAPP_URL = process.env.BOT_STARTAPP_URL; // Ensure env var is available
                    const keyboard = [];
                    const apartmentButtonUrl = apartmentId ? `${BOT_STARTAPP_URL}${apartmentId}` : null;
                    const rieltorPageUrl = `${BOT_STARTAPP_URL}${encodeURIComponent(rieltorName)}`;
                    if (apartmentButtonUrl) {
                        keyboard.push([{ text: "🏠 Переглянути це оголошення", url: apartmentButtonUrl }]);
                    }
                    keyboard.push([{ text: "👤 Всі оголошення рієлтора", url: rieltorPageUrl }]);
                    const replyMarkup = { inline_keyboard: keyboard };

                     await bot.telegram.sendContact(
                         parseInt(chat_id, 10),
                         rieltorPhoneNumber,
                         firstName,
                         {
                             last_name: lastName,
                             reply_markup: replyMarkup,
                         }
                     );
                } catch (error) {
                    console.error(`Error processing get_rieltor_contact for chat_id ${chat_id}, apartment ${apartmentId}:`, error);
                    await ctx.reply('Виникла помилка при надсиланні контакту рієлтора.');
                    await ctx.answerCbQuery('Помилка при надсиланні контакту').catch(e => console.error("Failed to answer callback query on error:", e));
                }
            } else {
                console.warn(`Received unexpected callback_query: ${data} from chat_id: ${chat_id}`);
                await ctx.answerCbQuery('Ця дія більше не підтримується.');
            }
        });

        bot.on('message', async (ctx) => {
            if (ctx.message && ctx.message.web_app_data) {
                const chat_id = ctx.chat.id;
                const data = ctx.message.web_app_data.data;
                console.log(`Received web_app_data: ${data} from chat_id: ${chat_id}`);
            }
        });

        console.log(`Bot is running`);
        return bot;
    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
};

export { startBot };