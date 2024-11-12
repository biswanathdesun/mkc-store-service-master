import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConvertStatusDto {
  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  @IsString()
  quality: string;

  @ApiProperty()
  @IsString()
  status: string;
}
