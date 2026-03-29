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

  async getAsistenciaParaReporte(filtros?: {
    idEmpleado?: number;
    fechaDesde?: string;
    fechaHasta?: string;
    mes?: number;
    anio?: number;
    estado?: string;
  }) {
    try {
      const where: any = {};

      // Filtro por empleado individual
      if (filtros?.idEmpleado) {
        where.idEmpleado = filtros.idEmpleado;
      }

      // Filtro por estado
      if (filtros?.estado) {
        where.estado = filtros.estado;
      }

      // Filtro por mes y año (tiene prioridad sobre rango de fechas)
      if (filtros?.mes && filtros?.anio) {
        const inicioMes = new Date(filtros.anio, filtros.mes - 1, 1, 0, 0, 0);
        const finMes    = new Date(filtros.anio, filtros.mes,     0, 23, 59, 59);
        where.fecha = { gte: inicioMes, lte: finMes };
      } else if (filtros?.anio) {
        const inicioAnio = new Date(filtros.anio, 0,  1, 0,  0,  0);
        const finAnio    = new Date(filtros.anio, 11, 31, 23, 59, 59);
        where.fecha = { gte: inicioAnio, lte: finAnio };
      } else if (filtros?.fechaDesde || filtros?.fechaHasta) {
        // Filtro por rango de fechas
        where.fecha = {};
        if (filtros.fechaDesde) where.fecha.gte = new Date(filtros.fechaDesde);
        if (filtros.fechaHasta) where.fecha.lte = new Date(filtros.fechaHasta);
      }

      const asistencias = await this.asistencia.findMany({
        where,
        include: {
          empleado: {
            select: {
              id:       true,
              nombre:   true,
              apellido: true,
              ci:       true,
              tipo: {
                select: { nombre: true }
              }
            }
          }
        },
        orderBy: [
          { fecha:      'desc' },
          { idEmpleado: 'asc'  }
        ]
      });

      // ── Estadísticas generales ────────────────────────────────────────────
      const totalRegistros   = asistencias.length;
      const empleadosUnicos  = new Set(asistencias.map(a => a.idEmpleado)).size;

      const porEstado = asistencias.reduce((acc, a) => {
        acc[a.estado] = (acc[a.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalPresente  = porEstado['PRESENTE']  || 0;
      const totalAusente   = porEstado['AUSENTE']   || 0;
      const totalTardanza  = porEstado['TARDANZA']  || 0;
      const totalPermiso   = porEstado['PERMISO']   || 0;
      const totalFeriado   = porEstado['FERIADO']   || 0;

      const porcentajeAsistencia = totalRegistros > 0
        ? ((totalPresente + totalTardanza) / totalRegistros * 100).toFixed(1)
        : '0.0';

      // ── Agrupar por empleado (para reporte individual) ───────────────────
      const porEmpleado = asistencias.reduce((acc, a) => {
        const key = a.idEmpleado;
        if (!acc[key]) {
          acc[key] = {
            empleado: {
              id:       a.empleado.id,
              nombre:   a.empleado.nombre,
              apellido: a.empleado.apellido,
              ci:       a.empleado.ci,
              tipo:     a.empleado.tipo?.nombre || '—'
            },
            presente:  0,
            ausente:   0,
            tardanza:  0,
            permiso:   0,
            feriado:   0,
            total:     0,
          };
        }
        acc[key][a.estado.toLowerCase()] += 1;
        acc[key].total += 1;
        return acc;
      }, {} as Record<number, any>);

      return {
        asistencias: asistencias.map(a => ({
          id:          a.id,
          fecha:       a.fecha,
          estado:      a.estado,
          observacion: a.observacion || '',
          empleado: {
            id:       a.empleado.id,
            nombre:   a.empleado.nombre,
            apellido: a.empleado.apellido,
            ci:       a.empleado.ci,
            tipo:     a.empleado.tipo?.nombre || '—'
          }
        })),
        resumenPorEmpleado: Object.values(porEmpleado),
        estadisticas: {
          totalRegistros,
          empleadosUnicos,
          totalPresente,
          totalAusente,
          totalTardanza,
          totalPermiso,
          totalFeriado,
          porcentajeAsistencia,
          porEstado,
          fechaGeneracion: new Date()
        }
      };

    } catch (error) {
      throw error;
    }
  }
}
