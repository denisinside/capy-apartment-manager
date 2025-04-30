import { UserFavourites } from '../models/userFavourites.js';

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
}

export default new FavouritesService();
