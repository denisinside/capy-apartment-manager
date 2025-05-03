import subscriptionService from '../services/subscriptionService.js';

export const createSubscription = async (req, res) => {
    try {
        const { userId, subscriptionOptions } = req.body;
        
        if (!userId || !subscriptionOptions) {
            return res.status(400).json({
                success: false,
                message: 'userId and subscriptionOptions are required'
            });
        }

        let parsedOptions = { ...subscriptionOptions };
        // Парсимо об'єкти, якщо вони прийшли рядком
        ["price", "area", "floor"].forEach(key => {
            if (parsedOptions[key] && typeof parsedOptions[key] === 'string') {
                try {
                    parsedOptions[key] = JSON.parse(parsedOptions[key]);
                } catch (e) {}
            }
        });
        // Парсимо масиви рядків
        ["districts", "subwayStations", "residentialComplexes", "landmarks", "rieltors", "agencies"].forEach(key => {
            if (parsedOptions[key] && typeof parsedOptions[key] === 'string') {
                try {
                    parsedOptions[key] = JSON.parse(parsedOptions[key]);
                } catch (e) {}
            }
        });
        // Парсимо rooms як масив чисел
        if (parsedOptions.rooms) {
            if (typeof parsedOptions.rooms === 'string') {
                try {
                    parsedOptions.rooms = JSON.parse(parsedOptions.rooms);
                } catch (e) {}
            }
            if (Array.isArray(parsedOptions.rooms)) {
                parsedOptions.rooms = parsedOptions.rooms.map(Number).filter(n => !isNaN(n));
            }
        }
        const subscription = await subscriptionService.createSubscription(userId, parsedOptions);
        
        res.status(201).json({
            success: true,
            data: subscription
        });
    } catch (error) {
        console.error('Error in createSubscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create subscription',
            error: error.message
        });
    }
};

export const getSubscriptions = async (req, res) => {
    try {
        const { userId } = req.params;
        const subscriptions = await subscriptionService.getSubscriptions(userId);
        
        res.json({
            success: true,
            data: subscriptions
        });
    } catch (error) {
        console.error('Error in getSubscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get subscriptions',
            error: error.message
        });
    }
};

export const deleteSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        await subscriptionService.deleteSubscription(subscriptionId);
        
        res.json({
            success: true,
            message: 'Subscription deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteSubscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete subscription',
            error: error.message
        });
    }
};

// Новий контролер для отримання квартир на перегляд
export const getApartmentsForReview = async (req, res) => {
    try {
        const { userId } = req.params;
        const apartmentsData = await subscriptionService.getApartmentsForReview(userId);
        
        res.json({ 
            success: true, 
            data: apartmentsData 
        });
    } catch (error) {
        console.error('Error in getApartmentsForReview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get apartments for review',
            error: error.message
        });
    }
};

// Новий контролер для видалення квартири зі списку очікування
export const removeNotifiedApartment = async (req, res) => {
    try {
        const { userId, apartmentId } = req.params;
        await subscriptionService.removeNotifiedApartment(userId, apartmentId);
        
        res.json({ 
            success: true, 
            message: 'Apartment removed from notification list successfully' 
        });
    } catch (error) {
        console.error('Error in removeNotifiedApartment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove apartment from notification list',
            error: error.message
        });
    }
};

// Новий контролер для оновлення підписки
export const updateSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const { userId, subscriptionOptions } = req.body; // userId потрібен для перевірки власника

        if (!userId || !subscriptionOptions || !subscriptionId) {
            return res.status(400).json({ 
                success: false, 
                message: 'userId, subscriptionOptions, and subscriptionId are required' 
            });
        }

        // TODO: Додати валідацію subscriptionOptions тут або в сервісі
        // Парсимо опції аналогічно до createSubscription, якщо потрібно
        let parsedOptions = { ...subscriptionOptions };
        // Парсимо об'єкти, якщо вони прийшли рядком
        ["price", "area", "floor"].forEach(key => {
            if (parsedOptions[key] && typeof parsedOptions[key] === 'string') {
                try { parsedOptions[key] = JSON.parse(parsedOptions[key]); } catch (e) {}
            }
        });
        ["districts", "subwayStations", "residentialComplexes", "landmarks", "rieltors", "agencies"].forEach(key => {
            if (parsedOptions[key] && typeof parsedOptions[key] === 'string') {
                try { parsedOptions[key] = JSON.parse(parsedOptions[key]); } catch (e) {}
            }
        });
        if (parsedOptions.rooms) {
             if (typeof parsedOptions.rooms === 'string') {
                try { parsedOptions.rooms = JSON.parse(parsedOptions.rooms); } catch (e) {}
            }
            if (Array.isArray(parsedOptions.rooms)) {
                parsedOptions.rooms = parsedOptions.rooms.map(Number).filter(n => !isNaN(n));
            }
        }

        const updatedSubscription = await subscriptionService.updateSubscription(
            subscriptionId,
            userId,
            parsedOptions
        );

        res.json({
            success: true,
            message: 'Subscription updated successfully',
            data: updatedSubscription
        });
    } catch (error) {
        console.error('Error in updateSubscription:', error);
        // Розрізняємо помилки
        if (error.message === 'Subscription not found or user mismatch') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update subscription',
            error: error.message
        });
    }
}; 