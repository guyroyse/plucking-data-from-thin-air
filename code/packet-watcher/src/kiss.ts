const FEND = 0xc0
const FESC = 0xdb
const TFEND = 0xdc
const TFESC = 0xdd

enum KISS_State {
  START_OF_PACKET,
  IN_COMMAND,
  IN_DATAFRAME,
  ESCAPING,
  END_OF_DATAFRAME
}

export function parseKISS_Packet(data: Buffer): Buffer {
  let dataframe: number[] = []
  let state = KISS_State.START_OF_PACKET

  for (const byte of data) {
    switch (state) {
      case KISS_State.START_OF_PACKET:
        state = processStartOfPacket(byte)
        break
      case KISS_State.IN_COMMAND:
        state = proccessCommandByte(byte)
        break
      case KISS_State.IN_DATAFRAME:
        state = processDataframeByte(byte)
        break
      case KISS_State.ESCAPING:
        state = processEscapedByte(byte)
        break
      case KISS_State.END_OF_DATAFRAME:
        throw new Error('KISS packet does not end with FEND')
      default:
        throw new Error('Invalid state')
    }
  }

  return Buffer.from(dataframe)

  function processStartOfPacket(byte: number): KISS_State {
    // packets must start with KISS FEND byte
    if (byte === FEND) return KISS_State.IN_COMMAND
    throw new Error('KISS packet does not start with FEND')
  }

  function proccessCommandByte(byte: number): KISS_State {
    // if byte's lower nibble is 0, this is a dataframe
    if ((byte & 0x0f) === 0) return KISS_State.IN_DATAFRAME
    throw new Error('Packet does not contain a dataframe')
  }

  function processDataframeByte(byte: number): KISS_State {
    // if byte is FESC, this is an escape sequence
    if (byte === FESC) return KISS_State.ESCAPING

    // if byte is FEND, this is the end of the dataframe
    if (byte === FEND) return KISS_State.END_OF_DATAFRAME

    // otherwise, we're still in the dataframe
    dataframe.push(byte)
    return KISS_State.IN_DATAFRAME
  }

  function processEscapedByte(transposedByte: number): KISS_State {
    // if transposed byte is not TFEND or TFESC then we have an error
    if (transposedByte !== TFESC && transposedByte !== TFEND) throw new Error('Invalid escape sequence in dataframe')

    // add the transposed byte and return to the dataframe state
    dataframe.push(transposedByte === TFESC ? FESC : FEND)
    return KISS_State.IN_DATAFRAME
  }
}
