import favouritesService from '../services/favouritesService.js';

export const addToFavourites = async (req, res) => {
    try {
        const { userId, apartmentId } = req.body;
        
        if (!userId || !apartmentId) {
            return res.status(400).json({
                success: false,
                message: 'userId and apartmentId are required'
            });
        }

        const favourites = await favouritesService.addToFavourites(userId, apartmentId);
        
        res.status(201).json({
            success: true,
            data: favourites
        });
    } catch (error) {
        console.error('Error in addToFavourites:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add to favourites',
            error: error.message
        });
    }
};

export const removeFromFavourites = async (req, res) => {
    try {
        const { userId, apartmentId } = req.params;
        await favouritesService.removeFromFavourites(userId, apartmentId);
        
        res.json({
            success: true,
            message: 'Removed from favourites successfully'
        });
    } catch (error) {
        console.error('Error in removeFromFavourites:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove from favourites',
            error: error.message
        });
    }
};

export const getFavourites = async (req, res) => {
    try {
        const { userId } = req.params;
        const favourites = await favouritesService.getFavourites(userId);
        
        res.json({
            success: true,
            data: favourites
        });
    } catch (error) {
        console.error('Error in getFavourites:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get favourites',
            error: error.message
        });
    }
}; 