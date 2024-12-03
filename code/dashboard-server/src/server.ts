import cors from 'cors'
import express, { Express } from 'express'
import { createClient } from 'redis'

const redisOptions = {
  url: 'redis://localhost:6379'
}

const redis = await createClient(redisOptions)
  .on('error', error => console.error('Redis Client Error:', error))
  .connect()

const app: Express = express()

app.use(express.json())

app.use(cors())
app.use(function (_req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/', (_req, res) => {
  res.json({ staus: 'OK' })
})

app.get('/power-meter', async (_req, res) => {
  /* Get the start and stop times for the last minute */
  const now = Math.floor(Date.now() / 1000) * 1000
  const then = now - 1000 * 60

  /* Get the data for the last minute */
  const data = await redis.ts.mRangeWithLabels(then, now, 'type=signalStrength')

  const results = data
    .flatMap((item: any) => {
      const frequency = Number(item.labels.frequency)
      return item.samples.map((sample: any) => {
        const time = Math.floor((sample.timestamp - then) / 1000)
        const power = sample.value
        return { time, frequency, power }
      })
    })
    .sort((a: any, b: any) => {
      return a.time - b.time || a.frequency - b.frequency
    })

  res.json(results)
})

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
