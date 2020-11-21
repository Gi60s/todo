import { AppFactory, getDefaultOptions } from '../app'
import DbFactory, { DatabaseController } from '../db'
import { expect } from 'chai'
import { Pool } from 'pg'
import express from 'express-serve-static-core'
import request from 'supertest'

describe('Tasks DB Controller', () => {
  const taskListId = '123'
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
    await pool.query({
      name: 'truncate-tasks',
      text: 'TRUNCATE tasks'
    })
  })

  it('initializes with zero tasks', async () => {
    const tasks = await db.tasks.getTasks(taskListId)
    expect(tasks.length).to.equal(0)
  })

  it('can create a task without due date', async () => {
    const task = await db.tasks.createTask(taskListId, {
      description: 'foo',
      due: null,
      completed: null
    })
    expect(task.description).to.equal('foo')
    expect(task.due).to.equal(null)
    expect(task.completed).to.equal(null)

    const tasks = await db.tasks.getTasks(taskListId)
    expect(tasks.length).to.equal(1)
    expect(tasks[0]).to.deep.equal(task)    
  })

  it('can create a task with due date', async () => {
    const due = new Date()
    const task = await db.tasks.createTask(taskListId, {
      description: 'foo',
      due,
      completed: null
    })
    expect(+task.due).to.equal(+due)

    const tasks = await db.tasks.getTasks(taskListId)
    expect(tasks.length).to.equal(1)
    expect(tasks[0]).to.deep.equal(task)    
  })

  it('can update a task', async () => {
    const task = await db.tasks.createTask(taskListId, {
      description: 'foo',
      due: null,
      completed: null
    })

    const completed = new Date()
    await db.tasks.setTask(task.id, { description: 'bar', due: null, completed })
    
    const tasks = await db.tasks.getTasks(taskListId)
    expect(tasks.length).to.equal(1)
    expect(tasks[0].id).to.equal(task.id)
    expect(tasks[0].description).to.equal('bar')
    expect(+tasks[0].completed).to.equal(+completed)
  })

  it('can delete a task', async () => {
    const a = await db.tasks.createTask(taskListId, {
      description: 'foo',
      due: null,
      completed: null
    })
    const b = await db.tasks.createTask(taskListId, {
      description: 'bar',
      due: null,
      completed: null
    })
    
    let tasks = await db.tasks.getTasks(taskListId)
    expect(tasks.length).to.equal(2)
    
    await db.tasks.deleteTask(a.id)
    tasks = await db.tasks.getTasks(taskListId)
    expect(tasks.length).to.equal(1)
    expect(tasks[0].id).to.equal(b.id)
  })

  it('can delete all tasks for a list', async () => {
    const a = await db.tasks.createTask(taskListId, {
      description: 'foo',
      due: null,
      completed: null
    })
    const b = await db.tasks.createTask(taskListId, {
      description: 'bar',
      due: null,
      completed: null
    })
    
    let tasks = await db.tasks.getTasks(taskListId)
    expect(tasks.length).to.equal(2)
    
    const conn = await pool.connect()
    await db.tasks.deleteTasks(conn, taskListId)
    conn.release()

    tasks = await db.tasks.getTasks(taskListId)
    expect(tasks.length).to.equal(0)
  })

})
