import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { PrismaClient } from "../../generated/prisma";
import { RpcException } from '@nestjs/microservices/exceptions/rpc-exception';
import { PaginationDto } from 'src/common';
import * as bcrypt from 'bcrypt'
import { LoginEmpleadoDto } from './dto/login-empleado.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload';
import { envs } from 'src/config';
import { FilterEmpleadosDto } from './dto/filtro-empleado.dto';

@Injectable()
export class EmpleadosService extends PrismaClient implements OnModuleInit{

  constructor(
    private readonly jwtService: JwtService
  ){
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async singJwt(payload: JwtPayload){
    return this.jwtService.sign(payload);
  }

  async create(createEmpleadoDto: CreateEmpleadoDto) {

    const ciUnico = await this.empleado.findUnique({
      where:{ci: createEmpleadoDto.ci, isActive:true}
    });

    if(ciUnico){
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `El empleado con CI ${createEmpleadoDto.ci} ya existe`
      });
    }

    const tipoExistente = await this.tipo.findUnique({
      where:{id: createEmpleadoDto.tipoId, isActive:true}
    });

    if(!tipoExistente){
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `El tipo con ID ${createEmpleadoDto.tipoId} no existe`
      })
    }

    if(createEmpleadoDto.rol === 'ADMIN'){
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `No se puede asignar el rol ADMIN a un empleado`
      });
    }

    const empleado = await this.empleado.create({
      data: {
        nombre: createEmpleadoDto.nombre,
        apellido: createEmpleadoDto.apellido,
        ci: createEmpleadoDto.ci,
        password: bcrypt.hashSync( createEmpleadoDto.password,10),
        rol: createEmpleadoDto.rol,
        sueldo: createEmpleadoDto.sueldo,
        fechaIngreso: new Date( createEmpleadoDto.fechaIngreso),
        tipo:{
          connect:{id: createEmpleadoDto.tipoId}
        }
      }
    })

    return empleado;
  }

  async findAll(filterEmpleadosDto: FilterEmpleadosDto) {
    const { page = 1, limit = 10, nombre, apellido, ci, rol } = filterEmpleadosDto;

    // Construir el objeto where dinámicamente
    const where: any = {
      isActive: true, // Solo empleados activos
    };

    // Filtro por nombre (búsqueda parcial, insensible a mayúsculas)
    if (nombre) {
      where.nombre = {
        contains: nombre,
        mode: 'insensitive',
      };
    }

    // Filtro por apellido (búsqueda parcial, insensible a mayúsculas)
    if (apellido) {
      where.apellido = {
        contains: apellido,
        mode: 'insensitive',
      };
    }

    // Filtro por CI (búsqueda parcial)
    if (ci) {
      where.ci = {
        contains: ci,
      };
    }

    // Filtro por rol (búsqueda parcial, insensible a mayúsculas)
    if (rol) {
      where.rol = {
        contains: rol,
        mode: 'insensitive',
      };
    }

    // Contar total de empleados que cumplen los filtros
    const total = await this.empleado.count({ where });

    // Calcular skip para paginación
    const skip = (page - 1) * limit;

    // Consultar empleados con filtros y paginación
    const data = await this.empleado.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        nombre: 'asc', // Ordenar alfabéticamente por nombre
      },
      include: {
        tipo: {
          select: {
            id: true,
            nombre: true,
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
          ...(nombre && { nombre }),
          ...(apellido && { apellido }),
          ...(ci && { ci }),
          ...(rol && { rol }),
        },
      },
    };
  }

  async findOne(id: number) {

    const empleado = await this.empleado.findUnique({
      where: {id:id, isActive:true},
      include:{
        tipo: {
          select:{
            nombre:true,
            descripcion:true
          }
        }
      }
    });

    if(!empleado){
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Empleado con el id ${id} no encontrado`
      })
    }
    return empleado;
  }

  async update(id: number, updateEmpleadoDto: UpdateEmpleadoDto) {

    await this.findOne(id);
    const {id:__,nombre,apellido,ci,password,rol,sueldo,fechaIngreso,tipoId} = updateEmpleadoDto;
    if(rol === 'ADMIN'){
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `No se puede asignar el rol ADMIN a un empleado`
      });
    }

    const empleado = await this.empleado.update({
      where: {id:id,isActive:true},
      data: {
        nombre,
        apellido,
        ci,
        ...(password && {password: bcrypt.hashSync(password,10)}),
        rol,
        sueldo,
        fechaIngreso: new Date(fechaIngreso),
        tipo: {
          connect: {id: tipoId}
        }
      }
    });


    return empleado;
  }

  async remove(id: number) {

    await this.findOne(id);

    const empleado = await this.empleado.update({
      where:{id:id},
      data:{isActive:false}
    });
    return empleado;
  }

  async loginEmpleado(loginempleadoDto: LoginEmpleadoDto){
    const {ci, password} = loginempleadoDto;
      const empleado = await this.empleado.findUnique({
        where:{ci:ci, isActive:true}
      });
      if(!empleado){
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Credenciales incorrectas`
        });
      }

      const passwordMatch = bcrypt.compareSync(password, empleado.password);
      if(!passwordMatch){
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Credenciales incorrectas`
        });
      }

      const {password:__, ...data} = empleado;

      return {
        ...data,
        token: await this.singJwt({id:empleado.id.toString(), ci:empleado.ci, rol:empleado.rol})
      }
  }

  async authVerifyEmpleado(token: string){
    try {
      const {sub,iat,exp, ...empleado} = this.jwtService.verify(token,{
        secret: envs.jwtSecret
      });

      return{
        empleado : empleado,
        token: await this.singJwt(empleado)
      }

    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Error en token de autenticacion`
      })
    }
  }

}
