import bcrypt from 'bcrypt'
import { DatabaseController } from './'
import { Pool, QueryResultRow } from "pg"
import { getUuid, StatusError } from '../util'

export interface AccountObject {
  id: string
  username: string
}

export interface AccountController {
  authenticate (username: string, password: string): Promise<AccountObject|null>
  createAccount (username: string, password: string): Promise<AccountObject|null>
  deleteAccount (username: string): Promise<void>
  getAccount (username: string): Promise<AccountObject|null>
  updateAccount (username: string, data: { username?: string, password?: string }): Promise<AccountObject|null>
}

export function AccountFactory (db: Pool, controller: DatabaseController): AccountController {
  async function authenticate (username: string, password: string): Promise<AccountObject|null> {
    const row = await getAccountRow(username)
    const valid = await bcrypt.compare(password, row.password)
    return valid ? toAccount(row) : null
  }

  async function createAccount (username: string, password: string): Promise<AccountObject|null> {
    if (username.length === 0) throw new StatusError('Username cannot be blank', 400)
    if (password.length === 0) throw new StatusError('Password cannot be blank', 400)
    
    const id = getUuid()
    const hash = await bcrypt.hash(password, 10)
    const { rowCount } = await db.query({
      name: 'account-create',
      text: 'INSERT INTO accounts (id, username, password) VALUES ($1, $2, $3)',
      values: [ id, username, hash ]
    })
    return rowCount > 0 ? { id, username } : null
  }

  async function deleteAccount (username: string): Promise<void> {
    const account = await getAccount(username)
    if (account) {
      await controller.transaction(null, async conn => {
        await conn.query({
          name: 'account-delete',
          text: 'DELETE FROM accounts WHERE username = $1',
          values: [ username ]
        })

        await controller.taskLists.deleteTaskLists(conn, account.id)
      })
    }
  }

  async function getAccount (username: string): Promise<AccountObject|null> {
    const row = await getAccountRow(username)
    return row ? toAccount(row) : null
  }

  async function getAccountRow (username: string): Promise<QueryResultRow> {
    const { rows } = await db.query({
      name: 'account-get',
      text: 'SELECT * FROM accounts WHERE username = $1',
      values: [ username ]
    })
    return rows.length ? rows[0] : null
  }

  async function updateAccount (username: string, data: { username?: string, password?: string }): Promise<AccountObject|null> {
    const account = await getAccount(username)
    if (account) {
      const values = []
      let name = 'account-update'
      let text = 'UPDATE accounts SET '
      let index = 1

      // username change
      if (data.username && data.username !== username) {
        if (data.username.length === 0) throw new StatusError('Username cannot be blank', 400)
        name += '-username'
        text += 'username = $' + index++
        values.push(data.username)
      }

      // password change
      if (data.password) {
        if (data.password.length === 0) throw new StatusError('Password cannot be blank', 400)
        name += '-password'
        text += (values.length ? ', ' : '') + 'password = $' + index++
        const hash = await bcrypt.hash(data.password, 10)
        values.push(hash)
      }

      // changes exist, so update database
      if (values.length > 0) {
        text += ' WHERE username = $' + index++
        values.push(username)
        const { rowCount } = await db.query({ name, text, values })
        return {
          id: account.id,
          username: data.username || username
        }

      // no changes
      } else {
        return account
      }

    // no account
    } else {
      return null
    }
  }

  return {
    authenticate,
    createAccount,
    deleteAccount,
    getAccount,
    updateAccount
  }
}

function toAccount (row: QueryResultRow): AccountObject {
  return {
    id: row.id,
    username: row.username
  }
}