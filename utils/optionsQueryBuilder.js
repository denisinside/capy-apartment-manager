export function buildQuery(subscriptionOptions) {
    const query = { 
        'apartment.address.city': subscriptionOptions.city,
        is_active: true
      };

    // Price filter
    if (subscriptionOptions.price) {
        query['apartment.price.price_number'] = {};
        if (subscriptionOptions.price.min !== 0) {
            query['apartment.price.price_number'] = {
                $gte: subscriptionOptions.price.min,
            };
        }
        if (subscriptionOptions.price.max !== 0) {
            query['apartment.price.price_number'] = {
                $lte: subscriptionOptions.price.max,
            };
        }
        if (subscriptionOptions.price.currency) {
            query['apartment.price.currency'] = subscriptionOptions.price.currency;
        }
    }

    // Area filter
    if (subscriptionOptions.area) {
        query['apartment.characteristics.area.total'] = {};
        if (subscriptionOptions.area.min !== 0) {
            query['apartment.characteristics.area.total'] = {
                $gte: subscriptionOptions.area.min,
            };
        }
        if (subscriptionOptions.area.max !== 0) {
            query['apartment.characteristics.area.total'] = {
                $lte: subscriptionOptions.area.max,
            };
        }
    }

    // Room count filter
    if (subscriptionOptions.rooms) {
        query['apartment.characteristics.room_count'] = {};
        if (subscriptionOptions.rooms.min !== 0) {
            query['apartment.characteristics.room_count'] = {
                $gte: subscriptionOptions.rooms.min,
            };
        }
        if (subscriptionOptions.rooms.max !== 0) {
            query['apartment.characteristics.room_count'] = {
                $lte: subscriptionOptions.rooms.max,
            };
        }
    }

    // Floor filter
    if (subscriptionOptions.floor) {
        query['apartment.characteristics.floor'] = {};
        if (subscriptionOptions.floor.min !== 0) {
            query['apartment.characteristics.floor'] = {
                $gte: subscriptionOptions.floor.min,
            };
        }
        if (subscriptionOptions.floor.max !== 0) {
            query['apartment.characteristics.floor'] = {
                $lte: subscriptionOptions.floor.max,
            };
        }
    }
    // Search by related entities
    // Districts filter
    if (subscriptionOptions.districts && subscriptionOptions.districts.length > 0) {
        query['apartment.address.district'] = { $in: subscriptionOptions.districts };
    }

    // Subway stations filter
    if (subscriptionOptions.subwayStations && subscriptionOptions.subwayStations.length > 0) {
        query['apartment.infrastructure.subway_station.name'] = { $in: subscriptionOptions.subwayStations };
    }

    // Residential complexes filter
    if (subscriptionOptions.residentialComplexes && subscriptionOptions.residentialComplexes.length > 0) {
        query['apartment.infrastructure.residential_complex'] = { $in: subscriptionOptions.residentialComplexes };
    }

    // Landmarks filter
    if (subscriptionOptions.landmarks && subscriptionOptions.landmarks.length > 0) {
        query['apartment.infrastructure.landmarks'] = { $all: subscriptionOptions.landmarks };
    }

    // Rieltors filter
    if (subscriptionOptions.rieltors && subscriptionOptions.rieltors.length > 0) {
        query['apartment.rieltor.rieltor_name'] = { $in: subscriptionOptions.rieltors };
    }

    // Agencies filter
    if (subscriptionOptions.agencies && subscriptionOptions.agencies.length > 0) {
        query['apartment.rieltor.rieltor_agency'] = { $in: subscriptionOptions.agencies };
    }

    // Additional parameters    
    if (subscriptionOptions.commissionRate) {
        query['apartment.permits.commission.commission_rate'] = {};
        if (subscriptionOptions.commissionRate.min !== 0) {
            query['apartment.permits.commission.commission_rate'] = {
                $gte: subscriptionOptions.commissionRate.min,
            };
        }
        if (subscriptionOptions.commissionRate.max !== 0) {
            query['apartment.permits.commission.commission_rate'] = {
                $lte: subscriptionOptions.commissionRate.max,
            };
        }
    }
    
    if (subscriptionOptions.commissionPrice) {
        query['apartment.permits.commission.commission_price.price_number'] = {};
        if (subscriptionOptions.commissionPrice.min !== 0) {
            query['apartment.permits.commission.commission_price.price_number'] = {
                $gte: subscriptionOptions.commissionPrice.min,
            };
        }
        if (subscriptionOptions.commissionPrice.max !== 0) {
            query['apartment.permits.commission.commission_price.price_number'] = {
                $lte: subscriptionOptions.commissionPrice.max,
            };
        }
        query['apartment.permits.commission.commission_price.currency'] = subscriptionOptions.commissionPrice.currency;
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

    return query;
}