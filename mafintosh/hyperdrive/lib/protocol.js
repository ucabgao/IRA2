var lpstream = require('length-prefixed-stream')
var duplexify = require('duplexify')
var ids = require('numeric-id-map')
var events = require('events')
var bitfield = require('bitfield')
var util = require('util')
var messages = require('./messages')

var MAX_BITFIELD = 5 * 1024 * 1024
var MAX_MESSAGE = 5 * 1024 * 1024

var ENCODINGS = [
  messages.Join,
  messages.Leave,
  messages.Have,
  messages.Choke,
  messages.Unchoke,
  messages.Request,
  messages.Response
]

module.exports = Protocol

function Channel (stream, link) {
  events.EventEmitter.call(this)

  this.stream = stream
  this.left = false
  this.link = link
  this.local = 0
  this.remote = 0
  this.remoteJoined = false

  this.remoteChoking = true
  this.remoteBitfield = bitfield(1, {grow: MAX_BITFIELD})
  this.amChoking = true
  this.amRequesting = bitfield(1, {grow: Infinity})
  this.inflight = 0
}

util.inherits(Channel, events.EventEmitter)

Channel.prototype.leave = function (err) {
  if (this.left) return
  if (err) this.emit('warn', err)
  this.stream._push(1, {channel: this.local})
  this.onleave()
}

Channel.prototype.bitfield = function (bitfield) {
  this.stream._push(2, {
    channel: this.local,
    bitfield: toBuffer(bitfield)
  })
}

Channel.prototype.have = function (blocks, bitfield) {
  if (typeof blocks === 'number') blocks = [blocks]
  this.stream._push(2, {
    channel: this.local,
    blocks: blocks,
    bitfield: toBuffer(bitfield)
  })
}

Channel.prototype.choke = function () {
  this.stream._push(3, {channel: this.local})
}

Channel.prototype.unchoke = function () {
  this.stream._push(4, {channel: this.local})
}

Channel.prototype.request = function (block) {
  this.amRequesting.set(block, true)
  this.inflight++
  this.stream.inflight++
  this.stream._push(5, {channel: this.local, block: block})
}

Channel.prototype.response = function (block, data, proof) {
  this.stream._push(6, {
    channel: this.local,
    block: block,
    data: data,
    proof: proof
  })
}

Channel.prototype.onleave = function () {
  if (this.left) return
  this.left = true
  if (this.remoteJoined) this.stream._remove(this)
  this.emit('leave')
}

Channel.prototype.onjoin = function (channel) {
  this.remote = channel
  this.remoteJoined = true
  if (this.left) this.stream._remove(this)
}

Channel.prototype.onhave = function (message) {
  if (message.bitfield) {
    this.remoteBitfield = bitfield(message.bitfield, {grow: MAX_BITFIELD})
  }
  if (message.blocks) {
    for (var i = 0; i < message.blocks.length; i++) {
      var block = message.blocks[i]
      this.remoteBitfield.set(block)
    }
  }

  this.emit('have')
  this.emit('update')
}

Channel.prototype.onchoke = function () {
  this.remoteChoking = true
  this.emit('choke')
  this.emit('update')
}

Channel.prototype.onunchoke = function () {
  this.remoteChoking = false
  this.emit('unchoke')
  this.emit('update')
}

Channel.prototype.onrequest = function (message) {
  this.emit('request', message.block)
}

Channel.prototype.onresponse = function (message) {
  var block = message.block
  if (this.amRequesting.get(block)) {
    this.inflight--
    this.stream.inflight--
  }
  this.amRequesting.set(block, false)
  this.emit('response', block, message.data, message.proof)
}

function Protocol () {
  if (!(this instanceof Protocol)) return new Protocol()
  duplexify.call(this)

  var self = this

  this.inflight = 0

  this._parser = lpstream.decode({limit: MAX_MESSAGE})
  this._generator = lpstream.encode()
  this._parser.on('data', parse)
  this._handshook = false

  this._channels = {}
  this._remote = []
  this._local = ids()

  var handshake = {
    protocol: 'hyperdrive'
  }

  this._generator.write(messages.Handshake.encode(handshake))

  this.setReadable(this._generator)
  this.setWritable(this._parser)

  function parse (data) {
    self._parse(data)
  }
}

