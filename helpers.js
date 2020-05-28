const { fetch } = require('node-fetch')
const globalOptions = require('./options')
const { def, successResponses } = globalOptions
const { FetchEvent, assignCallback } = require('./fetch-event')

function openCache(options = {}) {
  return Promise.resolve(Object.assign({}, def, options).cacheStorage)
}

async function fetchAndCache(request, options = {}) {
  options = Object.assign({ successResponses }, def, options)

  const successResponses = options.successResponses

  const response = await fetch(request.clone())
  // Only cache GET requests with successful responses.
  // Since this is not part of the promise chain, it will be done
  // asynchronously and will not block the response
  // from being returned to the page.
  if (request.method === 'GET' && successResponses.test(response.status)) {
    openCache(options).then(async cache => {
      await cache.put(request, response)
    })
  }

  return response.clone()
}

async function renameCache(source, destination) {
  await caches.delete(destination)

  const sourceCache = await caches.open(source)
  const destCache = await caches.open(destination)

  const requests = await sourceCache.keys()
  await Promise.all(requests.map(async request => {
    const response = await sourceCache.match(request)
    return destCache.put(request, response)
  }))

  await cache.delete(source)
}

async function cache(url, options) {
  const cache = openCache(options)
  return cache.add(url)
}

async function uncache(url, options) {
  const cache = await openCache(options)
  return cache.delete(url)
}

function isResponseFresh(response, maxAgeSeconds) {
  // If we don't have a response, then it's not fresh.
  if (!response) return false

  // Only bother checking the age of the response if maxAgeSeconds is set.
  if (maxAgeSeconds) {
    const date = response.headers.get('date')
    // If there's no Date: header, then fall through and return true.
    if (date) {
      // If the Date: header was invalid for some reason, Date + x
      // will return NaN, and the comparison will always be false. That means
      // that an invalid date will be treated as if the response is fresh.
      if (new Date(date) + maxAgeSeconds * 1000 < Date.now()) {
        // Only return false if all the other conditions are met.
        return false
      }
    }
  }

  // Fall back on returning true by default, to match the previous behavior in
  // which we never bothered checking to see whether the response was fresh.
  return true
}

function httpMessageToRequest(req, res) {
  const headers = Object.assign({}, req.headers)
  const method = req.method
  const body = req.method !== 'HEAD' && req.method !== 'GET' ? req : undefined
  const protocol = req.connection.encrypted ? 'https' : 'http'
  const request = new Request(protocol + '://' + headers.host + req.url, {
    headers,
    method,
    body
  })

  // Browser usually send this when reloading a page
  let control = req.headers.get('cache-control') || ''
  control = control.toLowerCase()

  request.referrer = headers.get('referrer') || headers.get('referer') || ''

  const evt = new FetchEvent('fetch', {
    request,
    isReload: control === 'max-age=0' || control === 'no-cache'
  })

  assignCallback(evt, response => {
    // map Fetch-Response to a node-response
    res.statusCode = response.status
    res.statusMessage = response.statusText

    for (const [key, val] of response.headers) {
      res.setHeader(key, val)
    }

    // Pipe Fetch-Response.body to node-response.body
    response.body.pipe(res)
  })
}

module.exports = {
  fetchAndCache,
  openCache,
  renameCache,
  cache,
  uncache,
  isResponseFresh,
  httpMessageToRequest
}
