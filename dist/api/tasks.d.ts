import Express from 'express-serve-static-core';
import { DatabaseController } from '../db';
export default function (db: DatabaseController): {
    createTask(req: Express.Request, res: Express.Response): Promise<void>;
    deleteTask(req: Express.Request, res: Express.Response): Promise<void>;
    deleteFile(req: Express.Request, res: Express.Response): Promise<void>;
    getTasks(req: Express.Request, res: Express.Response): Promise<void>;
    getFile(req: Express.Request, res: Express.Response): Promise<void>;
    updateTask(req: Express.Request, res: Express.Response): Promise<void>;
    uploadFile(req: Express.Request, res: Express.Response): Promise<void>;
};