util.inherits(Protocol, duplexify)

Protocol.prototype._onhandshake = function (handshake) {
  if (handshake.protocol !== 'hyperdrive') {
    return this.destroy(new Error('Protocol must be hyperdrive'))
  }
  this.emit('handshake')
}

Protocol.prototype._parse = function (data) {
  if (this.destroyed) return

  if (!this._handshook) {
    try {
      var handshake = messages.Handshake.decode(data)
    } catch (err) {
      return this.destroy(err)
    }
    this._handshook = true
    this._onhandshake(handshake)
    return
  }

  var type = data[0]
  if (type >= ENCODINGS.length) return // unknown message

  try {
    var message = ENCODINGS[type].decode(data, 1)
  } catch (err) {
    return this.destroy(err)
  }

  switch (type) {
    case 0: return this._onjoin(message)
    case 1: return this._onleave(message)
    case 2: return this._onhave(message)
    case 3: return this._onchoke(message)
    case 4: return this._onunchoke(message)
    case 5: return this._onrequest(message)
    case 6: return this._onresponse(message)
  }
}

Protocol.prototype._onjoin = function (message) {
  if (message.channel > this._remote.length) {
    return this.destroy(new Error('Remote sent invalid channel id'))
  }

  if (this._remote.length > message.channel && this._remote[message.channel]) {
    return this.destroy(new Error('Remote reused channel id'))
  }

  var ch = this.join(message.link)
  if (this._remote.length === message.channel) this._remote.push(null)
  this._remote[message.channel] = ch
  ch.onjoin(message.channel)
}

Protocol.prototype._onleave = function (message) {
  var ch = this._get(message.channel)
  if (ch) ch.onleave()
}

Protocol.prototype._onhave = function (message) {
  var ch = this._get(message.channel)
  if (ch) ch.onhave(message)
}

Protocol.prototype._onchoke = function (message) {
  var ch = this._get(message.channel)
  if (ch && !ch.remoteChoking) ch.onchoke()
}

Protocol.prototype._onunchoke = function (message) {
  var ch = this._get(message.channel)
  if (ch && ch.remoteChoking) ch.onunchoke()
}

Protocol.prototype._onrequest = function (message) {
  var ch = this._get(message.channel)
  if (ch) ch.onrequest(message)
}

Protocol.prototype._onresponse = function (message) {
  var ch = this._get(message.channel)
  if (ch) ch.onresponse(message)
}

Protocol.prototype._get = function (id) {
  if (id >= this._remote.length) {
    this.destroy(new Error('Remote sent invalid channel id'))
    return null
  }
  return this._remote[id]
}

Protocol.prototype._remove = function (channel) {
  this._local.remove(channel.local)
  this._remote[channel.remote] = null
  delete this._channels[channel.link.toString('hex')]
}

Protocol.prototype._push = function (type, message) {
  var enc = ENCODINGS[type]
  var buf = new Buffer(enc.encodingLength(message) + 1)
  buf[0] = type
  enc.encode(message, buf, 1)
  this._generator.write(buf)
}

Protocol.prototype.join = function (link) {
  var name = link.toString('hex')
  var ch = this._channels[name]
  if (ch) return this._local.get(ch - 1)

  ch = new Channel(this, link)
  ch.local = this._local.add(ch)
  this._channels[name] = ch.local + 1
  this._push(0, {channel: ch.local, link: link})
  this.emit('channel', ch)

  return ch
}

Protocol.prototype.leave = function (link) {
  var name = link.toString('hex')
  if (!this._channels[name]) return false
  this.join(link).leave()
}

function toBuffer (bitfield) {
  if (!bitfield) return null
  if (Buffer.isBuffer(bitfield)) return bitfield
  return bitfield.buffer
}
