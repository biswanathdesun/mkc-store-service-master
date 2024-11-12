import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ProductDetailsService } from './product-details.service';
import { ResponseBody } from 'src/utills/responseBody';
import { ParsedQs } from 'qs';
import {
  DELETE_DATA,
  FOUND_DATA,
  UPDATE_DATA,
  CREATE_DATA,
  COUPON_REMOVED,
} from 'src/utills/messages';
import { ApiQueriesProducts, ApiQueriesWallet } from 'src/swagger.decorators';
import { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ProductByIdDto } from './dto/product-by-id.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateToCartDto } from './dto/update-cart.dto';
import { AddToFavouriteDto } from './dto/add-favourite.dto';
import { CheckProductInCartDto } from './dto/check-product-exist.dto';
import { CheckCouponDto } from './dto/check-coupon.dto';
import { AddSaveDto } from './dto/save-product.dto';
import { UpdateOfflineProductDto } from './dto/update-offline-product-in-cart';
import { GetProductDetailsDto } from './dto/get-product.dto';
import { EncryptionService } from 'src/utills/encryption.service';

@ApiBearerAuth()
@ApiTags('Product details')
@Controller('product-details')
export class ProductDetailsController {
  constructor(
    private productDetailsService: ProductDetailsService,
    private readonly encryptionService: EncryptionService,
  ) {}

  @Get()
  @ApiQueriesProducts()
  async allProducts(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.productDetailsService.getProductDetails(
      query,
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('store')
  @ApiBody({ type: GetProductDetailsDto })
  async productsWithOutToken(
    @Body() payload: GetProductDetailsDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.productDetailsService.productsWithOutToken(
        payload,
        req.body._valid?.id,
        req.body._valid?.userType,
        req.body._valid?.studentId,
      );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };
    return result;
  }

  @Get('cartCount')
  async getCartCount(@Req() req: Request): Promise<ResponseBody> {
    const count = await this.productDetailsService.getCartCount(
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: count,
    };
    return result;
  }

  @Get('favouriteCount')
  async favouriteCount(@Req() req: Request): Promise<ResponseBody> {
    const count = await this.productDetailsService.favouriteCount(
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: count,
    };
    return result;
  }

  @Post('productId')
  @ApiBody({ type: ProductByIdDto })
  async productById(
    @Body() payload: ProductByIdDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const data = await this.productDetailsService.productById(
      payload,
      req.body._valid?.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('store/productId')
  @ApiBody({ type: ProductByIdDto })
  async productByIdWithOutToken(
    @Body() payload: ProductByIdDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const data = await this.productDetailsService.productByIdWithOutToken(
      payload,
      req.body._valid?.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('addTocart')
  @ApiBody({ type: [AddToCartDto] })
  async addTocart(
    @Body() payload: [AddToCartDto],
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const msg = await this.productDetailsService.addProductTocart(
      payload,
      req.body._valid.id,
      req.body._valid.userType,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: msg,
    };
    return result;
  }

  @Get('getCart')
  async getCartProducts(@Req() req: Request): Promise<ResponseBody> {
    const data = await this.productDetailsService.getCartProduct(
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };

    // const encryptedResponse = this.encryptionService.encrypt(result);
    // const de = this.encryptionService.decrypt(encryptedResponse);

    return result;
  }

  @Get('favourite')
  @ApiQueriesProducts()
  async getFavouriteProducts(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.productDetailsService.getFavouriteProducts(
      query,
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Get('saveList')
  @ApiQueriesProducts()
  async getSaveListProducts(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.productDetailsService.getSaveListProducts(
      query,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Get('topSeller')
  async getTopSellerProduct(@Req() req: Request): Promise<ResponseBody> {
    const { data } = await this.productDetailsService.getTopSellerProduct(
      req.body._valid?.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Patch('updateCart/:id')
  async updateCartProducts(
    @Param('id') id: string,
    @Body() payload: UpdateToCartDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { cartId } = await this.productDetailsService.updateCartProducts(
      id,
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
      data: cartId,
    };

    return result;
  }

  @Patch('updateOfflineProduct/:id')
  async updateOfflineProduct(
    @Param('id') id: string,
    @Body() payload: UpdateOfflineProductDto | string,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const decryptResponse = this.encryptionService.decrypt(
      payload as unknown as string,
    );

    await this.productDetailsService.updateOfflineProduct(
      id,
      decryptResponse,
      req.body._valid.id,
      req.body._valid.userType,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };

    return result;
  }

  @Delete('deleteCart/:id')
  async deleteCartProducts(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    await this.productDetailsService.deleteById(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: DELETE_DATA,
    };

    return result;
  }

  @Get('paymentSummary')
  @ApiQueriesWallet()
  async getPaymentSummary(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const data = await this.productDetailsService.getPaymentSummary(
      query,
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('similar-products')
  @ApiBody({ type: ProductByIdDto })
  async similarProducts(
    @Body() payload: ProductByIdDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.productDetailsService.similarProducts(
      payload,
      req.body._valid?.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('favourite/create')
  @ApiBody({ type: AddToFavouriteDto })
  async favouriteProducts(
    @Body() payload: AddToFavouriteDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.productDetailsService.favouriteProducts(
      payload,
      req.body._valid.id,
      req.body._valid?.userType,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: CREATE_DATA,
    };
    return result;
  }

  @Post('save/create')
  @ApiBody({ type: AddSaveDto })
  async saveProduct(
    @Body() payload: AddSaveDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.productDetailsService.saveProduct(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: CREATE_DATA,
    };
    return result;
  }

  @Post('checkInCart')
  @ApiBody({ type: CheckProductInCartDto })
  async checkInCart(
    @Body() payload: CheckProductInCartDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const status = await this.productDetailsService.checkInCart(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      status,
    };
    return result;
  }

  @Post('check-promo-code')
  @ApiBody({ type: CheckCouponDto })
  async checkCoupon(
    @Body() payload: CheckCouponDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const msg = await this.productDetailsService.checkCoupon(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: msg,
    };
    return result;
  }

  @Post('remove-promo-code')
  @ApiBody({ type: CheckCouponDto })
  async removeCoupon(
    @Body() payload: CheckCouponDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.productDetailsService.removeCoupon(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: COUPON_REMOVED,
    };
    return result;
  }
}
