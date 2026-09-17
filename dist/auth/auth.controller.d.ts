import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { AuthenticatedRequest } from './types/authenticated-request.type';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    me(request: AuthenticatedRequest): {
        autenticado: boolean;
        usuario: import("./types/authenticated-request.type").UsuarioAutenticado;
    };
    logout(request: AuthenticatedRequest): Promise<{
        mensagem: string;
    }>;
}
