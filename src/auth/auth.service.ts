import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { RowDataPacket } from 'mysql2';

import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';

interface UsuarioBanco extends RowDataPacket {
  id_usuario: number;
  nome_usuario: string;
  cpf_usuario: string | null;
  email_usuario: string;
  senha_usuario: string;
  status_usuario: 'ATIVA' | 'INATIVA' | 'BLOQUEADA';
  tentativas_invalidas: number;
  bloqueado_ate: Date | null;
}

interface PerfilUsuario extends RowDataPacket {
  id_perfil: number;
  nome_perfil: string;
  perfil_principal: number;
}

@Injectable()
export class AuthService {
  private readonly limiteTentativas = 5;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dados: LoginDto) {
    // =========================================================
    // 1. NORMALIZA O LOGIN
    // =========================================================

    const identificador = dados.login.trim();

    const email = identificador.toLowerCase();

    const cpf = identificador.replace(/\D/g, '');

    // =========================================================
    // 2. BUSCA O USUÁRIO NO BANCO
    // =========================================================

    const usuarios =
      await this.databaseService.query<UsuarioBanco[]>(
        `
        SELECT
          id_usuario,
          nome_usuario,
          cpf_usuario,
          email_usuario,
          senha_usuario,
          status_usuario,
          tentativas_invalidas,
          bloqueado_ate
        FROM USUARIOS
        WHERE email_usuario = ?
           OR cpf_usuario = ?
        LIMIT 1
        `,
        [email, cpf],
      );

    if (usuarios.length === 0) {
      throw new UnauthorizedException(
        'Usuário ou senha inválidos',
      );
    }

    const usuario = usuarios[0];

    // =========================================================
    // 3. VERIFICA STATUS DO USUÁRIO
    // =========================================================

    if (usuario.status_usuario === 'INATIVA') {
      throw new ForbiddenException('Conta inativa');
    }

    if (usuario.status_usuario === 'BLOQUEADA') {
      throw new ForbiddenException('Conta bloqueada');
    }

    if (
      usuario.bloqueado_ate &&
      new Date(usuario.bloqueado_ate) > new Date()
    ) {
      throw new ForbiddenException(
        'Acesso temporariamente bloqueado',
      );
    }

    // =========================================================
    // 4. VALIDA A SENHA
    // =========================================================

    const senhaCorreta = await bcrypt.compare(
      dados.senha,
      usuario.senha_usuario,
    );

    if (!senhaCorreta) {
      const novasTentativas =
        usuario.tentativas_invalidas + 1;

      if (
        novasTentativas >= this.limiteTentativas
      ) {
        await this.databaseService.query(
          `
          UPDATE USUARIOS
          SET
            tentativas_invalidas = ?,
            bloqueado_ate = DATE_ADD(
              NOW(),
              INTERVAL 15 MINUTE
            )
          WHERE id_usuario = ?
          `,
          [
            novasTentativas,
            usuario.id_usuario,
          ],
        );
      } else {
        await this.databaseService.query(
          `
          UPDATE USUARIOS
          SET tentativas_invalidas = ?
          WHERE id_usuario = ?
          `,
          [
            novasTentativas,
            usuario.id_usuario,
          ],
        );
      }

      throw new UnauthorizedException(
        'Usuário ou senha inválidos',
      );
    }

    // =========================================================
    // 5. RESETA AS TENTATIVAS APÓS LOGIN CORRETO
    // =========================================================

    await this.databaseService.query(
      `
      UPDATE USUARIOS
      SET
        tentativas_invalidas = 0,
        bloqueado_ate = NULL
      WHERE id_usuario = ?
      `,
      [usuario.id_usuario],
    );

    // =========================================================
    // 6. BUSCA OS PERFIS DO USUÁRIO
    // =========================================================

    const perfis =
      await this.databaseService.query<
        PerfilUsuario[]
      >(
        `
        SELECT
          p.id_perfil,
          p.nome_perfil,
          up.perfil_principal

        FROM USUARIOS_PERFIS up

        INNER JOIN PERFIS p
          ON p.id_perfil = up.id_perfil

        WHERE up.id_usuario = ?
          AND up.status_vinculo = 'ATIVO'

        ORDER BY
          up.perfil_principal DESC,
          p.nome_perfil ASC
        `,
        [usuario.id_usuario],
      );

    if (perfis.length === 0) {
      throw new ForbiddenException(
        'Usuário sem perfil ativo',
      );
    }

    // =========================================================
    // 7. DEFINE O PERFIL ATIVO
    // =========================================================

    const perfilAtivo = perfis[0];

    // =========================================================
    // 8. CRIA O TOKEN
    // =========================================================

    const jti = randomUUID();

    const token =
      await this.jwtService.signAsync({
        sub: usuario.id_usuario,

        email: usuario.email_usuario,

        id_perfil: perfilAtivo.id_perfil,

        perfil: perfilAtivo.nome_perfil,

        jti,
      });

    // =========================================================
    // 9. GERA O HASH DO TOKEN
    // =========================================================

    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex');

    // =========================================================
    // 10. CRIA A SESSÃO SEM TEMPO DE EXPIRAÇÃO
    // =========================================================

    await this.databaseService.query(
  `
  INSERT INTO SESSOES (
    id_usuario,
    id_perfil_ativo,
    token_hash,
    data_expiracao,
    status_sessao
  )
  VALUES (
    ?,
    ?,
    ?,
    '2099-12-31 23:59:59',
    'ATIVA'
  )
  `,
  [
    usuario.id_usuario,
    perfilAtivo.id_perfil,
    tokenHash,
  ],
    );

    // =========================================================
    // 11. RETORNA OS DADOS PARA O FRONTEND
    // =========================================================

    return {
      mensagem:
        'Login realizado com sucesso',

      access_token: token,

      usuario: {
        id_usuario:
          usuario.id_usuario,

        nome_usuario:
          usuario.nome_usuario,

        email_usuario:
          usuario.email_usuario,

        cpf_usuario:
          usuario.cpf_usuario,
      },

      perfil_ativo: {
        id_perfil:
          perfilAtivo.id_perfil,

        nome_perfil:
          perfilAtivo.nome_perfil,
      },

      perfis: perfis.map(
        (perfil) => ({
          id_perfil:
            perfil.id_perfil,

          nome_perfil:
            perfil.nome_perfil,

          principal: Boolean(
            perfil.perfil_principal,
          ),
        }),
      ),
    };
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  async logout(idSessao: number) {
    await this.databaseService.query(
      `
      UPDATE SESSOES
      SET
        status_sessao = 'ENCERRADA',
        data_logout = NOW()

      WHERE id_sessao = ?
        AND status_sessao = 'ATIVA'
      `,
      [idSessao],
    );

    return {
      mensagem:
        'Logout realizado com sucesso',
    };
  }
}