/// <reference types="express-serve-static-core" />
import { Pool } from 'pg';
import { DatabaseController as IDatabaseController } from './db';
interface AppObject {
    app: Express.Application;
    dbController: IDatabaseController;
    pool: Pool;
    start(): Promise<number>;
    stop(): void;
}
export interface AppOptions {
    database?: {
        host?: string;
        name?: string;
        password?: string;
        port?: number;
        user?: string;
    };
    jwt?: {
        issuer?: string;
        secret?: string;
    };
    server?: {
        port?: number;
    };
}
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                username: string;
            };
        }
    }
}
export declare function AppFactory(options?: AppOptions): AppObject;
export declare function getDefaultOptions(options: any): AppOptions;
export {};
