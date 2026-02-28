import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermisosService } from './permisos.service';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { UpdatePermisoDto } from './dto/update-permiso.dto';
import { PaginationDto } from 'src/common';
import { FilterPermisosDto } from './dto/filtro-permiso.dto';

@Controller()
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @MessagePattern('createPermiso')
  create(@Payload() createPermisoDto: CreatePermisoDto) {
    return this.permisosService.create(createPermisoDto);
  }

  @MessagePattern('findAllPermisos')
  findAll(@Payload() filterPermisosDto: FilterPermisosDto) {
    return this.permisosService.findAll(filterPermisosDto);
  }

  @MessagePattern('findOnePermiso')
  findOne(@Payload('id') id: number) {
    return this.permisosService.findOne(id);
  }

  @MessagePattern('updatePermiso')
  update(@Payload('id') id: number) {
    return this.permisosService.update(id);
  }

  @MessagePattern('removePermiso')
  remove(@Payload('id') id: number) {
    return this.permisosService.remove(id);
  }

  @MessagePattern('get_permisos_report')
  async getPermisosReport(@Payload() filtros?: any) {
    return this.permisosService.getPermisosParaReporte(filtros);
  }

}
