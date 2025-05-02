import apartmentService from '../services/apartmentService.js';

export const getApartments = async (req, res) => {
    try {
        const { city, price, area, commission, rooms, floor, districts, subwayStations, residentialComplexes, landmarks, allowChildren, allowPets, bargain, noCommission } = req.query;
        
        const subscriptionOptions = {
            city: city || 'Київ',
            price: price ? JSON.parse(price) : { min: undefined, max: undefined, currency: 'Uah' },
            area: area ? JSON.parse(area) : { min: undefined, max: undefined },
            commission: commission ? JSON.parse(commission) : { min: undefined, max: undefined },
            rooms: rooms ? JSON.parse(rooms) : [],
            floor: floor ? JSON.parse(floor) : { min: undefined, max: undefined },
            districts: districts ? JSON.parse(districts) : [],
            subwayStations: subwayStations ? JSON.parse(subwayStations) : [],
            residentialComplexes: residentialComplexes ? JSON.parse(residentialComplexes) : [],
            landmarks: landmarks ? JSON.parse(landmarks) : [],
            allowChildren: allowChildren === 'true',
            allowPets: allowPets === 'true',
            bargain: bargain === 'true',
            noCommission: noCommission === 'true',
        };

        //console.log('Subscription Options:', JSON.stringify(subscriptionOptions, null, 2));
        
        const apartments = await apartmentService.getApartments({
            subscriptionOptions
        });

        res.json({
            success: true,
            data: apartments
        });
    } catch (error) {
        console.error('Error in getApartments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get apartments',
            error: error.message
        });
    }
};

export const getApartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const apartment = await apartmentService.getApartmentById(id);
        
        if (!apartment) {
            return res.status(404).json({
                success: false,
                message: 'Apartment not found'
            });
        }

        res.json({
            success: true,
            data: apartment
        });
    } catch (error) {
        console.error('Error in getApartmentById:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get apartment',
            error: error.message
        });
    }
};

export const getCities = async (req, res) => {
    try {
        const cities = await apartmentService.getCities();
        res.json({
            success: true,
            data: cities
        });
    } catch (error) {
        console.error('Error in getCities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cities',
            error: error.message
        });
    }
};

export const getDistricts = async (req, res) => {
    try {
        const { city } = req.query;
        const districts = await apartmentService.getDistricts(city);
        res.json({ success: true, data: districts });
    } catch (error) {
        console.error('Error in getDistricts:', error);
        res.status(500).json({ success: false, message: 'Failed to get districts', error: error.message });
    }
};

export const getSubwayStations = async (req, res) => {
    try {
        const { city } = req.query;
        const stations = await apartmentService.getSubwayStations(city);
        res.json({ success: true, data: stations });
    } catch (error) {
        console.error('Error in getSubwayStations:', error);
        res.status(500).json({ success: false, message: 'Failed to get subway stations', error: error.message });
    }
};

export const getResidentialComplexes = async (req, res) => {
    try {
        const { city } = req.query;
        const complexes = await apartmentService.getResidentialComplexes(city);
        res.json({ success: true, data: complexes });
    } catch (error) {
        console.error('Error in getResidentialComplexes:', error);
        res.status(500).json({ success: false, message: 'Failed to get residential complexes', error: error.message });
    }
};

export const getLandmarks = async (req, res) => {
    try {
        const { city } = req.query;
        const landmarks = await apartmentService.getLandmarks(city);
        res.json({ success: true, data: landmarks });
    } catch (error) {
        console.error('Error in getLandmarks:', error);
        res.status(500).json({ success: false, message: 'Failed to get landmarks', error: error.message });
    }
};

export const getRieltors = async (req, res) => {
    try {
        const { city } = req.query;
        const rieltors = await apartmentService.getRieltors(city);
        res.json({ success: true, data: rieltors });
    } catch (error) {
        console.error('Error in getRieltors:', error);
        res.status(500).json({ success: false, message: 'Failed to get rieltors', error: error.message });
    }
};

export const getAgencies = async (req, res) => {
    try {
        const { city } = req.query;
        const agencies = await apartmentService.getAgencies(city);
        res.json({ success: true, data: agencies });
    } catch (error) {
        console.error('Error in getAgencies:', error);
        res.status(500).json({ success: false, message: 'Failed to get agencies', error: error.message });
    }
};