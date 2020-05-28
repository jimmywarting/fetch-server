const store = new Map

class MemStorage {
  constructor(storeName) {
    let storage = store.get(storeName)
    if (!storage) store.set(storeName, storage = [])

    this._storeage = storage
    this._storeageName = storeName
  }

  async put(req, res) {
    this._storeage.push({
      url: req.url,
      key: () => req.clone(),
      val: () => res.clone(),
      del: () => {}
    })
  }

  async * [Symbol.asyncIterator] () {
    yield* this._storeage
  }
}

MemStorage.store = store

module.exports = MemStorage
