import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { CreatePlanillaDto } from './dto/create-planilla.dto';
import { UpdatePlanillaDto } from './dto/update-planilla.dto';
import { FiltroPlanillaDto } from './dto/filtro-planilla.dto';
import { UpdateDetalleDto } from './dto/update-detalle.dto';
import { PrismaClient } from 'generated/prisma';
import { RpcException } from '@nestjs/microservices/exceptions/rpc-exception';

@Injectable()
export class PlanillasService extends PrismaClient implements OnModuleInit{

  async onModuleInit() {
    await this.$connect();
  }

  async create(dto: CreatePlanillaDto) {
    const { mes, anio } = dto;

    // 1. Verificar que no exista ya una planilla para ese mes/año
    const existe = await this.planilla.findUnique({
      where: { mes_anio: { mes, anio } }
    });

    if (existe) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Ya existe una planilla para ${mes}/${anio}`
      });
    }

    // 2. Obtener todos los empleados activos
    const empleados = await this.empleado.findMany({
      where: { isActive: true }
    });

    if (empleados.length === 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `No hay empleados activos para generar la planilla`
      });
    }

    // 3. Calcular rango de fechas del mes
    const inicioMes = new Date(anio, mes - 1, 1, 0, 0, 0);
    const finMes    = new Date(anio, mes,     0, 23, 59, 59);

    // 4. Obtener todas las asistencias del mes
    const asistencias = await this.asistencia.findMany({
      where: {
        fecha: { gte: inicioMes, lte: finMes }
      }
    });

    // 5. Constantes de descuento
    const DESCUENTO_AUSENTE  = 50;
    const DESCUENTO_TARDANZA = 10;

    // 6. Crear la planilla
    const planilla = await this.planilla.create({
      data: { mes, anio }
    });

    // 7. Generar detalle por cada empleado
    const detalles = await Promise.all(
      empleados.map(async (empleado) => {
        const asistenciasEmpleado = asistencias.filter(
          a => a.idEmpleado === empleado.id
        );

        const diasTrabajados = asistenciasEmpleado.filter(
          a => a.estado === 'PRESENTE' || a.estado === 'TARDANZA'
        ).length;

        const diasAusente  = asistenciasEmpleado.filter(a => a.estado === 'AUSENTE').length;
        const diasTardanza = asistenciasEmpleado.filter(a => a.estado === 'TARDANZA').length;

        const salarioBase = empleado.sueldo;

        const descuentos = parseFloat(
          ((diasAusente * DESCUENTO_AUSENTE) + (diasTardanza * DESCUENTO_TARDANZA)).toFixed(2)
        );

        const totalAPagar = parseFloat((salarioBase - descuentos).toFixed(2));

        const observacion = diasTardanza > 0 && diasAusente > 0
          ? `Ausencias: ${diasAusente} día(s) (-${diasAusente * DESCUENTO_AUSENTE} Bs) | Tardanzas: ${diasTardanza} día(s) (-${diasTardanza * DESCUENTO_TARDANZA} Bs)`
          : diasAusente > 0
            ? `Ausencias: ${diasAusente} día(s) (-${diasAusente * DESCUENTO_AUSENTE} Bs)`
            : diasTardanza > 0
              ? `Tardanzas: ${diasTardanza} día(s) (-${diasTardanza * DESCUENTO_TARDANZA} Bs)`
              : null;

        return this.detallePlanilla.create({
          data: {
            idPlanilla:     planilla.id,
            idEmpleado:     empleado.id,
            salarioBase,
            diasTrabajados,
            diasAusente,
            descuentos,
            totalAPagar,
            observacion
          }
        });
      })
    );

    return {
      ...planilla,
      totalEmpleados: detalles.length,
      detalles
    };
  }


  async findAll(dto: FiltroPlanillaDto) {
    const { page = 1, limit = 10, estado, mes, anio, nombreEmpleado } = dto;
  const offset = (page - 1) * limit;

  const where: any = {};
  if (estado) where.estado = estado;
  if (mes)    where.mes    = mes;
  if (anio)   where.anio   = anio;

  if (nombreEmpleado) {
    where.detalles = {
      some: {
        empleado: {
          OR: [
            { nombre:   { contains: nombreEmpleado, mode: 'insensitive' } },
            { apellido: { contains: nombreEmpleado, mode: 'insensitive' } },
          ]
        }
      }
    };
  }

  const [data, total] = await Promise.all([
    this.planilla.findMany({
      where,
      skip:    offset,
      take:    limit,
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
      include: {
        detalles: {
          // Si hay filtro de empleado, solo trae sus detalles
          where: nombreEmpleado ? {
            empleado: {
              OR: [
                { nombre:   { contains: nombreEmpleado, mode: 'insensitive' } },
                { apellido: { contains: nombreEmpleado, mode: 'insensitive' } },
              ]
            }
          } : undefined,
          select: {
            totalAPagar: true,
            descuentos:  true,
          }
        }
      }
    }),
    this.planilla.count({ where })
  ]);

  return {
    data: data.map(p => ({
      ...p,
      totalEmpleados:  p.detalles.length,
      totalAPagar:     parseFloat(p.detalles.reduce((sum, d) => sum + d.totalAPagar, 0).toFixed(2)),
      totalDescuentos: parseFloat(p.detalles.reduce((sum, d) => sum + d.descuentos,  0).toFixed(2)),
    })),
    meta: {
      total,
      pagina:       page,
      ultimaPagina: Math.ceil(total / limit),
      limit
    }
  };
    }

  async findOne(id:number) {
      const planilla = await this.planilla.findUnique({
      where: { id },
      include: {
        detalles: {
          include: {
            empleado: {
              select: {
                id:       true,
                nombre:   true,
                apellido: true,
                ci:       true,
                sueldo:   true,
                tipo: {
                  select: { nombre: true }
                }
              }
            }
          }
        }
      }
    });

    if (!planilla) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Planilla con id ${id} no encontrada`
      });
    }

    const totalAPagar     = planilla.detalles.reduce((sum, d) => sum + d.totalAPagar, 0);
    const totalDescuentos = planilla.detalles.reduce((sum, d) => sum + d.descuentos,  0);

    return {
      ...planilla,
      totalAPagar:     parseFloat(totalAPagar.toFixed(2)),
      totalDescuentos: parseFloat(totalDescuentos.toFixed(2)),
      totalEmpleados:  planilla.detalles.length
    };
  }

  async findOneDetalle(id: number) {
    const detalle = await this.detallePlanilla.findUnique({
      where: { id },
      include: {
        empleado: {
          select: {
            id:       true,
            nombre:   true,
            apellido: true,
            ci:       true,
            sueldo:   true,
            tipo: {
              select: { nombre: true }
            }
          }
        },
        planilla: {
          select: {
            id:     true,
            mes:    true,
            anio:   true,
            estado: true
          }
        }
      }
    });

    if (!detalle) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Detalle con id ${id} no encontrado`
      });
    }

    return detalle;
  }

  async cerrar(id: number) {
    const planilla = await this.planilla.findUnique({ where: { id } });

  if (!planilla) {
    throw new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: `Planilla con id ${id} no encontrada`
    });
  }

  if (planilla.estado === 'CERRADA') {
    throw new RpcException({
      status: HttpStatus.CONFLICT,
      message: `La planilla ya está cerrada`
    });
  }

  return this.planilla.update({
    where: { id },
    data: {
      estado:    'CERRADA',
      cerradoEn: new Date()
    }
  });
  }


  async getPlanillaParaReporte(filtros?: {
  idPlanilla?: number;
  mes?: number;
  anio?: number;
  estado?: string;
}) {
  try {

    // ── Reporte de una planilla específica ──────────────────────────────
    if (filtros?.idPlanilla) {
      const planilla = await this.planilla.findUnique({
        where: { id: filtros.idPlanilla },
        include: {
          detalles: {
            include: {
              empleado: {
                select: {
                  id:       true,
                  nombre:   true,
                  apellido: true,
                  ci:       true,
                  tipo: { select: { nombre: true } }
                }
              }
            }
          }
        }
      });

      if (!planilla) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `No existe la planilla con ID ${filtros.idPlanilla}`
        });
      }

      const totalDescuentos = planilla.detalles.reduce((sum, d) => sum + d.descuentos,  0);
      const totalAPagar     = planilla.detalles.reduce((sum, d) => sum + d.totalAPagar, 0);

      return {
        planilla: {
          id:        planilla.id,
          mes:       planilla.mes,
          anio:      planilla.anio,
          estado:    planilla.estado,
          creadoEn:  planilla.creadoEn,
          cerradoEn: planilla.cerradoEn,
        },
        detalles: planilla.detalles.map(d => ({
          id:             d.id,
          salarioBase:    d.salarioBase,
          diasTrabajados: d.diasTrabajados,
          diasAusente:    d.diasAusente,
          descuentos:     d.descuentos,
          totalAPagar:    d.totalAPagar,
          observacion:    d.observacion || '',
          empleado: {
            id:       d.empleado.id,
            nombre:   d.empleado.nombre,
            apellido: d.empleado.apellido,
            ci:       d.empleado.ci,
            tipo:     d.empleado.tipo?.nombre || '—'
          }
        })),
        estadisticas: {
          totalEmpleados:  planilla.detalles.length,
          totalDescuentos: parseFloat(totalDescuentos.toFixed(2)),
          totalAPagar:     parseFloat(totalAPagar.toFixed(2)),
          fechaGeneracion: new Date()
        }
      };
    }

    // ── Reporte de todas las planillas ──────────────────────────────────
    const where: any = {};
    if (filtros?.mes)    where.mes    = filtros.mes;
    if (filtros?.anio)   where.anio   = filtros.anio;
    if (filtros?.estado) where.estado = filtros.estado;

    const planillas = await this.planilla.findMany({
      where,
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
      include: {
        detalles: {
          select: {
            totalAPagar: true,
            descuentos:  true,
          }
        }
      }
    });

    const planillasConTotales = planillas.map(p => ({
      id:              p.id,
      mes:             p.mes,
      anio:            p.anio,
      estado:          p.estado,
      creadoEn:        p.creadoEn,
      cerradoEn:       p.cerradoEn,
      totalEmpleados:  p.detalles.length,
      totalDescuentos: parseFloat(p.detalles.reduce((sum, d) => sum + d.descuentos,  0).toFixed(2)),
      totalAPagar:     parseFloat(p.detalles.reduce((sum, d) => sum + d.totalAPagar, 0).toFixed(2)),
    }));

    const totalDescuentos = planillasConTotales.reduce((sum, p) => sum + p.totalDescuentos, 0);
    const totalAPagar     = planillasConTotales.reduce((sum, p) => sum + p.totalAPagar,     0);

    return {
      planillas: planillasConTotales,
      estadisticas: {
        totalPlanillas:  planillas.length,
        totalCerradas:   planillas.filter(p => p.estado === 'CERRADA').length,
        totalBorrador:   planillas.filter(p => p.estado === 'BORRADOR').length,
        totalDescuentos: parseFloat(totalDescuentos.toFixed(2)),
        totalAPagar:     parseFloat(totalAPagar.toFixed(2)),
        fechaGeneracion: new Date()
      }
    };

  } catch (error) {
    throw error;
  }
}

}
