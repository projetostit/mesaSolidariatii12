import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { ExecuteValues } from 'mysql2';
@Injectable()
export class DatabaseService {
  private pool: Pool;
  constructor(private readonly configService: ConfigService) {
    this.pool = createPool({
      host: this.configService.get<string>('DB_HOST'),
      port: Number(this.configService.get<number>('DB_PORT')),
      user: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  async query<T = unknown>(
    sql: string,
    params: ExecuteValues[] = [],
  ): Promise<T> {
    const [resultado] = await this.pool.execute(sql, params);
    return resultado as T;
  }
  async transaction<T>(
    callback: (connection: PoolConnection) => Promise<T>,
  ): Promise<T> {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const resultado = await callback(connection);

      await connection.commit();

      return resultado;
    } catch (erro) {
      await connection.rollback();

      throw erro;
    } finally {
      connection.release();
    }
  }
}
