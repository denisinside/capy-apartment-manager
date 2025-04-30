import { UserSubscription } from '../models/userSubscription.js';

class SubscriptionService {
    async createSubscription(userId, subscriptionOptions) {
        const subscription = new UserSubscription({
            userId,
            subscriptionOptions
        });
        await subscription.save();
        return subscription;
    }

    async getSubscriptions(userId) {
        return await UserSubscription.find({ userId });
    }

    async deleteSubscription(subscriptionId) {
        await UserSubscription.findByIdAndDelete(subscriptionId);
    }
}

export default new SubscriptionService();

