import * as d3 from 'd3'

type PowerEntry = {
  freq: number
  power: number
}

// Declare the chart dimensions and margins.
const width = 1800
const height = 900
const marginTop = 20
const marginRight = 100
const marginBottom = 30
const marginLeft = 100

// Declare the x (horizontal position) scale.
const x = d3.scaleLinear().range([marginLeft, width - marginRight])

// Declare the y (vertical position) scale.
const y = d3.scaleLinear().range([height - marginBottom, marginTop])

// Create the SVG container.
const svg = d3.select('#container').append('svg').attr('width', width).attr('height', height)

// Define the x and y domains.
// @ts-ignore
x.domain([88000000, 108000000])
y.domain([0, 25])

// Add the x-axis.
const xAxis = d3
  .axisBottom<number>(x)
  .ticks(40)
  .tickSize(-height + marginTop + marginBottom)
  .tickFormat((d: number, i: number) => (i % 2 === 0 ? `${d / 1000000} MHz` : ''))

svg
  .append('g')
  .attr('transform', `translate(0,${height - marginBottom})`)
  .call(xAxis)

// Add the y-axis.
const yAxis = d3
  .axisLeft<number>(y)
  .ticks(5)
  .tickFormat((d: number) => (d === 0 ? '' : `${d} dBm`))
svg.append('g').attr('transform', `translate(${marginLeft},0)`).call(yAxis)

// Create the line generator.
const line = d3
  .line<PowerEntry>()
  .x(d => x(d.freq))
  .y(d => y(d.power))

setInterval(async () => {
  const data = await fetch('http://localhost:8080/power-meter')
  const json: PowerEntry[] = await data.json()
  const powerData = json.map(entry => ({ freq: entry.freq, power: Math.max(entry.power, 0) }))

  svg.selectAll('#power-line').remove()

  svg
    .append('path')
    .datum(powerData)
    .attr('id', 'power-line')
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 3)
    .attr('d', line)
}, 1000)
