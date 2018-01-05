const momentTz = require('moment-timezone').tz

require('dotenv').config()
const sendFrom = process.env.SEND_EMAIL_FROM
const recipients = process.env.RECIPIENTS
const mailgun = require('mailgun-js')({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN })

module.exports = {
  log,
  sendEmail,
  getFormattedDate
}

function log (message) {
  console.log(message)
}

function sendEmail ({ subject, text }) {
  if (process.env.DEVELOPMENT) {
    return
  }

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

function getFormattedDate (unixTimestamp) {
  return momentTz(unixTimestamp, 'America/New_York').format()
}
