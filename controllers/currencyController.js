// Create controller for currency rates
import currencyService from '../services/currencyService.js';

export const getRates = (req, res) => {
    try {
        const rates = currencyService.getRates();
        res.json({ success: true, data: rates });
    } catch (error) {
        console.error('Error in getRates:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch rates', error: error.message });
    }
};

export const getRate = async (req, res) => {
    try {
        const { from, to } = req.query;
        const rate = await currencyService.getRate(from, to);
        res.json({ success: true, data: rate });
    } catch (error) {
        console.error('Error in getRate:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch rate', error: error.message });
    }
}; 