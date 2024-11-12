import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckCarePackageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly healthCareId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly title: string;
}
