import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg"
import { DatabaseController } from "."
import { getUuid } from "../util"

export interface BasicTaskObject {
  description: string
  due: Date | null
  completed: Date | null
}

export interface TaskObject extends BasicTaskObject {
  id: string
  files?: Array<{ id: string, name: string }>
}

export interface TaskController {
  checkAccess (accountId: string, taskId: string): Promise<{ access: boolean, exists: boolean }>
  createTask (taskListId: string, task: BasicTaskObject): Promise<TaskObject>
  deleteTask (taskId: string): Promise<void>
  deleteTasks (conn: PoolClient, taskListId: string): Promise<void>
  getTask (taskId: string): Promise<TaskObject>
  getTasks (taskListId: string): Promise<Array<TaskObject>>
  setTask (taskId: string, task: BasicTaskObject): Promise<TaskObject>
}

export function TaskFactory (db: Pool, controller: DatabaseController): TaskController {

  async function checkAccess (accountId: string, taskId: string): Promise<{ access: boolean, exists: boolean }> {
    const { rows } = await db.query({
      name: 'has-task-access',
      text: 'SELECT L.account_id as "account_id" FROM tasks T INNER JOIN task_lists L ON T.task_list_id = L.id WHERE T.id = $1',
      values: [taskId]
    })

    return rows.length > 0
      ? { exists: true, access: rows[0].account_id === accountId }
      : { exists: false, access: false }
  }

  async function createTask (taskListId: string, task: BasicTaskObject): Promise<TaskObject> {
    const id = getUuid()
    const { rows } = await db.query({
      name: 'create-task',
      text: 'INSERT INTO tasks (id, task_list_id, description, due, completed) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      values: [id, taskListId, task.description, task.due, task.completed]
    })
    const row = rows[0]
    return {
      id,
      description: row.description,
      due: row.due,
      completed: row.completed,
      files: []
    }
  }

  async function deleteTask (taskId: string): Promise<void> {
    return controller.transaction(null, async conn => {
      await db.query({
        name: 'delete-tasks',
        text: 'DELETE FROM tasks WHERE id = $1',
        values: [taskId]
      })
  
      await controller.files.deleteFiles(conn, taskId)
    })
  }

  async function deleteTasks (conn: PoolClient, taskListId: string): Promise<void> {
    return controller.transaction(conn, async conn => {
      const { rows } = await conn.query({
        name: 'delete-tasklist-tasks',
        text: 'DELETE FROM tasks WHERE task_list_id = $1 RETURNING *',
        values: [taskListId]
      })
  
      const length = rows.length
      if (length) {
        for (let i = 0; i < length; i++) {
          await controller.files.deleteFiles(conn, rows[0].id)
        }
      }
      
    })
  }

  async function getTask (taskId: string): Promise<TaskObject> {
    const { rows } = await db.query({
      name: 'get-task',
      text: `SELECT 
          T.id as "task_id",
          task_list_id, 
          description, 
          due, 
          completed, 
          F.id as "file_id", 
          F.name as "file_name", 
          file_path 
        FROM tasks T 
        LEFT JOIN files F ON T.id = F.task_id
        WHERE T.id = $1`,
      values: [taskId]
    })
    return formatTasks(rows)[0] || null
  }

  async function getTasks (taskListId: string): Promise<Array<TaskObject>> {
    const { rows } = await db.query({
      name: 'get-tasks',
      text: `SELECT 
          T.id as "task_id",
          task_list_id, 
          description, 
          due, 
          completed, 
          F.id as "file_id", 
          F.name as "file_name", 
          file_path 
        FROM tasks T 
        LEFT JOIN files F ON T.id = F.task_id
        WHERE T.task_list_id = $1`,
      values: [taskListId]
    })
    return formatTasks(rows)
  }

  async function setTask (taskId: string, task: BasicTaskObject): Promise<TaskObject> {
    const { rows } = await db.query({
      name: 'set-task',
      text: 'UPDATE tasks SET description = $1, due = $2, completed = $3 WHERE id = $4 RETURNING *',
      values: [task.description, task.due, task.completed, taskId]
    })
    return formatTasks(rows)[0] || null
  }

  return {
    checkAccess,
    createTask,
    deleteTask,
    deleteTasks,
    getTask,
    getTasks,
    setTask
  }
}

function formatTasks (rows: Array<QueryResultRow>): Array<TaskObject> {
  const filesMap: { [id: string]: Array<{ id: string, name: string }> } = {}
  const results: Array<TaskObject> = []
  
  rows.forEach(row => {
    const taskId = row.task_id
    const fileId = row.file_id

    const task: TaskObject = {
      id: row.task_id,
      description: row.description,
      due: row.due,
      completed: row.completed,
      files: []
    }

    // if there is a file then store it
    if (fileId) {
      const file = {
        id: row.file_id,
        name: row.file_name
      }
      if (filesMap[taskId]) {
        filesMap[taskId].push(file)
      } else {
        filesMap[taskId] = [file]
        task.files = filesMap[taskId]
        results.push(task)
      }
    } else{
      results.push(task)
    }
  })

  return results
}