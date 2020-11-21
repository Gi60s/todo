import fs from 'fs/promises'
import path from 'path'
import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg"
import { DatabaseController } from "."
import { getUuid } from "../util"

export interface BasicFileObject {
  taskId: string
  name: string
  filePath: string
}

export interface FileObject extends BasicFileObject {
  id: string
}

export interface FileController {
  saveFile (taskId: string, name: string, content: Buffer): Promise<FileObject>
  deleteFile (fileId: string): Promise<void>
  deleteFiles (conn: PoolClient, taskId: string): Promise<void>
  getFile (fileId: string): Promise<FileObject>
}

const storePath = path.resolve(__dirname, '..', 'file-store')

export function FileFactory (db: Pool, controller: DatabaseController): FileController {

  async function saveFile (taskId: string, name: string, content: Buffer): Promise<FileObject> {
    const dirPath = path.resolve(storePath, taskId)
    await ensureDirectory(dirPath)

    const filePath = path.resolve(dirPath, getUuid())
    await fs.writeFile(filePath, content)
    
    const id = getUuid()
    const { rowCount } = await db.query({
      name: 'save-file',
      text: 'INSERT INTO files (id, task_id, name, file_path) VALUES ($1, $2, $3, $4)',
      values: [ id, taskId, name, filePath ]
    })

    return rowCount > 0 ? { id, taskId, name, filePath } : null
  }

  async function deleteFile (fileId: string): Promise<void> {
    const { rows } = await db.query({
      name: 'delete-file',
      text: 'DELETE FROM files WHERE id = $1 RETURNING *',
      values: [ fileId ]
    })

    if (rows.length) {
      const file = formatFile(rows)[0]
      await fs.unlink(file.filePath)
    }
  }

  async function deleteFiles (conn: PoolClient, taskId: string): Promise<void> {
    const { rows } = await conn.query({
      name: 'delete-files',
      text: 'DELETE FROM files WHERE task_id = $1',
      values: [ taskId ]
    })

    const length = rows.length
    if (length) {
      const files = formatFile(rows)
      let dirPath: string = ''
      for (let i = 0; i < length; i++) {
        if (i === 0) dirPath = path.dirname(files[i].filePath)
        await fs.unlink(files[i].filePath)
      }
      await fs.rmdir(dirPath)
    }
  }

  async function getFile (fileId: string): Promise<FileObject> {
    const { rows } = await db.query({
      name: 'get-file',
      text: 'SELECT * FROM files WHERE id = $1',
      values: [ fileId ]
    })
    return rows.length
      ? formatFile(rows)[0]
      : null
  }

  return {
    saveFile,
    deleteFile,
    deleteFiles,
    getFile
  }
}

async function ensureDirectory (dirPath: string): Promise<void> {
  const upPath = path.dirname(dirPath)
  try {
    let stats = await fs.stat(upPath)
    if (stats.isDirectory()) await fs.mkdir(dirPath)
  } catch (err) {
    if (err.code === 'ENOENT') await ensureDirectory(upPath)
  }
}

function formatFile (rows: Array<QueryResultRow>): Array<FileObject> {
  return rows.map(row => {
    return {
      id: row.id,
      taskId: row.task_id,
      name: row.name,
      filePath: row.file_path }
  })
}