import { Pool } from "pg";
import { AccountController } from './accounts';
import { TaskListController } from './task-lists';
import { TaskController } from './tasks';
export interface DatabaseController {
    accounts: AccountController;
    taskLists: TaskListController;
    tasks: TaskController;
}
export default function (db: Pool): DatabaseController;
