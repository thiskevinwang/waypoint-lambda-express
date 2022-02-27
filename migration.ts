import { migrate } from 'postgres-migrations'
import { pool } from './db'

export async function runMigrations() {
  let error = null
  let client = null

  try {
    client = await pool.connect()
    await migrate({ client: pool }, './migrations')
  } catch (err) {
    error = err
  } finally {
    if (client) {
      client.release(true)
    } 
  }
  if (error) {
    throw error
  }
}
