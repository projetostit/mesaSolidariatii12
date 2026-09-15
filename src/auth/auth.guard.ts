import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { RowDataPacket } from 'mysql2';
import { DatabaseService } from '../database/database.service';
import type {
  AuthenticatedRequest,
  JwtTokenPayload,
} from './types/authenticated-request.type';

interface SessaoBanco extends RowDataPacket {
  id_sessao: number;
  id_usuario: number;
  nome_usuario: string;
  id_perfil_ativo: number;
  nome_perfil: string;
}

interface PerfilVinculado extends RowDataPacket {
  nome_perfil: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (typeof authorization !== 'string') {
      throw new UnauthorizedException('Token não informado');
    }
    const [tipo, token] = authorization.split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token inválido');
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtTokenPayload>(
        token,
        {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        },
      );

      const tokenHash = createHash('sha256').update(token).digest('hex');
      const sessoes = await this.databaseService.query<SessaoBanco[]>(
        `
            SELECT s.id_sessao, s.id_usuario, u.nome_usuario, s.id_perfil_ativo, p.nome_perfil FROM SESSOES s
            INNER JOIN USUARIOS u ON u.id_usuario = s.id_usuario
            LEFT JOIN PERFIS p ON p.id_perfil = s.id_perfil_ativo
            WHERE s.token_hash = ?
                AND s.status_sessao = 'ATIVA'
                AND s.data_logout IS NULL
                AND s.data_expiracao > NOW() LIMIT 1 `,
        [tokenHash],
      );

      if (sessoes.length === 0) {
        throw new UnauthorizedException('Sessão inválida ou encerrada');
      }

      const sessao = sessoes[0];
      if (Number(payload.sub) !== Number(sessao.id_usuario)) {
        throw new UnauthorizedException('Sessão inválida');
      }
      const perfis = await this.databaseService.query<PerfilVinculado[]>(
        `
          SELECT p.nome_perfil
          FROM USUARIOS_PERFIS up
          INNER JOIN PERFIS p ON p.id_perfil = up.id_perfil
          WHERE up.id_usuario = ?
            AND up.status_vinculo = 'ATIVO'
          ORDER BY up.perfil_principal DESC, p.nome_perfil ASC
        `,
        [sessao.id_usuario],
      );

      request.usuario = {
        ...payload,
        nome_usuario: sessao.nome_usuario,
        id_sessao: sessao.id_sessao,
        id_usuario: sessao.id_usuario,
        id_perfil_ativo: sessao.id_perfil_ativo,
        perfil_ativo: sessao.nome_perfil,
        perfis: perfis.map((perfil) => perfil.nome_perfil),
      };

      request.token = token;
      return true;
    } catch (erro) {
      if (erro instanceof UnauthorizedException) {
        throw erro;
      }
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
