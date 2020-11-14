import Express from 'express-serve-static-core'
import { DatabaseController } from '../db'
import { AppOptions } from '../app'
import jwt from 'jsonwebtoken'

export default function (db: DatabaseController, options: AppOptions) {
  return {
    async authenticate (req: Express.Request, res: Express.Response) {
      const { username, password } = req.enforcer!.body!
      const account = await db.accounts.authenticate(username, password)
      if (account) {
        const token = jwt.sign(account, options.jwt.secret, { expiresIn: '1 day', issuer: options.jwt.issuer })
        res.set('content-type', 'text/plain')
        res.enforcer!.send(token)
      } else {
        res.sendStatus(401)
      }
    },
  }
}