#! /usr/bin/env node

import { Command } from 'commander'
import { createInterface } from 'readline'
import { createClient } from 'redis'

const program = new Command()

const redisOptions = {
  url: program.opts().redis
}

const redis = await createClient(redisOptions)
  .on('error', error => console.error('Redis Client Error:', error))
  .connect()

program
  .name('power-meter')
  .description('A simple tool to read the output of rtl_power and write it to a Redis timeseries')
  .version('1.0.0')
  .option('-r, --redis <url>', 'Redis URL to connect to', 'redis://localhost:6379')
  .action(async () => {
    for await (const line of createInterface({ input: process.stdin })) {
      /* extract the date */
      const [date, time, ...theNumbers] = line.split(',').map(s => s.trim())
      const dateTime = new Date(`${date}T${time}`)

      /* extract the frequency and power levels */
      const [startFreq, _endFreq, stepFreq, _sampleCount, ...powers] = theNumbers.map(s => Number(s))

      /* write the power levels to Redis */
      for (const [index, power] of powers.entries()) {
        const timestamp = dateTime.getTime()
        const freq = startFreq! + stepFreq! * index
        const freqString = freq.toString()
        const key = `power:${freqString}`

        console.log(`Writing to ${key} at ${timestamp} with power ${power}`)

        await redis.ts.add(key, timestamp + index, power, { LABELS: { freq: freqString, type: 'power' } })
      }
    }
  })

program.parse(process.argv)
