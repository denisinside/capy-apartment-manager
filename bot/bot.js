import { Telegraf } from "telegraf";
import { startMessage, sendContractTemplates } from "./messages.js";
import subscriptionService from "../services/subscriptionService.js";

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