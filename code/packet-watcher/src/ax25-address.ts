export type AX25_AddressField = {
  destination: AX25_Address
  source: AX25_Address
  digipeaters: AX25_Address[]
}

export type AX25_Address = {
  callsign: string
  ssid: number
  lastAddress: boolean
}

export function parseAX25_Addresses(index: number, data: Buffer): AX25_AddressField {
  let offset = index

  const incrementOffset = () => (offset = offset + 7)
  const addressBytes = () => data.subarray(offset, offset + 7)

  const destination: AX25_Address = parseAX25_Address(addressBytes())
  incrementOffset()

  const source: AX25_Address = parseAX25_Address(addressBytes())
  incrementOffset()

  const digipeaters: AX25_Address[] = []

  let lastAddress = source.lastAddress
  while (!lastAddress) {
    const digipeater = parseAX25_Address(addressBytes())
    incrementOffset()
    digipeaters.push(digipeater)
    lastAddress = digipeater.lastAddress
  }

  return { destination, source, digipeaters }
}

export function parseAX25_Address(data: Buffer): AX25_Address {
  if (data.length !== 7) throw new Error('Address field must be 7 bytes long')

  const callsignBytes = data.subarray(0, 6)
  const ssidByte: number = data[6] as number

  const callsign: string = processCallsignBytes(callsignBytes)
  const { ssid, lastAddress } = processSSID_Byte(ssidByte)

  return {
    callsign,
    ssid,
    lastAddress
  }
}

function processCallsignBytes(callsignBytes: Buffer): string {
  const asciiBytes: Uint8Array = callsignBytes.map(byte => processCallsignByte(byte))
  return Buffer.from(asciiBytes).toString('ascii').trim()
}

function processCallsignByte(byte: number) {
  if (isLastBitHigh(byte)) throw new Error('Last bit must be low in a callsign byte')
  return shiftByteRight(byte)
}

function processSSID_Byte(byte: number) {
  const ssid = lowerNibble(shiftByteRight(byte))
  const lastAddress = isLastBitHigh(byte)

  return { ssid, lastAddress }
}

function isLastBitHigh(byte: number): boolean {
  return (byte & 0b00000001) === 0b00000001
}

function shiftByteRight(byte: number): number {
  return byte >> 1
}

function lowerNibble(byte: number): number {
  return byte & 0b00001111
}
