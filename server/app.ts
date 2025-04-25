import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import connectDB from './config/db';
import router from './routes/index';
import errorHandler from './shared/middleware/error';

connectDB();

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['set-cookie'],
};

app.use(express.json());

// Use the same corsOptions configuration consistently
app.use(cors(corsOptions));

app.use(cookieParser());
app.use(ExpressMongoSanitize());
app.use(helmet());

// Add pre-flight handling for all routes
app.options('*', cors(corsOptions));

app.use(router);
app.use(errorHandler);

export default app;
