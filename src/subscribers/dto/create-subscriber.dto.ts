import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class CreateSubscriberDto {
    @IsNotEmpty({ message: 'Email không được để trống' })
    email: string;
    @IsNotEmpty({ message: 'Name không được để trống' })
    name: string;

    @IsNotEmpty({ message: 'Skills không được để trống' })
    @IsArray({ message: 'Skills có định dạng là array' })
    @IsString({ each: true, message: 'Skills định dạng là string' })
    skills: string[];
}
