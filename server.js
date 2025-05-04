import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './database/db.js';
import apartmentRoutes from './routes/apartmentRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import favouritesRoutes from './routes/favouritesRoutes.js';
import currencyRoutes from './routes/currencyRoutes.js';
import botInteractionRoutes from './routes/botInteractionRoutes.js';
import { startBot } from './bot/bot.js';
import { SubscriptionQueue } from './jobs/subscriptionQueue.js';
import { FavouritesQueue } from './jobs/favouritesQueue.js';
import { telegramValidatorMiddleware } from './utils/telegramValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectDB();

const bot = await startBot();
new SubscriptionQueue();
new FavouritesQueue();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Apply Telegram validation to user-facing API routes
app.use('/api/apartments', telegramValidatorMiddleware, apartmentRoutes);
app.use('/api/subscriptions', telegramValidatorMiddleware, subscriptionRoutes);
app.use('/api/favourites', telegramValidatorMiddleware, favouritesRoutes);
// Currency rate endpoints
app.use('/api/currency', currencyRoutes);
// Bot interaction routes should not require Telegram WebApp initData
app.use('/api/bot', botInteractionRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 
export { bot };