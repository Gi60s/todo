export default function (): {
    createTaskList(req: Express.Request, res: Express.Response): void;
    deleteTaskList(req: Express.Request, res: Express.Response): void;
    getTaskLists(req: Express.Request, res: Express.Response): void;
    getTaskList(req: Express.Request, res: Express.Response): void;
    updateTaskList(req: Express.Request, res: Express.Response): void;
};
