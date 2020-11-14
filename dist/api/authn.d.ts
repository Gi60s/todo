import Express from 'express-serve-static-core';
import { DatabaseController } from '../db';
import { AppOptions } from '../app';
export default function (db: DatabaseController, options: AppOptions): {
    authenticate(req: Express.Request, res: Express.Response): Promise<void>;
};
