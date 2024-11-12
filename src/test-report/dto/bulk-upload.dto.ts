import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BulkUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
  })
  readonly file: Express.Multer.File;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly staffId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly testId: string;
}
