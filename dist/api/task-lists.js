"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(db) {
    return {
        async createTaskList(req, res) {
            const { body } = req.enforcer;
            const list = await db.taskLists.createTaskList(req.user.id, body.name);
            res.set('Location', '/task-lists/' + list.id);
            res.status(201);
            res.enforcer.send();
        },
        async deleteTaskList(req, res) {
            const { params } = req.enforcer;
            const { taskListId } = params;
            const list = await db.taskLists.getTaskListDetails(taskListId);
            if (!list) {
                res.sendStatus(204);
            }
            else if (list.accountId !== req.user.id) {
                res.sendStatus(403);
            }
            else {
                await db.taskLists.deleteTaskList(taskListId);
                res.sendStatus(204);
            }
        },
        async getTaskLists(req, res) {
            const lists = await db.taskLists.getTaskLists(req.user.id);
            res.enforcer.send(lists);
        },
        async getTaskList(req, res) {
            const { params, query } = req.enforcer;
            const { taskListId } = params;
            const list = await db.taskLists.getTaskListDetails(taskListId);
            if (!list) {
                res.sendStatus(404);
            }
            else if (list.accountId !== req.user.id) {
                res.sendStatus(403);
            }
            else {
                if (!query.allTasks)
                    list.tasks = list.tasks.filter(t => t.completed === null);
                res.enforcer.send(list);
            }
        },
        async updateTaskList(req, res) {
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
                await db.taskLists.renameTaskList(taskListId, body.name);
                res.sendStatus(200);
            }
        }
    };
}
exports.default = default_1;
//# sourceMappingURL=task-lists.js.map