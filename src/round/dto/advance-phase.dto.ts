import { IsOptional, IsBoolean } from 'class-validator';

export class AdvancePhaseDto {
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
