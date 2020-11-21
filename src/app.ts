//@ts-ignore
import Enforcer from 'openapi-enforcer'

// Load environment variables from .env file
import { config } from 'dotenv'
config()

import { AddressInfo } from 'net'
import express from 'express'
import { default as EnforcerMiddleware } from 'openapi-enforcer-middleware'
import jwt from 'jsonwebtoken'
import path from 'path'
import { Pool } from 'pg'
import DatabaseController, { DatabaseController as IDatabaseController } from './db'
import { StatusError } from './util'

interface AppObject {
  app: Express.Application
  dbController: IDatabaseController
  pool: Pool
  start (): Promise<number>
  stop (): void
}

export interface AppOptions {
  database?: {
    host?: string
    name?: string
    password?: string
    port?: number
    user?: string
  },
  jwt?: {
    issuer?: string
    secret?: string
  },
  server?: {
    port?: number
  }
}

// Declare possible user property for express request object
declare global {
  namespace Express {
      interface Request {
          user?: {
            id: string
            username: string
          }
      }
  }
}

export function AppFactory (options?: AppOptions): AppObject {
  options = getDefaultOptions(options)

  // Create express app
  const app = express()

  // Connect to database pool
  const db = options.database
  const pool = new Pool({
    user: db.user,
    password: db.password,
    host: db.host,
    port: db.port,
    database: db.name
  })

  // Test database connection
  pool.query('SELECT NOW()', (err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
  })

  // Initialize database controller
  const dbController = DatabaseController(pool)

  // Parse any request bodies
  app.use(express.json())

  // Verify JWT if present
  app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.headers.authorization) {
      const [ type, token ] = req.headers.authorization.split(/ +/)
      if (type.toLowerCase() === 'bearer') {
        try {
          const decoded:any = await jwt.verify(token, options.jwt.secret)
          req.user = {
            id: decoded.id,
            username: decoded.username
          }
        } catch (err) {
          return next(new StatusError('Invalid authorization token', 400))
        }
      }
    }
    next()
  })
  
  // Any paths defined in your openapi.yml will validate and parse the request
  // before it calls your route code.
  const openapiPath = path.resolve(__dirname, '..', 'openapi.yml')
  const enforcerMiddleware = EnforcerMiddleware(Enforcer(openapiPath))
  app.use(enforcerMiddleware.init())

  // Catch errors
  enforcerMiddleware.on('error', (err: Error) => {
    console.error(err)
    process.exit(1)
  }) 

  // Use route builder middleware
  const controllersPath = path.resolve(__dirname, 'api')
  const routeOptions = { dependencies: [ dbController, options ]}
  app.use(enforcerMiddleware.route(controllersPath, routeOptions))

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof StatusError) {
      res.status(err.code)
      res.send(err.message)
    } else {
      console.error(err && err.stack ? err.stack : err)
      res.sendStatus(500)
    }
  })

  let listener: any
  return {
    app,
    dbController,
    pool,
    start (): Promise<number> {
      if (!listener) {
        return new Promise((resolve, reject) => {
          listener = app.listen(process.env.SERVER_PORT, () => {
            if (arguments.length) {
              reject(arguments[0])
            } else {
              const addr = listener.address()
              resolve(addr ? (<AddressInfo>addr).port : 0)
            }
          })
        })
      } else {
        const addr = listener.address()
        return Promise.resolve(addr ? (<AddressInfo>addr).port : 0)
      }
    },
    stop () {
      if (listener) {
        listener.close()
      }
    }
  }
}

export function getDefaultOptions (options: any): AppOptions {
  const env = process.env

  if (!options) options = {}

  if (!options.database) options.database = {}
  if (!options.database.host) options.database.host = env.DB_HOST!
  if (!options.database.name) options.database.name = env.DB_NAME!
  if (!options.database.password) options.database.password = env.DB_PASS!
  if (!options.database.port) options.database.port = parseInt(env.DB_PORT!)
  if (!options.database.user) options.database.user = env.DB_USER!

  if (!options.jwt) options.jwt = {}
  if (!options.jwt.issuer) options.jwt.issuer = env.JWT_ISSUER!
  if (!options.jwt.secret) options.jwt.secret = env.JWT_SECRET!

  if (!options.server) options.server = {}
  if (!options.server.port) options.server.port = parseInt(env.SERVER_PORT!)

  return <AppOptions>options
}