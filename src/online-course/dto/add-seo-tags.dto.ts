import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddSeoTagDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly courseId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly metaTitle: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly metaDescription: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly metaTag: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly bodyTag: string;
}
