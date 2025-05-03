import express from 'express';
import {
    createSubscription, 
    getSubscriptions, 
    deleteSubscription, 
    getApartmentsForReview,
    removeNotifiedApartment,
    updateSubscription
} from '../controllers/subscriptionController.js';

const router = express.Router();

// POST /api/subscriptions - створити нову підписку
router.post('/', createSubscription);

// GET /api/subscriptions/:userId - отримати підписки користувача
router.get('/:userId', getSubscriptions);

// PUT /api/subscriptions/:subscriptionId - оновити підписку
router.put('/:subscriptionId', updateSubscription);

// DELETE /api/subscriptions/:subscriptionId - видалити підписку
router.delete('/:subscriptionId', deleteSubscription);

// GET /api/subscriptions/review/:userId - отримати квартири на перегляд для користувача
router.get('/review/:userId', getApartmentsForReview);

// DELETE /api/subscriptions/review/:userId/:apartmentId - видалити квартиру зі списку перегляду
router.delete('/review/:userId/:apartmentId', removeNotifiedApartment);

export default router; 