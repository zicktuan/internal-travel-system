import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';

import { errorMiddlewareHandler, notFoundHandler } from './middleware/error.middleware.js';
import { setupSwagger } from './config/swagger.js'
import testRoutes from './routes/test.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({extended: true, limit: '10mb'}));

app.use(morgan('combined'));

app.use('/uploads', express.static('uploads'));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

if (process.env.NODE_ENV === 'development') {
  app.use('/api/test', testRoutes);
}

setupSwagger(app);

// Error handling
app.use(notFoundHandler);
app.use(errorMiddlewareHandler);

export default app;