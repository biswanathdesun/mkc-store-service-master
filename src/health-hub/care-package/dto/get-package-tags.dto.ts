import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetPackagesSeoTagDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly packageId: string;
}
