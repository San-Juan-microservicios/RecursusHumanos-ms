import { IsInt, IsPositive, IsOptional, IsEnum, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoPlanilla } from '../enum/estado-planilla.enum';

export class FiltroPlanillaDto {
  @IsInt() @IsPositive() @IsOptional() @Type(() => Number)
  page?: number;

  @IsInt() @IsPositive() @IsOptional() @Type(() => Number)
  limit?: number;


  @IsString() @IsOptional()
  nombreEmpleado?: string;

  @IsEnum(EstadoPlanilla) @IsOptional()
  estado?: EstadoPlanilla;

  @IsInt() @Min(1) @Max(12) @IsOptional() @Type(() => Number)
  mes?: number;

  @IsInt() @Min(2020) @IsOptional() @Type(() => Number)
  anio?: number;
}