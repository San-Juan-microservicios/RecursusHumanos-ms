import { Type } from 'class-transformer';
import { IsInt, IsPositive, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateDetalleDto {
  @IsInt() @IsPositive() @Type(() => Number)
  id: number;

  @IsNumber() @Min(0) @IsOptional()
  descuentos?: number;

  @IsString() @IsOptional()
  observacion?: string;
}