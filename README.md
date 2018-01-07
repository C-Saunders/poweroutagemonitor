This is the server for a simple, cheap, two-part power outage monitoring system. This was originally created to monitor the power outlet my freezer is plugged into, so if there is a loss of power, we'll know about it and how long the power was out for when it comes back.

The basic idea is:
* The server (the code in this repo) is running, probably using a cloud service such as AWS, GCP, Azure, IBM cloud, etc.
  * The server should be independent from the power and Internet of the area you want to monitor
* You make requests to the server ("heartbeats") from a device plugged into the power outlet you want to monitor to tell the server everything is still working as expected
  * I used a Raspberry Pi that runs `curl` in a cron job every one minute
  * `* * * * * curl <URL of the server here>`
* If the sever hasn't gotten a "heartbeat" (received an HTTP request) in a long enough period, it sends an email using the MailGun API
* When heartbeats are received again, the server will see this, and alert again with the calculated approximate downtime
