import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EnquiryStatus } from 'src/utills/enum';

export class UpdateHostelEnquiryStatusDto {
  @ApiProperty()
  @IsEnum(EnquiryStatus)
  readonly enquiryStatus: EnquiryStatus;
}
