"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskFactory = void 0;
const util_1 = require("../util");
function TaskFactory(db, controller) {
    async function checkAccess(accountId, taskId) {
        const { rows } = await db.query({
            name: 'has-task-access',
            text: 'SELECT L.account_id as "account_id" FROM tasks T INNER JOIN task_lists L ON T.task_list_id = L.id WHERE T.id = $1',
            values: [taskId]
        });
        return rows.length > 0
            ? { exists: true, access: rows[0].account_id === accountId }
            : { exists: false, access: false };
    }
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
        return controller.transaction(null, async (conn) => {
            await db.query({
                name: 'delete-tasks',
                text: 'DELETE FROM tasks WHERE id = $1',
                values: [taskId]
            });
            await controller.files.deleteFiles(conn, taskId);
        });
    }
    async function deleteTasks(conn, taskListId) {
        return controller.transaction(conn, async (conn) => {
            const { rows } = await conn.query({
                name: 'delete-tasklist-tasks',
                text: 'DELETE FROM tasks WHERE task_list_id = $1 RETURNING *',
                values: [taskListId]
            });
            const length = rows.length;
            if (length) {
                for (let i = 0; i < length; i++) {
                    await controller.files.deleteFiles(conn, rows[0].id);
                }
            }
        });
    }
    async function getTask(taskId) {
        const { rows } = await db.query({
            name: 'get-task',
            text: `SELECT 
          T.id as "task_id",
          task_list_id, 
          description, 
          due, 
          completed, 
          F.id as "file_id", 
          F.name as "file_name", 
          file_path 
        FROM tasks T 
        LEFT JOIN files F ON T.id = F.task_id
        WHERE T.id = $1`,
            values: [taskId]
        });
        return formatTasks(rows)[0] || null;
    }
    async function getTasks(taskListId) {
        const { rows } = await db.query({
            name: 'get-tasks',
            text: `SELECT 
          T.id as "task_id",
          task_list_id, 
          description, 
          due, 
          completed, 
          F.id as "file_id", 
          F.name as "file_name", 
          file_path 
        FROM tasks T 
        LEFT JOIN files F ON T.id = F.task_id
        WHERE T.task_list_id = $1`,
            values: [taskListId]
        });
        return formatTasks(rows);
    }
    async function setTask(taskId, task) {
        const { rows } = await db.query({
            name: 'set-task',
            text: 'UPDATE tasks SET description = $1, due = $2, completed = $3 WHERE id = $4 RETURNING *',
            values: [task.description, task.due, task.completed, taskId]
        });
        return formatTasks(rows)[0] || null;
    }
    return {
        checkAccess,
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
        const taskId = row.task_id;
        const fileId = row.file_id;
        const task = {
            id: row.task_id,
            description: row.description,
            due: row.due,
            completed: row.completed,
            files: []
        };
        if (fileId) {
            const file = {
                id: row.file_id,
                name: row.file_name
            };
            if (filesMap[taskId]) {
                filesMap[taskId].push(file);
            }
            else {
                filesMap[taskId] = [file];
                task.files = filesMap[taskId];
                results.push(task);
            }
        }
        else {
            results.push(task);
        }
    });
    return results;
}
//# sourceMappingURL=tasks.js.map