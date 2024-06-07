import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

export function JwtMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log("📢 [jwt.middleware.ts:6]", req.headers);
  next();
}
