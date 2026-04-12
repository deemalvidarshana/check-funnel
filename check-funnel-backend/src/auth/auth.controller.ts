import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto'; // keep the DTO import

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: any) {  // temporarily change to any
    console.log('Raw register body:', body);
    return this.authService.register(body);
  }

  @Post('login')
 @HttpCode(HttpStatus.OK)
 async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
 }
}
