const { cacheStorage } = require('./cachestorage/cacheStorage')

module.exports = {
  def: {
    storage: cacheStorage.open('$$$node-fetch-cache$$$'),
    maxAgeSeconds: null,
    maxEntries: null,
    queryOptions: null,
    ignoreSearch: false,
    ignoreMethod: false,
  },
  preCacheItems: [],
  // A regular expression to apply to HTTP response codes. Codes that match
  // will be considered successes, while others will not, and will not be
  // cached.
  successResponses: /^0|([123]\d\d)|(40[14567])|410$/
}
