import { HttpStatus, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CreateTipoDto } from './dto/create-tipo.dto';
import { UpdateTipoDto } from './dto/update-tipo.dto';
import { PrismaClient } from "../../generated/prisma";
import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class TiposService extends PrismaClient implements OnModuleInit{

  private readonly logger = new Logger('TiposService');
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  async create(createTipoDto: CreateTipoDto) {

    const tipoUnico = await this.tipo.findUnique({
      where: {nombre: createTipoDto.nombre}
    })

    if(tipoUnico){
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `El tipo con nombre ${createTipoDto.nombre} ya existe`
      })
    }
    

    const tipo = this.tipo.create({
      data: createTipoDto
    });

    return tipo;
  }

  async findAll(paginationDto: PaginationDto) {

    const { page, limit } = paginationDto;
    const totalPages = await this.tipo.count({where:{isActive:true}});


    return {
      data: await this.tipo.findMany({
        skip: (page - 1) * limit, //skip de paginas
        where:{isActive:true}, // retorna los proveedores disponibles
        take: limit,
        // include:{
        //   empleado: true
        // }
      }),
      meta:{
        pagina: page,
        total: totalPages,
        ultimaPagina: Math.ceil(totalPages / limit), // muestra la ultima pagina que hay
      }
    };
  }

  async findOne(id: number) {

    
    const tipo = await this.tipo.findUnique({
      where:{id: id}
    });


    if(!tipo){
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Tipo con el id ${id} no encontrado`
      })
    }
    return tipo;
  }

  async update(id: number, updateTipoDto: UpdateTipoDto) {

    await this.findOne(id);
    const {id:__, ...data} = updateTipoDto;

    const tipo = await this.tipo.update({
      where: {id: id},
      data: data
    })
    return tipo;
  }

  async remove(id: number) {

    await this.findOne(id);
    const tipo = await this.tipo.update({
      where: {id: id},
      data: {isActive: false}
    });

    return tipo;
  }
}
