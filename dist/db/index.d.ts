import { Pool, PoolClient } from "pg";
import { AccountController } from './accounts';
import { FileController } from './files';
import { TaskListController } from './task-lists';
import { TaskController } from './tasks';
export interface DatabaseController {
    accounts: AccountController;
    files: FileController;
    taskLists: TaskListController;
    tasks: TaskController;
    transaction<T>(client: PoolClient, callback: TransactionCallback<T>): Promise<T>;
}
declare type TransactionCallback<T> = (conn: PoolClient) => Promise<T>;
export default function (db: Pool): DatabaseController;
export {};
