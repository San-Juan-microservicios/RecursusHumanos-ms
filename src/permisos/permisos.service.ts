import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { PaginationDto } from 'src/common';
import { PrismaClient } from "../../generated/prisma";
import { RpcException } from '@nestjs/microservices';

import { FilterPermisosDto } from './dto/filtro-permiso.dto';

@Injectable()
export class PermisosService extends PrismaClient implements OnModuleInit{
   private readonly logger = new Logger(PermisosService.name);
  async onModuleInit() {

    await this.$connect();
    setInterval(async()=>{
      await this.verificarPermisosVencidos();
    },86400000)
  }

  async verificarPermisosVencidosCron() {
    this.logger.log('Ejecutando verificación automática de permisos vencidos...');
    await this.verificarPermisosVencidos();
  }
//----------------------------------------------------------------

  async verificarPermisosVencidos() {
    try {

      console.log('se ejecuto el metodo', new Date().toLocaleString());
      const ahora = new Date();
      ahora.setHours(23, 59, 59, 999); // Fin del día actual

      // Buscar permisos que ya finalizaron pero aún están en estado "CURSANDO"
      const permisosVencidos = await this.permisos.findMany({
        where: {
          isActive: true,
          estadoPermiso: 'CURSANDO',
          fechaFin: {
            lt: ahora // fechaFin menor que ahora
          }
        }
      });

      if (permisosVencidos.length === 0) {
        this.logger.log('No hay permisos vencidos para actualizar');
        return {
          mensaje: 'No hay permisos vencidos para actualizar',
          actualizados: 0
        };
      }

      // Actualizar todos los permisos vencidos a CONCLUIDO
      const resultado = await this.permisos.updateMany({
        where: {
          id: {
            in: permisosVencidos.map(p => p.id)
          }
        },
        data: {
          estadoPermiso: 'FINALIZADO'
        }
      });

      this.logger.log(`✅ Se actualizaron ${resultado.count} permisos a estado CONCLUIDO`);

      return {
        mensaje: `Se actualizaron ${resultado.count} permisos vencidos`,
        actualizados: resultado.count,
        permisos: permisosVencidos.map(p => ({
          id: p.id,
          idEmpleado: p.idEmpleado,
          titulo: p.titulo,
          fechaFin: p.fechaFin
        }))
      };

    } catch (error) {
      this.logger.error('❌ Error al verificar permisos vencidos:', error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error al verificar permisos vencidos'
      });
    }
  }

  //-------------------------------------------------------------


  async create(createPermisoDto: CreatePermisoDto) {

    const {fechaInicio, fechaFin, ...data} = createPermisoDto;

    //verificar que el empleado exista
    const empleadoExistente = await this.empleado.findUnique({
      where:{id: createPermisoDto.idEmpleado,isActive:true}
    });

    if(!empleadoExistente){
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `El empleado con ID ${createPermisoDto.idEmpleado} no existe`
      });
    }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // normaliza la hora

        const inicio = this.dateStringToLocal(createPermisoDto.fechaInicio);
        const fin = this.dateStringToLocal(createPermisoDto.fechaFin);

    
    if(inicio < hoy){
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `La fecha de inicio no puede ser anterior a la fecha actual`
      })
    }

    //verifica que la fecha de fin no sea anterior a la fecha de inicio
    if(new Date(createPermisoDto.fechaFin ) < new Date(createPermisoDto.fechaInicio)){
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `La fecha de fin no puede ser anterior a la fecha de inicio`
      });
    }

    //verifica que el empleado no tenga permisos activos
    const permisoActivo = await this.permisos.findFirst({
      where:{
        idEmpleado:createPermisoDto.idEmpleado,
        isActive:true,
        estadoPermiso:'CURSANDO',
        fechaFin:{
          gte: new Date()
        }
      }
    });

    if(permisoActivo){
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `El empleado con ID ${createPermisoDto.idEmpleado} ya tiene un permiso activo`
      })
    }

    const permiso = await this.permisos.create({
      data: {
        fechaInicio: new Date(createPermisoDto.fechaInicio),
        fechaFin: new Date(createPermisoDto.fechaFin),
        ...data
      },
    })
    return permiso;
  }

  async findAll(filterPermisosDto: FilterPermisosDto) {
    const { page = 1, limit = 10, nombreEmpleado, fechaInicio, fechaFin, tipo } = filterPermisosDto;

    // Construir el objeto where dinámicamente
    const where: any = {
      isActive: true,
      estadoPermiso: {
        in:['FINALIZADO','CURSANDO']
      }, // Solo permisos activos
    };

    // Filtro por nombre del empleado (búsqueda en la relación)
    if (nombreEmpleado) {
      where.empleado = {
        OR: [
          {
            nombre: {
              contains: nombreEmpleado,
              mode: 'insensitive',
            },
          },
          {
            apellido: {
              contains: nombreEmpleado,
              mode: 'insensitive',
            },
          },
        ],
      };
    }

    // Filtro por rango de fechas
    // Si se proporciona fechaInicio y fechaFin, buscar permisos cuya fechaInicio esté entre ese rango
    if (fechaInicio && fechaFin) {
      where.fechaInicio = {
        gte: new Date(fechaInicio), // Mayor o igual a fechaInicio
        lte: new Date(fechaFin),    // Menor o igual a fechaFin
      };
    } else if (fechaInicio) {
      // Solo fechaInicio: permisos desde esa fecha en adelante
      where.fechaInicio = {
        gte: new Date(fechaInicio),
      };
    } else if (fechaFin) {
      // Solo fechaFin: permisos hasta esa fecha
      where.fechaInicio = {
        lte: new Date(fechaFin),
      };
    }

    // Filtro por tipo de permiso
    if (tipo) {
      where.tipo = {
        contains: tipo,
        mode: 'insensitive',
      };
    }

    // Contar total de permisos que cumplen los filtros
    const total = await this.permisos.count({ where });

    // Calcular skip para paginación
    const skip = (page - 1) * limit;

    // Consultar permisos con filtros, paginación e información del empleado
    const data = await this.permisos.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        fechaInicio: 'desc', // Ordenar por fecha más reciente primero
      },
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            ci: true,
            rol: true,
          },
        },
      },
    });

    return {
      data,
      meta: {
        pagina: page,
        total: total,
        ultimaPagina: Math.ceil(total / limit),
        filtrosAplicados: {
          ...(nombreEmpleado && { nombreEmpleado }),
          ...(fechaInicio && { fechaInicio }),
          ...(fechaFin && { fechaFin }),
          ...(tipo && { tipo }),
        },
      },
    };
  }

  async findOne(id: number) {

    const permiso = await this.permisos.findUnique({
      where:{id:id,isActive:true},
      include:{
        empleado:true
      }
    });

    if(!permiso){
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `El permiso con ID ${id} no existe`
      })
    }

    return permiso;
  }

  async update(id: number) {
    console.log('id...........',id);
    await this.findOne(id);
    const permiso = await this.permisos.update({
      where:{id:id,isActive:true},
      data:{
        estadoPermiso:'FINALIZADO',
        isActive:false
      }
    }) 
    return permiso;
  }

  async remove(id: number) {

    await this.findOne(id);

    const permiso = await this.permisos.update({
      where:{id:id},
      data:{isActive:false,estadoPermiso:"CANCELADO"}
    })
    return permiso;
  }


