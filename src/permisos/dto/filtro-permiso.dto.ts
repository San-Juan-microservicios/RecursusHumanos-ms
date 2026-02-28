import { IsOptional, IsString, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterPermisosDto {
  // Paginación
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  // Filtro por nombre del empleado (búsqueda en la relación)
  @IsOptional()
  @IsString()
  nombreEmpleado?: string;

  // Filtro por rango de fechas
  @IsOptional()
  @IsDateString()
  fechaInicio?: string; // Fecha inicial del rango (YYYY-MM-DD)

  @IsOptional()
  @IsDateString()
  fechaFin?: string; // Fecha final del rango (YYYY-MM-DD)

  // Filtro opcional por tipo de permiso
  @IsOptional()
  @IsString()
  tipo?: string;
}