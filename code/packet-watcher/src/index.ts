#! /usr/bin/env node

import chalk from 'chalk'
import { Command } from 'commander'
import { createClient } from 'redis'
import { Socket } from 'net'

import { parseAPRS_Packet, APRS_Packet } from './aprs'
import { parseKISS_Packet } from './kiss'
import { AX25_Address } from './ax25-address'

/* Set up the command line interface */
const program = new Command()
  .name('plane-finder')
  .description('A simple tool to read the SBS1 messages  of rtl_adsb and write it to JSON in Redis')
  .version('1.0.0')
  .option('-r, --redis <url>', 'Redis URL to connect to', 'redis://localhost:6379')
  .option('-h, --host <host>', 'Host running the KISS service', 'localhost')
  .option<number>(
    '-p, --port <port>',
    'Port to connect to on the host',
    value => {
      const port = parseInt(value, 10)
      if (isNaN(port)) throw new Error('Port must be a number')
      if (port < 0 || port > 65535) throw new Error('Port must be in the range 0-65535')
      return port
    },
    8001
  )
  .action(main)
  .parse()

/* Get the program options */
const redisUrl: string = program.opts().redis
const kissHost: string = program.opts().host
const kissPort: number = program.opts().port

/* Get the Redis URL from the command line */
const redisOptions = {
  url: redisUrl
}

/* Connect to Redis */
const redis = await createClient(redisOptions)
  .on('error', error => console.error('Redis Client Error:', error))
  .connect()

const socket = new Socket()

socket.connect(kissPort, kissHost, () => {
  console.log(`Connected to Direwolf on ${kissHost}:${kissPort}`)
})

socket.on('data', handlePacket)

socket.on('close', () => {})

socket.on('error', err => {
  console.log('Error: ' + err)
})

async function main() {}

function handlePacket(data: Buffer) {
  /* Log the received data */
  const hex = data.toString('hex')
  console.log(`Received ${data.length} bytes: ${hex}`)

  /* Parse the APRS packet */
  const dataframe = parseKISS_Packet(data)
  const packet = parseAPRS_Packet(dataframe)

  /* Convert the packet to an object usable by a Redis event stream */
  const event = {
    destination: addressToString(packet.addresses.destination),
    source: addressToString(packet.addresses.source),
    digipeaters: addressesToString(packet.addresses.digipeaters),
    information: Buffer.from(packet.information.bytes),
    informationHex: packet.information.hex,
    informationAscii: packet.information.ascii
  }

  /* Log the parsed packet to Redis */
  redis.xAdd('aprs:packets', '*', event)
}

function addressesToString(addresses: AX25_Address[]): string {
  return addresses.map(addressToString).join(',')
}

function addressToString(address: AX25_Address): string {
  return address.ssid === 0 ? address.callsign : `${address.callsign}-${address.ssid}`
}
