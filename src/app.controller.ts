import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';
import { AuthService } from 'src/auth/auth.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Public } from 'src/decorator/customize';
import ms, { StringValue } from 'ms';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    private configService: ConfigService,
    private authService: AuthService
  ) { }

  @Get()
  getHello(): string {
    console.log('check port', this.configService.get<string>("PORT"))
    return this.appService.getHello();
  }


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
