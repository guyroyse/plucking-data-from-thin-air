#! /usr/bin/env node

import chalk from 'chalk'
import { Command } from 'commander'
import { createInterface } from 'readline'
import { createClient } from 'redis'

/* Type containing a single signal value */
type SignalValue = {
  dateTime: Date
  frequency: number
  signalStrength: number
}

/* Set up the command line interface */
const program = new Command()
  .name('power-meter')
  .description('A simple tool to read the output of rtl_power and write it to a Redis timeseries')
  .version('1.0.1')
  .option('-r, --redis <url>', 'Redis URL to connect to', 'redis://localhost:6379')
  .action(main)
  .parse()

/* Get the Redis URL from the command line */
const redisOptions = {
  url: program.opts().redis
}

/* Connect to Redis */
const redis = await createClient(redisOptions)
  .on('error', error => console.error('Redis Client Error:', error))
  .connect()

/* Read stdin forever */
async function main() {
  for await (const line of createInterface({ input: process.stdin })) {
    await processLine(line)
  }
}

/* Process a single line of power inputs */
async function processLine(line: string) {
  console.log(chalk.yellow('Processing line'), line)
  /* Yield signal values from the line */
  for (const signalValue of yieldSignalValues(line)) {
    /* Get the values from the signal value */
    const timestamp = signalValue.dateTime.getTime()
    const frequency = signalValue.frequency.toString()
    const signalStrength = signalValue.signalStrength

    /* The key to write it to in Redis */
    const key = `power:${frequency}`

    /* Write the signal strength to Redis */
    await redis.ts.add(key, timestamp, signalStrength, {
      LABELS: { frequency, type: 'signalStrength' },
      RETENTION: 60 * 60 * 1000
    })

    /* Log that we did a thing */
    console.log(`Writing to ${chalk.green(key)} at ${chalk.blue(timestamp)} with power ${chalk.red(signalStrength)}`)
  }
}

function* yieldSignalValues(line: string): Generator<SignalValue> {
  /* Define the types in the arrays to appease the TypeScript gods */
  type DateTimeAndSignalData = [string, string, ...string[]]
  type SignalData = [number, number, number, number, ...number[]]

  /* Fix windows nan values from rtl_power.exe */
  line = line.replace(/nan/gi, "0.0")

  /* Pull out the date, time, and signal data */
  const [date, time, ...signalData] = line.split(',').map(s => s.trim()) as DateTimeAndSignalData
  const dateTime = new Date(`${date}T${time}`)

  /* Pull out the details from the signal data */
  const [startFreq, _endFreq, step, _count, ...strengths] = signalData.map(s => Number(s)) as SignalData
  strengths.pop() // Remove the last element, which is always a duplicate

  /* Yield signal strengths until they are done */
  for (const [index, signalStrength] of strengths.entries()) {
    const frequency = startFreq + step * index
    yield {
      dateTime,
      frequency,
      signalStrength
    }
  }
}
