"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskFactory = void 0;
const util_1 = require("../util");
function TaskFactory(db, controller) {
    async function createTask(taskListId, task) {
        const id = util_1.getUuid();
        const { rows } = await db.query({
            name: 'create-task',
            text: 'INSERT INTO tasks (id, task_list_id, description, due, completed) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            values: [id, taskListId, task.description, task.due, task.completed]
        });
        const row = rows[0];
        return {
            id,
            description: row.description,
            due: row.due,
            completed: row.completed,
            files: []
        };
    }
    async function deleteTask(taskId) {
        await db.query({
            name: 'delete-tasks',
            text: 'DELETE FROM tasks WHERE id = $1',
            values: [taskId]
        });
    }
    async function deleteTasks(conn, taskListId) {
        await conn.query({
            name: 'delete-tasklist-tasks',
            text: 'DELETE FROM tasks WHERE task_list_id = $1',
            values: [taskListId]
        });
    }
    async function getTask(taskId) {
        const { rows } = await db.query({
            name: 'get-task',
            text: 'SELECT * FROM tasks as T, files as F WHERE T.id = $1 AND T.id = F.task_id',
            values: [taskId]
        });
        return formatTasks(rows)[0] || null;
    }
    async function getTasks(taskListId) {
        const { rows } = await db.query({
            name: 'get-tasks',
            text: 'SELECT * FROM tasks as T, files as F WHERE T.task_list_id = $1 AND T.id = F.task_id',
            values: [taskListId]
        });
        return formatTasks(rows);
    }
    async function setTask(task) {
        await db.query({
            name: 'set-task',
            text: 'UPDATE tasks SET description = $1, due = $2, completed = $3 WHERE id = $4',
            values: [task.description, task.due, task.completed, task.id]
        });
        return getTask(task.id);
    }
    return {
        createTask,
        deleteTask,
        deleteTasks,
        getTask,
        getTasks,
        setTask
    };
}
exports.TaskFactory = TaskFactory;
function formatTasks(rows) {
    const filesMap = {};
    const results = [];
    rows.forEach(row => {
        const id = row.T.id;
        const file = {
            id: row.F.id,
            name: row.F.name
        };
        if (filesMap[id]) {
            filesMap[id].push(file);
        }
        else {
            filesMap[id] = [file];
            results.push({
                id: row.T.id,
                description: row.T.description,
                due: row.T.due,
                completed: row.T.completed,
                files: filesMap[id]
            });
        }
    });
    return results;
}
//# sourceMappingURL=tasks.js.map