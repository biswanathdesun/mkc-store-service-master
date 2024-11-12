import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateInventoryCategoryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly name: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  readonly status: boolean;
}