async getPermisosParaReporte(filtros?: {
  estadoPermiso?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  idEmpleado?: number;
  tipo?: number;
}) {
  try {
    const where: any = {
      isActive: true
    };

    // Filtro por estado
    if (filtros?.estadoPermiso) {
      where.estadoPermiso = filtros.estadoPermiso;
    }

    // Filtro por rango de fechas (fecha de inicio del permiso)
    if (filtros?.fechaDesde || filtros?.fechaHasta) {
      where.fechaInicio = {};
      
      if (filtros.fechaDesde) {
        where.fechaInicio.gte = new Date(filtros.fechaDesde);
      }
      
      if (filtros.fechaHasta) {
        where.fechaInicio.lte = new Date(filtros.fechaHasta);
      }
    }

    // Filtro por empleado
    if (filtros?.idEmpleado) {
      where.idEmpleado = filtros.idEmpleado;
    }

    // Filtro por tipo de permiso
    if (filtros?.tipo) {
      where.idTipo = filtros.tipo;
    }

    const permisos = await this.permisos.findMany({
      where,
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            ci: true,
            idTipo:true
          }
        }
      },
      orderBy: {
        fechaInicio: 'desc'
      }
    });

    // Calcular estadísticas
    const totalPermisos = permisos.length;
    
    const permisosPorEstado = permisos.reduce((acc, p) => {
      acc[p.estadoPermiso] = (acc[p.estadoPermiso] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const permisosPorTipo = permisos.reduce((acc, p) => {
      const tipoId = p.empleado.idTipo || 0;
      const tipoKey = `Tipo ${tipoId}`;
      acc[tipoKey] = (acc[tipoKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcular días totales de permisos
    const diasTotales = permisos.reduce((acc, p) => {
      const dias = Math.ceil(
        (new Date(p.fechaFin).getTime() - new Date(p.fechaInicio).getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      return acc + dias;
    }, 0);

    // Empleados únicos que solicitaron permisos
    const empleadosUnicos = new Set(permisos.map(p => p.idEmpleado)).size;

    return {
      permisos: permisos.map(p => {
        const dias = Math.ceil(
          (new Date(p.fechaFin).getTime() - new Date(p.fechaInicio).getTime()) 
          / (1000 * 60 * 60 * 24)
        );

        return {
          id: p.id,
          titulo: p.titulo || '',
          descripcion: p.descripcion || '',
          fechaInicio: p.fechaInicio,
          fechaFin: p.fechaFin,
          dias: dias,
          estadoPermiso: p.estadoPermiso,
          empleado: p.empleado ? {
            nombre: `${p.empleado.nombre || ''} ${p.empleado.apellido || ''}`.trim(),
            ci: p.empleado.ci || ''
          } : null,
        };
      }),
      estadisticas: {
        totalPermisos,
        diasTotales,
        empleadosUnicos,
        permisosPorEstado,
        permisosPorTipo,
        promedioLargo: totalPermisos > 0 ? (diasTotales / totalPermisos).toFixed(1) : 0,
        fechaGeneracion: new Date()
      }
    };
  } catch (error) {
    throw error;
  }
}

  dateStringToLocal(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // fecha local sin hora
  }

}
