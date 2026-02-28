import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {

  const logger = new Logger('Recursos-humanos-Main');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule,{
    transport: Transport.NATS,
    options:{
      servers: envs.natsServers
    }
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform:true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )

  await app.listen();
}
bootstrap();
