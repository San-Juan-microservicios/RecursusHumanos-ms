import { Module } from '@nestjs/common';
import { PermisosService } from './permisos.service';
import { PermisosController } from './permisos.controller';

@Module({
  imports:[],
  controllers: [PermisosController],
  providers: [PermisosService],
})
export class PermisosModule {}
