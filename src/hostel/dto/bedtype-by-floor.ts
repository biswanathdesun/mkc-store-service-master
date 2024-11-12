import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class BedTypesByFloorNumberDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly hostelId: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly floorNumber: number;
}
