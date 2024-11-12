import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UNAUTHORIZED } from 'src/utills/messages';
import * as jwt from 'jsonwebtoken';
import { UserType } from 'src/utills/enum';
import { InjectModel } from '@nestjs/mongoose';
import { Token } from 'src/schema/token.schema';
import { Model } from 'mongoose';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(@InjectModel(Token.name) private tokenModel: Model<Token>) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.header('Authorization');
    if (token) {
      //NOTE: If a token exists, apply the JwtMiddleware
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        throw new HttpException(UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      //NOTE: Fetch token from the database
      const tokenFromDb = await this.tokenModel.findOne({
        userId: decoded.id,
      });

      if (!tokenFromDb) {
        throw new HttpException(UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      //NOTE: Handle unauthorized cases
      if (!tokenFromDb || tokenFromDb.userType !== UserType.STAFF)
        if (
          !decoded ||
          decoded.id === undefined ||
          token !== tokenFromDb.token ||
          tokenFromDb.expiryTime <= new Date()
        ) {
          throw new HttpException(UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
        }
      req.body._valid = { ...decoded, userType: tokenFromDb.userType };
      return next();
    } else {
      const allowedApis = [
        '/product-details/store',
        '/product-details/store/productId',
        '/product-details/similar-products',
        '/hostel/student',
        '/health-care/student',
        '/care-package/student',
        '/care-package/create-enquiry',
        '/healthcare-billing/return-url',
        '/hostel-hub-pay/return-url',
      ];
      const isAllowedApi = allowedApis.some((allowedApi) =>
        req.baseUrl.startsWith(allowedApi),
      );

      if (!isAllowedApi) {
        throw new HttpException(UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      //NOTE: If no token exists, continue to the next middleware or route handler
      next();
    }
  }
}
