import express from 'express';
import { addToFavourites, removeFromFavourites, getFavourites } from '../controllers/favouritesController.js';

const router = express.Router();

// POST /api/favourites - додати до улюблених
router.post('/', addToFavourites);

// DELETE /api/favourites/:userId/:apartmentId - видалити з улюблених
router.delete('/:userId/:apartmentId', removeFromFavourites);

// GET /api/favourites/:userId - отримати улюблені користувача
router.get('/:userId', getFavourites);

export default router; 