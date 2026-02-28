import { IsDateString, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePermisoDto {

    @IsString()
    @IsNotEmpty()
    titulo: string;

    @IsString()
    @IsNotEmpty()
    tipo: string;

    @IsString()
    @IsNotEmpty()
    descripcion: string;

    @IsDateString()
    @IsNotEmpty()
    fechaInicio: string;

    @IsDateString()
    @IsNotEmpty()
    fechaFin: string;

    @IsNumber()
    @IsNotEmpty()
    idEmpleado: number;


}
