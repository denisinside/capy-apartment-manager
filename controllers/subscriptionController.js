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

        const subscription = await subscriptionService.createSubscription(userId, subscriptionOptions);
        
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