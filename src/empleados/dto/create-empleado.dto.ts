import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";
import { rol, rolEmpleadoList } from "../enum/cargo.enum";

export class CreateEmpleadoDto {

    @IsString()
    @IsNotEmpty()
    nombre:string;

    
    @IsString()
    @IsNotEmpty()
    apellido:string;


    @IsString()
    @IsNotEmpty()
    ci: string;
    

    @IsString()
    @IsNotEmpty()
    password: string;


    @IsEnum(rol,{
        message:`Los roles permitidos son: ${rolEmpleadoList}`
    })
    @IsNotEmpty()
    rol: string;


    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    sueldo: number;



    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    tipoId: number;


    @IsDateString()
    @IsNotEmpty()
    fechaIngreso: string;

}
