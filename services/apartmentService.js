import { Apartment, Rieltor, Agency, District, SubwayStation, ResidentialComplex, Landmark } from '../models/apartment.js';

class ApartmentService {
    async getApartments({
        subscriptionOptions,
        offset = 0,
        limit = 10
    }) {
        try {
            // Перевіряємо всі квартири в базі
            const allApartments = await Apartment.find({});
            console.log('Total apartments in DB:', allApartments.length);
            
            // Перевіряємо квартири з is_active = true
            const activeApartments = await Apartment.find({ is_active: true });
            console.log('Active apartments:', activeApartments.length);
            
            // Перевіряємо квартири в Києві
            const kyivApartments = await Apartment.find({ 'apartment.address.city': 'Київ' });
            console.log('Apartments in Kyiv:', kyivApartments.length);
            
            // Перевіряємо всі унікальні міста в базі
            const allCities = await Apartment.find({}, 'apartment.address.city');
            const uniqueCities = [...new Set(allCities.map(apt => apt.apartment.address.city))];
            console.log('Unique cities in DB:', uniqueCities);

            console.log('Subscription Options:', JSON.stringify(subscriptionOptions, null, 2));
            
            if (!subscriptionOptions) {
                return await Apartment.find()
                .skip(offset)
                .limit(limit);            
            }

            const query = {
                'apartment.address.city': subscriptionOptions.city
                //'is_active': true
            };

            // Price filter
            if (subscriptionOptions.price.min || subscriptionOptions.price.max) {
                query['apartment.price.price_number'] = {};
                if (subscriptionOptions.price.min) query['apartment.price.price_number'].$gte = subscriptionOptions.price.min;
                if (subscriptionOptions.price.max) query['apartment.price.price_number'].$lte = subscriptionOptions.price.max;
                query['apartment.price.currency'] = subscriptionOptions.price.currency;
            }

            // Area filter
            if (subscriptionOptions.area.min || subscriptionOptions.area.max) {
                query['apartment.characteristics.area.total'] = {};
                if (subscriptionOptions.area.min) query['apartment.characteristics.area.total'].$gte = subscriptionOptions.area.min;
                if (subscriptionOptions.area.max) query['apartment.characteristics.area.total'].$lte = subscriptionOptions.area.max;
            }

            // Room count filter
            if (subscriptionOptions.rooms.min || subscriptionOptions.rooms.max) {
                query['apartment.characteristics.room_count'] = {};
                if (subscriptionOptions.rooms.min) query['apartment.characteristics.room_count'].$gte = subscriptionOptions.rooms.min;
                if (subscriptionOptions.rooms.max) query['apartment.characteristics.room_count'].$lte = subscriptionOptions.rooms.max;
            }

            // Floor filter
            if (subscriptionOptions.floor.min || subscriptionOptions.floor.max) {
                query['apartment.characteristics.floor'] = {};
                if (subscriptionOptions.floor.min) query['apartment.characteristics.floor'].$gte = subscriptionOptions.floor.min;
                if (subscriptionOptions.floor.max) query['apartment.characteristics.floor'].$lte = subscriptionOptions.floor.max;
            }

            // Search by related entities
            if (subscriptionOptions.districts && subscriptionOptions.districts.length > 0) {
                query['apartment.address.district'] = { $in: subscriptionOptions.districts };
            }

            if (subscriptionOptions.subwayStations && subscriptionOptions.subwayStations.length > 0) {
                query['apartment.infrastructure.subway_station.name'] = { $in: subscriptionOptions.subwayStations };
            }

            if (subscriptionOptions.residentialComplexes && subscriptionOptions.residentialComplexes.length > 0) {
                query['apartment.infrastructure.residential_complex'] = { $in: subscriptionOptions.residentialComplexes };
            }

            if (subscriptionOptions.landmarks && subscriptionOptions.landmarks.length > 0) {
                query['apartment.infrastructure.landmarks'] = { $all: subscriptionOptions.landmarks };
            }

            if (subscriptionOptions.rieltors && subscriptionOptions.rieltors.length > 0) {
                query['apartment.rieltor.rieltor_name'] = { $in: subscriptionOptions.rieltors };
            }

            if (subscriptionOptions.agencies && subscriptionOptions.agencies.length > 0) {
                query['apartment.rieltor.rieltor_agency'] = { $in: subscriptionOptions.agencies };
            }

            // Additional parameters
            if (subscriptionOptions.commissionRate && (subscriptionOptions.commissionRate.min || subscriptionOptions.commissionRate.max)) {
                query['apartment.permits.commission.commission_rate'] = {};
                if (subscriptionOptions.commissionRate.min) query['apartment.permits.commission.commission_rate'].$gte = subscriptionOptions.commissionRate.min;
                if (subscriptionOptions.commissionRate.max) query['apartment.permits.commission.commission_rate'].$lte = subscriptionOptions.commissionRate.max;
                query['apartment.permits.commission.currency'] = subscriptionOptions.commissionRate.currency;
            }

            if (subscriptionOptions.commissionPrice && (subscriptionOptions.commissionPrice.min || subscriptionOptions.commissionPrice.max)) {
                query['apartment.permits.commission.commission_price'] = {};
                if (subscriptionOptions.commissionPrice.min) query['apartment.permits.commission.commission_price'].$gte = subscriptionOptions.commissionPrice.min;
                if (subscriptionOptions.commissionPrice.max) query['apartment.permits.commission.commission_price'].$lte = subscriptionOptions.commissionPrice.max;
            }

            if (subscriptionOptions.shortPeriod) {
                query['apartment.permits.short_period'] = true;
            }

            if (subscriptionOptions.allowChildren) {
                query['apartment.permits.allow_children'] = true;
            }

            if (subscriptionOptions.allowPets) {
                query['apartment.permits.allow_pets'] = true;
            }

            if (subscriptionOptions.bargain) {
                query['apartment.permits.bargain'] = true;
            }

            if (subscriptionOptions.houseType) {
                query['apartment.characteristics.house_type'] = subscriptionOptions.houseType;
            }

            if (subscriptionOptions.roomPlanning) {
                query['apartment.characteristics.room_planning'] = subscriptionOptions.roomPlanning;
            }

            console.log('MongoDB Query:', JSON.stringify(query, null, 2));

            const apartments = await Apartment.find(query)
                .skip(offset)
                .limit(limit);

            console.log('Found apartments:', apartments.length);
            
            return apartments;
        } catch (error) {
            console.error("Error fetching apartments:", error);
            console.error("Error details:", {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code
            });
            throw error;
        }
    }

