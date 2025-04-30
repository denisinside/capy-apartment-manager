import mongoose from 'mongoose';

const UserFavouritesSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    favourites: { type: [String], required: true },
    lastCheckedAt: { type: Date, default: Date.now }
});

const UserFavourites = mongoose.model('UserFavourites', UserFavouritesSchema);

export { UserFavourites };
