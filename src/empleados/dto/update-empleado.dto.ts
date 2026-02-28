import { PartialType } from '@nestjs/mapped-types';
import { CreateEmpleadoDto } from './create-empleado.dto';
import { IsNumber, IsPositive } from 'class-validator';

export class UpdateEmpleadoDto extends PartialType(CreateEmpleadoDto) {

  @IsNumber()
  @IsPositive()
  id: number;
}
