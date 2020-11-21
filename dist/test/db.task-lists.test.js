"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../app");
const db_1 = __importDefault(require("../db"));
const chai_1 = require("chai");
const pg_1 = require("pg");
describe('Task Lists DB Controller', () => {
    const accountId = '123';
    let db;
    let pool;
    before(() => {
        const options = app_1.getDefaultOptions({ database: { name: 'test' } }).database;
        pool = new pg_1.Pool({
            user: options.user,
            password: options.password,
            host: options.host,
            port: options.port,
            database: options.name
        });
        db = db_1.default(pool);
    });
    after(async () => {
        await pool.end();
    });
    beforeEach(async () => {
        await pool.query({
            name: 'truncate-task-list',
            text: 'TRUNCATE task_lists'
        });
    });
    it('initializes with zero task lists', async () => {
        const lists = await db.taskLists.getTaskLists(accountId);
        chai_1.expect(lists.length).to.equal(0);
    });
    it('can create a task list', async () => {
        const list = await db.taskLists.createTaskList(accountId, 'first');
        chai_1.expect(list.accountId).to.equal(accountId);
        chai_1.expect(list.name).to.equal('first');
        chai_1.expect(list.id.length).to.equal(32);
        const lists = await db.taskLists.getTaskLists(accountId);
        chai_1.expect(lists.length).to.equal(1);
        chai_1.expect(lists[0]).to.deep.equal(list);
    });
    it('can rename a task list', async () => {
        const list = await db.taskLists.createTaskList(accountId, 'first');
        await db.taskLists.renameTaskList(list.id, 'second');
        const lists = await db.taskLists.getTaskLists(accountId);
        chai_1.expect(lists.length).to.equal(1);
        chai_1.expect(lists[0].id).to.equal(list.id);
        chai_1.expect(lists[0].name).to.equal('second');
    });
    it('can delete a task list', async () => {
        const a = await db.taskLists.createTaskList(accountId, 'first');
        const b = await db.taskLists.createTaskList(accountId, 'second');
        let lists = await db.taskLists.getTaskLists(accountId);
        chai_1.expect(lists.length).to.equal(2);
        await db.taskLists.deleteTaskList(a.id);
        lists = await db.taskLists.getTaskLists(accountId);
        chai_1.expect(lists.length).to.equal(1);
        chai_1.expect(lists[0].id).to.equal(b.id);
    });
    it('can delete all task lists', async () => {
        const a = await db.taskLists.createTaskList(accountId, 'first');
        const b = await db.taskLists.createTaskList(accountId, 'second');
        let lists = await db.taskLists.getTaskLists(accountId);
        chai_1.expect(lists.length).to.equal(2);
        const conn = await pool.connect();
        await db.taskLists.deleteTaskLists(conn, accountId);
        conn.release();
        lists = await db.taskLists.getTaskLists(accountId);
        chai_1.expect(lists.length).to.equal(0);
    });
});
//# sourceMappingURL=db.task-lists.test.js.map