    async getApartmentById(id) {
        try {
            const apartment = await Apartment.findById(id);
            return apartment;
        } catch (error) {
            console.error("Error fetching apartment by id:", error);
            throw error;
        }
    }

    async getDistricts(city) {
        try {
            const districts = await District.find({ city: city });
            return districts;
        } catch (error) {
            console.error("Error fetching districts:", error);
            throw error;
        }
    }

    async getSubwayStations(city) {
        try {
            const subwayStations = await SubwayStation.find({ city: city });
            return subwayStations;
        } catch (error) {
            console.error("Error fetching subway stations:", error);
            throw error;
        }
    }

    async getResidentialComplexes(city) {
        try {
            const residentialComplexes = await ResidentialComplex.find({ city: city });
            return residentialComplexes;
        } catch (error) {
            console.error("Error fetching residential complexes:", error);
            throw error;
        }
    }

    async getLandmarks(city) {
        try {
            const landmarks = await Landmark.find({ city: city });
            return landmarks;
        } catch (error) {
            console.error("Error fetching landmarks:", error);
            throw error;
        }
    }

    async getRieltors(city) {
        try {
            const rieltors = await Rieltor.find({ city: city });
            return rieltors;
        } catch (error) {
            console.error("Error fetching rieltors:", error);
            throw error;
        }
    }

    async getAgencies(city) {
        try {
            const agencies = await Agency.find({ city: city });
            return agencies;
        } catch (error) {
            console.error("Error fetching agencies:", error);
            throw error;
        }
    }
}

export { ApartmentService };
export default new ApartmentService();


