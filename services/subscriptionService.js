import { UserSubscription } from '../models/userSubscription.js';
import { Apartment } from '../models/apartment.js';

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

    async getApartmentsForReview(userId) {
        const subscriptions = await UserSubscription.find({ userId }).lean();
        if (!subscriptions || subscriptions.length === 0) {
            return [];
        }

        const allNotifiedIds = subscriptions.reduce((acc, sub) => {
            if (sub.notifiedApartmentIds && Array.isArray(sub.notifiedApartmentIds) && sub.notifiedApartmentIds.length > 0) {
                sub.notifiedApartmentIds.forEach(apartmentId => {
                    acc.add(JSON.stringify({ apartmentId, subscriptionId: sub._id.toString() }));
                });
            }
            return acc;
        }, new Set());
        
        if (allNotifiedIds.size === 0) {
            return [];
        }

        const uniquePairs = Array.from(allNotifiedIds).map(pairStr => JSON.parse(pairStr));
        const apartmentIds = uniquePairs.map(pair => pair.apartmentId);

        const apartments = await Apartment.find({ '_id': { $in: apartmentIds } }).lean();

        const apartmentMap = apartments.reduce((map, apt) => {
            map[apt._id.toString()] = apt;
            return map;
        }, {});

        return uniquePairs
            .map(pair => ({
                apartment: apartmentMap[pair.apartmentId],
                subscriptionId: pair.subscriptionId
            }))
            .filter(item => item.apartment);
    }

    async removeNotifiedApartment(userId, apartmentId) {
        await UserSubscription.updateMany(
            { userId, notifiedApartmentIds: apartmentId },
            { $pull: { notifiedApartmentIds: apartmentId } }
        );
    }

    // Метод для оновлення підписки
    async updateSubscription(subscriptionId, userId, newSubscriptionOptions) {
        const subscription = await UserSubscription.findOne({ _id: subscriptionId, userId });

        if (!subscription) {
            throw new Error('Subscription not found or user mismatch');
        }

        // Оновлюємо опції та дату оновлення
        subscription.subscriptionOptions = newSubscriptionOptions;
        subscription.updatedAt = new Date();
        // Важливо: скидаємо lastNotifiedAt, щоб користувач отримав оголошення
        // за новими критеріями, які могли з'явитися під час редагування.
        // Можна додати логіку, щоб не скидати, якщо критерії не змінилися суттєво.
        subscription.lastNotifiedAt = new Date(0); 
        // Також очищуємо масив вже надісланих, бо критерії змінились
        subscription.notifiedApartmentIds = [];

        await subscription.save();
        return subscription;
    }
}

export default new SubscriptionService();

