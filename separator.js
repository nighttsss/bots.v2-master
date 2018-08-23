/**
 * Thanks Mr. Sonik Masta for help :D
 */

console.log("Reading proxies...")
const HttpsProxyAgent = require('https-proxy-agent');
const WebSocket = require('ws');
const SOCKS = require('socks');
const fs = require('fs');

fs.writeFile('/http.txt', '', function(){});
fs.writeFile('/socks.txt', '', function(){});

let proxies = fs.readFileSync('proxy.txt').toString().split('\n').filter((item, pos, self) => {
    return self.indexOf(item) == pos;
});

let workingSocksProxies = 0;
let workingHTTPProxies = 0;
let workingBots = 0;

global.url = "ws://104.207.132.60:4041/";
global.headers = {
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    "Origin": "http://cellcraft.io",
    "Pragma": "no-cache",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36"
}
class ProxyChecker {
    constructor(proxy) {
        
        if(proxy == undefined) process.exit();

        this.proxy = proxy.toString();

        this.socksWebSocket = null;
        this.httpWebSocket = null;

        this.isClosed = false;
    }

    checkProxy() {
        if (!this.proxy || this.proxy == "") return;
        let proxyInfo = this.proxy.split(':');

        var me = this;

        this.socksWebSocket = new WebSocket(global.url, {
            agent: new SOCKS.Agent({
                proxy: {
                    ipaddress: proxyInfo[0],
                    port: proxyInfo[1],
                    type: 5
                }
            }),
            headers: global.headers,
            timeout: 5000
        });

        this.httpWebSocket = new WebSocket(global.url, {
            agent: new HttpsProxyAgent(`http://${this.proxy}`),
            headers: global.headers,
            timeout: 5000
        });

        this.socksWebSocket.onopen = () => {
            workingSocksProxies++;
            fs.appendFile('socks.txt', `${this.proxy}\n`, err => {});
        };

        this.httpWebSocket.onopen = () => {
            workingHTTPProxies++;
            fs.appendFile('http.txt', `${this.proxy}\n`, err => {});

            this.httpWebSocket.close();
        };

        this.socksWebSocket.onclose = this.setClosed.bind(this);
        this.socksWebSocket.onerror = this.setClosed.bind(this);
        this.httpWebSocket.onclose = this.setClosed.bind(this);
        this.httpWebSocket.onerror = this.setClosed.bind(this);
    }

    setClosed() {
        this.isClosed = true;
    }

}

let checkerInstances = [];
let i = 0;
setInterval(() => {
    checkerInstances.push(new ProxyChecker(proxies[i]));
    checkerInstances[i].checkProxy();
    i++;
    if (i == proxies.length) clearInterval(this);
}, 20);

setInterval(() => {

    process.stdout.write('\x1B[2J\x1B[0f');
    console.log(`Bots: ${workingBots} HTTP: ${workingHTTPProxies} SOCKS: ${workingSocksProxies} WORKING PROXIES: ${workingHTTPProxies + workingSocksProxies} working of ${checkerInstances.length} / ${proxies.length}`);
}, 1000);