import { AppFactory, getDefaultOptions } from '../app'
import DbFactory, { DatabaseController } from '../db'
import { expect } from 'chai'
import { Pool } from 'pg'
import express from 'express-serve-static-core'
import request from 'supertest'

describe('Task Lists DB Controller', () => {
  const accountId = '123'
  let db: DatabaseController
  let pool: Pool

  before(() => {
    const options = getDefaultOptions({ database: { name: 'test' }}).database
    pool = new Pool({
      user: options.user,
      password: options.password,
      host: options.host,
      port: options.port,
      database: options.name
    })
    db = DbFactory(pool)
  })

  after(async () => {
    await pool.end()
  })

  beforeEach(async () => {
    await pool.query({
      name: 'truncate-task-list',
      text: 'TRUNCATE task_lists'
    })
  })

  it('initializes with zero task lists', async () => {
    const lists = await db.taskLists.getTaskLists(accountId)
    expect(lists.length).to.equal(0)
  })

  it('can create a task list', async () => {
    const list = await db.taskLists.createTaskList(accountId, 'first')
    expect(list.accountId).to.equal(accountId)
    expect(list.name).to.equal('first')
    expect(list.id.length).to.equal(32)

    const lists = await db.taskLists.getTaskLists(accountId)
    expect(lists.length).to.equal(1)
    expect(lists[0]).to.deep.equal(list)    
  })

  it('can rename a task list', async () => {
    const list = await db.taskLists.createTaskList(accountId, 'first')
    await db.taskLists.renameTaskList(list.id, 'second')
    
    const lists = await db.taskLists.getTaskLists(accountId)
    expect(lists.length).to.equal(1)
    expect(lists[0].id).to.equal(list.id)
    expect(lists[0].name).to.equal('second')
  })

  it('can delete a task list', async () => {
    const a = await db.taskLists.createTaskList(accountId, 'first')
    const b = await db.taskLists.createTaskList(accountId, 'second')
    
    let lists = await db.taskLists.getTaskLists(accountId)
    expect(lists.length).to.equal(2)
    
    await db.taskLists.deleteTaskList(a.id)
    lists = await db.taskLists.getTaskLists(accountId)
    expect(lists.length).to.equal(1)
    expect(lists[0].id).to.equal(b.id)
  })

  it('can delete all task lists', async () => {
    const a = await db.taskLists.createTaskList(accountId, 'first')
    const b = await db.taskLists.createTaskList(accountId, 'second')
    
    let lists = await db.taskLists.getTaskLists(accountId)
    expect(lists.length).to.equal(2)
    
    const conn = await pool.connect()
    await db.taskLists.deleteTaskLists(conn, accountId)
    conn.release()

    lists = await db.taskLists.getTaskLists(accountId)
    expect(lists.length).to.equal(0)
  })

})
