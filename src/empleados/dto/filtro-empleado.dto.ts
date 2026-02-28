import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterEmpleadosDto {
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

  // Filtro por nombre
  @IsOptional()
  @IsString()
  nombre?: string;

  // Filtro por apellido
  @IsOptional()
  @IsString()
  apellido?: string;

  // Filtro por CI (cédula de identidad) - es string
  @IsOptional()
  @IsString()
  ci?: string;

  // Filtro por rol
  @IsOptional()
  @IsString()
  rol?: string;
}