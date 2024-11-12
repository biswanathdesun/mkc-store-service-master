import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShippingStatusType } from 'src/utills/enum';
import { INVALID_SHPPING_STATUS } from 'src/utills/messages';

export class UpdateShippingStatus {
  @ApiProperty({ enum: ShippingStatusType })
  @IsEnum(ShippingStatusType, { message: INVALID_SHPPING_STATUS })
  @IsString()
  @IsNotEmpty()
  readonly shippingStatus: ShippingStatusType;
}
