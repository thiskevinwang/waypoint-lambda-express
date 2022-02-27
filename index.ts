import serverlessExpress from '@vendia/serverless-express'
import type { ALBEvent, Context } from 'aws-lambda'

import { createApp } from './app'

const app = createApp()

function createHandler() {
  const realHandler = serverlessExpress({ app })
  return async (event: ALBEvent, context: Context) => {
    // https://gist.github.com/streamich/6175853840fb5209388405910c6cc04b
    // https://github.com/brianc/node-postgres/issues/930#issuecomment-230362178
    context.callbackWaitsForEmptyEventLoop = false // !important to reuse pool

    // @ts-expect-error: purposefully omitting the callback
    return await realHandler(event, context)
  }
}

export const handler = createHandler()

// createApp().listen(3002, () => {
//   console.log("listening on http://localhost:3002")
// })
