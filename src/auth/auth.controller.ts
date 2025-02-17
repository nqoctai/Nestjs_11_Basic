import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';
import { AuthService } from 'src/auth/auth.service';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { RegisterUserDto, UserLoginDto } from 'src/users/dto/create-user.dto';
import { Response } from 'express';
import { IUser } from 'src/users/users.interface';
import { Request } from 'express';
import { RolesService } from 'src/roles/roles.service';
import { ApiBody } from '@nestjs/swagger';


@Controller("auth")
export class AuthController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService,
        private roleService: RolesService
    ) { }


    @Post('/login')
    @UseGuards(LocalAuthGuard)
    @Public()
    @ApiBody({ type: UserLoginDto, })
    @ResponseMessage("User login")
    handleLogin(@Req() req, @Res({ passthrough: true }) response: Response) {
        return this.authService.login(req.user, response);
    }

    // @UseGuards(JwtAuthGuard)
    // @Public()
    @Get('profile')
    getProfile(@Req() req) {
        let expire = this.configService.get<string>('JWT_ACCESS_EXPIRE')
        console.log('expire', expire)
        console.log(ms(expire as StringValue))
        return req.user;
    }


    @Post('/register')
    @ResponseMessage("Register a new User")
    @Public()
    handleRegister(@Body() registerUser: RegisterUserDto) {
        return this.authService.register(registerUser);
    }

    @Get('/account')
    @ResponseMessage("Get user information")
    async handleGetAccount(@User() user: IUser) {
        const temp = await this.roleService.findOne(user.role._id) as any;
        user.permissions = temp.permissions;
        return { user };
    }


    @Get('/refresh')
    @Public()
    @ResponseMessage("Get User by refresh token")
    handleRefreshToken(@Req() req: Request, @Res({ passthrough: true }) response: Response) {
        const refreshToken = req.cookies['refresh_token'];
        return this.authService.processNewToken(refreshToken, response);
    }

    @Post('/logout')
    @ResponseMessage("Logout User")
    handleLogout(@User() user: IUser, @Res({ passthrough: true }) response: Response) {
        return this.authService.logout(user, response);
    }
}
