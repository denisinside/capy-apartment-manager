import mongoose from 'mongoose';

const SubwayStationSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Унікальний ідентифікатор, складений з name_line_city
    name: { type: String, required: true },
    line: { type: String, required: true },
    city: { type: String, required: true }
});

const DistrictSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Унікальний ідентифікатор, складений з name_city
    name: { type: String, required: true },
    city: { type: String, required: true }
});

const LandmarkSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Унікальний ідентифікатор, складений з name_city
    name: { type: String, required: true },
    city: { type: String, required: true }
});

const ResidentialComplexSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Унікальний ідентифікатор, складений з name_city
    name: { type: String, required: true },
    city: { type: String, required: true }
});

const RieltorSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Унікальний ідентифікатор, складений з name_phone
    name: { type: String, required: true },
    phone_number: { type: String, required: true },
    position: { type: String, required: true }
});

const AgencySchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Унікальний ідентифікатор - назва агентства
    name: { type: String, required: true }
});

const PriceChangeSchema = new mongoose.Schema({
    price_number: { type: Number, required: true },
    currency: { type: String, required: true },
    timestamp: { type: Date, required: true }
});

const UpdateHistorySchema = new mongoose.Schema({
    timestamp: { type: Date, required: true },
    event_type: { type: String, required: true, enum: ['created', 'updated', 'price_changed', 'deactivated'] },
    details: { type: String }
});

const PriceSchema = new mongoose.Schema({
    price_number: { type: Number, required: true },
    currency: { type: String, required: true }
});

const AddressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    house_number: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true }
});

const AreaSchema = new mongoose.Schema({
    total: { type: Number, required: true },
    living: { type: Number, required: true },
    kitchen: { type: Number, required: true }
});

const ViewsSchema = new mongoose.Schema({
    total: { type: Number, required: true },
    today: { type: Number, required: true },
    yesterday: { type: Number, required: true }
});

const StatisticsSchema = new mongoose.Schema({
    renewed: { type: String, required: true },
    published: { type: String, required: true },
    views: { type: ViewsSchema, required: true }
});

const CharacteristicsSchema = new mongoose.Schema({
    room_count: { type: Number, required: true },
    area: { type: AreaSchema, required: true },
    floor: { type: Number, required: true },
    max_floor: { type: Number, required: true },
    house_type: { type: String, required: true },
    room_planning: { type: String, required: true },
    state: { type: String, required: true },
    statistics: { type: StatisticsSchema, required: true }
});

const DescriptionSchema = new mongoose.Schema({
    advert_description: { type: String, required: true },
    details_description: { type: String, required: true }
});

const CommissionSchema = new mongoose.Schema({
    commission_rate: { type: Number, required: true },
    commission_price: { type: PriceSchema, required: true }
});

const PermitsSchema = new mongoose.Schema({
    premium_advert: { type: Boolean, required: true },
    short_period: { type: Boolean, required: true },
    commission: { type: CommissionSchema, required: true },
    allow_children: { type: Boolean, required: true },
    allow_pets: { type: Boolean, required: true },
    bargain: { type: Boolean, required: true }
});

const InfrastructureSchema = new mongoose.Schema({
    subway_station: [{ type: SubwayStationSchema }],
    landmarks: [{ type: String }],
    residential_complex: { type: String }
});

const RieltorInfoSchema = new mongoose.Schema({
    rieltor_name: { type: String, required: true },
    rieltor_phone_number: { type: String, required: true },
    rieltor_position: { type: String, required: true },
    rieltor_agency: { type: String }
});

const ApartmentDetailsSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    link: { type: String, required: true },
    price: { type: PriceSchema, required: true },
    address: { type: AddressSchema, required: true },
    characteristics: { type: CharacteristicsSchema, required: true },
    description: { type: DescriptionSchema, required: true },
    permits: { type: PermitsSchema, required: true },
    infrastructure: { type: InfrastructureSchema, required: true },
    rieltor: { type: RieltorInfoSchema, required: true },
    photo: [{ type: String, required: true }]
});

const ApartmentSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    apartment: { type: ApartmentDetailsSchema, required: true },
    price_history: [PriceChangeSchema],
    update_history: [UpdateHistorySchema],
    created_at: { type: Date, required: true },
    updated_at: { type: Date, required: true },
    is_active: { type: Boolean, required: true, default: true }
});

// Створюємо моделі
const SubwayStation = mongoose.model('Subway_Station', SubwayStationSchema);
const District = mongoose.model('District', DistrictSchema);
const Landmark = mongoose.model('Landmark', LandmarkSchema);
const ResidentialComplex = mongoose.model('Residential_Complex', ResidentialComplexSchema);
const Rieltor = mongoose.model('Rieltor', RieltorSchema);
const Agency = mongoose.model('Agency', AgencySchema);
const Apartment = mongoose.model('Apartment', ApartmentSchema);

export {
    SubwayStation,
    District,
    Landmark,
    ResidentialComplex,
    Rieltor,
    Agency,
    Apartment
};