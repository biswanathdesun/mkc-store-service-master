import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateHealthCareDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly slugUrl: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  image: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly description: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  readonly status: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  readonly isPreeBook: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly metaTitle: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly metaDescription: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly headScript: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly bodyScript: string;
}
