import cors from 'cors'
import express, { Express } from 'express'

/* Import the routers */
import { router as powerMeterRouter } from './power-meter-routes'
import { router as planeFinderRouter } from './plane-finder-routes'
import { router as packetWatcherRouter } from './packet-watcher-routes'
import { router as payloadSnifferRouter } from './payload-sniffer-routes'

/* Create the Express app */
const app: Express = express()

/* Use JSON */
app.use(express.json())

/* Enable CORS */
app.use(cors())
app.use(function (_req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

/* Home route with a status message */
app.get('/', (_req, res) => {
  res.json({ staus: 'OK' })
})

/* Use all the routers */
app.use('/power-meter', powerMeterRouter)
app.use('/plane-finder', planeFinderRouter)
app.use('/packet-watcher', packetWatcherRouter)
app.use('/payload-sniffer', payloadSnifferRouter)

/* Start the server */
const server = app.listen(8080, () => {
  console.log('Server is running on port 8080')
})

/* Mad hacks to get HMR working *and* to appease the TypeScript gods */

interface ImportMeta {
  hot?: {
    on: (event: string, callback: () => void) => void
    dispose: (callback: () => void) => void
  }
}

const importMeta = import.meta as ImportMeta

if (importMeta.hot) {
  importMeta.hot.on('vite:beforeFullReload', () => {
    server.close()
  })

  importMeta.hot.dispose(() => {
    server.close()
  })
}
