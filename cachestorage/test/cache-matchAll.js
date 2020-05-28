var fetch = require('node-fetch')
var {Readable} = require('stream')
var Cache = require('../cache')
var caches = require('../caches')
var {Request, Response} = fetch

describe('cache-delete', () => {
  beforeEach(() => caches.delete('v1'))

  it('', async () => {
  })
})
