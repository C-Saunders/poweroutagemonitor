import * as http from 'http'
import { log, sendEmail, getFormattedDate } from './helpers'

const port = 8080
const alertAfter = 120e3
const checkInterval = 30e3
const millisecondsPerMinute = 60e3

let lastHeartbeat = Date.now()
let lastHeartbeatBeforeOutage: number
let isDown = false

function sendDownAlert (): void {
  const message = `Outage! Last heartbeat: ${getFormattedDate(lastHeartbeat)}`
  log(message)
  sendEmail({
    subject: 'Outage Detected',
    text: message
  })
}

function sendUpAlert (): void {
  const downtime = (Date.now() - lastHeartbeatBeforeOutage) / millisecondsPerMinute
  const message = `Recovery detected at ${getFormattedDate(Date.now())}. Approximate downtime: ${Math.round(downtime)} minutes`
  log(message)
  sendEmail({
    subject: 'Outage Recovery',
    text: message
  })
}

function doStatusCheck (): void {
  const timeSinceLastHeartBeat = Date.now() - lastHeartbeat

  if (timeSinceLastHeartBeat > alertAfter && !isDown) {
    lastHeartbeatBeforeOutage = lastHeartbeat
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
      lastHeartbeat = Date.now()
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
