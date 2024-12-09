const deviceSelect = document.getElementById('devices') as HTMLSelectElement
const temperatureElement = document.getElementById('temperature') as HTMLTableCellElement
const humidityElement = document.getElementById('humidity') as HTMLTableCellElement
const windElement = document.getElementById('wind') as HTMLTableCellElement
const rainfallElement = document.getElementById('rainfall') as HTMLTableCellElement

type WeatherData = {
  temperature?: number
  humidity?: number
  windSpeed?: number
  windDirection?: number
  rainfall?: number
}

async function loadModels(): Promise<void> {
  /* Get the list of devices from the server */
  const modelResponse = await fetch('http://localhost:8080/payload-sniffer/models')
  const devices = (await modelResponse.json()) as string[]

  /* Add the devices to the dropdown */
  for (const device of devices) {
    // add the option if it doesn't exist
    const option = deviceSelect.querySelector(`option[value="${device}"`)
    if (!option) {
      const option = document.createElement('option')
      option.value = device
      option.innerText = device
      deviceSelect.appendChild(option)
    }
  }
}

async function loadWeatherData(): Promise<WeatherData> {
  /* Get the selected device */
  const device = deviceSelect.value

  /* Get the latest payload from the server */
  const payloadResponse = await fetch(`http://localhost:8080/payload-sniffer/${device}`)
  const payload = await payloadResponse.json()

  /* Places for the data to go */
  let temperatures = []
  let humidities = []
  let windSpeeds = []
  let windDirections = []
  let rainfalls = []

  for (const item of payload) {
    /* Get the message type */
    const messageType = item.message_type

    /* If we have a temperature and humidity message */
    if (messageType === '56') {
      const temperature = Number(item.temperature_F)
      if (!Number.isNaN(temperature)) temperatures.push(temperature)

      const humidity = Number(item.humidity)
      if (!Number.isNaN(humidity)) humidities.push(humidity)
    }

    /* If we have a wind and rain message */
    if (messageType === '49') {
      const windSpeed = Number(item.wind_avg_km_h)
      if (!Number.isNaN(windSpeed)) windSpeeds.push(windSpeed)

      const windDirection = Number(item.wind_dir_deg)
      if (!Number.isNaN(windDirection)) windDirections.push(windDirection)

      const rainfall = Number(item.rain_in)
      if (!Number.isNaN(rainfall)) rainfalls.push(rainfall)
    }
  }

  /* Calculate the averages */
  const averageTemperature = temperatures.reduce((a, b) => a + b, 0) / temperatures.length
  const averageHumidity = humidities.reduce((a, b) => a + b, 0) / humidities.length
  const averageWindSpeed = windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length
  const averageWindDirection = windDirections.reduce((a, b) => a + b, 0) / windDirections.length
  const averageRainfall = rainfalls.reduce((a, b) => a + b, 0) / rainfalls.length

  /* The weather data */
  const weatherData: WeatherData = {}
  if (!Number.isNaN(averageTemperature)) weatherData.temperature = averageTemperature
  if (!Number.isNaN(averageHumidity)) weatherData.humidity = averageHumidity
  if (!Number.isNaN(averageWindSpeed)) weatherData.windSpeed = averageWindSpeed * 0.6213712
  if (!Number.isNaN(averageWindDirection)) weatherData.windDirection = averageWindDirection
  if (!Number.isNaN(averageRainfall)) weatherData.rainfall = averageRainfall

  return weatherData
}

async function updateWeather(weatherData: WeatherData) {
  console.log(weatherData)
  if (weatherData.temperature !== undefined) temperatureElement.innerText = `${weatherData.temperature.toFixed(0)} °F`
  if (weatherData.humidity !== undefined) humidityElement.innerText = `${weatherData.humidity.toFixed(0)}%`
  if (weatherData.windSpeed !== undefined)
    windElement.innerText = `${weatherData.windSpeed.toFixed(0)} mph ${convertWindDirectionToText(weatherData.windDirection)}`
  if (weatherData.rainfall !== undefined) rainfallElement.innerText = `${weatherData.rainfall.toFixed(2)} in`
}

function convertWindDirectionToText(degrees?: number): string {
  if (degrees === undefined) return ''

  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW'
  ]

  return directions[Math.round(degrees / 22.5) % 16] ?? ''
}

const _handle = setInterval(async () => {
  /* Load any new models we've found */
  loadModels()

  /* if a model is selected, update the weather */
  if (deviceSelect.value) {
    const weatherData = await loadWeatherData()
    updateWeather(weatherData)
  }
}, 1000)
