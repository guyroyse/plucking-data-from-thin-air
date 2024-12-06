import { Router } from 'express'
import redis from './redis-client'

export const router = Router()

router.get('/', async (_req, res) => {
  const results = await redis.xRevRange('aprs:packets', '+', '-', { COUNT: 20 })

  const packets = results.map(result => {
    const id = result.id
    const message = result.message

    const [ms] = id.split('-')
    const date = new Date(Number(ms)).toISOString()

    return {
      date,
      destination: message.destination,
      source: message.source,
      digipeaters: message.digipeaters?.split(',') ?? [],
      information: {
        hex: message.informationHex,
        ascii: message.informationAscii
      }
    }
  })

  res.json(packets)
})
