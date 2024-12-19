import { PACKET_WATCHER_URL } from './config'

const handle = setInterval(async () => {
  /* Get the table body */
  const table = document.querySelector('#packets')
  if (!table) return

  /* Get the packets from the server */
  const response = await fetch(PACKET_WATCHER_URL)
  const packets = await response.json()

  /* If there are no packets, return */
  if (packets.length === 0) {
    console.log('No packets found')
    return
  }

  /* Remove the body of the table */
  table.innerHTML = ''

  /* Add the packets to the table */
  for (const packet of packets) {
    /* Create a new row */
    const row = document.createElement('tr')
    row.classList.add('even:bg-redis-light-gray')

    /* Add the date */
    const date = document.createElement('td')
    date.classList.add('text-nowrap', 'pr-8', 'py-2')
    date.textContent = packet.date
    row.appendChild(date)

    /* Add the destination */
    const destination = document.createElement('td')
    destination.classList.add('text-left', 'text-nowrap', 'pr-8', 'py-2')
    destination.textContent = packet.destination
    row.appendChild(destination)

    /* Add the source */
    const source = document.createElement('td')
    source.classList.add('text-left', 'text-nowrap', 'pr-8', 'py-2')
    source.textContent = packet.source
    row.appendChild(source)

    /* Add the digipeaters */
    const digipeaters = document.createElement('td')
    digipeaters.classList.add('text-left', 'text-nowrap', 'pr-8', 'py-2')
    digipeaters.textContent = packet.digipeaters.join(',')
    row.appendChild(digipeaters)

    /* Add the information */
    const information = document.createElement('td')
    information.classList.add('text-left', 'text-wrap')
    information.textContent = packet.information.ascii
    row.appendChild(information)

    /* Add the row to the table */
    table.appendChild(row)
  }
}, 1000)
