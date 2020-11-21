"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../app");
const db_1 = __importDefault(require("../db"));
const chai_1 = require("chai");
const pg_1 = require("pg");
describe('Tasks DB Controller', () => {
    const taskListId = '123';
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
        await pool.query({
            name: 'truncate-tasks',
            text: 'TRUNCATE tasks'
        });
    });
    it('initializes with zero tasks', async () => {
        const tasks = await db.tasks.getTasks(taskListId);
        chai_1.expect(tasks.length).to.equal(0);
    });
    it('can create a task without due date', async () => {
        const task = await db.tasks.createTask(taskListId, {
            description: 'foo',
            due: null,
            completed: null
        });
        chai_1.expect(task.description).to.equal('foo');
        chai_1.expect(task.due).to.equal(null);
        chai_1.expect(task.completed).to.equal(null);
        const tasks = await db.tasks.getTasks(taskListId);
        chai_1.expect(tasks.length).to.equal(1);
        chai_1.expect(tasks[0]).to.deep.equal(task);
    });
    it('can create a task with due date', async () => {
        const due = new Date();
        const task = await db.tasks.createTask(taskListId, {
            description: 'foo',
            due,
            completed: null
        });
        chai_1.expect(+task.due).to.equal(+due);
        const tasks = await db.tasks.getTasks(taskListId);
        chai_1.expect(tasks.length).to.equal(1);
        chai_1.expect(tasks[0]).to.deep.equal(task);
    });
    it('can update a task', async () => {
        const task = await db.tasks.createTask(taskListId, {
            description: 'foo',
            due: null,
            completed: null
        });
        const completed = new Date();
        await db.tasks.setTask(task.id, { description: 'bar', due: null, completed });
        const tasks = await db.tasks.getTasks(taskListId);
        chai_1.expect(tasks.length).to.equal(1);
        chai_1.expect(tasks[0].id).to.equal(task.id);
        chai_1.expect(tasks[0].description).to.equal('bar');
        chai_1.expect(+tasks[0].completed).to.equal(+completed);
    });
    it('can delete a task', async () => {
        const a = await db.tasks.createTask(taskListId, {
            description: 'foo',
            due: null,
            completed: null
        });
        const b = await db.tasks.createTask(taskListId, {
            description: 'bar',
            due: null,
            completed: null
        });
        let tasks = await db.tasks.getTasks(taskListId);
        chai_1.expect(tasks.length).to.equal(2);
        await db.tasks.deleteTask(a.id);
        tasks = await db.tasks.getTasks(taskListId);
        chai_1.expect(tasks.length).to.equal(1);
        chai_1.expect(tasks[0].id).to.equal(b.id);
    });
    it('can delete all tasks for a list', async () => {
        const a = await db.tasks.createTask(taskListId, {
            description: 'foo',
            due: null,
            completed: null
        });
        const b = await db.tasks.createTask(taskListId, {
            description: 'bar',
            due: null,
            completed: null
        });
        let tasks = await db.tasks.getTasks(taskListId);
        chai_1.expect(tasks.length).to.equal(2);
        const conn = await pool.connect();
        await db.tasks.deleteTasks(conn, taskListId);
        conn.release();
        tasks = await db.tasks.getTasks(taskListId);
        chai_1.expect(tasks.length).to.equal(0);
    });
});
//# sourceMappingURL=db.tasks.test.js.map