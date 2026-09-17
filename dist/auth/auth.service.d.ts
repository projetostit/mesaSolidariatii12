import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly databaseService;
    private readonly jwtService;
    private readonly limiteTentativas;
    constructor(databaseService: DatabaseService, jwtService: JwtService);
    login(dados: LoginDto): Promise<{
        mensagem: string;
        access_token: string;
        usuario: {
            id_usuario: number;
            nome_usuario: string;
            email_usuario: string;
            cpf_usuario: string | null;
        };
        perfil_ativo: {
            id_perfil: number;
            nome_perfil: string;
        };
        perfis: {
            id_perfil: number;
            nome_perfil: string;
            principal: boolean;
        }[];
    }>;
    logout(idSessao: number): Promise<{
        mensagem: string;
    }>;
}
