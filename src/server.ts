import 'reflect-metadata';
import app from './app';
import { AppDataSource, connectDatabase } from './config/database';
import logger from './utils/logger';
import { dataSeeder } from './seeders/data.seeder';

const PORT = process.env.PORT || 11000;

const runMigrations = async (): Promise<void> => {
    try {
        const pendingMigration = await AppDataSource.showMigrations();

        if (pendingMigration) {
            logger.info('🔄 Running database migrations...');
            await AppDataSource.runMigrations();
            logger.info('✅ Database migrations completed');
        }
        else {
            logger.info('✅ Database is up to date');
        }
    } catch (error) {
        logger.error('❌ Database migrations failed:', error);
        throw error;
    }
}

const startServer = async (): Promise<void> => {
    try {
        logger.info('🚀 Starting Internal Travel System...');
        await connectDatabase();

        // await runMigrations();

        // try {
        //     await dataSeeder.seed();
        //     logger.info('🌱 Data seeding completed');
        // } catch (e) {
        //     logger.warn('Data seeding may have partial errors:', e);
        // }

        // Start server
        app.listen(PORT, () => {
            logger.info(`🎉 Server running on port ${PORT}`);
            logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
            logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
            logger.info(`🔐 Authentication: http://localhost:${PORT}/api/auth/login`);
            logger.info(`🌐 Environment: ${process.env.NODE_ENV}`);
            logger.info(`🗄️  Database: PostgreSQL`);
            
            // Log super admin credentials for development
            if (process.env.NODE_ENV === 'development') {
                logger.info('👑 Super Admin Credentials:');
                logger.info('   Username: superadmin');
                logger.info('   Password: Admin123!');
                logger.info('   Email: superadmin@travelsystem.com');
            }
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

startServer();