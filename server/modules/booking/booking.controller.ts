import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../../shared/middleware/async';
import ErrorResponse from '../../utils/errorResponse';
import BookingService from './booking.service';

interface AuthenticatedRequest extends Request {
    user?: { id: string }; // Define the user property with an id
  }
export default class BookingController {
  private readonly bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }
  createBooking = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if(!req.user){
            return next(new ErrorResponse("No user found",404))
        }
      const bookingData={
        ...req.body,
        user:req.user?.id
      }
      const booking=await this.bookingService.createBooking(bookingData)
      res.status(200).json({success:true,data:booking})
    },
  );

  
}
