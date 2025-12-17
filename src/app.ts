import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';

import { errorMiddlewareHandler, notFoundHandler } from './middleware/error.middleware';
import { setupSwagger } from './config/swagger'
import testRoutes from './routes/test.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';
import permissionRoutes from './routes/permission.routes';

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
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/permissions', permissionRoutes);

if (process.env.NODE_ENV === 'development') {
  app.use('/api/test', testRoutes);
}

setupSwagger(app);

// Error handling
app.use(notFoundHandler);
app.use(errorMiddlewareHandler);

export default app;