import * as d3 from 'd3'

import { POWER_METER_URL } from './config'

type PowerEntry = {
  time: number
  frequency: number
  power: number
}

/* Declare the chart dimensions and margins */
const dimensions = { width: 1600, height: 900 }
const margin = { top: 0, right: 50, bottom: 50, left: 50 }
const width = dimensions.width - margin.left - margin.right
const height = dimensions.height - margin.top - margin.bottom

/* Create the SVG container */
const svg = d3
  .select('#container')
  .append('svg')
  .attr('width', dimensions.width)
  .attr('height', dimensions.height)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

/* Read the data from the server */
const data = (await d3.json(POWER_METER_URL)) as PowerEntry[]

/* Get the ranges for the data */
const minPower = d3.min(data, d => d.power) as number
const maxPower = d3.max(data, d => d.power) as number

const frequencies = [...new Set(data.map((entry: PowerEntry) => entry.frequency))].sort((a, b) => a - b)
const minFrequency = d3.min(frequencies) as number
const maxFrequency = d3.max(frequencies) as number

const seconds = [...new Set(data.map((entry: PowerEntry) => entry.time))].sort((a, b) => b - a)

/* Declare the x scale for frequency */
const xFreq = d3.scaleLinear<number>().range([0, width]).domain([minFrequency, maxFrequency])
svg
  .append('g')
  .style('font-size', 10)
  .attr('transform', 'translate(0,' + height + ')')
  .call(d3.axisBottom(xFreq).tickSize(5).ticks(40).tickFormat(d3.formatPrefix(',.1', 1e6)))
  .select('.domain')
  .remove()

/* Declare the y scale for seconds */
const ySeconds = d3.scaleBand<number>().range([0, height]).domain(seconds)
svg.append('g').style('font-size', 8).call(d3.axisLeft(ySeconds).tickSize(5)).select('.domain').remove()

/* Declare the color scale */
const colorScale = d3.scaleSequential().interpolator(d3.interpolateReds).domain([minPower, maxPower])

/* Draw the squares */
drawRectangles(data)

function drawRectangles(data: PowerEntry[]) {
  svg.selectAll('rect').remove()

  svg
    .selectAll()
    .data(data, d => d!.frequency + ':' + d!.time)
    .enter()
    .append('rect')
    .attr('x', d => xFreq(d.frequency))
    .attr('y', d => ySeconds(d.time) ?? 0)
    .attr('width', 10)
    .attr('height', ySeconds.bandwidth())
    .style('fill', d => colorScale(d.power))
    .style('opacity', 1)
}

setInterval(async () => {
  const data = (await d3.json(POWER_METER_URL)) as PowerEntry[]
  drawRectangles(data)
}, 1000)
