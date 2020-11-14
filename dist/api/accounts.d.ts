import { DatabaseController } from '../db';
import Express from 'express-serve-static-core';
export default function (db: DatabaseController): {
    createAccount(req: Express.Request, res: Express.Response): Promise<void>;
    deleteAccount(req: Express.Request, res: Express.Response): Promise<void>;
    getAccount(req: Express.Request, res: Express.Response): Promise<void>;
    updateAccount(req: Express.Request, res: Express.Response): Promise<void>;
};
