import { AppFactory } from './app'

// Build app and start server
const env = process.env
const { start } = AppFactory()
start()
  .then((port: number) => {
    console.log('Server listening on port: ' + port)
  })
  .catch((err: Error) => {
    console.error(err.stack)
  })