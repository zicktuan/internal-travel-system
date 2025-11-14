import { AppDataSource } from "../config/database";
import logger from "../utils/logger";

async function resetDatabase() {
    try {
        await AppDataSource.initialize();

        // Drop all tables (BE CAREFUL - this will delete all data!)
        await AppDataSource.dropDatabase();
        logger.info('🗑️  Database dropped');

        // Synchronize schema
        await AppDataSource.synchronize();
        logger.info('📐 Database schema synchronized');

        await AppDataSource.destroy();
        logger.info('🎉 Database reset completed');

    } catch (error) {
        logger.error('❌ Database reset failed:', error);
        process.exit(1);
    }
}