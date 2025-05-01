import apartmentService from '../services/apartmentService.js';

export const getApartments = async (req, res) => {
    try {
        const { city, price, rooms, area, floor, districts, subwayStations, residentialComplexes, landmarks, rieltors, agencies, shortPeriod, allowChildren, allowPets, bargain, houseType, commissionRate, commissionPrice, offset, limit } = req.query;
        
        const subscriptionOptions = {
            city: city || 'Київ',
            price: price ? JSON.parse(price) : { min: undefined, max: undefined, currency: 'Uah' },
            rooms: rooms ? JSON.parse(rooms) : { min: undefined, max: undefined },
            area: area ? JSON.parse(area) : { min: undefined, max: undefined },
            floor: floor ? JSON.parse(floor) : { min: undefined, max: undefined },
            districts: districts ? JSON.parse(districts) : [],
            subwayStations: subwayStations ? JSON.parse(subwayStations) : [],
            residentialComplexes: residentialComplexes ? JSON.parse(residentialComplexes) : [],
            landmarks: landmarks ? JSON.parse(landmarks) : [],
            rieltors: rieltors ? JSON.parse(rieltors) : [],
            agencies: agencies ? JSON.parse(agencies) : [],
            shortPeriod: shortPeriod === 'true',
            allowChildren: allowChildren === 'true',
            allowPets: allowPets === 'true',
            bargain: bargain === 'true',
            houseType: houseType || undefined,
            commissionRate: commissionRate ? JSON.parse(commissionRate) : { min: undefined, max: undefined, currency: 'Uah' },
            commissionPrice: commissionPrice ? JSON.parse(commissionPrice) : { min: undefined, max: undefined }
        };

        console.log('Subscription Options:', JSON.stringify(subscriptionOptions, null, 2));
        
        const apartments = await apartmentService.getApartments({
            subscriptionOptions,
            offset: offset ? parseInt(offset) : 0,
            limit: limit ? parseInt(limit) : 10
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