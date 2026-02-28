import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TiposService } from './tipos.service';
import { CreateTipoDto } from './dto/create-tipo.dto';
import { UpdateTipoDto } from './dto/update-tipo.dto';
import { PaginationDto } from 'src/common';

@Controller()
export class TiposController {
  constructor(private readonly tiposService: TiposService) {}

  @MessagePattern('createTipo')
  create(@Payload() createTipoDto: CreateTipoDto) {
    return this.tiposService.create(createTipoDto);
  }

  @MessagePattern('findAllTipos')
  findAll(@Payload() paginationDto: PaginationDto) {
    return this.tiposService.findAll(paginationDto);
  }

  @MessagePattern('findOneTipo')
  findOne(@Payload('id') id: number) {
    return this.tiposService.findOne(id);
  }

  @MessagePattern('updateTipo')
  update(@Payload() updateTipoDto: UpdateTipoDto) {
    return this.tiposService.update(updateTipoDto.id, updateTipoDto);
  }

  @MessagePattern('removeTipo')
  remove(@Payload('id') id: number) {
    return this.tiposService.remove(+id);
  }
}
