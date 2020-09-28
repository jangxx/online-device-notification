# Online Device Notification Server
Get a Pushover notification if a server (or other device) does not report in for a set time.

## Environment Variables

```
PUSHOVER_TOKEN="<pushover app token>"
PUSHOVER_USER="<pushover user id>"

DEVICES="<devices specification>"
TIMEOUT=180 // seconds
PORT=30000
```

The devices specification has the format: 

    device1[;Device 1 Pretty Name]|device2[;Device 2 Pretty Name]|...

i.e. the properties of the device are separated with `;` (semicolon) and the different devices are separated with `|` (pipe).

## Reporting In

Simply send a UDP packet containing the device key to the server. Example:

    echo "device1" | nc -u localhost 30000