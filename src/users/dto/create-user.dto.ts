import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDefined, IsEmail, IsEmpty, IsMongoId, IsNotEmpty, IsNotEmptyObject, IsObject, IsString, ValidateNested } from "class-validator";
import mongoose from "mongoose";


class Company {

    @IsNotEmpty({ message: 'Id không được để trống' })
    @IsMongoId({ message: 'CompanyID không đúng định dạng' })
    _id: mongoose.Schema.Types.ObjectId;

    @IsNotEmpty({ message: 'Name không được để trống' })
    name: string;
}
export class CreateUserDto {

    @IsNotEmpty({ message: 'Name không được để trống' })
    name: string;

    @IsEmail({}, { message: 'Email không đúng định dạng' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email: string;

    @IsNotEmpty({ message: 'Password không được để trống' })
    password: string;

    @IsNotEmpty({ message: 'Age không được để trống' })
    age: number

    @IsNotEmpty({ message: 'Gender không được để trống' })
    gender: string;

    @IsNotEmpty({ message: 'Adress không được để trống' })
    address: string;

    @IsNotEmpty({ message: 'Role không được để trống' })
    @IsMongoId({ message: 'Role không đúng định dạng' })
    role: mongoose.Schema.Types.ObjectId;

    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => Company)
    company: Company;
}

export class UserLoginDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'jeweltai@gmail.com', description: 'username' })
    readonly username: string;
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        example: '123456',
        description: 'password',
    })
    readonly password: string;
}



export class RegisterUserDto {

    @IsNotEmpty({ message: 'Name không được để trống' })
    name: string;

    @IsEmail({}, { message: 'Email không đúng định dạng' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email: string;

    @IsNotEmpty({ message: 'Password không được để trống' })
    password: string;

    @IsNotEmpty({ message: 'Age không được để trống' })
    age: number

    @IsNotEmpty({ message: 'Gender không được để trống' })
    gender: string;

    @IsNotEmpty({ message: 'Adress không được để trống' })
    address: string;


}
