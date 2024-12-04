import Optional from '@guyroyse/optional'
import { parseAX25_Addresses, AX25_AddressField } from './ax25-address'

const CONTROL_FIELD = 0x03
const PROTOCOL_ID = 0xf0

enum APRS_State {
  AX25_ADDRESSES,
  CONTROL_FIELD,
  PROTOCOL_ID,
  INFORMATION_FIELD,
  END_OF_PACKET
}

export type APRS_Information = {
  ascii: string
  hex: string
  bytes: number[]
}

export type APRS_Packet = {
  addresses: AX25_AddressField
  information: APRS_Information
}

export function parseAPRS_Packet(data: Buffer): APRS_Packet {
  let addressField: Optional<AX25_AddressField> = Optional.empty()
  let informationField: Optional<APRS_Information> = Optional.empty()

  let index = 0
  let state = APRS_State.AX25_ADDRESSES

  while (index < data.length) {
    switch (state) {
      case APRS_State.AX25_ADDRESSES:
        state = processAddressField()
        break
      case APRS_State.CONTROL_FIELD:
        state = processControlField()
        break
      case APRS_State.PROTOCOL_ID:
        state = processProtocolID()
        break
      case APRS_State.INFORMATION_FIELD:
        state = processInformationField()
        break
      default:
        throw new Error('Invalid state')
    }
  }

  return {
    addresses: addressField.get(),
    information: informationField.get()
  }

  function processAddressField(): APRS_State {
    addressField = Optional.of(parseAX25_Addresses(index, data))

    const destinationLength = 7
    const sourceLength = 7
    const digipeaterLength = addressField.get().digipeaters.length * 7
    index = index + destinationLength + sourceLength + digipeaterLength

    return APRS_State.CONTROL_FIELD
  }

  function processControlField(): APRS_State {
    if (data[index] !== CONTROL_FIELD) throw new Error('Invalid control field')
    index++
    return APRS_State.PROTOCOL_ID
  }

  function processProtocolID(): APRS_State {
    if (data[index] !== PROTOCOL_ID) throw new Error('Invalid protocol ID')
    index++
    return APRS_State.INFORMATION_FIELD
  }

  function processInformationField(): APRS_State {
    const rawBytes = data.subarray(index)

    const ascii = rawBytes.toString('ascii')
    const hex = rawBytes.toString('hex')
    const bytes = [...rawBytes]

    informationField = Optional.of({ ascii, hex, bytes })

    index = data.length
    return APRS_State.END_OF_PACKET
  }
}
