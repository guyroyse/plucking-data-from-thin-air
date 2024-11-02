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

app.get('/power-meter', async (_req, res) => {
  const data = await redis.ts.mGet('type=power')
  const betterData = data
    .map((item: any) => {
      const freq = Number(item.key.split(':')[1])
      const power = Number(item.sample.value)
      return { freq, power }
    })
    .sort((a: any, b: any) => a.freq - b.freq)
  res.json(betterData)
})

app.listen(8080, () => {
  console.log('Server is running on port 8080')
})
