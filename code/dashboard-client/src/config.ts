const HOSTNAME = 'localhost'
const PORT = 8080

export const POWER_METER_URL = `http://${HOSTNAME}:${PORT}/power-meter`
export const PLANE_FINDER_URL = `http://${HOSTNAME}:${PORT}/plane-finder`
export const PACKET_WATCHER_URL = `http://${HOSTNAME}:${PORT}/packet-watcher`
export const PAYLOAD_SNIFFER_URL = `http://${HOSTNAME}:${PORT}/payload-sniffer`
export const DEVICE_LIST_URL = `${PAYLOAD_SNIFFER_URL}/models`
