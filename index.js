const http = require('http')
require('dotenv').config()
const sendFrom = process.env.SEND_EMAIL_FROM
const recipients = process.env.RECIPIENTS
const api_key = process.env.MAILGUN_API_KEY
const mailgunDomain = process.env.MAILGUN_DOMAIN
const mailgun = require('mailgun-js')({ apiKey: api_key, domain: mailgunDomain })

const log = console.log
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

const sendEmail = ({subject, text}) => {
  const data = {
    from: `Outage Notifier <${sendFrom}>`,
    to: recipients,
    subject,
    text
  }

  mailgun.messages().send(data, (error, body) => {
    log(`Response from Mailgun: ${JSON.stringify(body)}`)
    if (error) {
      log(`Error response from Mailgun: ${JSON.stringify(error)}`)
    }
  })
}

const sendDownAlert = () => {
  const message = `Outage! Last heartbeat: ${lastHeartbeat.toUTCString()}`
  log(message)
  sendEmail({
    subject: 'Outage Detected',
    text: message
  })
}

const sendUpAlert = () => {
  const message = `Recovery detected at ${new Date().toUTCString()}. Downtime: ${(Date.now() - lastHeartbeatBeforeOutage.getTime()) / 1e3} minutes`
  log(message)
  sendEmail({
    subject: 'Outage Recovery',
    text: message
  })
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
