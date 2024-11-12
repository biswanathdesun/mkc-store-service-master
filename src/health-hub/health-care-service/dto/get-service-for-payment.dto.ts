import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PaymentModuleType } from 'src/utills/enum';

export class GetServiceBasedOnUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiProperty({ enum: PaymentModuleType })
  @IsNotEmpty()
  @IsString()
  @IsEnum(PaymentModuleType)
  readonly status: PaymentModuleType;
}
