import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EnquiryStatus } from 'src/utills/enum';

export class UpdateEnquiryStatusDto {
  @ApiProperty()
  @IsEnum(EnquiryStatus)
  readonly enquiryStatus: EnquiryStatus;
}
