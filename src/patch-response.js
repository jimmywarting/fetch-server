const { Readable } = require('stream')
const { Response, Request, fetch } = require('node-fetch')
const toFormData = require('./reverse-formdata')

// https://github.com/bitinn/node-fetch/issues/210
// node-fetch don't handle body conversion
for (const Body of [ Response, Request ]) {
  const bodyGetter = Object.getOwnPropertyDescriptor(
    Body.prototype, 'body'
  ).get

  Object.defineProperty(Request.prototype, 'body', {
    get() {
      console.log('meh')
      console.log('symb,', Object.getOwnPropertySymbols(this))

      const body = bodyGetter.call(this)
      let stream = body

      if (!(body instanceof Readable)) {
        stream = new Readable({
          read() {
            body != null && this.push(body)
            this.push(null)
          }
        })
      }

      return stream
    }
  })
}

// https://github.com/bitinn/node-fetch/issues/199
// node-fetch haven't implemented body.formData
Response.prototype.formData = toFormData
Request.prototype.formData = toFormData


/**
 * Detect a URLSearchParams object
 * ref: https://github.com/bitinn/node-fetch/issues/296#issuecomment-307598143
 *
 * @param   Object  obj     Object to detect by type or brand
 * @return  String
 */
function isURLSearchParams(obj) {
	// Duck-typing as a necessary condition.
	if (typeof obj !== 'object' ||
		typeof obj.append !== 'function' ||
		typeof obj.delete !== 'function' ||
		typeof obj.get !== 'function' ||
		typeof obj.getAll !== 'function' ||
		typeof obj.has !== 'function' ||
		typeof obj.set !== 'function') {
		return false;
	}

	// Brand-checking and more duck-typing as optional condition.
	return obj.constructor.name === 'URLSearchParams' ||
		Object.prototype.toString.call(obj) === '[object URLSearchParams]' ||
		typeof obj.sort === 'function';
}
