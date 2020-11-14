"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountFactory = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const util_1 = require("../util");
function AccountFactory(db, controller) {
    async function authenticate(username, password) {
        const row = await getAccountRow(username);
        const valid = await bcrypt_1.default.compare(password, row.password);
        return valid ? toAccount(row) : null;
    }
    async function createAccount(username, password) {
        if (username.length === 0)
            throw new util_1.StatusError('Username cannot be blank', 400);
        if (password.length === 0)
            throw new util_1.StatusError('Password cannot be blank', 400);
        const id = util_1.getUuid();
        const hash = await bcrypt_1.default.hash(password, 10);
        const { rowCount } = await db.query({
            name: 'account-create',
            text: 'INSERT INTO accounts (id, username, password) VALUES ($1, $2, $3)',
            values: [id, username, hash]
        });
        return rowCount > 0 ? { id, username } : null;
    }
    async function deleteAccount(username) {
        const account = await getAccount(username);
        if (account) {
            const client = await db.connect();
            try {
                await client.query('BEGIN');
                await client.query({
                    name: 'account-delete',
                    text: 'DELETE FROM accounts WHERE username = $1',
                    values: [username]
                });
                await client.query('COMMIT');
            }
            catch (err) {
                client.query('ROLLBACK');
                throw err;
            }
        }
    }
    async function getAccount(username) {
        const row = await getAccountRow(username);
        return row ? toAccount(row) : null;
    }
    async function getAccountRow(username) {
        const { rows } = await db.query({
            name: 'account-get',
            text: 'SELECT * FROM accounts WHERE username = $1',
            values: [username]
        });
        return rows.length ? rows[0] : null;
    }
    async function updateAccount(username, data) {
        const account = await getAccount(username);
        if (account) {
            const values = [];
            let name = 'account-update';
            let text = 'UPDATE accounts SET ';
            let index = 1;
            if (data.username && data.username !== username) {
                if (data.username.length === 0)
                    throw new util_1.StatusError('Username cannot be blank', 400);
                name += '-username';
                text += 'username = $' + index++;
                values.push(data.username);
            }
            if (data.password) {
                if (data.password.length === 0)
                    throw new util_1.StatusError('Password cannot be blank', 400);
                name += '-password';
                text += (values.length ? ', ' : '') + 'password = $' + index++;
                const hash = await bcrypt_1.default.hash(data.password, 10);
                values.push(hash);
            }
            if (values.length > 0) {
                text += ' WHERE username = $' + index++;
                values.push(username);
                const { rowCount } = await db.query({ name, text, values });
                return {
                    id: account.id,
                    username: data.username || username
                };
            }
            else {
                return account;
            }
        }
        else {
            return null;
        }
    }
    return {
        authenticate,
        createAccount,
        deleteAccount,
        getAccount,
        updateAccount
    };
}
exports.AccountFactory = AccountFactory;
function toAccount(row) {
    return {
        id: row.id,
        username: row.username
    };
}
//# sourceMappingURL=accounts.js.map