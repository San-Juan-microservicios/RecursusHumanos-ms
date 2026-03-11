import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PlanillasService } from './planillas.service';
import { CreatePlanillaDto } from './dto/create-planilla.dto';
import { UpdatePlanillaDto } from './dto/update-planilla.dto';
import { FiltroPlanillaDto } from './dto/filtro-planilla.dto';
import { UpdateDetalleDto } from './dto/update-detalle.dto';

@Controller()
export class PlanillasController {
  constructor(private readonly planillasService: PlanillasService) {}

  @MessagePattern('createPlanilla')
  create(@Payload() dto: CreatePlanillaDto) {
    return this.planillasService.create(dto);
  }

  @MessagePattern('findAllPlanillas')
  findAll(@Payload() dto: FiltroPlanillaDto) {
    return this.planillasService.findAll(dto);
  }

  @MessagePattern('findOneDetallePlanilla')
  findOneDetalle(@Payload('id') id: number) {
    return this.planillasService.findOneDetalle(id);
  }

  @MessagePattern('findOnePlanilla')
  findOne(@Payload('id') id: number) {
    return this.planillasService.findOne(id);
  }

  @MessagePattern('cerrarPlanilla')
  cerrar(@Payload('id') id: number) {
    return this.planillasService.cerrar(id);
  }
}
