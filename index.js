const http = require('http')
const { log, sendEmail, getFormattedDate } = require('./helpers')

const port = 8080
const alertAfter = 120e3
const checkInterval = 30e3
const millisecondsPerMinute = 60e3

let lastHeartbeat = Date.now()
let lastHeartbeatBeforeOutage
let isDown = false

const requestHandler = (request, response) => {
  switch (request.url) {
    case '/':
      lastHeartbeat = Date.now()
      response.end('OK')
      break;
    case '/status':
      response.end(isDown ? 'DOWN' : 'UP')
      break;
    default:
      response.statusCode = 404
      response.end('PAGE NOT FOUND')
  }
}

const sendDownAlert = () => {
  const message = `Outage! Last heartbeat: ${getFormattedDate(lastHeartbeat)}`
  log(message)
  sendEmail({
    subject: 'Outage Detected',
    text: message
  })
}

const sendUpAlert = () => {
  const downtime = (Date.now() - lastHeartbeatBeforeOutage) / millisecondsPerMinute
  const message = `Recovery detected at ${getFormattedDate(Date.now())}. Approximate downtime: ${Math.round(downtime)} minutes`
  log(message)
  sendEmail({
    subject: 'Outage Recovery',
    text: message
  })
}

const doStatusCheck = () => {
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

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return log('something bad happened', err)
  }

  log(`server is listening on ${port}`)
})

setInterval(doStatusCheck, checkInterval)
