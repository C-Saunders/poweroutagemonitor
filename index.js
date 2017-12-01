const http = require('http')
const port = 3000

const alertAfter = 10e3
const checkInterval = 2e3

let lastHeartbeat = new Date()
let haveAlerted = false

const requestHandler = (request, response) => {
  lastHeartbeat = new Date()
  response.end('OK')
}

const server = http.createServer(requestHandler)

const sendDownAlert = () => console.log(`Outage! Last heartbeat: ${lastHeartbeat.toISOString()}`)
const sendUpAlert = () => console.log(`Recovery detected at ${new Date().toISOString()}`)

const doStatusCheck = () => {
  const timeSinceLastHeartBeat = new Date() - lastHeartbeat

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
