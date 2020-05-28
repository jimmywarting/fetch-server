const { Request, Response } = require('node-fetch')
const map = new WeakMap()
const wm = o => map.get(o)

const requires = (i, args) => {
  if (args.length < i)
    throw new TypeError(`${i} argument required, but only ${args.length} present.`)
}

const isReq = req => req && req[Symbol.toStringTag] === 'Request'
const isRes = res => res && res[Symbol.toStringTag] === 'Response'

const sRemove = Symbol('remove')
const sOnce = Symbol('once')
const sResponse = Symbol('response')

class Cache {
  constructor(store) {
    map.set(this, store)
  }

  // Returns a Promise that resolves to the response associated
  // with the first matching request in the Cache object.
  match(req, opts) {
    return this.keys(req, opts || {}, null, sResponse, sOnce)
  }

  // Returns a Promise that resolves to an array
  // of all matching requests in the Cache object.
  async matchAll(req, opts) {
    return this.keys(req, opts || {}, null, sResponse).then(res => res[0])
  }

  // Takes a URL, retrieves it and adds the resulting response
  // object to the given cache. This is fuctionally equivalent
  // to calling fetch(), then using put() to add the results to the cache
  async add(request) {
    requires(1, arguments)
    return this.addAll([request])
  }

  // Takes an array of URLs, retrieves them, and adds the
  // resulting response objects to the given cache.
  async addAll(requests) {
    requires(1, arguments)

    let results = []

    for (let req of requests) {
      req = new Request(req)

      if (!/^((http|https):\/\/)/.test(req.url))
        throw new TypeError(`Add/AddAll does not support schemes other than "http" or "https"`)

      if (req.method !== 'GET')
        throw new TypeError(`Add/AddAll only supports the GET request method`)

      let clone = req.clone()

      await fetch(req).then(res => {
        if (res.status === 206)
          throw new TypeError('Partial response (status code 206) is unsupported')

        if (!res.ok)
          throw new TypeError('Request failed')

        results.push([req, res])
      })
    }

    await Promise.all(results.map(a => this.put(...a)))
  }


  /**
   * Takes both a request and its response and adds it to the given cache.
   *
   * @param  {Request|String}  req  [description]
   * @param  {Response}        res  [description]
   * @return {Promise}              [description]
   */
  async put(req, res) {
    requires(2, arguments)
    const store = wm(this)

    req = isReq(req) ? req : new Request(req)

    if (!/^((http|https):\/\/)/.test(req.url))
      throw new TypeError(`Request scheme '${req.url.split(':')[0]}' is unsupported`)

    if (req.method !== 'GET')
      throw new TypeError(`Request method '${req.method}' is unsupported`)

    if (res.status === 206)
      throw new TypeError('Partial response (status code 206) is unsupported')

    let varyHeaders = (res.headers.get('Vary') || '').split(',')

    if (varyHeaders.includes('*'))
      throw new TypeError('Vary header contains *')

    if (res.body != null)
      if (res.bodyUsed)
        throw new TypeError('Response body is already used')

    await store.put(req, res)
  }

  // Finds the Cache entry whose key is the request, and if found,
  // deletes the Cache entry and returns a Promise that resolves to true.
  // If no Cache entry is found, it returns false.
  async delete(request, options = {}) {
    requires(1, arguments)
    await this.keys(request, options, sRemove)
  }

  /**
   * Returns a Promise that resolves to an array of Cache keys.
   *
   * @param  {[type]}  request      [description]
   * @param  {Object}  [options={}] [description]
   * @return {Promise<[Request]>}   [description]
   */
  async keys(request, options = {}, _remove, _response, _once) {
    const store = wm(this)
    const result = []
    const { ignoreMethod = false, ignoreSearch = false } = options

    let searchString = ''
    let method = 'GET'

    // using new Request to normalize fragment and trailing slash
    if (request !== undefined) {
      const url = request.url.split('#')[0]
      method = request.method || 'GET'
      searchString = ignoreSearch ? url.split('?')[0] : url
      if (request.method !== 'GET' && !ignoreMethod) return result
    }

    for await (const entry of store) {
      if (request) {
        const test = ignoreSearch ? entry.url.split('?')[0] : entry.url
        if (searchString !== test) continue
      }

      _remove === sRemove
        ? await entry.del()
        : result.push(await _response === sResponse ? entry.val() : entry.key())

      if (_once === sOnce) return result[0]
    }

    return result
  }
}

module.exports = Cache
