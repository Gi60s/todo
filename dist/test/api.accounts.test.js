"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../app");
const chai_1 = require("chai");
const supertest_1 = __importDefault(require("supertest"));
describe('Accounts API', () => {
    let app;
    let pool;
    before(() => {
        const result = app_1.AppFactory({ database: { name: 'test' } });
        app = result.app;
        pool = result.pool;
    });
    async function authenticate(username, password) {
        const res = await supertest_1.default(app)
            .put('/authenticate')
            .send({ username, password })
            .expect(200);
        return res.text;
    }
    describe('account creation', () => {
        it('can create a new account if it does not already exist', async () => {
            await pool.query('TRUNCATE accounts');
            await supertest_1.default(app)
                .post('/accounts')
                .send({ username: 'foo', password: 'bar' })
                .expect(201);
        });
        it('will have a conflict if an account already exists', async () => {
            await pool.query('TRUNCATE accounts');
            await supertest_1.default(app)
                .post('/accounts')
                .send({ username: 'foo', password: 'bar' });
            await supertest_1.default(app)
                .post('/accounts')
                .send({ username: 'foo', password: 'bar' })
                .expect(409);
        });
    });
    describe('existing accounts', () => {
        beforeEach(async () => {
            await pool.query('TRUNCATE accounts');
            await supertest_1.default(app).post('/accounts').send({ username: 'foo', password: 'bar' });
        });
        describe('authenticate', () => {
            it('can log in using correct account credentials', async () => {
                return authenticate('foo', 'bar');
            });
            it('cannot log in using invalid account credentials', async () => {
                await supertest_1.default(app)
                    .put('/authenticate')
                    .send({ username: 'foo', password: 'foo' })
                    .expect(401);
            });
        });
    });
    describe('authenticated accounts', () => {
        let token = '';
        beforeEach(async () => {
            await pool.query('TRUNCATE accounts');
            await supertest_1.default(app).post('/accounts').send({ username: 'foo', password: 'bar' });
            token = await authenticate('foo', 'bar');
        });
        describe('get account by username', () => {
            it('get own account using valid JWT', async () => {
                return supertest_1.default(app)
                    .get('/accounts/foo')
                    .set('Authorization', 'Bearer ' + token)
                    .expect(200);
            });
            it('cannot get account using wrong JWT', async () => {
                await supertest_1.default(app).post('/accounts').send({ username: 'cat', password: 'dog' });
                return supertest_1.default(app)
                    .get('/accounts/cat')
                    .set('Authorization', 'Bearer ' + token)
                    .expect(403);
            });
        });
        describe('delete account', () => {
            it('can delete own account using valid JWT', async () => {
                return supertest_1.default(app)
                    .delete('/accounts/foo')
                    .set('Authorization', 'Bearer ' + token)
                    .expect(204);
            });
            it('is ok deleting a non-existing account', async () => {
                await supertest_1.default(app).delete('/accounts/foo').set('Authorization', 'Bearer ' + token);
                return supertest_1.default(app)
                    .delete('/accounts/foo')
                    .set('Authorization', 'Bearer ' + token)
                    .expect(204);
            });
            it('cannot delete account using wrong JWT', async () => {
                await supertest_1.default(app).post('/accounts').send({ username: 'cat', password: 'dog' });
                return supertest_1.default(app)
                    .delete('/accounts/cat')
                    .set('Authorization', 'Bearer ' + token)
                    .expect(403);
            });
        });
        describe('update account', () => {
            it('can update own username using valid JWT', async () => {
                let res = await supertest_1.default(app)
                    .put('/accounts/foo')
                    .set('Authorization', 'Bearer ' + token)
                    .send({ username: 'foo2' })
                    .expect(200);
                chai_1.expect(res.body.username).to.equal('foo2');
                const id = res.body.id;
                const token2 = await authenticate('foo2', 'bar');
                res = await supertest_1.default(app).get('/accounts/foo2').set('Authorization', 'Bearer ' + token2);
                chai_1.expect(res.body.username).to.equal('foo2');
                chai_1.expect(res.body.id).to.equal(id);
            });
            it('can update own password using valid JWT', async () => {
                await supertest_1.default(app)
                    .put('/accounts/foo')
                    .set('Authorization', 'Bearer ' + token)
                    .send({ password: 'bar2' })
                    .expect(200);
                const token2 = await authenticate('foo', 'bar2');
                await supertest_1.default(app).get('/accounts/foo')
                    .set('Authorization', 'Bearer ' + token2)
                    .expect(200);
            });
            it('can update own username and password using valid JWT', async () => {
                let res = await supertest_1.default(app).get('/accounts/foo').set('Authorization', 'Bearer ' + token);
                const id = res.body.id;
                await supertest_1.default(app)
                    .put('/accounts/foo')
                    .set('Authorization', 'Bearer ' + token)
                    .send({ username: 'foo2', password: 'bar2' })
                    .expect(200);
                const token2 = await authenticate('foo2', 'bar2');
                res = await supertest_1.default(app).get('/accounts/foo2')
                    .set('Authorization', 'Bearer ' + token2);
                chai_1.expect(res.body.id).to.equal(id);
            });
            it('cannot update account using wrong JWT', async () => {
                await supertest_1.default(app).post('/accounts').send({ username: 'cat', password: 'dog' });
                await supertest_1.default(app)
                    .put('/accounts/cat')
                    .set('Authorization', 'Bearer ' + token)
                    .send({ username: 'foo', password: 'bar' })
                    .expect(403);
            });
        });
    });
});
//# sourceMappingURL=api.accounts.test.js.map