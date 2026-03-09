import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { EstadoAsistencia, estadoAsistenciaList } from '../enum/asistencia.enum';

export class FiltroAsistenciaDto {

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  // Filtro por estado de asistencia
  @IsEnum(EstadoAsistencia, {
    message: `Los estados permitidos son: ${estadoAsistenciaList}`,
  })
  @IsOptional()
  estado?: EstadoAsistencia;

  // Filtro por nombre o apellido del empleado
  @IsString()
  @IsOptional()
  nombreEmpleado?: string;

  // Filtro por fecha exacta "YYYY-MM-DD"
  @IsDateString()
  @IsOptional()
  fecha?: string;
}