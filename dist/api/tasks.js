"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(db) {
    return {
        async createTask(req, res) {
            const { body, params } = req.enforcer;
            const { taskListId } = params;
            const list = await db.taskLists.getTaskListDetails(taskListId);
            if (!list) {
                res.sendStatus(404);
            }
            else if (list.accountId !== req.user.id) {
                res.sendStatus(403);
            }
            else {
                await db.tasks.createTask(taskListId, body);
                res.sendStatus(201);
            }
        },
        async deleteTask(req, res) {
            const { params } = req.enforcer;
            const { taskId } = params;
            const { access, exists } = await db.tasks.checkAccess(req.user.id, taskId);
            if (!exists) {
                res.sendStatus(204);
            }
            else if (!access) {
                res.sendStatus(403);
            }
            else {
                await db.tasks.deleteTask(taskId);
                res.sendStatus(204);
            }
        },
        async deleteFile(req, res) {
            const { params } = req.enforcer;
            const { taskId, fileId } = params;
            const { access, exists } = await db.tasks.checkAccess(req.user.id, taskId);
            if (!exists) {
                res.sendStatus(404);
            }
            else if (!access) {
                res.sendStatus(403);
            }
            else {
                await db.files.deleteFile(fileId);
                res.sendStatus(204);
            }
        },
        async getTasks(req, res) {
            const { params } = req.enforcer;
            const { taskListId } = params;
            const list = await db.taskLists.getTaskListDetails(taskListId);
            if (!list) {
                res.sendStatus(404);
            }
            else if (list.accountId !== req.user.id) {
                res.sendStatus(403);
            }
            else {
                const tasks = await db.tasks.getTasks(taskListId);
            }
        },
        async getFile(req, res) {
            const { params } = req.enforcer;
            const { taskId, fileId } = params;
            const { access, exists } = await db.tasks.checkAccess(req.user.id, taskId);
            if (!exists) {
                res.sendStatus(404);
            }
            else if (!access) {
                res.sendStatus(403);
            }
            else {
                const file = await db.files.getFile(fileId);
                if (file) {
                    res.sendFile(file.filePath);
                }
                else {
                    res.sendStatus(404);
                }
            }
        },
        async updateTask(req, res) {
            const { body, params } = req.enforcer;
            const { taskId } = params;
            const { access, exists } = await db.tasks.checkAccess(req.user.id, taskId);
            if (!exists) {
                res.sendStatus(404);
            }
            else if (!access) {
                res.sendStatus(403);
            }
            else {
                const task = await db.tasks.setTask(taskId, body);
                res.enforcer.send(task);
            }
        },
        async uploadFile(req, res) {
            const { body, params } = req.enforcer;
            const { taskId } = params;
            const { access, exists } = await db.tasks.checkAccess(req.user.id, taskId);
            if (!exists) {
                res.sendStatus(404);
            }
            else if (!access) {
                res.sendStatus(403);
            }
            else {
                const { name, content } = body;
                const file = await db.files.saveFile(taskId, name, content);
                res.set('Location', '/tasks/' + taskId + '/files/' + file.id);
                res.status(201);
                res.enforcer.send();
            }
        }
    };
}
exports.default = default_1;
//# sourceMappingURL=tasks.js.map