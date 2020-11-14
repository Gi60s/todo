"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const accounts_1 = require("./accounts");
const task_lists_1 = require("./task-lists");
const tasks_1 = require("./tasks");
function default_1(db) {
    async function transaction(client, callback) {
        if (client) {
            return callback(client);
        }
        else {
            client = await db.connect();
            try {
                await client.query('BEGIN');
                const result = await callback(client);
                await client.query('COMMIT');
                return result;
            }
            catch (err) {
                await client.query('ROLLBACK');
                return undefined;
            }
            finally {
                client.release();
            }
        }
    }
    const context = {};
    context.accounts = accounts_1.AccountFactory(db, context);
    context.taskLists = task_lists_1.TaskListFactory(db, context);
    context.tasks = tasks_1.TaskFactory(db, context);
    return context;
}
exports.default = default_1;
//# sourceMappingURL=index.js.map