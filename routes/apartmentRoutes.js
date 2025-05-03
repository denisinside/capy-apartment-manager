import express from 'express';
import { getApartments, getApartmentById, getCities, getDistricts, getSubwayStations, getResidentialComplexes, getLandmarks, getRieltors, getAgencies, getApartmentsByRieltor, getApartmentsByAgency } from '../controllers/apartmentController.js';

const router = express.Router();

// GET /api/apartments - отримати всі оголошення з фільтрами
router.get('/', getApartments);

// GET /api/apartments/cities - отримати список міст
router.get('/cities', getCities);

// GET /api/apartments/districts - отримати райони за містом
router.get('/districts', getDistricts);

// GET /api/apartments/subway-stations - отримати станції метро за містом
router.get('/subway-stations', getSubwayStations);

// GET /api/apartments/residential-complexes - отримати ЖК за містом
router.get('/residential-complexes', getResidentialComplexes);

// GET /api/apartments/landmarks - отримати landmarks за містом
router.get('/landmarks', getLandmarks);

// GET /api/apartments/rieltors - отримати рієлторів за містом
router.get('/rieltors', getRieltors);

// GET /api/apartments/agencies - отримати агенції за містом
router.get('/agencies', getAgencies);

// GET /api/apartments/by-rieltor?name= - отримати квартири рієлтора
router.get('/by-rieltor', getApartmentsByRieltor);

// GET /api/apartments/by-agency?name= - отримати квартири агенції
router.get('/by-agency', getApartmentsByAgency);

// GET /api/apartments/:id - отримати оголошення за ID
router.get('/:id', getApartmentById);

export default router; 