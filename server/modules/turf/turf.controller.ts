import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../../shared/middleware/async';
import Turf from './turf.model';

// @desc   Create new turf
// @route  POST /api/v1/turf
// @access Private
export const createTurf = asyncHandler(
  async (
    req: Request & { user?: { id: string } },
    res: Response,
    next: NextFunction,
  ) => {
    const turfData = {
      ...req.body,
      owner: req.user?.id,
      userRoles: [
        {
          user: req.user?.id,
          role: 'owner' as const,
        },
      ],
      permissions: new Map([
        ['roleManage', ['owner']],
        ['update', ['owner']],
        ['delete', ['owner']],
      ]),
    };

    const turf = await Turf.create(turfData);

    res.status(201).json({
      success: true,
      data: turf,
    });
  },
);
