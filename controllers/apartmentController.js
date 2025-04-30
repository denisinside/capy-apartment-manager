import apartmentService from '../services/apartmentService.js';

export const getApartments = async (req, res) => {
    try {
        const { city, price, rooms, area, floor, districts, subwayStations, residentialComplexes, landmarks, rieltors, agencies, shortPeriod, allowChildren, allowPets, bargain, houseType, commissionRate, commissionPrice, offset, limit } = req.query;
        const options = {
            city: city || undefined,
            price: price ? JSON.parse(price) : undefined,
            rooms: rooms ? JSON.parse(rooms) : undefined,
            area: area ? JSON.parse(area) : undefined,
            floor: floor ? JSON.parse(floor) : undefined,
            districts: districts ? JSON.parse(districts) : undefined,
            subwayStations: subwayStations ? JSON.parse(subwayStations) : undefined,
            residentialComplexes: residentialComplexes ? JSON.parse(residentialComplexes) : undefined,
            landmarks: landmarks ? JSON.parse(landmarks) : undefined,
            rieltors: rieltors ? JSON.parse(rieltors) : undefined,
            agencies: agencies ? JSON.parse(agencies) : undefined,
            shortPeriod: shortPeriod === 'true',
            allowChildren: allowChildren === 'true',
            allowPets: allowPets === 'true',
            bargain: bargain === 'true',
            houseType,
            commissionRate: commissionRate ? Number(commissionRate) : undefined,
            commissionPrice: commissionPrice ? Number(commissionPrice) : undefined
        };
        console.log(options);
        const apartments = await apartmentService.getApartments(options, offset, limit);
        console.log(apartments);
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