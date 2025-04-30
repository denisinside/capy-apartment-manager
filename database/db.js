import { connect } from 'mongoose';

const clientOptions = { 
    serverApi: { 
        version: '1', 
        strict: true, 
        deprecationErrors: true 
    },
    dbName: 'Rieltor'
};

export const connectDB = async () => {
    try {
        const conn = await connect(process.env.MONGO_URI, clientOptions);
        
        console.log(`MongoDB підключено: ${conn.connection.host}`);
        console.log(`База даних: ${conn.connection.name}`);
    } catch (error) {
        console.error(`Помилка підключення до MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;