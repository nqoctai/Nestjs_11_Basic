import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';
import { AuthService } from 'src/auth/auth.service';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';
import { Public } from 'src/decorator/customize';


@Controller("auth")
export class AuthController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService
    ) { }


    @Post('/login')
    @UseGuards(LocalAuthGuard)
    @Public()
    handleLogin(@Request() req) {
        return this.authService.login(req.user);
    }

    // @UseGuards(JwtAuthGuard)
    // @Public()
    @Get('profile')
    getProfile(@Request() req) {
        let expire = this.configService.get<string>('JWT_ACCESS_EXPIRE')
        console.log('expire', expire)
        console.log(ms(expire as StringValue))
        return req.user;
    }
}
