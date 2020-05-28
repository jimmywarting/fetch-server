const { sep } = require('path')
const fs = require('fs-extra')
const fs2 = require('fs-extra').promises

const Cache = require('./cache')
const MemStorage = require('./memstore')

const requires = (i, args) => {
  if (args.length < i)
    throw new TypeError(`${i} argument required, but only ${args.length} present.`)
}

class CacheStorage {
  constructor(store) {
    // TODO:
    // Probably going to open up for construction and
    // custom storage layers later
    //
    // But for now this is a MVP (Minimum Viable Product)
    if (store !== MemStorage)
      throw new TypeError('Illegal constructor')
  }

  /**
   * [delete description]
   *
   * @return {[type]} [description]
   */
  delete(cacheName) {
    return MemStorage.store.delete(cacheName)
  }

  /**
   * [has description]
   * @return {Boolean} [description]
   */
  async has(cacheName) {
    return MemStorage.store.has(cacheName)
  }

  /**
   * resolves with an array containing strings corresponding to all of the named
   * Cache objects tracked by the CacheStorage.
   * Use this method to iterate over a list of all the Cache objects.
   *
   * @return <Promise>Array keyList
   */
  async keys() {
    return [...MemStorage.store.keys()]
  }

  /**
   * Checks if a given Request is a key in any of the Cache objects
   * that the CacheStorage object tracks and returns a Promise that
   * resolves to that match.
   *
   * @return Promise
   */
  async match(...args) {
    let keys = await this.keys()

    for (let key of keys) {
      let cache = await this.open(key)
      let result = await cache.match(...args)
      if (result) return result
    }
  }


  /**
   * Resolves to the Cache object matching the cacheName
   * (a new cache is created if it doesn't exist.)
   *
   * @return {[type]} [description]
   */
  async open(cacheName) {
    requires(1, arguments)
    return new Cache(new MemStorage(cacheName))
  }
}

CacheStorage[Symbol.toStringTag] = CacheStorage

module.exports = {
  CacheStorage,
  cacheStorage: new CacheStorage(MemStorage)
}
