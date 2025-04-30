import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { bot } from "../server.js";
import { UserFavourites } from '../models/userFavourites.js';
import { sendFavouriteApartmentsUpdates } from '../bot/messages.js';
import { Apartment } from '../models/apartment.js';

class FavouritesQueue {
    constructor() {
        this.redisConnection = new IORedis(process.env.REDIS_URL, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            maxMemoryPolicy: 'noeviction'
        });

        this.queue = new Queue('favourites-check', {
            connection: this.redisConnection,
            defaultJobOptions: {
                removeOnComplete: false,
                removeOnFail: false
            }
        });

        this.worker = new Worker('favourites-check', this.processJob.bind(this), {
            connection: this.redisConnection,
            concurrency: 1
        });

        this.worker.on('failed', (job, err) => {
            console.error(`Job ${job.id} failed:`, err);
        });

        this.worker.on('error', (err) => {
            console.error('Worker error:', err);
        });

        this.queue.on('error', (err) => {
            console.error('Queue error:', err);
        });

        this.scheduleRepeatableJob();
    }

    async scheduleRepeatableJob() {
        try {
            await this.queue.add(
                'check-favourites',
                {},
                {
                    repeat: { cron: '*/1 * * * *' },
                    removeOnComplete: false,
                    removeOnFail: false
                }
            );
        } catch (error) {
            console.error('Error scheduling favourites job:', error);
        }
    }
    
    async processJob(job) {
        console.log('[favourites-check] Job started at', new Date().toISOString());

        try {
            const favourites = await UserFavourites.find().lean();            
            const now = new Date();

            for (const fav of favourites) {                
                const userId = fav._id;
                const userFavourites = fav.favourites || [];
                const lastCheckedAt = fav.lastCheckedAt || new Date(0);
                
                const allApartments = await Apartment.find({
                    _id: { $in: userFavourites }
                }).lean();
                
                const apartmentsWithUpdates = allApartments.filter(apartment => {
                    const priceUpdates = apartment.update_history.filter(update => {
                        const isPriceChanged = update.event_type === 'price_changed';
                        const isNewer = new Date(update.timestamp) > new Date(lastCheckedAt);
                        return isPriceChanged && isNewer;
                    });
                    
                    return priceUpdates.length > 0;
                });
                
                if (apartmentsWithUpdates.length === 0) continue;

                await sendFavouriteApartmentsUpdates(bot, userId, apartmentsWithUpdates);

                await UserFavourites.updateOne(
                    { _id: fav._id },
                    { $set: { lastCheckedAt: now, updatedAt: now } }
                );
            }

            console.log('[favourites-check] Job finished at', new Date().toISOString());
        } catch (error) {
            console.error('[favourites-check] Job error:', error);
            throw error;
        }
    }

    async close() {
        await this.worker.close();
        await this.queue.close();
        await this.redisConnection.quit();
    }
}

export { FavouritesQueue };