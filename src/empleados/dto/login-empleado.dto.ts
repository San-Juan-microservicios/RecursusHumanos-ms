import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";
import { rol, rolEmpleadoList } from "../enum/cargo.enum";

export class LoginEmpleadoDto {

    @IsString()
    @IsNotEmpty()
    ci: string;
    

    @IsString()
    @IsNotEmpty()
    password: string;

}