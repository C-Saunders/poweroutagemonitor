const momentTz = require('moment-timezone').tz

require('dotenv').config()
const sendFrom = process.env.SEND_EMAIL_FROM
const recipients = process.env.RECIPIENTS
const mailgun = require('mailgun-js')({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN })

export {
  log,
  sendEmail,
  getFormattedDate
}

function log (message: String, error?: Error): void {
  if (error) {
    console.log(message, error)
  } else {
    console.log(message)
  }
}

function sendEmail ({ subject, text }: { subject: String, text: String }) {
  if (process.env.DEVELOPMENT === 'true') {
    return
  }

  const data = {
    from: `Outage Notifier <${sendFrom}>`,
    to: recipients,
    subject,
    text
  }

  mailgun.messages().send(data, (error: Error, body: Object) => {
    log(`Response from Mailgun: ${JSON.stringify(body)}`)
    if (error) {
      log(`Error response from Mailgun: ${JSON.stringify(error)}`)
    }
  })
}

function getFormattedDate (unixTimestamp: number) {
  return momentTz(unixTimestamp, 'America/New_York').format()
}
