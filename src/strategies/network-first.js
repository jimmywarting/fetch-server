const { def, successResponses } = require('../options')
const globalOptions = require('../options')
const helpers = require('../helpers')

async function networkFirst(request, options = {}) {
  options = Object.assign({}, def, options)
  let originalResponse

  return helpers.fetchAndCache(request, options).then(response => {
    if (successResponses.test(response.status)) return response

    originalResponse = response
    throw new Error('Bad response')
  }).catch(async error => {
    const cache = await helpers.openCache(options)
    const response = await cache.match(request, options)

    if (response || originalResponse)
    return response || originalResponse

    throw error
  })
}

module.exports = networkFirst
