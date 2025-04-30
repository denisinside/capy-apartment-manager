import mongoose from 'mongoose';

const SubscriptionOptionsSchema = new mongoose.Schema({
    city: { type: String, required: true },
    price: { type: { min: Number, max: Number, currency: String }, required: false },
    area: { type: { min: Number, max: Number }, required: false },
    rooms: { type: { min: Number, max: Number }, required: false },
    floor: { type: { min: Number, max: Number }, required: false },
    districts: { type: [String], required: false },
    subwayStations: { type: [String], required: false },
    residentialComplexes: { type: [String], required: false },
    landmarks: { type: [String], required: false },
    rieltors: { type: [String], required: false },
    agencies: { type: [String], required: false },
    shortPeriod: { type: Boolean, required: false },
    allowChildren: { type: Boolean, required: false },
    allowPets: { type: Boolean, required: false },
    bargain: { type: Boolean, required: false },
    houseType: { type: String, required: false },
    commissionRate: { type: Number, required: false },
    commissionPrice: { type: Number, required: false },
});

const UserSubscriptionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    subscriptionOptions: { type: SubscriptionOptionsSchema, required: true },
    lastNotifiedAt:  { type: Date,   required: true, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const UserSubscription = mongoose.model('UserSubscription', UserSubscriptionSchema);
const SubscriptionOptions = mongoose.model('SubscriptionOptions', SubscriptionOptionsSchema);

export { UserSubscription, SubscriptionOptions };

