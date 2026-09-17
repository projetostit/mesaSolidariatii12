import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
export declare class AuthGuard implements CanActivate {
    private readonly jwtService;
    private readonly configService;
    private readonly databaseService;
    constructor(jwtService: JwtService, configService: ConfigService, databaseService: DatabaseService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
