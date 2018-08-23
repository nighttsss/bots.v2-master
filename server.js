process.on('uncaughtException', function (err) {})
var express = require("express"),
    app = express();
var path = require("path");
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var HttpAgent = require('https-proxy-agent');
var Socks = require('socks');
var WebSocket = require("ws");
var proxies = fs.readFileSync('http.txt').toString().split("\n");
var proxiesSocks = fs.readFileSync('socks.txt').toString().split("\n");

var agents = [];
var bots = [];

function resetAll() {

    agents = [];
    bots = [];

    for (var j = 0; j < proxies.length; j++) {

        agents.push(new HttpAgent("http://" + proxies[j]))
    }

    for (var s = 0; s < proxiesSocks.length; s++) {
        var so = proxiesSocks[s].split(":");
        agents.push(new Socks.Agent({
            proxy: {
                ipaddress: so[0],
                port: so[1],
                type: 5
            }
        }))
    }
}

resetAll();

var client = {

    server: "",
    botId: false,
    botName: "scaryYT",
    rageMode: false,
    randomSkin: true,
    randomName: true,
    skins: [

        "pika",
        "gfm",
        "wuf",
        "EVIL",
        "savage",
        "doge",
        "vip"
    ]
}

function getRandomSkin() {

    var skin = client.skins[Math.floor(Math.random() * client.skins.length)];

    return "[" + skin + "]";
}

class bot {

    constructor(agent) {

        this.id = Math.floor(Math.random() * agents.length);
        this.agent = agent;
    }

    connect(ip) {

        var me = this;

        if (this.ws && this.ws.readyState == WebSocket.OPEN) this.ws.close();

        this.server = ip;
        this.reconnectCounter = 0;

        this.ws = new WebSocket(ip, {
            headers: {
                "Accept-Encoding": "gzip, deflate",
                "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
                "Cache-Control": "no-cache",
                "Origin": "http://cellcraft.io",
                "Pragma": "no-cache",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36"
            },
            agent: this.agent
        });
        this.binaryType = "arraybuffer";

        this.ws.onopen = () => {

            me.send(new Buffer([254, 5, 0, 0, 0]));
            me.send(new Buffer([255, 50, 137, 112, 79]));
            me.send(new Buffer([42]));
            me.send(new Buffer([90, 51, 24, 34, 131]));

            me.spawn();

            setInterval(() => {

                me.send(new Buffer([90, 51, 24, 34, 131]));

            }, 2750);

            setInterval(() => {

                me.send(new Buffer([42]));
                me.spawn();

            }, 1750 * 2);
        }

        this.ws.onmessage = (e) => {

            var p = new Uint8Array(e.data);

            switch (p[0]) {

                case 20:

                    if (client.rageMode) {
                        me.split();
                        me.split();
                    }
                    break;
            }
        }

        this.ws.onclose = (e) => {

            var me = this;

            setTimeout(() => {

                me.connect(me.server);
            }, 1600)
        }

        this.ws.onerror = () => {

        }
    }

    spawn() {

        this.send(new Uint8Array([42]));

        var arr = [0, 59, 0];

        var name = client.botName;
        if (client.randomSkin) name = getRandomSkin() + name;


        if (client.botId) name += "|" + this.id;

        for (var i = 0; i < name.length; i++) {


            arr.push(name.charCodeAt(i));
            arr.push(0);

        }

        this.send(new Uint8Array(arr));
    }

    moveTo(x, y, ai) {

        var rx = Math.floor(Math.random() * 10000);
        var ry = Math.floor(Math.random() * 20000);

        if(ai) x = rx, y = ry

        var buf = new Buffer(13);
        buf.writeUInt8(16, 0);
        buf.writeInt32LE(x, 1);
        buf.writeInt32LE(y, 5);
        buf.writeUInt32LE(0, 9);

        this.send(buf);
    }

    split() {

        this.send(new Uint8Array([17]))
    }

    send(data) {

        if (data[0] == 90) return
        if (!this.ws || this.ws && this.ws.readyState !== WebSocket.OPEN) return

        this.ws.send(data);
    }

    chat(txt) {


        var arr = [99, 0];

        var name = txt;

        for (var i = 0; i < name.length; i++) {
            arr.push(name.charCodeAt(i));
            arr.push(0);
        }

        this.send(new Uint8Array(arr));
    }
}

function startBots(server) {

    resetAll();

    console.log("Starting bots... server: %s", server)

    var i = 0;

    setInterval(() => {

        bots.push(new bot(agents[Math.floor(Math.random() * agents.length)]));
        bots[i].connect(server);

        if (i < agents.length * 2) i++;
    }, 5)

}
var moveCounter = 0;

io.on('connection', function (socket) {

    socket.on('data', (e) => {

        if (client.server != e.server) {
            startBots(e.server);
        }

        client.server = e.server;
        global.working = 0;

        if (bots) {
            for (var i in bots) {

                if (bots[i].ws && bots[i].ws.readyState == WebSocket.OPEN) {

                    bots[i].moveTo(e.x, e.y, e.ai);
                    global.working++;
                }

            }
        }

        process.stdout.write('\x1B[2J\x1B[0f');

        io.emit('info', 'bots', global.working);
        console.log("SERVER [%s] \nBOTS [%s]", client.server, global.working)
        console.log("\nPROXIES:\nHTTP [%s] \nSOCKS [%s]", proxies.length, proxiesSocks.length);
    })

    socket.on('action', (e, data) => {

        switch (e) {
            case 'botid':

                client.botId = data;
                break;

            case 'rage':

                client.rageMode = data;
                break;

            case 'skin':
                client.randomSkin = data;
                break;

            case 'split':

                for (var i in bots) bots[i].split();
                break;

            case 'name':

                client.botName = data;
                break;

            case 'spawn':

                if (data == "force") {

                    for (var i in bots) bots[i].spawn();
                }
                break;
        }
    });
});

http.listen(1000, () => {
    console.log("Welcome! Bots by l3mpik");
});