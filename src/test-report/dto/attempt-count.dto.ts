import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationType, TestSubmitType } from 'src/utills/enum';

export class AttemptCountDto {
  @ApiProperty()
  @IsString()
  readonly testId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly userId: string;

  @ApiProperty({ enum: ApplicationType })
  @IsEnum(ApplicationType)
  @IsOptional()
  readonly application: ApplicationType;

  @ApiProperty({ enum: TestSubmitType })
  @IsEnum(TestSubmitType)
  @IsOptional()
  readonly mode: TestSubmitType;
}
