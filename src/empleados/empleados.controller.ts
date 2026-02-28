import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmpleadosService } from './empleados.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { PaginationDto } from 'src/common';
import { LoginEmpleadoDto } from './dto/login-empleado.dto';
import { string } from 'joi';
import { FilterEmpleadosDto } from './dto/filtro-empleado.dto';

@Controller()
export class EmpleadosController {
  constructor(private readonly empleadosService: EmpleadosService) {}

  @MessagePattern('createEmpleado')
  create(@Payload() createEmpleadoDto: CreateEmpleadoDto) {
    return this.empleadosService.create(createEmpleadoDto);
  }

  @MessagePattern('findAllEmpleados')
  findAll(@Payload() filterEmpleadosDto: FilterEmpleadosDto) {
    return this.empleadosService.findAll(filterEmpleadosDto);
  }

  @MessagePattern('findOneEmpleado')
  findOne(@Payload('id') id: number) {
    return this.empleadosService.findOne(id); 
  }

  @MessagePattern('updateEmpleado')
  update(@Payload() updateEmpleadoDto: UpdateEmpleadoDto) {
    return this.empleadosService.update(updateEmpleadoDto.id, updateEmpleadoDto);
  }

  @MessagePattern('removeEmpleado')
  remove(@Payload('id') id: number) {
    return this.empleadosService.remove(id);
  }

  @MessagePattern('loginEmpleado')
  login(@Payload() loginEmpleadoDto: LoginEmpleadoDto) {
    return this.empleadosService.loginEmpleado(loginEmpleadoDto);
  }

  @MessagePattern('authVerifyEmpleado')
  authVerifyEmpleado(@Payload() token:string) {
    return this.empleadosService.authVerifyEmpleado(token);
  }
}
