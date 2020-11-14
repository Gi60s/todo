"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusError = exports.getUuid = void 0;
const uuid_1 = require("uuid");
function getUuid() {
    const id = uuid_1.v4();
    return id.replace(/-/g, '');
}
exports.getUuid = getUuid;
class StatusError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.code = statusCode;
    }
}
exports.StatusError = StatusError;
//# sourceMappingURL=util.js.map