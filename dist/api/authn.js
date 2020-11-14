"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function default_1(db, options) {
    return {
        async authenticate(req, res) {
            const { username, password } = req.enforcer.body;
            const account = await db.accounts.authenticate(username, password);
            if (account) {
                const token = jsonwebtoken_1.default.sign(account, options.jwt.secret, { expiresIn: '1 day', issuer: options.jwt.issuer });
                res.set('content-type', 'text/plain');
                res.enforcer.send(token);
            }
            else {
                res.sendStatus(401);
            }
        },
    };
}
exports.default = default_1;
//# sourceMappingURL=authn.js.map