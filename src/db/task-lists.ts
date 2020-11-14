import { Pool, PoolClient } from "pg";
import { DatabaseController } from ".";
import { getUuid, StatusError } from "../util";
import { TaskObject } from './tasks'

interface TaskListObject {
  id: string
  name: string
}

interface TaskListDetailedObject extends TaskListObject {
  tasks: Array<TaskObject>
}

export interface TaskListController {
  createTaskList (name: string): Promise<TaskListObject|null>
  getTaskLists (userId: string): Promise<Array<TaskListObject>>
  getTaskListDetails (taskListId: string): Promise<TaskListDetailedObject|null>
  renameTaskList (taskListId: string, name: string): Promise<TaskListObject|null>
  deleteTaskList (taskListId: string): Promise<void>
  deleteTaskLists (client: PoolClient, accountId: string): Promise<void>
}

export function TaskListFactory (db: Pool, controller: DatabaseController): TaskListController {

  async function createTaskList (name: string): Promise<TaskListObject|null> {
    if (name.length === 0) throw new StatusError('Task list name cannot be blank', 400)
    
    const id = getUuid()
    const { rowCount } = await db.query({
      name: 'task-list-create',
      text: 'INSERT INTO task_lists (id, name) VALUES ($1, $2)',
      values: [ id, name ]
    })

    return rowCount > 0 ? { id, name } : null
  }

  async function getTaskLists (accountId: string): Promise<Array<TaskListObject>> {
    const { rows } = await db.query({
      name: 'task-list-find',
      text: 'SELECT * FROM task_lists WHERE account_id = $1',
      values: [ accountId ]
    })

    return rows.map(r => {
      return { id: r.id, name: r.name }
    })
  }

  async function getTaskListDetails (taskListId: string): Promise<TaskListDetailedObject|null> {
    const { rows } = await db.query({
      name: 'task-list-get',
      text: `SELECT L.name, T.id, T.description, T.due, T.completed
        FROM task_lists as L, tasks as T
        WHERE L.id = $1 AND L.id = T.task_list_id`,
      values: [ taskListId ]
    })

    if (!rows.length) return null

    return {
      id: taskListId,
      name: rows[0].name,
      tasks: rows.map(r => {
        return {
          id: r.id,
          description: r.description,
          due: r.due,
          completed: r.completed
        }
      })
    }
  }

  async function renameTaskList (taskListId: string, name: string): Promise<TaskListObject|null> {
    const { rowCount } = await db.query({
      name: 'task-list-rename',
      text: 'UPDATE task_lists SET name = $1 WHERE id = $2',
      values: [ taskListId, name ]
    })

    return rowCount ? { id: taskListId, name } : null
  }

  async function deleteTaskList (taskListId: string): Promise<void> {
    await db.query({
      name: 'delete-task-list',
      text: 'DELETE from task_lists WHERE id = $1',
      values: [taskListId]
    })
  }

  async function deleteTaskLists (client: PoolClient, accountId: string): Promise<void> {
    const { rows } = await client.query({
      name: 'delete-task-lists',
      text: 'DELETE from task_lists WHERE account_id = $1 RETURNING *',
      values: [accountId]
    })

    const length = rows.length
    for (let i = 0; i < length; i++) {
      await controller.tasks.deleteTasks(client, rows[i].id)
    }
  }

  return {
    createTaskList,
    getTaskLists,
    getTaskListDetails,
    renameTaskList,
    deleteTaskList,
    deleteTaskLists
  }
}