const { hrtime } = process

function getNanoSeconds() {
  const hr = hrtime()
  return (hr[0] * 1e9) + hr[1]
}

const moduleLoadTime = getNanoSeconds()
const upTime = process.uptime() * 1e9
const nodeLoadTime = moduleLoadTime - upTime
const wm = new WeakMap()
const settled = new WeakMap()

class FetchEvent {
	constructor(type, init) {
    wm.set(this, { used: false, cb: null })

		this.type = type
		this.request = init.request
		this.clientId = init.clientId || ''
		this.isReload = !!init.isReload
    this.timeStamp = (getNanoSeconds() - nodeLoadTime) / 1e6
    this.target = init.target
	}

  waitUntil(p) {}
	respondWith(response) {
    const _ = wm.get(this)
    if (_.used) {
      throw new TypeError(`Failed to execute 'respondWith' on 'FetchEvent': The event has already been responded to.`)
    }
    _.used = true
    _.callback && Promise.resolve(response).then(_.callback)
  }
}

module.exports = {
  FetchEvent,

  /**
   * Used iternal by `helpers.httpMessageToRequest`
   * to tell how respondWith should handle the response
   *
   * And how a iternal fetch request should just return
   * the response (not yet implemented)
   *
   * @private used internally by helpers.js,
   * @param  {FetchEvent} event [description]
   * @param  {Function}   cb    [description]
   * @return {undefined}        [description]
   */
  assignCallback(event, cb) {
    wm.set(event, cb)
  }
}
