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
exports.UsuariosService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const database_service_1 = require("../database/database.service");
let UsuariosService = class UsuariosService {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async criarUsuario(dados) {
        const nome = dados.nome.trim();
        const cpf = dados.cpf?.replace(/\D/g, '') || null;
        const email = dados.email.trim().toLowerCase();
        const perfil = dados.perfil.trim().toUpperCase();
        if (cpf && cpf.length !== 11) {
            throw new common_1.BadRequestException('CPF deve possuir 11 números');
        }
        const usuariosExistentes = await this.databaseService.query(`
        SELECT
          id_usuario
        FROM USUARIOS
        WHERE email_usuario = ?
           OR cpf_usuario = ?
        LIMIT 1
        `, [email, cpf]);
        if (usuariosExistentes.length > 0) {
            throw new common_1.ConflictException('CPF ou e-mail já cadastrado');
        }
        const perfis = await this.databaseService.query(`
        SELECT
          id_perfil,
          nome_perfil
        FROM PERFIS
        WHERE nome_perfil = ?
        LIMIT 1
        `, [perfil]);
        if (perfis.length === 0) {
            throw new common_1.NotFoundException('Perfil não encontrado');
        }
        if (perfil === 'ADMINISTRADOR') {
            throw new common_1.BadRequestException('Perfil não permitido no cadastro público');
        }
        const senhaHash = await bcrypt.hash(dados.senha, 12);
        const perfilEncontrado = perfis[0];
        return this.databaseService.transaction(async (connection) => {
            const [resultadoUsuario] = await connection.execute(`
            INSERT INTO USUARIOS
            (
              nome_usuario, cpf_usuario, email_usuario, senha_usuario ) VALUES (?, ?, ?, ?)
            `, [nome, cpf, email, senhaHash]);
            const resultado = resultadoUsuario;
            const idUsuario = resultado.insertId;
            await connection.execute(`
          INSERT INTO USUARIOS_PERFIS
          (
            id_usuario,
            id_perfil,
            perfil_principal
          )
          VALUES (?, ?, 1)
          `, [idUsuario, perfilEncontrado.id_perfil]);
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
};
exports.UsuariosService = UsuariosService;
exports.UsuariosService = UsuariosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], UsuariosService);
//# sourceMappingURL=usuarios.service.js.map