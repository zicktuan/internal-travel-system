import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import logger from '../utils/logger';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEntities } from './entities';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig: PostgresConnectionOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'atn',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'travel_system_internal',
    synchronize: false,
    logging: process.env.NODE_ENV !== 'production',
    entities: loadEntities(),
    migrations: [path.join(__dirname, '../migrations/**/*.{js,ts}')],
    subscribers: [path.join(__dirname, '../subscribers/**/*.{js,ts}')],
}

export const AppDataSource = new DataSource(dbConfig);

export const connectDatabase = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        logger.info("Database connected successfully");

        // Test connection with a simple query
        await AppDataSource.query('SELECT 1');
        logger.info('✅ Database connection test passed');
    } catch (error) {
        logger.error('❌ Database connection error:', error);

        // Provide helpful error information
        logger.error('Connection details:', {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            username: process.env.DB_USERNAME,
            database: process.env.DB_NAME,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        process.exit(1);
    }
}