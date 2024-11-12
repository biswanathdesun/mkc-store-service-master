import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHealthCareDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly slugUrl: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  image: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly description: string;

  @ApiProperty()
  @IsNotEmpty()
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
