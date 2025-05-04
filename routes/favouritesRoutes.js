import express from 'express';
import { addToFavourites, removeFromFavourites, getFavourites, getFavouriteApartments } from '../controllers/favouritesController.js';

const router = express.Router();

// POST /api/favourites - додати до улюблених
router.post('/', addToFavourites);

// DELETE /api/favourites/:userId/:apartmentId - видалити з улюблених
router.delete('/:userId/:apartmentId', removeFromFavourites);

// GET /api/favourites/:userId - отримати улюблені користувача
router.get('/:userId', getFavourites);

// GET /api/favourites/:userId/apartments - отримати деталі улюблених квартир одним запитом
router.get('/:userId/apartments', getFavouriteApartments);

export default router; 