"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const database_service_1 = require("../database/database.service");
let AuthGuard = class AuthGuard {
    jwtService;
    configService;
    databaseService;
    constructor(jwtService, configService, databaseService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.databaseService = databaseService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization;
        if (typeof authorization !== 'string') {
            throw new common_1.UnauthorizedException('Token não informado');
        }
        const [tipo, token] = authorization.split(' ');
        if (tipo !== 'Bearer' || !token) {
            throw new common_1.UnauthorizedException('Token inválido');
        }
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.getOrThrow('JWT_SECRET'),
            });
            const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
            const sessoes = await this.databaseService.query(`
            SELECT s.id_sessao, s.id_usuario, u.nome_usuario, s.id_perfil_ativo, p.nome_perfil FROM SESSOES s
            INNER JOIN USUARIOS u ON u.id_usuario = s.id_usuario
            LEFT JOIN PERFIS p ON p.id_perfil = s.id_perfil_ativo
            WHERE s.token_hash = ?
                AND s.status_sessao = 'ATIVA'
                AND s.data_logout IS NULL
                AND s.data_expiracao > NOW() LIMIT 1 `, [tokenHash]);
            if (sessoes.length === 0) {
                throw new common_1.UnauthorizedException('Sessão inválida ou encerrada');
            }
            const sessao = sessoes[0];
            if (Number(payload.sub) !== Number(sessao.id_usuario)) {
                throw new common_1.UnauthorizedException('Sessão inválida');
            }
            const perfis = await this.databaseService.query(`
          SELECT p.nome_perfil
          FROM USUARIOS_PERFIS up
          INNER JOIN PERFIS p ON p.id_perfil = up.id_perfil
          WHERE up.id_usuario = ?
            AND up.status_vinculo = 'ATIVO'
          ORDER BY up.perfil_principal DESC, p.nome_perfil ASC
        `, [sessao.id_usuario]);
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
        }
        catch (erro) {
            if (erro instanceof common_1.UnauthorizedException) {
                throw erro;
            }
            throw new common_1.UnauthorizedException('Token inválido ou expirado');
        }
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        database_service_1.DatabaseService])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map