import express from 'express';
import { getApartments, getApartmentById } from '../controllers/apartmentController.js';

const router = express.Router();

// GET /api/apartments - отримати всі оголошення з фільтрами
router.get('/', getApartments);

// GET /api/apartments/:id - отримати оголошення за ID
router.get('/:id', getApartmentById);

export default router; 