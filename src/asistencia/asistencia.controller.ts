import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AsistenciaService } from './asistencia.service';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { PaginationDto } from 'src/common';
import { FiltroAsistenciaDto } from './dto/FiltroAsistenciaDto';

@Controller()
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  @MessagePattern('createAsistencia')
  create(@Payload() createAsistenciaDto: CreateAsistenciaDto) {
    return this.asistenciaService.create(createAsistenciaDto);
  }

  @MessagePattern('findAllAsistencia')
  findAll(@Payload() filtroAsistenciaDto: FiltroAsistenciaDto) {
    return this.asistenciaService.findAll(filtroAsistenciaDto);
  }

  @MessagePattern('findOneAsistencia')
  findOne(@Payload('id') id: number) {
    return this.asistenciaService.findOne(id);
  }


  @MessagePattern('updateAsistencia')
  update(@Payload() updateAsistenciaDto: UpdateAsistenciaDto) {
    return this.asistenciaService.update(updateAsistenciaDto.id, updateAsistenciaDto);
  }

  @MessagePattern('get_asistencia_report')
  async getAsistenciaReport(@Payload() filtros?: any) {
    return this.asistenciaService.getAsistenciaParaReporte(filtros);
  }

}
