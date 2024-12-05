#! /usr/bin/env node

import chalk from 'chalk'
import { Command } from 'commander'
import { createInterface } from 'readline'
import { createClient } from 'redis'

/* Set up the command line interface */
const program = new Command()
  .name('payload-sniffer')
  .description('A simple tool to read the output of rtl_433 and write it to multiple event streams in Redis')
  .version('1.0.0')
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
    processLine(line)
  }
}

/* Process a single line of JSON from rtl_433 */
function processLine(line: string) {
  console.log(chalk.yellow('Processing line'), line)

  /* Parse the JSON */
  const data = JSON.parse(line)
  for (const key in data) {
    data[key] = data[key].toString()
  }

  const model = data.model

  /* Write it to an event stream matching the device model */
  const key = `rtl_433:${data.model}`
  redis.xAdd(key, '*', data)

  /* Log that we did a thing */
  console.log(`Adding event for model ${chalk.green(model)} to stream ${chalk.green(key)}`)
}
