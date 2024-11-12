import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddPackageSeoTagDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly packageId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly metaTitle: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly metaDescription: string;
}
