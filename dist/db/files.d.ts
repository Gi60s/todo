/// <reference types="node" />
import { Pool, PoolClient } from "pg";
import { DatabaseController } from ".";
export interface BasicFileObject {
    taskId: string;
    name: string;
    filePath: string;
}
export interface FileObject extends BasicFileObject {
    id: string;
}
export interface FileController {
    saveFile(taskId: string, name: string, content: Buffer): Promise<FileObject>;
    deleteFile(fileId: string): Promise<void>;
    deleteFiles(conn: PoolClient, taskId: string): Promise<void>;
    getFile(fileId: string): Promise<FileObject>;
}
export declare function FileFactory(db: Pool, controller: DatabaseController): FileController;
