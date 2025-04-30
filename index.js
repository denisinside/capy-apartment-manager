import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { Input } from "telegraf";
import { startMessage, searchApartments } from "./bot/messages.js";
import { connectDB } from "./database/db.js";
import { SubscriptionQueue } from "./jobs/subscriptionQueue.js";
import subscriptionService from "./services/subscriptionService.js";
import { FavouritesQueue } from "./jobs/favouritesQueue.js";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.launch();
connectDB();

new SubscriptionQueue();
new FavouritesQueue();
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
    //searchApartments(ctx, chat_id, "Київ");
  } else if (data === "search_lviv") {
    ctx.reply("Я почав пошук квартир у Львові. Це може зайняти деякий час...");
    subscriptionService.createSubscription(chat_id, {city: "Львів", price: {min: 0, max: 12000}});
    //searchApartments(ctx, chat_id, "Львів");
  } else if (data === "search_kharkiv") {
    ctx.reply("Я почав пошук квартир у Харкові. Це може зайняти деякий час...");
    subscriptionService.createSubscription(chat_id, {city: "Харків", rooms: {min: 1, max: 1}});
    //searchApartments(ctx, chat_id, "Харків");
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

export { bot };
