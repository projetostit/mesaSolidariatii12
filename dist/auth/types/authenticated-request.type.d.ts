import type { Request } from 'express';
export interface JwtTokenPayload {
    sub: string | number;
    [key: string]: unknown;
}
export interface UsuarioAutenticado extends JwtTokenPayload {
    nome_usuario: string;
    id_sessao: number;
    id_usuario: number;
    id_perfil_ativo: number;
    perfil_ativo: string;
    perfis: string[];
}
export type AuthenticatedRequest = Request & {
    usuario: UsuarioAutenticado;
    token: string;
};
