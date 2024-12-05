import { createClient, ErrorReply, SchemaFieldTypes } from 'redis'

/* Change this to connect to a different Redis */
const redisOptions = {
  url: 'redis://localhost:6379'
}

/* Create and connect the Redis client */
const redis = await createClient(redisOptions)
  .on('error', error => console.error('Redis Client Error:', error))
  .connect()

/* Drop aircraft index if it exists */
try {
  await redis.ft.dropIndex('aircraft:index')
} catch (error) {
  if (error instanceof ErrorReply && error.message !== 'Unknown Index name') throw error
}

/* Create the aircraft index */
await redis.ft.create(
  'aircraft:index',
  {
    '$.icaoId': { type: SchemaFieldTypes.TAG, AS: 'icaoId' },
    '$.generatedDateTime': { type: SchemaFieldTypes.NUMERIC, AS: 'generatedDateTime' },
    '$.loggedDateTime': { type: SchemaFieldTypes.NUMERIC, AS: 'loggedDateTime' },
    '$.callsign': { type: SchemaFieldTypes.TAG, AS: 'callsign' },
    '$.altitude': { type: SchemaFieldTypes.NUMERIC, AS: 'altitude' },
    '$.groundSpeed': { type: SchemaFieldTypes.NUMERIC, AS: 'groundSpeed' },
    '$.track': { type: SchemaFieldTypes.NUMERIC, AS: 'track' },
    '$.latitude': { type: SchemaFieldTypes.NUMERIC, AS: 'latitude' },
    '$.longitude': { type: SchemaFieldTypes.NUMERIC, AS: 'longitude' },
    '$.verticalRate': { type: SchemaFieldTypes.NUMERIC, AS: 'verticalRate' },
    '$.squawk': { type: SchemaFieldTypes.TAG, AS: 'squawk' },
    '$.alert': { type: SchemaFieldTypes.TAG, AS: 'alert' },
    '$.emergency': { type: SchemaFieldTypes.TAG, AS: 'emergency' },
    '$.specialPositionIndicator': { type: SchemaFieldTypes.TAG, AS: 'specialPositionIndicator' },
    '$.isOnGround': { type: SchemaFieldTypes.TAG, AS: 'isOnGround' }
  },
  {
    ON: 'JSON',
    PREFIX: 'aircraft:'
  }
)

/* Export the Redis client */
export default redis
