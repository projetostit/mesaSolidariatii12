import { ConfigService } from '@nestjs/config';
import { PoolConnection } from 'mysql2/promise';
import { ExecuteValues } from 'mysql2';
export declare class DatabaseService {
    private readonly configService;
    private pool;
    constructor(configService: ConfigService);
    query<T = unknown>(sql: string, params?: ExecuteValues[]): Promise<T>;
    transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T>;
}
