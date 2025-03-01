import { NextFunction, Request, Response } from "express";

type AsyncFunction<Params = any, ResBody = any, ReqBody = any> = (
  req: Request<Params, ResBody, ReqBody>,
  res: Response,
  next: NextFunction
) => Promise<any>;

const asyncHandler = <Params = any, ResBody = any, ReqBody = any>(
  fn: AsyncFunction<Params, ResBody, ReqBody>
) => {
  return (
    req: Request<Params, ResBody, ReqBody>,
    res: Response,
    next: NextFunction
  ): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
