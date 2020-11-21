"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileFactory = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const util_1 = require("../util");
const storePath = path_1.default.resolve(__dirname, '..', 'file-store');
function FileFactory(db, controller) {
    async function saveFile(taskId, name, content) {
        const dirPath = path_1.default.resolve(storePath, taskId);
        await ensureDirectory(dirPath);
        const filePath = path_1.default.resolve(dirPath, util_1.getUuid());
        await promises_1.default.writeFile(filePath, content);
        const id = util_1.getUuid();
        const { rowCount } = await db.query({
            name: 'save-file',
            text: 'INSERT INTO files (id, task_id, name, file_path) VALUES ($1, $2, $3, $4)',
            values: [id, taskId, name, filePath]
        });
        return rowCount > 0 ? { id, taskId, name, filePath } : null;
    }
    async function deleteFile(fileId) {
        const { rows } = await db.query({
            name: 'delete-file',
            text: 'DELETE FROM files WHERE id = $1 RETURNING *',
            values: [fileId]
        });
        if (rows.length) {
            const file = formatFile(rows)[0];
            await promises_1.default.unlink(file.filePath);
        }
    }
    async function deleteFiles(conn, taskId) {
        const { rows } = await conn.query({
            name: 'delete-files',
            text: 'DELETE FROM files WHERE task_id = $1',
            values: [taskId]
        });
        const length = rows.length;
        if (length) {
            const files = formatFile(rows);
            let dirPath = '';
            for (let i = 0; i < length; i++) {
                if (i === 0)
                    dirPath = path_1.default.dirname(files[i].filePath);
                await promises_1.default.unlink(files[i].filePath);
            }
            await promises_1.default.rmdir(dirPath);
        }
    }
    async function getFile(fileId) {
        const { rows } = await db.query({
            name: 'get-file',
            text: 'SELECT * FROM files WHERE id = $1',
            values: [fileId]
        });
        return rows.length
            ? formatFile(rows)[0]
            : null;
    }
    return {
        saveFile,
        deleteFile,
        deleteFiles,
        getFile
    };
}
exports.FileFactory = FileFactory;
async function ensureDirectory(dirPath) {
    const upPath = path_1.default.dirname(dirPath);
    try {
        let stats = await promises_1.default.stat(upPath);
        if (stats.isDirectory())
            await promises_1.default.mkdir(dirPath);
    }
    catch (err) {
        if (err.code === 'ENOENT')
            await ensureDirectory(upPath);
    }
}
function formatFile(rows) {
    return rows.map(row => {
        return {
            id: row.id,
            taskId: row.task_id,
            name: row.name,
            filePath: row.file_path
        };
    });
}
//# sourceMappingURL=files.js.map