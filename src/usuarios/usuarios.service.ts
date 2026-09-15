import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { DatabaseService } from '../database/database.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

interface UsuarioExistente extends RowDataPacket {
  id_usuario: number;
}

interface PerfilBanco extends RowDataPacket {
  id_perfil: number;
  nome_perfil: string;
}

@Injectable()
export class UsuariosService {
  constructor(private readonly databaseService: DatabaseService) {}

  async criarUsuario(dados: CreateUsuarioDto) {
    const nome = dados.nome.trim();

    const cpf = dados.cpf?.replace(/\D/g, '') || null;

    const email = dados.email.trim().toLowerCase();

    const perfil = dados.perfil.trim().toUpperCase();

    if (cpf && cpf.length !== 11) {
      throw new BadRequestException('CPF deve possuir 11 números');
    }

    const usuariosExistentes = await this.databaseService.query<
      UsuarioExistente[]
    >(
      `
        SELECT
          id_usuario
        FROM USUARIOS
        WHERE email_usuario = ?
           OR cpf_usuario = ?
        LIMIT 1
        `,
      [email, cpf],
    );

    if (usuariosExistentes.length > 0) {
      throw new ConflictException('CPF ou e-mail já cadastrado');
    }

    const perfis = await this.databaseService.query<PerfilBanco[]>(
      `
        SELECT
          id_perfil,
          nome_perfil
        FROM PERFIS
        WHERE nome_perfil = ?
        LIMIT 1
        `,
      [perfil],
    );

    if (perfis.length === 0) {
      throw new NotFoundException('Perfil não encontrado');
    }

    if (perfil === 'ADMINISTRADOR') {
      throw new BadRequestException('Perfil não permitido no cadastro público');
    }

    const senhaHash = await bcrypt.hash(dados.senha, 12);

    const perfilEncontrado = perfis[0];

    return this.databaseService.transaction(async (connection) => {
      const [resultadoUsuario] = await connection.execute(
        `
            INSERT INTO USUARIOS
            (
              nome_usuario, cpf_usuario, email_usuario, senha_usuario ) VALUES (?, ?, ?, ?)
            `,
        [nome, cpf, email, senhaHash],
      );

      const resultado = resultadoUsuario as ResultSetHeader;

      const idUsuario = resultado.insertId;

      await connection.execute(
        `
          INSERT INTO USUARIOS_PERFIS
          (
            id_usuario,
            id_perfil,
            perfil_principal
          )
          VALUES (?, ?, 1)
          `,
        [idUsuario, perfilEncontrado.id_perfil],
      );

      return {
        mensagem: 'Usuário cadastrado com sucesso',

        usuario: {
          id_usuario: idUsuario,

          nome_usuario: nome,

          cpf_usuario: cpf,

          email_usuario: email,

          perfil: perfilEncontrado.nome_perfil,
        },
      };
    });
  }
}
