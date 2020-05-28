const { Response } = require('node-fetch')
const { fetchAndCache } = require('../helpers')
const cacheOnly = require('./cache-only')

function fastest(request, options) {
  return new Promise((resolve, reject) => {
    let rejected = false
    const reasons = []

    const maybeReject = reason => {
      reasons.push(reason.toString())
      if (rejected) {
        reject(new Error(`Both cache and network failed: "${reasons.join('", "')}"`))
      } else {
        rejected = true
      }
    }

    const maybeResolve = result => {
      if (result instanceof Response) {
        resolve(result)
      } else {
        maybeReject('No result returned')
      }
    }

    fetchAndCache(request.clone(), options).then(maybeResolve, maybeReject)

    cacheOnly(request, options).then(maybeResolve, maybeReject)
  })
}

module.exports = fastest
