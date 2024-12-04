const kissFEND = 0xc0
const kissFESC = 0xdb
const kissTFEND = 0xdc
const kissTFESC = 0xdd

enum KISS_States {
  FEND_START,
  COMMAND,
  FRAME,
  ESCAPE,
  FEND_END,
  END_OF_PACKET
}

export function parseKISS_Packet(data: Buffer): Buffer {
  let dataframe: number[] = []
  let state = KISS_States.FEND_START

  for (const byte of data) {
    switch (state) {
      case KISS_States.FEND_START:
        state = processStart(byte, dataframe)
        break
      case KISS_States.COMMAND:
        state = proccessCommand(byte, dataframe)
        break
      case KISS_States.FRAME:
        state = processFrame(byte, dataframe)
        break
      case KISS_States.ESCAPE:
        state = processEscape(byte, dataframe)
        break
      case KISS_States.FEND_END:
        state = KISS_States.END_OF_PACKET
        break
      case KISS_States.END_OF_PACKET:
        throw new Error('Bytes received beyond FEND')
      default:
        throw new Error('Invalid state')
    }
  }

  return Buffer.from(dataframe)
}

function processStart(byte: number, data: number[]): KISS_States {
  // packets must start with FEND
  if (byte === kissFEND) return KISS_States.COMMAND
  throw new Error('Invalid KISS packet')
}

function proccessCommand(byte: number, dataframe: number[]): KISS_States {
  // if bytes lower nibble is 0, this is a data frame
  if ((byte & 0x0f) === 0) return KISS_States.FRAME
  throw new Error('Packet does not contain a data frame')
}

function processFrame(byte: number, dataframe: number[]): KISS_States {
  if (byte === kissFESC) return KISS_States.ESCAPE
  if (byte === kissFEND) return KISS_States.FEND_END
  dataframe.push(byte)

  return KISS_States.FRAME
}

function processEscape(byte: number, dataframe: number[]): KISS_States {
  if (byte === kissTFESC) {
    dataframe.push(kissFESC)
  } else if (byte === kissTFEND) {
    dataframe.push(kissFEND)
  } else {
    throw new Error('Invalid escape sequence')
  }

  return KISS_States.FRAME
}
