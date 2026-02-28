import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoDto } from './create-tipo.dto';
import { IsNumber, IsPositive } from 'class-validator';

export class UpdateTipoDto extends PartialType(CreateTipoDto) {

  @IsNumber()
  @IsPositive()
  id: number;
}
