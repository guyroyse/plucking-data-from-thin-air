export type AircraftJSON = {
  icaoId: string
  generatedDateTime: number
  loggedDateTime: number
  callsign?: string
  altitude?: number
  groundSpeed?: number
  track?: number
  latitude?: number
  longitude?: number
  verticalRate?: number
  squawk?: string
  alert?: boolean
  emergency?: boolean
  specialPositionIndicator?: boolean
  isOnGround?: boolean
}
