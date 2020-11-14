"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppFactory = void 0;
const openapi_enforcer_1 = __importDefault(require("openapi-enforcer"));
const dotenv_1 = require("dotenv");
dotenv_1.config();
const express_1 = __importDefault(require("express"));
const openapi_enforcer_middleware_1 = __importDefault(require("openapi-enforcer-middleware"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const db_1 = __importDefault(require("./db"));
const util_1 = require("./util");
function AppFactory(options) {
    options = getDefaultOptions(options);
    const app = express_1.default();
    const db = options.database;
    const pool = new pg_1.Pool({
        user: db.user,
        password: db.password,
        host: db.host,
        port: db.port,
        database: db.name
    });
    pool.query('SELECT NOW()', (err) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
    });
    const dbController = db_1.default(pool);
    app.use(express_1.default.json());
    app.use(async (req, res, next) => {
        if (req.headers.authorization) {
            const [type, token] = req.headers.authorization.split(/ +/);
            if (type.toLowerCase() === 'bearer') {
                try {
                    const decoded = await jsonwebtoken_1.default.verify(token, options.jwt.secret);
                    req.user = {
                        id: decoded.id,
                        username: decoded.username
                    };
                }
                catch (err) {
                    return next(new util_1.StatusError('Invalid authorization token', 400));
                }
            }
        }
        next();
    });
    const openapiPath = path_1.default.resolve(__dirname, '..', 'openapi.yml');
    const enforcerMiddleware = openapi_enforcer_middleware_1.default(openapi_enforcer_1.default(openapiPath));
    app.use(enforcerMiddleware.init());
    enforcerMiddleware.on('error', (err) => {
        console.error(err);
        process.exit(1);
    });
    const controllersPath = path_1.default.resolve(__dirname, 'api');
    const routeOptions = { dependencies: [dbController, options] };
    app.use(enforcerMiddleware.route(controllersPath, routeOptions));
    app.use((err, req, res, next) => {
        if (err instanceof util_1.StatusError) {
            res.status(err.code);
            res.send(err.message);
        }
        else {
            console.error(err && err.stack ? err.stack : err);
            res.sendStatus(500);
        }
    });
    let listener;
    return {
        app,
        dbController,
        pool,
        start() {
            if (!listener) {
                return new Promise((resolve, reject) => {
                    listener = app.listen(process.env.SERVER_PORT, () => {
                        if (arguments.length) {
                            reject(arguments[0]);
                        }
                        else {
                            const addr = listener.address();
                            resolve(addr ? addr.port : 0);
                        }
                    });
                });
            }
            else {
                const addr = listener.address();
                return Promise.resolve(addr ? addr.port : 0);
            }
        },
        stop() {
            if (listener) {
                listener.close();
            }
        }
    };
}
exports.AppFactory = AppFactory;
function getDefaultOptions(options) {
    const env = process.env;
    if (!options)
        options = {};
    if (!options.database)
        options.database = {};
    if (!options.database.host)
        options.database.host = env.DB_HOST;
    if (!options.database.name)
        options.database.name = env.DB_NAME;
    if (!options.database.password)
        options.database.password = env.DB_PASS;
    if (!options.database.port)
        options.database.port = parseInt(env.DB_PORT);
    if (!options.database.user)
        options.database.user = env.DB_USER;
    if (!options.jwt)
        options.jwt = {};
    if (!options.jwt.issuer)
        options.jwt.issuer = env.JWT_ISSUER;
    if (!options.jwt.secret)
        options.jwt.secret = env.JWT_SECRET;
    if (!options.server)
        options.server = {};
    if (!options.server.port)
        options.server.port = parseInt(env.SERVER_PORT);
    return options;
}
//# sourceMappingURL=app.js.map