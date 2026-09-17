export declare class JwtService {
    signAsync(): Promise<string>;
    verifyAsync(): Promise<Record<string, unknown>>;
}
