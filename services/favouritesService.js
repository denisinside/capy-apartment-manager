import { UserFavourites } from '../models/userFavourites.js';
import { Apartment } from '../models/apartment.js';

class FavouritesService {
    async getFavourites(userId) {
        return await UserFavourites.findOne({ _id: userId });
    }

    async addFavourite(userId, apartmentId) {
        const favourites = await this.getFavourites(userId);
        if (!favourites) {
            await UserFavourites.create({ _id: userId, favourites: [apartmentId] });
        } else {
            if (!favourites.favourites.includes(apartmentId)) {
                favourites.favourites.push(apartmentId);
                await favourites.save();
            }
        }
    }

    async removeFavourite(userId, apartmentId) {
        const favourites = await this.getFavourites(userId);
        favourites.favourites = favourites.favourites.filter(id => id !== apartmentId);
        await favourites.save();
    }

    async removeAllFavourites(userId) {
        await UserFavourites.findByIdAndDelete(userId);
    }

    async getFavouriteApartments(userId) {
        const favouritesDoc = await UserFavourites.findOne({ _id: userId });
        if (!favouritesDoc || !favouritesDoc.favourites.length) {
            return [];
        }
        const apartments = await Apartment.find({ _id: { $in: favouritesDoc.favourites } });
        return apartments;
    }
}

export default new FavouritesService();
