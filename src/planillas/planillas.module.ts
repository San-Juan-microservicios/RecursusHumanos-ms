import { Module } from '@nestjs/common';
import { PlanillasService } from './planillas.service';
import { PlanillasController } from './planillas.controller';

@Module({
  controllers: [PlanillasController],
  providers: [PlanillasService],
})
export class PlanillasModule {}
