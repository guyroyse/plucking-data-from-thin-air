import 'leaflet/dist/leaflet.css'
import L, { tooltip } from 'leaflet'

import { PLANE_FINDER_URL } from './config'

/* Create the icons we'll use  */
const homeIcon: L.Icon = L.icon({ iconUrl: 'icons/home.png', iconSize: [16, 16] })
const planeIcons: L.Icon[] = rangeInclusive(0, 23).map(i =>
  L.icon({ iconUrl: `icons/plane-${i * 15}.png`, iconSize: [18, 18] })
)

/* A container for the plane markers */
type MarkerData = {
  marker: L.Marker
  tooltip: L.Tooltip
  popup: L.Popup
}

const planeMarkers: Map<string, MarkerData> = new Map()

/* Create the map and bind it to an element with the id 'map' */
const map: L.Map = L.map('map')

/* Add the tile layer */
const urlTemplate = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const options = {
  maxZoom: 18,
  tileSize: 512,
  zoomOffset: -1,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}
const tileLayer: L.TileLayer = L.tileLayer(urlTemplate, options).addTo(map)

/* Get the user's current location and use it to place a home marker and center the map */
navigator.geolocation.getCurrentPosition((position: GeolocationPosition) => {
  const latitude = position.coords.latitude
  const longitude = position.coords.longitude

  const homeMarker: L.Marker = L.marker([latitude, longitude], { icon: homeIcon })
  map.addLayer(homeMarker)
  map.setView([latitude, longitude], 8)
})

/* Set a timer to update the plane markers every coupld seconds */
const handle = setInterval(async () => {
  const response = await fetch(PLANE_FINDER_URL)
  const planes = await response.json()

  /* Add and update the plane markers */
  for (const plane of planes) addOrUpdateMarker(plane)

  /* remove any plane markers that are no longer in the list */
  for (const icaoId in planeMarkers) {
    const plane = planes.find((plane: any) => plane.icaoId === icaoId)
    if (!plane) removeMarker(icaoId)
  }
}, 1000)

function addOrUpdateMarker(plane: any): void {
  const planeFound = planeMarkers.has(plane.icaoId)
  const hasLocation = plane.latitude !== undefined && plane.longitude !== undefined

  /* A plane that is on the map has a location */
  if (planeFound) updatePlaneMarker(plane)

  /* Only add planes with a known location */
  if (!planeFound && hasLocation) addPlaneMarker(plane)
}

function removeMarker(icaoId: string): void {
  const markerData = planeMarkers.get(icaoId)
  if (markerData) {
    map.removeLayer(markerData.marker)
    planeMarkers.delete(icaoId)
  }
}

function addPlaneMarker(plane: any): void {
  /* Create a marker for the plane */
  const markerData = {
    marker: L.marker([plane.latitude, plane.longitude]),
    tooltip: L.tooltip({
      permanent: true,
      direction: 'auto',
      offset: L.point(12, 0),
      opacity: 0.9,
      className: 'font-mono'
    }),
    popup: L.popup({ className: 'font-mono', interactive: true })
  }

  /* Update the marker data */
  updateIcon(markerData, plane)
  updateTooltip(markerData, plane)
  updatePopup(markerData, plane)

  /* Bind the tooltip and popup to the marker */
  markerData.marker.bindTooltip(markerData.tooltip).openTooltip()
  markerData.marker.bindPopup(markerData.popup)

  /* Add the marker data to the Map */
  planeMarkers.set(plane.icaoId, markerData)

  /* Add the marker to the map */
  map.addLayer(markerData.marker)
}

function updatePlaneMarker(plane: any): void {
  const markerData = planeMarkers.get(plane.icaoId) as MarkerData
  updateLocation(markerData, plane)
  updateIcon(markerData, plane)
  updateTooltip(markerData, plane)
  updatePopup(markerData, plane)
}

function updateLocation(markerData: MarkerData, plane: any): void {
  markerData.marker.setLatLng([plane.latitude, plane.longitude])
}

function updateIcon(markerData: MarkerData, plane: any): void {
  const track = plane.track ?? 0
  const index = Math.round(track / 15)
  const icon = planeIcons[index === 24 ? 0 : index] as L.Icon
  markerData.marker.setIcon(icon)
}

function updateTooltip(markerData: MarkerData, plane: any): void {
  markerData.tooltip.setContent(`${plane.callsign ?? plane.icaoId}`)
}

function updatePopup(markerData: MarkerData, plane: any): void {
  const content =
    `<pre>` +
    `ICAO          : ${plane.icaoId}<br>` +
    `Callsign      : ${plane.callsign}<br>` +
    `Latitude      : ${plane.latitude}<br>` +
    `Longitude     : ${plane.longitude}<br>` +
    `Altitude      : ${plane.altitude}<br>` +
    `Track         : ${plane.track}<br>` +
    `Ground Speed  : ${plane.groundSpeed}<br>` +
    `Vertical Rate : ${plane.verticalRate}<br>` +
    `</pre>`
  markerData.popup.setContent(content)
}

function rangeInclusive(start: number, end: number): number[] {
  return Array.from(rangeInclusiveGenerator(start, end))
}

function* rangeInclusiveGenerator(start: number, end: number): Iterable<number> {
  for (let i = start; i <= end; i++) yield i
}
