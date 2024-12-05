import { Router } from 'express'

import redis from './redis-client'

export const router = Router()

router.get('/', async (_req, res) => {
  const result = await redis.ft.search('aircraft:index', '*')
  return result.documents.map(document => {
    console.log(document.value)
    return document.value
  })
})
