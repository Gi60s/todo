import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg"
import { DatabaseController } from "."
import { getUuid } from "../util"

export interface BasicTaskObject {
  description: string
  due: string | null
  completed: string | null
}

export interface TaskObject extends BasicTaskObject {
  id: string
  files?: Array<{ id: string, name: string }>
}

export interface TaskController {
  createTask (taskListId: string, task: BasicTaskObject): Promise<TaskObject>
  deleteTask (taskId: string): Promise<void>
  deleteTasks (conn: PoolClient, taskListId: string): Promise<void>
  getTask (taskId: string): Promise<TaskObject>
  getTasks (taskListId: string): Promise<Array<TaskObject>>
  setTask (task: TaskObject): Promise<TaskObject>
}

export function TaskFactory (db: Pool, controller: DatabaseController): TaskController {

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
    await db.query({
      name: 'delete-tasks',
      text: 'DELETE FROM tasks WHERE id = $1',
      values: [taskId]
    })

    // TODO: delete files
  }

  async function deleteTasks (conn: PoolClient, taskListId: string): Promise<void> {
    await conn.query({
      name: 'delete-tasklist-tasks',
      text: 'DELETE FROM tasks WHERE task_list_id = $1',
      values: [taskListId]
    })

    // TODO: delete files
  }

  async function getTask (taskId: string): Promise<TaskObject> {
    const { rows } = await db.query({
      name: 'get-task',
      text: 'SELECT * FROM tasks as T, files as F WHERE T.id = $1 AND T.id = F.task_id',
      values: [taskId]
    })
    return formatTasks(rows)[0] || null
  }

  async function getTasks (taskListId: string): Promise<Array<TaskObject>> {
    const { rows } = await db.query({
      name: 'get-tasks',
      text: 'SELECT * FROM tasks as T, files as F WHERE T.task_list_id = $1 AND T.id = F.task_id',
      values: [taskListId]
    })
    return formatTasks(rows)
  }

  async function setTask (task: TaskObject): Promise<TaskObject> {
    await db.query({
      name: 'set-task',
      text: 'UPDATE tasks SET description = $1, due = $2, completed = $3 WHERE id = $4',
      values: [task.description, task.due, task.completed, task.id]
    })
    return getTask(task.id)
  }

  return {
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
    const id = row.T.id
    const file = {
      id: row.F.id,
      name: row.F.name
    }
    if (filesMap[id]) {
      filesMap[id].push(file)
    } else {
      filesMap[id] = [file]
      results.push({
        id: row.T.id,
        description: row.T.description,
        due: row.T.due,
        completed: row.T.completed,
        files: filesMap[id]
      })
    }
  })

  return results
}