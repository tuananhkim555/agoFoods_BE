import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ApproveUserDto {
  
  @ApiProperty()
  @IsBoolean()
  isApproved: boolean;
}
