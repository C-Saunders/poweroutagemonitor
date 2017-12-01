const http = require('http')
const port = 3000

const alertAfter = 10e3
const checkInterval = 2e3

let lastHeartbeat = new Date()
let lastHeartbeatBeforeOutage
let haveAlerted = false

const requestHandler = (request, response) => {
  lastHeartbeat = new Date()
  response.end('OK')
}

const server = http.createServer(requestHandler)

const sendDownAlert = () => console.log(`Outage! Last heartbeat: ${lastHeartbeat.toUTCString()}`)
const sendUpAlert = () => {
  console.log(`Recovery detected at ${new Date().toUTCString()}. Downtime: ${(Date.now() - lastHeartbeatBeforeOutage.getTime()) / 1e3} minutes`)
}

const doStatusCheck = () => {
  const timeSinceLastHeartBeat = new Date() - lastHeartbeat
  lastHeartbeatBeforeOutage = lastHeartbeat

  if (timeSinceLastHeartBeat > alertAfter && !haveAlerted) {
    sendDownAlert()
    haveAlerted = true
  } else if (timeSinceLastHeartBeat <= alertAfter) {
    if (haveAlerted) {
      sendUpAlert()
    }

    haveAlerted = false
  }
}

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})

setInterval(doStatusCheck, checkInterval)
