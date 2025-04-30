import { Telegraf } from "telegraf";
import { startMessage, searchApartments } from "./messages.js";
import subscriptionService from "../services/subscriptionService.js";

let bot;

const startBot = async () => {
    try {
        bot = new Telegraf(process.env.BOT_TOKEN);
        
        bot.launch();

        bot.start((ctx) => {
            const chat_id = ctx.chat.id;
            startMessage(ctx, chat_id);
        });
          
        bot.on("callback_query", (ctx) => {
            const chat_id = ctx.chat.id;
            const data = ctx.callbackQuery.data;
            if (data === "search_kyiv") {
                ctx.reply("Я почав пошук квартир у Києві. Це може зайняти деякий час...");
                subscriptionService.createSubscription(chat_id, {city: "Київ"});
            } else if (data === "search_lviv") {
                ctx.reply("Я почав пошук квартир у Львові. Це може зайняти деякий час...");
                subscriptionService.createSubscription(chat_id, {city: "Львів", price: {min: 0, max: 12000}});
            } else if (data === "search_kharkiv") {
                ctx.reply("Я почав пошук квартир у Харкові. Це може зайняти деякий час...");
                subscriptionService.createSubscription(chat_id, {city: "Харків", rooms: {min: 1, max: 1}});
            } else if (data === "search_dnipro") {
                ctx.reply("Я почав пошук квартир у Дніпрі. Це може зайняти деякий час...");
                searchApartments(ctx, chat_id, "Дніпро");
            } else if (data === "search_odesa") {
                ctx.reply("Я почав пошук квартир у Одесі. Це може зайняти деякий час...");
                searchApartments(ctx, chat_id, "Одеса");
            } else if (data === "search_poltava") {
                ctx.reply("Я почав пошук квартир у Полтаві. Це може зайняти деякий час...");
                searchApartments(ctx, chat_id, "Полтава");
            } else if (data === "search_zhytomyr") {
                ctx.reply("Я почав пошук квартир у Житомирі. Це може зайняти деякий час...");
                searchApartments(ctx, chat_id, "Житомир");
            } else if (data === "search_chernigov") {
                ctx.reply("Я почав пошук квартир у Чернігові. Це може зайняти деякий час...");
                searchApartments(ctx, chat_id, "Чернігів");
            } else {
                ctx.reply("Я не розумію вашого запиту. Будь ласка, спробуйте ще раз.");
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