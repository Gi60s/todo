import { Pool, PoolClient } from "pg";
import { DatabaseController } from ".";
import { TaskObject } from './tasks';
interface TaskListObject {
    id: string;
    name: string;
}
interface TaskListDetailedObject extends TaskListObject {
    tasks: Array<TaskObject>;
}
export interface TaskListController {
    createTaskList(name: string): Promise<TaskListObject | null>;
    getTaskLists(userId: string): Promise<Array<TaskListObject>>;
    getTaskListDetails(taskListId: string): Promise<TaskListDetailedObject | null>;
    renameTaskList(taskListId: string, name: string): Promise<TaskListObject | null>;
    deleteTaskList(taskListId: string, client?: PoolClient): void;
}
export declare function TaskListFactory(db: Pool, controller: DatabaseController): TaskListController;
export {};
