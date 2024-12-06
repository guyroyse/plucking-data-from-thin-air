import { Router } from 'express'

import { SearchOptions, SearchReply } from 'redis'

import redis from './redis-client'

export const router = Router()

router.get('/', async (_req, res) => {
  const options: SearchOptions = {
    LIMIT: { from: 0, size: 1000 }
  }
  const result: SearchReply = await redis.ft.search('aircraft:index', '*', options)
  const aircraft = result.documents.map(document => {
    console.log(document.value)
    return document.value
  })
  res.json(aircraft)
})
