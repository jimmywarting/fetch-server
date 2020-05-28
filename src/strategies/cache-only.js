const { def } = require('../options')
const { openCache, isResponseFresh } = require('../helpers')

async function cacheOnly(request, options = {}) {
  options = Object.assign({}, def, options)

  const cache = await openCache(options.name)
  const response = await cache.match(request, options)

  if (isResponseFresh(response, options.maxAgeSeconds)) {
    return response
  }

  return
}

module.exports = cacheOnly
