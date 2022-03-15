import express from 'express'
import type { RequestHandler, ErrorRequestHandler } from 'express'
import morgan from "morgan"


import { pool } from './db'
import { runMigrations } from './migration'

const envRouter = express.Router()
envRouter.get('/version', ((req, res) => {
  res.status(200).send(process.env.VERSION)
}) as RequestHandler)

envRouter.get('/subdomain', (async (req, res) => {
  res.status(200).send(process.env.SUBDOMAIN)
}) as RequestHandler)
envRouter.get('/foobar', (async (req, res) => {
  res.status(200).send(process.env.FOOBAR)
}) as RequestHandler)

const loggingMiddleware = morgan(process.env.NODE_ENV === "production" ? "short" : "dev" )

export const createApp = () => {
  const app = express()

  app.use(loggingMiddleware)

  app.post('/_migrations', (async (req, res) => {
    const auth = req.headers.authorization
    if (auth !== 'some_secret_password') {
      res.status(401).send('Unauthorized')
      return
    }

    try {
      await runMigrations()
      res.status(200).send({ message: 'migrations ran successfully' })
    } catch (err: any) {
      res
        .status(500)
        .send({ message: `migrations failed: ${err.message}`, error: err })
    }
  }) as RequestHandler)

  app.use('/env', envRouter)

  app.get('/', ((req, res) => {
    res.status(200).send('OK')
  }) as RequestHandler)

  app.get('/health', (async (req, res) => {
    let client
    
    try {
      client = await pool.connect()
      const queryResult = await client.query(`SELECT t1.datname AS db_name,  
    pg_size_pretty(pg_database_size(t1.datname)) AS db_size
  FROM pg_database t1
  ORDER BY pg_database_size(t1.datname) DESC;`)
      res.status(200).send(queryResult.rows)
    } catch (err: any) {
      // crude but reasonable way to check for a connection timeout      
      if (err.message?.includes('timeout')) {
        return res.status(408).send({ message: 'timeout' })
      }
      return res
        .status(500)
        .send({ error: 'borked', errno: err.errno, code: err.code, message: err.message })
    } finally {
      if (client) {
        client.release(true)
      }
    }
  }) as RequestHandler)

  // default 404 handler
  app.use(((req, res, next) => {
    res.status(404).send('Not found')
  }) as RequestHandler)

  // default 500
  app.use(((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Borked')
  }) as ErrorRequestHandler)

  return app
}
