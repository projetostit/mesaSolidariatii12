import { Body, Controller, Post, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './types/authenticated-request.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body()
    dados: LoginDto,
  ) {
    return this.authService.login(dados);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return { autenticado: true, usuario: request.usuario };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Req() request: AuthenticatedRequest) {
    return this.authService.logout(request.usuario.id_sessao);
  }
}
