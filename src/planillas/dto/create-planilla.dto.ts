import { IsInt, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanillaDto {
  @IsInt() @IsPositive() @Min(1) @Max(12) @Type(() => Number)
  mes: number;

  @IsInt() @IsPositive() @Min(2020) @Type(() => Number)
  anio: number;
}