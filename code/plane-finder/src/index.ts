#! /usr/bin/env node

import chalk from 'chalk'
import { Command } from 'commander'
import { createClient as createRedisClient } from 'redis'
import { createClient as createSBS1_Client, SBS1_Message } from 'sbs1'

import { AircraftJSON } from './types/aircraft-status.js'

/* Set up the command line interface */
const program = new Command()
  .name('plane-finder')
  .description('A simple tool to read the SBS1 messages of dump-1090 and write them to JSON in Redis')
  .version('1.0.0')
  .option('-r, --redis <url>', 'Redis URL to connect to', 'redis://localhost:6379')
  .option('-h, --host <host>', 'Host running service publishing SBS-1 messages', 'localhost')
  .option<number>(
    '-p, --port <port>',
    'Port for service publishing SBS-1 messages',
    value => {
      const port = parseInt(value, 10)
      if (isNaN(port)) throw new Error('Port must be a number')
      if (port < 0 || port > 65535) throw new Error('Port must be in the range 0-65535')
      return port
    },
    30003
  )
  .option(
    '--ttl <seconds>',
    'Seconds to keep aircraft data in Redis',
    value => {
      const ttl = parseInt(value, 10)
      if (isNaN(ttl)) throw new Error('TTL must be a number')
      return ttl
    },
    300
  )
  .parse()

/* Get the program options */
const redisUrl: string = program.opts().redis
const sbs1Host: string = program.opts().host
const sbs1Port: number = program.opts().port
const ttl: number = program.opts().ttl

/* Connect to Redis */
const redis = await createRedisClient({ url: redisUrl })
  .on('error', error => console.error('Redis Client Error:', error))
  .connect()

/* Create the SBS1 client and start listening to events */
const sbs1 = createSBS1_Client({ host: sbs1Host, port: sbs1Port })
  .on('message', processMessage)
  .on('error', error => console.error('SBS1 Client Error:', error))
  .on('close', () => console.log('SBS1 Client Closed'))

/* Process an SBS-1 message */
function processMessage(message: SBS1_Message) {
  /* Fields that are always present */
  const json: AircraftJSON = {
    icaoId: message.hex_ident,
    generatedDateTime: toEpochMilliseconds(message.generated_date, message.generated_time),
    loggedDateTime: toEpochMilliseconds(message.logged_date, message.logged_time)
  }

  /* Fields that may be present */
  if (isNotNullish(message.callsign)) json.callsign = message.callsign!.trim()
  if (isNotNullish(message.altitude)) json.altitude = message.altitude!
  if (isNotNullish(message.ground_speed)) json.groundSpeed = message.ground_speed!
  if (isNotNullish(message.track)) json.track = message.track!
  if (isNotNullish(message.lat)) json.latitude = message.lat!
  if (isNotNullish(message.lon)) json.longitude = message.lon!
  if (isNotNullish(message.vertical_rate)) json.verticalRate = message.vertical_rate!
  if (isNotNullish(message.squawk)) json.squawk = message.squawk!
  if (isNotNullish(message.alert)) json.alert = message.alert!
  if (isNotNullish(message.emergency)) json.emergency = message.emergency!
  if (isNotNullish(message.spi)) json.specialPositionIndicator = message.spi!
  if (isNotNullish(message.is_on_ground)) json.isOnGround = message.is_on_ground!

  /* Write the JSON to Redis with an expiration of 5 minutes */
  const key = `aircraft:${json.icaoId}`
  redis.json.merge(key, '.', json)
  redis.expire(key, ttl)

  /* Log the message */
  console.log(chalk.green('Added aircraft to Redis:'), json.icaoId)
}

function toEpochMilliseconds(dateString: string, timeString: string): number {
  if (!dateString || !timeString) return 0
  const date = new Date(`${dateString.replaceAll('/', '-')}T${timeString}`)
  return date.getTime()
}

function isNotNullish(value: unknown): boolean {
  return value !== null && value !== undefined
}
