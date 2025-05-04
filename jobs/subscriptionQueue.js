import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

import { UserSubscription } from '../models/userSubscription.js';
import { Apartment } from '../models/apartment.js';
import { bot } from "../server.js";
import { sendApartmentsWithoutContext } from '../bot/messages.js';
import apartmentService from '../services/apartmentService.js';
import favouritesService from '../services/favouritesService.js';

class SubscriptionQueue {
  constructor() {
    this.redisConnection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });

    this.queue = new Queue('subscription-check', {
      connection: this.redisConnection
    });

    this.worker = new Worker(
      'subscription-check', 
      this.processJob.bind(this),
      { 
        connection: this.redisConnection,
        concurrency: 1
      }
    );

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
        'check-subscriptions',
        {},
        {
          repeat: { cron: '*/1 * * * *' },
          removeOnComplete: true,
          removeOnFail: false
        }
      );
    } catch (error) {
      console.error('Error scheduling subscription job:', error);
    }
  }


  async processJob(job) {
    console.log('[subscription-check] Job started at', new Date().toISOString());

    try {
      const subs = await UserSubscription.find().lean();
      const now = new Date();
      for (const sub of subs) {
        const { userId, subscriptionOptions, lastNotifiedAt } = sub;

        const allAds = await apartmentService.getApartments({ subscriptionOptions });
        const cutoff = lastNotifiedAt || new Date(0);
        const newAds = allAds.filter(ad => ad.created_at > cutoff);
        
        if (newAds.length === 0) continue;

        await sendApartmentsWithoutContext(bot, userId, newAds);
        console.log(`Sent ${newAds.length} ads to user ${userId}`);

        const newAdIds = newAds.map(ad => ad._id.toString());

        // --- Safely update subscription ---
        try {
            const subDoc = await UserSubscription.findById(sub._id);
            if (subDoc) {
                let currentIds = subDoc.notifiedApartmentIds;

                if (typeof currentIds === 'string') {
                    try {
                        currentIds = JSON.parse(currentIds);
                        if (!Array.isArray(currentIds)) {
                            console.warn(`Parsed notifiedApartmentIds for sub ${sub._id} is not an array, resetting.`);
                            currentIds = [];
                        }
                    } catch (e) {
                        console.warn(`Failed to parse notifiedApartmentIds string for sub ${sub._id}, resetting:`, e);
                        currentIds = [];
                    }
                } else if (!Array.isArray(currentIds)) {
                    console.warn(`notifiedApartmentIds for sub ${sub._id} is not an array or string, resetting.`);
                    currentIds = [];
                }

                const updatedIds = Array.from(new Set([...currentIds, ...newAdIds]));

                subDoc.notifiedApartmentIds = updatedIds;
                subDoc.lastNotifiedAt = now;
                subDoc.updatedAt = now; 
                await subDoc.save();
            } else {
               console.warn(`Subscription ${sub._id} not found during update.`);
            }
        } catch(updateError) {
            console.error(`Failed to update subscription ${sub._id} for user ${userId}:`, updateError);
        }
      }

      console.log('[subscription-check] Job finished at', new Date().toISOString());
    } catch (error) {
      console.error('[subscription-check] Job error:', error);
      throw error;
    }
  }

  /**
   * Закриває з'єднання з Redis та зупиняє воркер
   */
  async close() {
    await this.worker.close();
    await this.queue.close();
    await this.redisConnection.quit();
  }
}

export { SubscriptionQueue };
