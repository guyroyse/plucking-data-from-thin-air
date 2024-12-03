#! /usr/bin/env node

import chalk from 'chalk'
import { Command } from 'commander'
import { createClient as createRedisClient } from 'redis'
import { createClient as createSBS1_Client, SBS1_Message } from 'sbs1'

import { AircraftJSON } from './types/aircraft-status'

/* Set up the command line interface */
const program = new Command()
  .name('plane-finder')
  .description('A simple tool to read the SBS1 messages  of rtl_adsb and write it to JSON in Redis')
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
  .parse()

/* Get the program options */
const redisUrl: string = program.opts().redis
const sbs1Host: string = program.opts().host
const sbs1Port: number = program.opts().port

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
  if (message.callsign !== null) json.callsign = message.callsign.trim()
  if (message.altitude !== null) json.altitude = message.altitude
  if (message.ground_speed !== null) json.groundSpeed = message.ground_speed
  if (message.track !== null) json.track = message.track
  if (message.lat !== null) json.latitude = message.lat
  if (message.lon !== null) json.longitude = message.lon
  if (message.vertical_rate !== null) json.verticalRate = message.vertical_rate
  if (message.squawk !== null) json.squawk = message.squawk
  if (message.alert !== null) json.alert = message.alert
  if (message.emergency !== null) json.emergency = message.emergency
  if (message.spi !== null) json.specialPositionIndicator = message.spi
  if (message.is_on_ground !== null) json.isOnGround = message.is_on_ground

  /* Write the JSON to Redis with an expiration of 5 minutes */
  const key = `aircraft:${json.icaoId}`
  redis.json.merge(key, '.', json)
  redis.expire(key, 300)

  /* Log the message */
  console.log(chalk.green('Added aircraft to Redis:'), json.icaoId)
}

function toEpochMilliseconds(dateString: string, timeString: string): number {
  if (!dateString || !timeString) return 0

  const offset = new Date().getTimezoneOffset() * 60 * 1000
  const date = new Date(`${dateString.replaceAll('/', '-')}T${timeString}`)
  return date.getTime() - offset
}
