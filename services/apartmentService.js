import { Apartment, Rieltor, Agency, District, SubwayStation, ResidentialComplex, Landmark } from '../models/apartment.js';
import currencyService from './currencyService.js';

class ApartmentService {
    async getApartments({
        subscriptionOptions
    }) {
        try {
            //console.log('Subscription Options:', JSON.stringify(subscriptionOptions, null, 2));
            
            if (!subscriptionOptions) {
                return await Apartment.find();            
            }

            const query = {
                'apartment.address.city': subscriptionOptions.city,
                'is_active': true
            };

            // Price filter with dynamic currency conversion
            if (subscriptionOptions.price.min !== undefined || subscriptionOptions.price.max !== undefined) {
                const { min, max, currency: filterCurrency } = subscriptionOptions.price;
                const rates = currencyService.getRates();
                const orConditions = [];
                Object.keys(rates).forEach(fromCurrency => {
                    const rate = rates[filterCurrency] / rates[fromCurrency];
                    if (!rate) return;
                    const priceCond = {};
                    if (min !== undefined) priceCond.$gte = min / rate;
                    if (max !== undefined) priceCond.$lte = max / rate;
                    orConditions.push({
                        'apartment.price.currency': fromCurrency,
                        'apartment.price.price_number': priceCond
                    });
                });
                query.$or = orConditions;
            }

            // Area filter
            if (subscriptionOptions.area.min || subscriptionOptions.area.max) {
                query['apartment.characteristics.area.total'] = {};
                if (subscriptionOptions.area.min) query['apartment.characteristics.area.total'].$gte = subscriptionOptions.area.min;
                if (subscriptionOptions.area.max) query['apartment.characteristics.area.total'].$lte = subscriptionOptions.area.max;
            }

            // Room count filter
            if (subscriptionOptions.rooms && subscriptionOptions.rooms.length > 0) {
                query['apartment.characteristics.room_count'] = { $in: subscriptionOptions.rooms };
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

            // Commission filter
            if (subscriptionOptions.commission) {
                if (subscriptionOptions.commission.min !== undefined || subscriptionOptions.commission.max !== undefined) {
                    query['apartment.permits.commission.commission_price.price_number'] = {};
                    if (subscriptionOptions.commission.min !== undefined) query['apartment.permits.commission.commission_price.price_number'].$gte = Number(subscriptionOptions.commission.min);
                    if (subscriptionOptions.commission.max !== undefined) query['apartment.permits.commission.commission_price.price_number'].$lte = Number(subscriptionOptions.commission.max);
                }
            }
            if (subscriptionOptions.noCommission) {
                query['apartment.permits.commission.commission_price.price_number'] = 0;
            }

            //console.log('MongoDB Query:', JSON.stringify(query, null, 2));

            const apartments = await Apartment.find(query);

            //console.log('Found apartments:', apartments.length);
            
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

    async getCities() {
        try {
            const allCities = await Apartment.find({}, 'apartment.address.city');
            const uniqueCities = [...new Set(allCities.map(apt => apt.apartment.address.city))];
            return uniqueCities;
        } catch (error) {
            console.error("Error fetching cities:", error);
            throw error;
        }
    }

    async getApartmentsByRieltor(name) {
        try {
            return await Apartment.find({ 'apartment.rieltor.rieltor_name': name });
        } catch (error) {
            console.error('Error fetching apartments by rieltor:', error);
            throw error;
        }
    }

    async getApartmentsByAgency(name) {
        try {
            return await Apartment.find({ 'apartment.rieltor.rieltor_agency': name });
        } catch (error) {
            console.error('Error fetching apartments by agency:', error);
            throw error;
        }
    }

    // Новий метод для отримання рієлторів за назвою агентства
    async getRieltorsByAgency(agencyName) {
        try {
            const apartments = await Apartment.find({ 'apartment.rieltor.rieltor_agency': agencyName });
            if (!apartments || apartments.length === 0) {
                return [];
            }

            const realtorsMap = new Map();
            apartments.forEach(apt => {
                const rieltor = apt.apartment?.rieltor;
                if (rieltor && rieltor.rieltor_name) {
                    // Використовуємо комбінацію ім'я+телефон як ключ, щоб уникнути дублікатів
                    // Якщо телефону немає, використовуємо лише ім'я, але це менш надійно
                    const key = rieltor.rieltor_phone_number ? `${rieltor.rieltor_name}_${rieltor.rieltor_phone_number}` : rieltor.rieltor_name;
                    if (!realtorsMap.has(key)) {
                        realtorsMap.set(key, {
                            name: rieltor.rieltor_name,
                            phone_number: rieltor.rieltor_phone_number,
                            position: rieltor.rieltor_position 
                            // Можна додати інші поля, якщо потрібно
                        });
                    }
                }
            });

            return Array.from(realtorsMap.values());
        } catch (error) {
            console.error('Error fetching realtors by agency:', error);
            throw error;
        }
    }
}

export { ApartmentService };
export default new ApartmentService();


