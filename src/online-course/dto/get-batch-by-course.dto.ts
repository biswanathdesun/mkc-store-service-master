import { IsNotEmpty, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetCourseBatchDto {
  @ApiProperty({ type: [String], isArray: true })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  readonly courseIds: string[];
}
