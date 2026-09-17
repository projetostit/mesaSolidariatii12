"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const database_service_1 = require("../database/database.service");
let AuthService = class AuthService {
    databaseService;
    jwtService;
    limiteTentativas = 5;
    constructor(databaseService, jwtService) {
        this.databaseService = databaseService;
        this.jwtService = jwtService;
    }
    async login(dados) {
        const identificador = dados.login.trim();
        const email = identificador.toLowerCase();
        const cpf = identificador.replace(/\D/g, '');
        const usuarios = await this.databaseService.query(`
        SELECT id_usuario, nome_usuario, cpf_usuario, email_usuario, senha_usuario, status_usuario,tentativas_invalidas, bloqueado_ate FROM USUARIOS WHERE email_usuario = ? OR cpf_usuario = ? LIMIT 1 `, [email, cpf]);
        if (usuarios.length === 0) {
            throw new common_1.UnauthorizedException('Usuário ou senha inválidos');
        }
        const usuario = usuarios[0];
        if (usuario.status_usuario === 'INATIVA') {
            throw new common_1.ForbiddenException('Conta inativa');
        }
        if (usuario.status_usuario === 'BLOQUEADA') {
            throw new common_1.ForbiddenException('Conta bloqueada');
        }
        if (usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
            throw new common_1.ForbiddenException('Acesso temporariamente bloqueado');
        }
        const senhaCorreta = await bcrypt.compare(dados.senha, usuario.senha_usuario);
        if (!senhaCorreta) {
            const novasTentativas = usuario.tentativas_invalidas + 1;
            if (novasTentativas >= this.limiteTentativas) {
                await this.databaseService.query(`
          UPDATE USUARIOS SET tentativas_invalidas = ?, bloqueado_ate =
              DATE_ADD( NOW(), INTERVAL 15 MINUTE) WHERE id_usuario = ?`, [novasTentativas, usuario.id_usuario]);
            }
            else {
                await this.databaseService.query(`
          UPDATE USUARIOS SET tentativas_invalidas = ? WHERE id_usuario = ? `, [novasTentativas, usuario.id_usuario]);
            }
            throw new common_1.UnauthorizedException('Usuário ou senha inválidos');
        }
        await this.databaseService.query(`
      UPDATE USUARIOS SET tentativas_invalidas = 0, bloqueado_ate = NULL WHERE id_usuario = ? `, [usuario.id_usuario]);
        const perfis = await this.databaseService.query(`SELECT 
          p.id_perfil, p.nome_perfil, up.perfil_principal FROM USUARIOS_PERFIS up INNER JOIN PERFIS p ON p.id_perfil = up.id_perfil

        WHERE up.id_usuario = ? AND up.status_vinculo = 'ATIVO'

        ORDER BY up.perfil_principal DESC, p.nome_perfil ASC `, [usuario.id_usuario]);
        if (perfis.length === 0) {
            throw new common_1.ForbiddenException('Usuário sem perfil ativo');
        }
        const perfilAtivo = perfis[0];
        const jti = (0, crypto_1.randomUUID)();
        const token = await this.jwtService.signAsync({
            sub: usuario.id_usuario,
            email: usuario.email_usuario,
            id_perfil: perfilAtivo.id_perfil,
            perfil: perfilAtivo.nome_perfil,
            jti,
        });
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        await this.databaseService.query(`
      INSERT INTO SESSOES (id_usuario, id_perfil_ativo, token_hash, data_expiracao,
        status_sessao)
      VALUES(?,?,?,DATE_ADD(NOW(), INTERVAL 1 HOUR),'ATIVA')`, [usuario.id_usuario, perfilAtivo.id_perfil, tokenHash]);
        return {
            mensagem: 'Login realizado com sucesso',
            access_token: token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nome_usuario: usuario.nome_usuario,
                email_usuario: usuario.email_usuario,
                cpf_usuario: usuario.cpf_usuario,
            },
            perfil_ativo: {
                id_perfil: perfilAtivo.id_perfil,
                nome_perfil: perfilAtivo.nome_perfil,
            },
            perfis: perfis.map((perfil) => ({
                id_perfil: perfil.id_perfil,
                nome_perfil: perfil.nome_perfil,
                principal: Boolean(perfil.perfil_principal),
            })),
        };
    }
    async logout(idSessao) {
        await this.databaseService.query(`
        UPDATE SESSOES
        SET
          status_sessao = 'ENCERRADA',
          data_logout = NOW()
        WHERE
          id_sessao = ?
          AND status_sessao = 'ATIVA'
      `, [idSessao]);
        return {
            mensagem: 'Logout realizado com sucesso',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map