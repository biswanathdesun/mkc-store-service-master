import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

class TestData {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly testMasterId: string;
}

export class AssignTestMasterDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly testId: string;

  @ApiProperty({ type: [TestData] })
  readonly testMaster: TestData[];
}
