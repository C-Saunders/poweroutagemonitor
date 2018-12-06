import * as http from 'http'
import {
  log,
  sendEmail,
  getHeartbeatMessage,
  isDevelopment
} from './helpers'

const port = 8080
const alertAfter = isDevelopment() ? 10e3 : 120e3
const checkInterval = isDevelopment() ? 1e3 : 30e3
const millisecondsPerMinute = 60e3
const UNKNOWN_IP = 'UNKNOWN IP'

interface Heartbeat {
  ip: String,
  time: number
}

export {
  Heartbeat
}

let lastHeartbeat: Heartbeat = {
  ip: UNKNOWN_IP,
  time: Date.now()
}
let lastHeartbeatBeforeOutage: Heartbeat
let isDown = false

function sendDownAlert (): void {
  const message = `Outage - last heartbeat: ${getHeartbeatMessage(lastHeartbeat)}`
  log(message)
  sendEmail({
    subject: 'Outage Detected',
    text: message
  })
}

function sendUpAlert (): void {
  const downtime = (Date.now() - lastHeartbeatBeforeOutage.time) / millisecondsPerMinute
  const message = `Recovery detected. Heartbeat at ${getHeartbeatMessage(lastHeartbeat)}.\n\nApproximate downtime: ${Math.round(downtime)} minutes.`
  log(message)
  sendEmail({
    subject: 'Outage Recovery',
    text: message
  })
}

function doStatusCheck (): void {
  const timeSinceLastHeartBeat = Date.now() - lastHeartbeat.time

  if (timeSinceLastHeartBeat > alertAfter && !isDown) {
    lastHeartbeatBeforeOutage = Object.assign({}, lastHeartbeat)
    sendDownAlert()
    isDown = true
  } else if (timeSinceLastHeartBeat <= alertAfter) {
    if (isDown) {
      sendUpAlert()
    }

    isDown = false
  }
}

function requestHandler (request: http.IncomingMessage, response: http.ServerResponse): void {
  switch (request.url) {
    case '/heartbeat':
      lastHeartbeat = {
        ip: request.connection.remoteAddress || UNKNOWN_IP,
        time: Date.now()
      }
      response.end('OK')
      break
    case '/status':
      response.end(isDown ? 'DOWN' : 'UP')
      break
    case '/robots.txt':
      response.end('User-agent: *\nDisallow: /')
      break
    default:
      response.statusCode = 404
      response.end('PAGE NOT FOUND')
  }
}

const server = http.createServer(requestHandler)

server.listen(port, (err: Error) => {
  if (err) {
    return log('something bad happened', err)
  }

  log(`server is listening on ${port}`)
})

setInterval(doStatusCheck, checkInterval)
