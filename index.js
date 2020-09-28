require("dotenv").config();
const dgram = require("dgram");

const Push = require("pushover-notifications");
const { DateTime } = require("luxon");

if (!("PUSHOVER_USER" in process.env) || !("PUSHOVER_TOKEN" in process.env)) {
    console.log("PUSHOVER_TOKEN or PUSHOVER_USER is missing");
    process.exit(1);
}

if (!("DEVICES" in process.env)) {
    console.log("No DEVICES are specified");
    process.exit(1);
}

const devices = {};
const pushover = new Push({
    user: process.env.PUSHOVER_USER,
    token: process.env.PUSHOVER_TOKEN,
});

for (let definition_str of process.env.DEVICES.split("|")) {
    const definition = definition_str.split(";");

    devices[definition[0]] = {
        name: (definition.length > 1) ? definition[1] : definition[0],
        lastReport: null,
    };
}

const timeoutSeconds = ("TIMEOUT" in process.env) ? process.env.TIMEOUT : 3 * 60; // 3 minute default timeout
const bindPort = ("PORT" in process.env) ? process.env.PORT : 30000;

const v4socket = dgram.createSocket({
    type: "udp4",
    reuseAddr: true,
});
v4socket.bind(bindPort, () => {
    console.log(`IPv4 Socket is bound to ${v4socket.address().address}:${v4socket.address().port}`);
});

const v6socket = dgram.createSocket({
    type: "udp6",
    reuseAddr: true,
});
v6socket.bind(bindPort, () => {
    console.log(`IPv6 Socket is bound to ${v6socket.address().address}:${v6socket.address().port}`);
});

v4socket.on("message", messageHandler);
v6socket.on("message", messageHandler);

function messageHandler(msg, rinfo) {
    let deviceName = msg.toString("ascii").trim();

    if (!(deviceName in devices)) return;

    let device = devices[deviceName];

    if (device.lastReport == null) {
        pushover.send({
            message: `${device.name} came online.`
        });
        console.log(`${device.name} (${deviceName}) came online.`);
    }

    device.lastReport = DateTime.local();
}

setInterval(() => {
    for (let deviceName in devices) {
        const device = devices[deviceName];

        if (device.lastReport == null) continue;

        if (Math.abs(device.lastReport.diffNow().as("seconds")) >= timeoutSeconds) {
            pushover.send({
                message: `${device.name} is offline.`
            });
            console.log(`${device.name} (${deviceName}) is offline.`);
            device.lastReport = null;
        }
    }
}, 10000); // check for offline devices every 10 seconds