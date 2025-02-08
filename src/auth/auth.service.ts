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
import { Role, RoleDocument } from 'src/roles/schemas/role.schema';
import { USER_ROLE } from 'src/databases/sample';
import { RolesService } from 'src/roles/roles.service';
@Injectable()
export class AuthService {
    constructor(private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
        @InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>,
        private roleService: RolesService

    ) { }

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
                const userRole = user.role as unknown as { _id: string; name: string };
                const temp = await this.roleService.findOne(userRole._id);
                const objUser = {
                    ...user.toObject(),
                    permissions: temp?.permissions ?? []
                }
                return objUser;
            }
        }
        return null;
    }

    async login(user: IUser, response: Response) {
        const { _id, name, email, role, permissions } = user;
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
                role,
                permissions
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

        const fetchRole = await this.roleModel.findOne({ name: USER_ROLE });
        let user = await this.userModel.create({ ...registerUserDTO, role: fetchRole?._id });
        return user;
    }

    createRefreshTOken = (payload) => {
        const refresh_token = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
            expiresIn: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE') as StringValue) / 1000
        })
        return refresh_token;
    }

    processNewToken = async (refreshToken: string, response: Response) => {
        try {
            this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET')
            })

            let user = await this.usersService.findUserByToken(refreshToken);
            if (user) {
                // update new refresh token
                const { _id, name, email, role } = user;
                const payload = {
                    sub: "token refresh",
                    iss: "from server",
                    _id,
                    name,
                    email,
                    role
                };

                const refresh_token = this.createRefreshTOken(payload);

                // update user with refresh token
                await this.usersService.updateUserWithToken(refresh_token, _id.toString());

                const userRole = user.role as unknown as { _id: string; name: string };
                const temp = await this.roleService.findOne(userRole._id);

                // set refresh token to cookie
                response.clearCookie('refresh_token');
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
                        role,
                        permissions: temp?.permissions ?? []
                    }

                };
            } else {

            }
            console.log('user', user)
        } catch (error) {
            throw new BadRequestException("Refresh Token không hợp lệ. Vui lòng login");
        }
    }

    logout = async (user: IUser, res: Response) => {
        await this.usersService.updateUserWithToken('', user._id);
        res.clearCookie('refresh_token');
        return "logout success";
    }
}
