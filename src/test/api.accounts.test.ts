import { AppFactory } from '../app'
import { expect } from 'chai'
import { Pool } from 'pg'
import express from 'express-serve-static-core'
import request from 'supertest'

describe('Accounts API', () => {
  let app: any
  let pool: Pool

  before(() => {
    const result = AppFactory({ database: { name: 'test' }})
    app = result.app
    pool = result.pool
  })

  async function authenticate (username: string, password: string) {
    const res = await request(app)
      .put('/authenticate')
      .send({ username, password })
      .expect(200)
    return res.text
  }

  describe('account creation', () => {
    it('can create a new account if it does not already exist', async () => {
      await pool.query('TRUNCATE accounts')
      await request(app)
        .post('/accounts')
        .send({ username: 'foo', password: 'bar' })
        .expect(201)
    })
  
    it('will have a conflict if an account already exists', async () => {
      await pool.query('TRUNCATE accounts')
      await request(app)
        .post('/accounts')
        .send({ username: 'foo', password: 'bar' })
  
      await request(app)
        .post('/accounts')
        .send({ username: 'foo', password: 'bar' })
        .expect(409)
    })
  })

  describe('existing accounts', () => {
    beforeEach(async () => {
      await pool.query('TRUNCATE accounts')
      await request(app).post('/accounts').send({ username: 'foo', password: 'bar' })
    })

    describe('authenticate', () => {
      it('can log in using correct account credentials', async () => {
        return authenticate('foo', 'bar')
      })
  
      it('cannot log in using invalid account credentials', async () => {
        await request(app)
          .put('/authenticate')
          .send({ username: 'foo', password: 'foo' })
          .expect(401)
      })
    })
  })

  describe('authenticated accounts', () => {
    let token: string = ''

    beforeEach(async () => {
      await pool.query('TRUNCATE accounts')
      await request(app).post('/accounts').send({ username: 'foo', password: 'bar' })
      token = await authenticate('foo', 'bar')
    })

    describe('get account by username', () => {
      it('get own account using valid JWT', async () => {
        return request(app)
          .get('/accounts/foo')
          .set('Authorization', 'Bearer ' + token)
          .expect(200)
      })
  
      it('cannot get account using wrong JWT', async () => {
        await request(app).post('/accounts').send({ username: 'cat', password: 'dog' })
        return request(app)
          .get('/accounts/cat')
          .set('Authorization', 'Bearer ' + token)
          .expect(403)
      })
    })

    describe('delete account', () => {
      it('can delete own account using valid JWT', async () => {
        return request(app)
          .delete('/accounts/foo')
          .set('Authorization', 'Bearer ' + token)
          .expect(204)
      })
  
      it('is ok deleting a non-existing account', async () => {
        await request(app).delete('/accounts/foo').set('Authorization', 'Bearer ' + token)
        return request(app)
          .delete('/accounts/foo')
          .set('Authorization', 'Bearer ' + token)
          .expect(204)
      })
  
      it('cannot delete account using wrong JWT', async () => {
        await request(app).post('/accounts').send({ username: 'cat', password: 'dog' })
        return request(app)
          .delete('/accounts/cat')
          .set('Authorization', 'Bearer ' + token)
          .expect(403)
      })
    })

    describe('update account', () => {
      it('can update own username using valid JWT', async () => {
        let res = await request(app)
          .put('/accounts/foo')
          .set('Authorization', 'Bearer ' + token)
          .send({ username: 'foo2' })
          .expect(200)
        expect(res.body.username).to.equal('foo2')
        const id = res.body.id

        const token2 = await authenticate('foo2', 'bar')
        res = await request(app).get('/accounts/foo2').set('Authorization', 'Bearer ' + token2)
        expect(res.body.username).to.equal('foo2')
        expect(res.body.id).to.equal(id)
      })

      it('can update own password using valid JWT', async () => {
        await request(app)
          .put('/accounts/foo')
          .set('Authorization', 'Bearer ' + token)
          .send({ password: 'bar2' })
          .expect(200)

        const token2 = await authenticate('foo', 'bar2')
        await request(app).get('/accounts/foo')
          .set('Authorization', 'Bearer ' + token2)
          .expect(200)
      })

      it('can update own username and password using valid JWT', async () => {
        let res = await request(app).get('/accounts/foo').set('Authorization', 'Bearer ' + token)
        const id = res.body.id

        await request(app)
          .put('/accounts/foo')
          .set('Authorization', 'Bearer ' + token)
          .send({ username: 'foo2', password: 'bar2' })
          .expect(200)
        const token2 = await authenticate('foo2', 'bar2')
        
        res = await request(app).get('/accounts/foo2')
          .set('Authorization', 'Bearer ' + token2)
        expect(res.body.id).to.equal(id)
      })
  
      it('cannot update account using wrong JWT', async () => {
        await request(app).post('/accounts').send({ username: 'cat', password: 'dog' })
        await request(app)
          .put('/accounts/cat')
          .set('Authorization', 'Bearer ' + token)
          .send({ username: 'foo', password: 'bar' })
          .expect(403)
      })
    })

  })

})