import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import connectDB from './config/db';
import errorHandler from './shared/middleware/error';
import router from './routes/index';

connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(ExpressMongoSanitize());
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:3001",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(router);
app.use(errorHandler);

export default app;