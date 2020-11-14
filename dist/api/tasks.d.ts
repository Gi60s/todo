export default function (): {
    createTask(req: Express.Request, res: Express.Response): void;
    deleteTask(req: Express.Request, res: Express.Response): void;
    deleteFile(req: Express.Request, res: Express.Response): void;
    getTasks(req: Express.Request, res: Express.Response): void;
    getFile(req: Express.Request, res: Express.Response): void;
    updateTask(req: Express.Request, res: Express.Response): void;
    uploadFile(req: Express.Request, res: Express.Response): void;
};
