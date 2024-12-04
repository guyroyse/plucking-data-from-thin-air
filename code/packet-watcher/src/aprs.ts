export type APRS_Packet = {
  addresses: any
  information: string
}

export function parseAPRS_Packet(data: Buffer): APRS_Packet {
  const controlField = 0x03
  const protocolId = 0xf0
  const cfpid = Uint8Array.from([controlField, protocolId])
  const cfpidLocation = data.indexOf(cfpid)

  const addressStart = 0
  const addressEnd = cfpidLocation
  const infoStart = cfpidLocation + 2
  const infoEnd = data.length

  const addresses = parseAddresses(data)
  const information = data.subarray(infoStart, infoEnd).toString('ascii')

  return {
    addresses,
    information
  }
}

function parseAddresses(data: Buffer) {
  const destination = parseAddress(data.subarray(0, 7))
  if (destination.lastAddress) return { destination }

  const source = parseAddress(data.subarray(7, 14))
  if (source.lastAddress) return { destination, source }

  const digipeaters = []
  let offset = 14
  while (true) {
    const digipeater = parseAddress(data.subarray(offset, offset + 7))
    digipeaters.push(digipeater)
    offset += 7

    if (digipeater.lastAddress) break
  }

  return { destination, source, digipeaters }
}

enum AddressStates {
  CALLSIGN,
  SSID
}

function parseAddress(data: Buffer) {
  if (data.length !== 7) throw new Error('Address field must be 7 bytes long')

  let state = AddressStates.CALLSIGN
  let callsignBytes: number[] = []

  for (const byte of data) {
    if (state === AddressStates.CALLSIGN) {
      state = processCallsignByte(byte, callsignBytes)
    } else if (state === AddressStates.SSID) {
      const { ssid, lastAddress } = processSSID_Byte(byte)
      return {
        callsign: Buffer.from(callsignBytes).toString('ascii').trim(),
        ssid,
        lastAddress
      }
    } else {
      throw new Error('Invalid state')
    }
  }

  throw new Error('Address field did not contain SSID byte')
}

function processCallsignByte(byte: number, callsignBytes: number[]) {
  const lastBitHigh: boolean = (byte & 0b00000001) === 0b00000001
  if (lastBitHigh) throw new Error('Last bit high in callsign byte')

  const asciiByte = byte >> 1
  callsignBytes.push(asciiByte)

  return callsignBytes.length === 6 ? AddressStates.SSID : AddressStates.CALLSIGN
}

function processSSID_Byte(byte: number) {
  const lastBitHigh: boolean = (byte & 0b00000001) === 0b00000001
  const ssid = (byte & 0b00011110) >> 1

  return {
    ssid,
    lastAddress: lastBitHigh
  }
}
