import { Router } from 'express'
import redis from './redis-client'

export const router = Router()

router.get('/:model', async (req, res) => {
  const model = req.params.model
  const key = `rtl_433:${model}`
  const results = await redis.xRevRange(key, '+', '-', { COUNT: 20 })

  const messages = results.map(result => {
    const id = result.id
    const message = result.message

    const [ms] = id.split('-')
    const date = new Date(Number(ms)).toISOString()

    return { date, ...message }
  })
  res.json(messages)
})
