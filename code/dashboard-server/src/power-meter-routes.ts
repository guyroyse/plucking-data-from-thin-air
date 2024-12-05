import { Router } from 'express'
import redis from './redis-client'

export const router = Router()

router.get('/', async (_req, res) => {
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
