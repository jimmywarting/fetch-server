var { Request, Response } = require('node-fetch')
var query = new URLSearchParams([['name', 'value']])

new Request('https://httpbin.org/post', {
  body: query,
  method: 'post'
}).text().then(console.log)

new Response(query).text().then(console.log)
