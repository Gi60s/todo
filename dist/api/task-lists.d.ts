import Express from 'express-serve-static-core';
import { DatabaseController } from "../db";
export default function (db: DatabaseController): {
    createTaskList(req: Express.Request, res: Express.Response): Promise<void>;
    deleteTaskList(req: Express.Request, res: Express.Response): Promise<void>;
    getTaskLists(req: Express.Request, res: Express.Response): Promise<void>;
    getTaskList(req: Express.Request, res: Express.Response): Promise<void>;
    updateTaskList(req: Express.Request, res: Express.Response): Promise<void>;
};
