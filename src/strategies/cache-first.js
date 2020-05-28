const cacheOnly = require('./cache-only')
const { def } = require('../options')
const { openCache } = require('../helpers')

async function cacheFirst(request, options = {}) {
  response = await cacheOnly(request, options)

  if (helpers.isResponseFresh(response, options.maxAgeSeconds)) {
    return response
  }

  return helpers.fetchAndCache(request, options)
}

module.exports = cacheFirst
