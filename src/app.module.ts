import { Module } from '@nestjs/common';
import { EmpleadosModule } from './empleados/empleados.module';
import { PermisosModule } from './permisos/permisos.module';
import { TiposModule } from './tipos/tipos.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EmpleadosModule, 
    PermisosModule, 
    TiposModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
