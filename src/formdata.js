const File = require('./file')
const map = new WeakMap()
const wm = o => map.get(o)

function normalizeValue ([value, filename]) {
  if (value instanceof File) {
    value = new File([value], filename, {
      type: value.type,
      lastModified: value.lastModified
    })
  }

  return value
}

function stringify (name) {
  if (!arguments.length) { throw new TypeError('1 argument required, but only 0 present.') }

  return [name + '']
}

function normalizeArgs (name, value, filename) {
  if (arguments.length < 2) {
    throw new TypeError(
      `2 arguments required, but only ${arguments.length} present.`
    )
  }

  return value instanceof File
    // normalize name and filename if adding an attachment
    ? [name + '', value, filename !== undefined
      ? filename + '' // Cast filename to string if 3th arg isn't undefined
      : typeof value.name === 'string' // if name prop exist
        ? value.name // Use File.name
        : 'blob'] // otherwise fallback to Blob

    // If no attachment, just cast the args to strings
    : [name + '', value + '']
}

/**
 * @implements {Iterable}
 */
class FormData {

  /**
   * FormData class
   */
  constructor() {
    map.set(this, Object.create(null))
  }

  /**
   * Append a field
   *
   * @param   {String}           name      field name
   * @param   {String|Blob|File} value     string / blob / file
   * @param   {String=}          filename  filename to use with blob
   * @return  {Undefined}
   */
  append (name, value, filename) {
    const map = wm(this)
    if (!map[name]) { map[name] = [] }

    map[name].push([value, filename])
  }

  /**
   * Delete all fields values given name
   *
   * @param   {String}  name  Field name
   * @return  {Undefined}
   */
  delete (name) {
    delete wm(this)[name]
  }

  /**
   * Iterate over all fields as [name, value]
   *
   * @return {Iterator}
   */
  * entries () {
    const map = wm(this)

    for (let name in map) {
      for (let value of map[name]) { yield [name, normalizeValue(value)] }
    }
  }

  /**
   * Iterate over all fields
   *
   * @param   {Function}  callback  Executed for each item with parameters (value, name, thisArg)
   * @param   {Object=}   thisArg   `this` context for callback function
   * @return  {Undefined}
   */
  forEach (callback, thisArg) {
    for (let [name, value] of this) { callback.call(thisArg, value, name, this) }
  }

  /**
   * Return first field value given name
   * or null if non existen
   *
   * @param   {String}  name      Field name
   * @return  {String|File|null}  value Fields value
   */
  get (name) {
    const map = wm(this)
    return map[name] ? normalizeValue(map[name][0]) : null
  }

  /**
   * Return all fields values given name
   *
   * @param   {String}  name  Fields name
   * @return  {Array}         [{String|File}]
   */
  getAll (name) {
    return (wm(this)[name] || []).map(normalizeValue)
  }

  /**
   * Check for field name existence
   *
   * @param   {String}   name  Field name
   * @return  {boolean}
   */
  has (name) {
    return name in wm(this)
  }

  /**
   * Iterate over all fields name
   *
   * @return {Iterator}
   */
  * keys () {
    for (let [name] of this) { yield name }
  }

  /**
   * Overwrite all values given name
   *
   * @param   {String}    name      Filed name
   * @param   {String}    value     Field value
   * @param   {String=}   filename  Filename (optional)
   * @return  {Undefined}
   */
  set (name, value, filename) {
    wm(this)[name] = [[value, filename]]
  }

  /**
   * Iterate over all fields
   *
   * @return {Iterator}
   */
  * values () {
    for (let [name, value] of this) { yield value }
  }

  /**
   * Return a native (perhaps degraded) FormData with only a `append` method
   * Can throw if it's not supported
   *
   * @return {FormData}
   */
  ['_asNative'] () {
    const fd = new _FormData()

    for (let [name, value] of this) { fd.append(name, value) }

    return fd
  }

  /**
   * [_blob description]
   *
   * @return {Blob} [description]
   */
  ['_blob']() {
    const boundary = '----formdata-polyfill-' + Math.random()
    const chunks = []

    for (let [name, value] of this) {
      chunks.push(`--${boundary}\r\n`)

      if (value instanceof File) {
        chunks.push(
          `Content-Disposition: form-data; name="${name}"; filename="${value.name}"\r\n`,
          `Content-Type: ${value.type || 'application/octet-stream'}\r\n\r\n`,
          value,
          '\r\n'
        )
      } else {
        chunks.push(
          `Content-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
        )
      }
    }


    chunks.push(`--${boundary}--`)

    return {
      chunks,
      size: 2,
      type: 'multipart/form-data; boundary=' + boundary
    }
  }

  getBoundary() {
    const boundary = '----formdata-polyfill-' + Math.random()
  }

  /**
   * The class itself is iterable
   * alias for formdata.entries()
   *
   * @return  {Iterator}
   */
  [Symbol.iterator] () {
    return this.entries()
  }

  /**
   * Create the default string description.
   *
   * @return  {String} [object FormData]
   */
  toString () {
    return '[object FormData]'
  }
}

FormData.prototype[Symbol.toStringTag] = 'FormData'

const decorations = [
  ['append', normalizeArgs],
  ['delete', stringify],
  ['get', stringify],
  ['getAll', stringify],
  ['has', stringify],
  ['set', normalizeArgs]
]

decorations.forEach(([method, fn]) => {
  const orig = FormData.prototype[method]
  FormData.prototype[method] = function(...args) {
    return orig.apply(this, fn(...args))
  }
})

module.exports = FormData
