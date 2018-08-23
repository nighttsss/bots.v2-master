"use strict";
const commander = require('commander')
const request = require('request')
const fs = require('fs')
global.get = 0;

commander.unknownOption = function() {
    return
}

commander
    .version('1.0.1')
    .option('-H, --http', 'Scrapes HTTP(s) proxies')
    .option('-s, --sock', 'Scrapes SOCKS5 proxies')
    .option('-a, --all', 'Scrapes all proxy types')
    .option('-p, --page <n>', 'Number of pages to scrape default: 3')
    .option('-o, --output <n>', 'The file to dump proxies too')
    .option('-r, --remove', 'Don\'t remove the old proxy file')
    .option('-h, --showHelp', 'Shows help')
    .parse(process.argv)

if (commander.showHelp) commander.help()

var scraper = {

    pages: 15,
    outFile: commander.output || 'proxy.txt',

    proxySites: [],

    parseLink: function(body) {

        body.replace(/<a class='timestamp-link' href='http:\/\/.*.html/g, function(text) {
            text = text.replace("<a class='timestamp-link' href='", '')
            scraper.requestSite(text, scraper.parseProxies)
        })
    },

    requestSite: function(site, cb) {
        request(site, function(error, response, body) {
            if (!error && response.statusCode != 200) return false
            cb(body)
        })
    },
    loadLinks: function(callback) {
        for (var i = 0; i < scraper.proxySites.length; i++) {
            scraper.requestSite(scraper.proxySites[i], scraper.parseLink)
        }

    },
    parseProxies: function(body) {
        body = body.match(/\d{1,3}([.])\d{1,3}([.])\d{1,3}([.])\d{1,3}((:)|(\s)+)\d{1,8}/g) || [] //proxy regex
        for (var i = 0; i < body.length; i++) {
            if (body[i].match(/\d{1,3}([.])\d{1,3}([.])\d{1,3}([.])\d{1,3}(\s)+\d{1,8}/g)) { //clean whitespace
                body[i] = body[i].replace(/(\s)+/, ':') //clean whitespace
            }
        }
        fs.appendFileSync(scraper.outFile, body.join('\n') + '\r\n')
        global.get += body.length;
        
    }
}

scraper.proxySites = [
    'http://www.socks24.org//search?max-results=' + scraper.pages,
    'http://www.vipsocks24.net//search?max-results=' + scraper.pages,
    'http://www.live-socks.net//search?max-results=' + scraper.pages,
    'http://socksproxylist24.blogspot.com/search?max-results=' + scraper.pages,

    'http://newfreshproxies-24.blogspot.com//search?max-results=' + scraper.pages,
    'https://proxylistdaily4you.blogspot.com//search?max-results=' + scraper.pages,
    'http://topproxys.blogspot.com/search?max-results=' + scraper.pages,
    'http://incloak-free-proxy-lists.blogspot.com'
]

if (!commander.remove) try {
    fs.unlinkSync(scraper.outFile)
} catch (e) {}

scraper.loadLinks();