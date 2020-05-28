const fetch = require('node-fetch')
const { Readable } = require('stream')
const EventEmitter = require('events')
const http = require('http')
const { Response, Headers, Request, fetchError } = fetch

var nodeFetch = require("node-fetch")


const { CacheStorage, cacheStorage } = require('./cachestorage/cacheStorage')
const { FetchEvent, wm } = require('./fetch-event')
const FormData = require('./formdata')
const Cache = require('./cachestorage/cache')
const strategies = require('./strategies/index')

search = new URLSearchParams([['name', 'value']])
new fetch.Request('https://httpbin.org/post', {
  body: search,
  method: 'post'
}).text().then(e=>console.log('e',e))

// require('./patch-response')



// https://github.com/bitinn/node-fetch/issues/517
// node-fetch haven't implemented Response.redirect
Response.redirect = ( location, status = 302 ) => new Response('', {
  headers: { location },
  status
})

class Server extends EventEmitter {
  constructor(port = 3000) {
    super()

    const requestHandler = (req, res) => {
      const evt = helpers.httpMessageToFetchEvent(req, res)
      this.emit('fetch', evt)
    }

    http.createServer(requestHandler).listen(port)
  }
}

module.exports = {
  Server,

  // AbortController,
  fetch,
  fetchError,
  FetchEvent,
  FormData,
  Headers,
  Request,
  Response,

  Cache,
  caches: cacheStorage,
  CacheStorage,

  cacheFirst: strategies.cacheFirst,
  cacheOnly: strategies.cacheOnly,
  fastest: strategies.fastest,
  networkFirst: strategies.networkFirst,
  networkOnly: strategies.networkOnly,
}
