import { Module } from '@nestjs/common';
import { EmpleadosService } from './empleados.service';
import { EmpleadosController } from './empleados.controller';
import { JwtModule } from '@nestjs/jwt';
import { envs } from 'src/config';

@Module({
  controllers: [EmpleadosController],
  providers: [EmpleadosService],
  imports:[
    JwtModule.register({
      global:true,
      secret: envs.jwtSecret,
      signOptions:{expiresIn:'12h'}
    })
  ]
})
export class EmpleadosModule {}
