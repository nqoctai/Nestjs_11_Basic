import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    private configService: ConfigService,
  ) { }

  @Get()
  getHello(): string {
    console.log('check port', this.configService.get<string>("PORT"))
    return this.appService.getHello();
  }


  @Post('/login')
  @UseGuards(LocalAuthGuard)
  handleLogin(@Request() req) {
    return req.user;
  }
}
