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
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
};

app.use(express.json());
app.use(cookieParser());
app.use(ExpressMongoSanitize());
app.use(helmet());
app.use(cors(corsOptions));

// Add pre-flight handling for all routes
app.options('*', cors(corsOptions));

app.use(router);
app.use(errorHandler);

export default app;
