import Express from 'express-serve-static-core'
import { DatabaseController } from "../db"

export default function (db: DatabaseController) {
  return {
    async createTaskList (req: Express.Request, res: Express.Response) {
      const { body } = req.enforcer.body
      const list = await db.taskLists.createTaskList(req.user.id, body.name)

      res.set('Location', '/task-lists/' + list.id)
      res.status(201)
      res.enforcer.send()
    },

    async deleteTaskList (req: Express.Request, res: Express.Response) {
      const { params } = req.enforcer.params
      const { taskListId } = params
      
      const list = await db.taskLists.getTaskListDetails(taskListId)
      if (!list) {
        res.sendStatus(204)
      } else if (list.accountId !== req.user.id) {
        res.sendStatus(403)
      } else {
        await db.taskLists.deleteTaskList(taskListId)
        res.sendStatus(204)
      }
    },

    async getTaskLists (req: Express.Request, res: Express.Response) {
      const lists = await db.taskLists.getTaskLists(req.user.id)
      res.enforcer.send(lists)
    },

    async getTaskList (req: Express.Request, res: Express.Response) {
      const { params, query } = req.enforcer.params
      const { taskListId } = params
      
      const list = await db.taskLists.getTaskListDetails(taskListId)
      if (!list) {
        res.sendStatus(404)
      } else if (list.accountId !== req.user.id) {
        res.sendStatus(403)
      } else {
        if (!query.allTasks) list.tasks = list.tasks.filter(t => t.completed === null)
        res.enforcer.send(list)
      }
    },

    async updateTaskList (req: Express.Request, res: Express.Response) {
      const { body, params } = req.enforcer
      const { taskListId } = params

      const list = await db.taskLists.getTaskListDetails(taskListId)
      if (!list) {
        res.sendStatus(404)
      } else if (list.accountId !== req.user.id) {
        res.sendStatus(403)
      } else {
        await db.taskLists.renameTaskList(taskListId, body.name)
        res.sendStatus(200)
      }
    }
  }
}