import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/users.interface';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { genSaltSync, hashSync } from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';
import { Response } from 'express';
@Injectable()
export class AuthService {
    constructor(private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>) { }

    hashPassword = (password: string) => {
        const salt = genSaltSync(10);
        const hash = hashSync(password, salt);
        return hash;
    }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByUserName(username);
        if (user) {
            const isValid = this.usersService.isValidPasswrod(pass, user.password);
            if (isValid) {
                return user;
            }
        }
        return null;
    }

    async login(user: IUser, response: Response) {
        const { _id, name, email, role } = user;
        const payload = {
            sub: "token login",
            iss: "from server",
            _id,
            name,
            email,
            role
        };

        const refresh_token = this.createRefreshTOken(payload);

        // update user with refresh token
        await this.usersService.updateUserWithToken(refresh_token, _id);

        // set refresh token to cookie
        response.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE') as StringValue)
        })


        return {
            access_token: this.jwtService.sign(payload),
            user: {
                _id,
                name,
                email,
                role
            }

        };

    }


    async register(registerUserDTO: RegisterUserDto) {
        let userExist = await this.usersService.findOneByUserName(registerUserDTO.email);
        if (userExist) {
            throw new BadRequestException("User already exist");
        }
        const hashedPassword = this.hashPassword(registerUserDTO.password);
        registerUserDTO.password = hashedPassword;
        registerUserDTO.role = 'USER'
        let user = await this.userModel.create(registerUserDTO);
        return {
            _id: user?._id,
            createdAt: user?.createdAt
        };
    }

    createRefreshTOken = (payload) => {
        const refresh_token = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
            expiresIn: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE') as StringValue) / 1000
        })
        return refresh_token;
    }
}
