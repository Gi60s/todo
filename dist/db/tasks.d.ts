import { Pool, PoolClient } from "pg";
import { DatabaseController } from ".";
export interface BasicTaskObject {
    description: string;
    due: Date | null;
    completed: Date | null;
}
export interface TaskObject extends BasicTaskObject {
    id: string;
    files?: Array<{
        id: string;
        name: string;
    }>;
}
export interface TaskController {
    checkAccess(accountId: string, taskId: string): Promise<{
        access: boolean;
        exists: boolean;
    }>;
    createTask(taskListId: string, task: BasicTaskObject): Promise<TaskObject>;
    deleteTask(taskId: string): Promise<void>;
    deleteTasks(conn: PoolClient, taskListId: string): Promise<void>;
    getTask(taskId: string): Promise<TaskObject>;
    getTasks(taskListId: string): Promise<Array<TaskObject>>;
    setTask(taskId: string, task: BasicTaskObject): Promise<TaskObject>;
}
export declare function TaskFactory(db: Pool, controller: DatabaseController): TaskController;
