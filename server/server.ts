import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request, Response } from 'express';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import connectDB from './config/db';
import authRouter from './modules/auth/auth.route';
import turfRoutes from './modules/turf/turf.route';
import turfReviewRoutes from './modules/turf-review/turf-review.route';
import errorHandler from './shared/middleware/error';

const app = express();
const port = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(ExpressMongoSanitize());
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true, // Important for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);

app.get('/', (req: Request, res: Response) => {
  res.send('Server is running');
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/turf', turfRoutes);
app.use('/api/v1/turf-review', turfReviewRoutes);

app.use(errorHandler);
app.listen(port, () => console.log(`Server app listening on port ${port}!`));
