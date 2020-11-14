"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(db) {
    const Accounts = db.accounts;
    return {
        async createAccount(req, res) {
            const { username, password } = req.enforcer.body;
            const account = await Accounts.getAccount(username);
            if (account) {
                res.sendStatus(409);
            }
            else {
                const account = await Accounts.createAccount(username, password);
                if (account) {
                    res.set('location', '/accounts/' + account.id);
                    res.sendStatus(201);
                }
                else {
                    throw Error('Unable to create account: ' + username);
                }
            }
        },
        async deleteAccount(req, res) {
            const { username } = req.enforcer.params;
            if (!req.user) {
                res.sendStatus(401);
            }
            else if (req.user.username !== username) {
                res.sendStatus(403);
            }
            else {
                await Accounts.deleteAccount(username);
                res.sendStatus(204);
            }
        },
        async getAccount(req, res) {
            const { username } = req.enforcer.params;
            if (!req.user) {
                res.sendStatus(401);
            }
            else if (req.user.username !== username) {
                res.sendStatus(403);
            }
            else {
                const account = await Accounts.getAccount(username);
                if (!account) {
                    res.sendStatus(404);
                }
                else {
                    res.enforcer.send(account);
                }
            }
        },
        async updateAccount(req, res) {
            const currentUsername = req.enforcer.params.username;
            const { username, password } = req.enforcer.body;
            if (!req.user) {
                res.sendStatus(401);
            }
            else if (req.user.username !== currentUsername) {
                res.sendStatus(403);
            }
            else {
                const account = await Accounts.updateAccount(currentUsername, { username, password });
                if (!account) {
                    res.sendStatus(404);
                }
                else {
                    res.enforcer.send(account);
                }
            }
        }
    };
}
exports.default = default_1;
//# sourceMappingURL=accounts.js.map