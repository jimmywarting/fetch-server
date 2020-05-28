const { Readable } = require('stream')

class File extends Readable {
  constructor(b, d, c) {
    const t = c && void 0 !== c.lastModified ? new Date(c.lastModified) : new Date
    this.name = d
    this.lastModifiedDate = t
    this.lastModified = +t
  }

  toString() {
    return '[object File]'
  }
}

File.prototype[Symbol.toStringTag] = 'File'

module.exports = File
