/** 사용하지 않는 파일 */

// import { Injectable, NestMiddleware } from "@nestjs/common";
// import { NextFunction, Request, Response } from "express";
// import { JwtService } from "./jwt.service";
// import { UserService } from "src/user/user.service";

// @Injectable()
// export class JwtMiddleware implements NestMiddleware {
//   constructor(
//     private readonly jwtService: JwtService,
//     private readonly UserService: UserService,
//   ) {}
//   async use(req: Request, res: Response, next: NextFunction) {
//     if ("x-jwt" in req.headers) {
//       const token = req.headers["x-jwt"];
//       try {
//         const decoded = this.jwtService.verify(token.toString());
//         if (typeof decoded === "object" && decoded.hasOwnProperty("id")) {
//           const user = await this.UserService.findById(decoded["id"]);
//           req["user"] = user;
//         }
//       } catch (e) {
//         console.log(e);
//       }
//     }
//     next();
//   }
// }
