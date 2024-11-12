import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFineOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly fineId: string;
}
