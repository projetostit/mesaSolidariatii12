import { DatabaseService } from '../database/database.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
export declare class UsuariosService {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    criarUsuario(dados: CreateUsuarioDto): Promise<{
        mensagem: string;
        usuario: {
            id_usuario: number;
            nome_usuario: string;
            cpf_usuario: string | null;
            email_usuario: string;
            perfil: string;
        };
    }>;
}
