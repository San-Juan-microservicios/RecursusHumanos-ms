import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { FiltroAsistenciaDto } from '../asistencia/dto/FiltroAsistenciaDto';
import { PrismaClient } from "../../generated/prisma";
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AsistenciaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async create(createAsistenciaDto: CreateAsistenciaDto) {
    const {idEmpleado,observacion,estado} = createAsistenciaDto;
    const fecha = new Date();
    fecha.setHours(0,0,0,0);
    const inicioDia = new Date(fecha.setHours(0, 0, 0, 0));
    const finDia    = new Date(fecha.setHours(23, 59, 59, 999));

    const empleado = await this.empleado.findUnique({
      where: {
        id: idEmpleado,
        isActive: true
      }
    });
    if(!empleado){
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Empleado con id ${idEmpleado} no encontrado o inactivo`
      });
    }
    const registroExistente = await this.asistencia.findFirst({
      where:{
        idEmpleado: createAsistenciaDto.idEmpleado,
        fecha:{gte: inicioDia, lt: finDia}
      }
    });
    if(registroExistente){
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Ya existe un registro de asistencia para el empleado ${idEmpleado} en la fecha ${fecha}`
      });
    }
    const asistencia = await this.asistencia.create({
      data:{
        idEmpleado,
        fecha:fecha,
        estado,
        observacion
      },
      include:{
        empleado:{
          select: {nombre:true,apellido:true,ci:true}
        }
      }
    })
    return asistencia;
  }

  async findAll(filtroAsistenciaDto: FiltroAsistenciaDto) {
    const { page = 1, limit = 10, estado, nombreEmpleado, fecha } = filtroAsistenciaDto;
    const where: any = {};
    //filtro estado
    if (estado) {
      where.estado = estado;
    }
    //filtrop fecha
    if (fecha) {
      const fechaBuscada = new Date(fecha);
      fechaBuscada.setHours(0, 0, 0, 0);
      where.fecha = fechaBuscada;
    }
    //filtro nombre apellido
    if (nombreEmpleado) {
      where.empleado = {
        OR: [
          { nombre:   { contains: nombreEmpleado, mode: 'insensitive' } },
          { apellido: { contains: nombreEmpleado, mode: 'insensitive' } },
        ],
      };
    }

    const total = await this.asistencia.count({ where });
    const skip = (page - 1) * limit;

    const data = await this.asistencia.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fecha: 'desc' },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return {
      data,
      meta: {
        pagina: page,
        total,
        ultimaPagina: Math.ceil(total / limit),
        filtrosAplicados: {
          ...(estado         && { estado }),
          ...(nombreEmpleado && { nombreEmpleado }),
          ...(fecha          && { fecha }),
        },
      },
    };
  }

  async findOne(id: number) {
    const asistencia = await this.asistencia.findUnique({
      where: { id },
      include: {
        empleado: { select: { nombre: true, apellido: true } },
      },
    });

    if (!asistencia) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Registro de asistencia con ID ${id} no encontrado`,
      });
    }

    return asistencia;
  }

  // async findByEmpleado(idEmpleado: number) {
  //   return `findByEmpleado #${idEmpleado}`;
  // }

  // async reporteMensual(filtroAsistenciaDto: FiltroAsistenciaDto) {
  //   return 'reporte mensual asistencia';
  // }

  async update(id: number, updateAsistenciaDto: UpdateAsistenciaDto) {
    await this.findOne(id);
    return this.asistencia.update({
      where: { id },
      data: { observacion: updateAsistenciaDto.observacion },
      include: {
        empleado: { select: { nombre: true, apellido: true } },
      },
    });
  }

  // async remove(id: number) {
  //   return `remove asistencia #${id}`;
  // }
}
