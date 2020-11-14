import { DatabaseController } from './';
import { Pool } from "pg";
export interface AccountObject {
    id: string;
    username: string;
}
export interface AccountController {
    authenticate(username: string, password: string): Promise<AccountObject | null>;
    createAccount(username: string, password: string): Promise<AccountObject | null>;
    deleteAccount(username: string): Promise<void>;
    getAccount(username: string): Promise<AccountObject | null>;
    updateAccount(username: string, data: {
        username?: string;
        password?: string;
    }): Promise<AccountObject | null>;
}
export declare function AccountFactory(db: Pool, controller: DatabaseController): AccountController;
