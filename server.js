import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './database/db.js';
import apartmentRoutes from './routes/apartmentRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import favouritesRoutes from './routes/favouritesRoutes.js';
import { startBot } from './bot/bot.js';
import { SubscriptionQueue } from './jobs/subscriptionQueue.js';
import { FavouritesQueue } from './jobs/favouritesQueue.js';

dotenv.config();

await connectDB();

const bot = await startBot();
new SubscriptionQueue();
new FavouritesQueue();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/apartments', apartmentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/favourites', favouritesRoutes);

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