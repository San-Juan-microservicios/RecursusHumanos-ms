import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { EstadoAsistencia, estadoAsistenciaList } from '../enum/asistencia.enum';

export class CreateAsistenciaDto {

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  idEmpleado: number;

  @IsEnum(EstadoAsistencia, {
    message: `Los estados permitidos son: ${estadoAsistenciaList}`,
  })
  @IsNotEmpty()
  estado: EstadoAsistencia;

  @IsString()
  @IsOptional()
  observacion?: string;
}
