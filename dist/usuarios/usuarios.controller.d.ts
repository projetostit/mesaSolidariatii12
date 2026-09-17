import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UsuariosService } from './usuarios.service';
export declare class UsuariosController {
    private readonly usuariosService;
    constructor(usuariosService: UsuariosService);
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
