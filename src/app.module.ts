import { Module } from '@nestjs/common';
import { EmpleadosModule } from './empleados/empleados.module';
import { PermisosModule } from './permisos/permisos.module';
import { TiposModule } from './tipos/tipos.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AsistenciaModule } from './asistencia/asistencia.module';
import { PlanillasModule } from './planillas/planillas.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EmpleadosModule, 
    PermisosModule, 
    TiposModule, AsistenciaModule, PlanillasModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
