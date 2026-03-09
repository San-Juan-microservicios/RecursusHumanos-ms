import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { EstadoAsistencia, estadoAsistenciaList } from '../enum/asistencia.enum';

export class UpdateAsistenciaDto {

  @IsInt()
    @IsPositive()
    id:number;

  @IsString()
  @IsOptional()
  observacion?: string;
}