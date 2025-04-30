import express from 'express';
import { createSubscription, getSubscriptions, deleteSubscription } from '../controllers/subscriptionController.js';

const router = express.Router();

// POST /api/subscriptions - створити нову підписку
router.post('/', createSubscription);

// GET /api/subscriptions/:userId - отримати підписки користувача
router.get('/:userId', getSubscriptions);

// DELETE /api/subscriptions/:subscriptionId - видалити підписку
router.delete('/:subscriptionId', deleteSubscription);

export default router; 