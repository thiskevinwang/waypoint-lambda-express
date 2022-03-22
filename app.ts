import express from 'express'
import type { IncomingMessage, ServerResponse } from 'http'
import type { RequestHandler, ErrorRequestHandler } from 'express'
import morgan from 'morgan'
import redoc from 'redoc-express'

import { pool } from './db'
import { runMigrations } from './migration'

// This is copied from `morgan`
type Handler<Request extends IncomingMessage, Response extends ServerResponse> = (
  req: Request,
  res: Response,
  callback: (err?: Error) => void
) => void

const envRouter = express.Router()
const envController: Record<string, RequestHandler> = {
  getVersion: async (req, res) => {
    res.status(200).send(process.env.VERSION)
  },
  getSubdomain: async (req, res) => {
    res.status(200).send(process.env.SUBDOMAIN)
  },
  getFoobar: async (req, res) => {
    res.status(200).send(process.env.FOOBAR)
  },
}
envRouter.get('/version', envController.getVersion)
envRouter.get('/subdomain', envController.getSubdomain)
envRouter.get('/foobar', envController.getFoobar)

const loggingMiddleware = morgan(process.env.NODE_ENV === 'production' ? 'short' : 'dev')
const cacheHeaderMiddleware: Handler<IncomingMessage, ServerResponse> = (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=60')
  next()
}

export const createApp = () => {
  const app = express()
  // middleware
  app.use(loggingMiddleware, cacheHeaderMiddleware)

  // serve your swagger.json file
  app.get('/docs/swagger.yaml', (req, res) => {
    res.sendFile('swagger.yaml', { root: '.' })
  })

  // define title and specUrl location
  // serve redoc
  app.get('/docs', (req, res) => {
    redoc({
      title: 'API Docs',
      specUrl: '/docs/swagger.yaml',
    })(req, res)
  })

  app.post('/_migrations', async (req, res) => {
    const auth = req.headers.authorization
    if (auth !== 'some_secret_password') {
      res.status(401).send('Unauthorized')
      return
    }

    try {
      await runMigrations()
      res.status(200).send({ message: 'migrations ran successfully' })
    } catch (err: any) {
      res.status(500).send({ message: `migrations failed: ${err.message}`, error: err })
    }
  })

  app.use('/env', envRouter)

  app.get('/', (req, res) => {
    res.status(200).send('OK')
  })

  app.get('/health', async (req, res) => {
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
      return res.status(500).send({
        error: 'borked',
        errno: err.errno,
        code: err.code,
        message: err.message,
      })
    } finally {
      if (client) {
        client.release(true)
      }
    }
  })

  // default 404 handler
  app.use((req, res, next) => {
    res
      .status(404)
      .send({ message: 'Not found', path: req.path, method: req.method, query: req.query })
  })

  // default 500
  app.use(((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Borked')
  }) as ErrorRequestHandler)

  return app
}
