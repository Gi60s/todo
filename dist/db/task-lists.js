"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskListFactory = void 0;
const util_1 = require("../util");
function TaskListFactory(db, controller) {
    async function createTaskList(name) {
        if (name.length === 0)
            throw new util_1.StatusError('Task list name cannot be blank', 400);
        const id = util_1.getUuid();
        const { rowCount } = await db.query({
            name: 'task-list-create',
            text: 'INSERT INTO task_lists (id, name) VALUES ($1, $2)',
            values: [id, name]
        });
        return rowCount > 0 ? { id, name } : null;
    }
    async function getTaskLists(accountId) {
        const { rows } = await db.query({
            name: 'task-list-find',
            text: 'SELECT * FROM task_lists WHERE account_id = $1',
            values: [accountId]
        });
        return rows.map(r => {
            return { id: r.id, name: r.name };
        });
    }
    async function getTaskListDetails(taskListId) {
        const { rows } = await db.query({
            name: 'task-list-get',
            text: `SELECT L.name, T.id, T.description, T.due, T.completed
        FROM task_lists as L, tasks as T
        WHERE L.id = $1 AND L.id = T.task_list_id`,
            values: [taskListId]
        });
        if (!rows.length)
            return null;
        return {
            id: taskListId,
            name: rows[0].name,
            tasks: rows.map(r => {
                return {
                    id: r.id,
                    description: r.description,
                    due: r.due,
                    completed: r.completed
                };
            })
        };
    }
    async function renameTaskList(taskListId, name) {
        const { rowCount } = await db.query({
            name: 'task-list-rename',
            text: 'UPDATE task_lists SET name = $1 WHERE id = $2',
            values: [taskListId, name]
        });
        return rowCount ? { id: taskListId, name } : null;
    }
    async function deleteTaskList(taskListId, client) {
        const conn = client ? client : db;
        await conn.query({
            name: 'delete-task-list',
            text: 'DELETE from task_lists WHERE id = $1',
            values: [taskListId]
        });
    }
    return {
        createTaskList,
        getTaskLists,
        getTaskListDetails,
        renameTaskList,
        deleteTaskList
    };
}
exports.TaskListFactory = TaskListFactory;
//# sourceMappingURL=task-lists.js.map