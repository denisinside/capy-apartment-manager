import express from 'express';
import { getRates, getRate } from '../controllers/currencyController.js';

const router = express.Router();

// GET /api/currency/rates - return all currency rates
router.get('/rates', getRates);

// GET /api/currency/rate?from=USD&to=EUR - return conversion rate
router.get('/rate', getRate);

export default router; 