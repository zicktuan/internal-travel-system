import 'reflect-metadata';
import app from './app';
import { AppDataSource, connectDatabase } from './config/database';
import logger from './utils/logger';

const PORT = process.env.PORT || 11000;

const startServer = async (): Promise<void> => {
    try {
        logger.info('🚀 Starting Internal Travel System...');
        await connectDatabase();

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