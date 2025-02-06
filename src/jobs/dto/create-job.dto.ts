import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsDefined, IsNotEmpty, IsNotEmptyObject, IsObject, IsString, ValidateNested } from "class-validator";
import mongoose from "mongoose";

class Company {

    @IsNotEmpty({ message: 'Id không được để trống' })
    _id: mongoose.Schema.Types.ObjectId;

    @IsNotEmpty({ message: 'Name không được để trống' })
    name: string;
}

export class CreateJobDto {

    @IsNotEmpty({ message: 'Name không được để trống' })
    name: string;

    @IsNotEmpty({ message: 'Skills không được để trống' })
    @IsArray({ message: 'Skills có định dạng là array' })
    @IsString({ each: true, message: 'Skills định dạng là string' })
    skills: string[];

    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => Company)
    company: Company

    @IsNotEmpty({ message: 'Salary không được để trống' })
    salary: number;

    @IsNotEmpty({ message: 'Quantity không được để trống' })
    quantity: number;

    @IsNotEmpty({ message: 'Level không được để trống' })
    level: string;

    @IsNotEmpty({ message: 'Description không được để trống' })
    description: string;

    @IsNotEmpty({ message: 'StartDate không được để trống' })
    @Transform(({ value }) => new Date(value))
    @IsDate({ message: 'StartDate phải có định dạng date' })
    startDate: Date;

    @IsNotEmpty({ message: 'EndDate không được để trống' })
    @Transform(({ value }) => new Date(value))
    @IsDate({ message: 'StartDate phải có định dạng date' })
    endDate: Date;


    @IsNotEmpty({ message: 'IsActive không được để trống' })
    @IsBoolean({ message: 'IsActive phải có định dạng boolean' })
    isActive: boolean;


}
