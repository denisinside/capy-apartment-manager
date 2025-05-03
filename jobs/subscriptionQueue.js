import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

import { UserSubscription } from '../models/userSubscription.js';
import { Apartment } from '../models/apartment.js';
import { bot } from "../server.js";
import { sendApartmentsWithoutContext } from '../bot/messages.js';
import { buildQuery } from "../utils/optionsQueryBuilder.js";
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

        const query = buildQuery(subscriptionOptions);
        query['created_at'] = { $gt: lastNotifiedAt || new Date(0) };
        
        const newAds = await Apartment.find(query).lean();
        console.log(`Found ${newAds.length} new ads for user ${userId}`);
        
        if (newAds.length === 0) continue;

        await sendApartmentsWithoutContext(bot, userId, newAds);
        console.log(`Sent ${newAds.length} ads to user ${userId}`);

        const newAdIds = newAds.map(ad => ad._id.toString());

        await UserSubscription.updateOne(
          { _id: sub._id },
          {
            $set: { lastNotifiedAt: now, updatedAt: now },
            $push: { notifiedApartmentIds: { $each: newAdIds } } 
          }
        );
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
