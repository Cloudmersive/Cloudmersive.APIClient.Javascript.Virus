(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":1,"ieee754":4}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],7:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":5,"./encode":6}],8:[function(require,module,exports){
var CloudmersiveConvertApiClient = require('cloudmersive-convert-api-client');
var CloudmersiveValidateApiClient = require('cloudmersive-validate-api-client');
var CloudmersiveImageApiClient = require('cloudmersive-image-api-client');
},{"cloudmersive-convert-api-client":20,"cloudmersive-image-api-client":100,"cloudmersive-validate-api-client":122}],9:[function(require,module,exports){
(function (Buffer){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['superagent', 'querystring'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('superagent'), require('querystring'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.ApiClient = factory(root.superagent, root.querystring);
  }
}(this, function(superagent, querystring) {
  'use strict';

  /**
   * @module ApiClient
   * @version 1.2.7
   */

  /**
   * Manages low level client-server communications, parameter marshalling, etc. There should not be any need for an
   * application to use this class directly - the *Api and model classes provide the public API for the service. The
   * contents of this file should be regarded as internal but are documented for completeness.
   * @alias module:ApiClient
   * @class
   */
  var exports = function() {
    /**
     * The base URL against which to resolve every API call's (relative) path.
     * @type {String}
     * @default https://api.cloudmersive.com
     */
    this.basePath = 'https://api.cloudmersive.com'.replace(/\/+$/, '');

    /**
     * The authentication methods to be included for all API calls.
     * @type {Array.<String>}
     */
    this.authentications = {
      'Apikey': {type: 'apiKey', 'in': 'header', name: 'Apikey'}
    };
    /**
     * The default HTTP headers to be included for all API calls.
     * @type {Array.<String>}
     * @default {}
     */
    this.defaultHeaders = {};

    /**
     * The default HTTP timeout for all API calls.
     * @type {Number}
     * @default 60000
     */
    this.timeout = 180000;

    /**
     * If set to false an additional timestamp parameter is added to all API GET calls to
     * prevent browser caching
     * @type {Boolean}
     * @default true
     */
    this.cache = true;

    /**
     * If set to true, the client will save the cookies from each server
     * response, and return them in the next request.
     * @default false
     */
    this.enableCookies = false;

    /*
     * Used to save and return cookies in a node.js (non-browser) setting,
     * if this.enableCookies is set to true.
     */
    if (typeof window === 'undefined') {
      this.agent = new superagent.agent();
    }

    /*
     * Allow user to override superagent agent
     */
    this.requestAgent = null;
  };

  /**
   * Returns a string representation for an actual parameter.
   * @param param The actual parameter.
   * @returns {String} The string representation of <code>param</code>.
   */
  exports.prototype.paramToString = function(param) {
    if (param == undefined || param == null) {
      return '';
    }
    if (param instanceof Date) {
      return param.toJSON();
    }
    return param.toString();
  };

  /**
   * Builds full URL by appending the given path to the base URL and replacing path parameter place-holders with parameter values.
   * NOTE: query parameters are not handled here.
   * @param {String} path The path to append to the base URL.
   * @param {Object} pathParams The parameter values to append.
   * @returns {String} The encoded path with parameter values substituted.
   */
  exports.prototype.buildUrl = function(path, pathParams) {
    if (!path.match(/^\//)) {
      path = '/' + path;
    }
    var url = this.basePath + path;
    var _this = this;
    url = url.replace(/\{([\w-]+)\}/g, function(fullMatch, key) {
      var value;
      if (pathParams.hasOwnProperty(key)) {
        value = _this.paramToString(pathParams[key]);
      } else {
        value = fullMatch;
      }
      return encodeURIComponent(value);
    });
    return url;
  };

  /**
   * Checks whether the given content type represents JSON.<br>
   * JSON content type examples:<br>
   * <ul>
   * <li>application/json</li>
   * <li>application/json; charset=UTF8</li>
   * <li>APPLICATION/JSON</li>
   * </ul>
   * @param {String} contentType The MIME content type to check.
   * @returns {Boolean} <code>true</code> if <code>contentType</code> represents JSON, otherwise <code>false</code>.
   */
  exports.prototype.isJsonMime = function(contentType) {
    return Boolean(contentType != null && contentType.match(/^application\/json(;.*)?$/i));
  };

  /**
   * Chooses a content type from the given array, with JSON preferred; i.e. return JSON if included, otherwise return the first.
   * @param {Array.<String>} contentTypes
   * @returns {String} The chosen content type, preferring JSON.
   */
  exports.prototype.jsonPreferredMime = function(contentTypes) {
    for (var i = 0; i < contentTypes.length; i++) {
      if (this.isJsonMime(contentTypes[i])) {
        return contentTypes[i];
      }
    }
    return contentTypes[0];
  };

  /**
   * Checks whether the given parameter value represents file-like content.
   * @param param The parameter to check.
   * @returns {Boolean} <code>true</code> if <code>param</code> represents a file.
   */
  exports.prototype.isFileParam = function(param) {
    // fs.ReadStream in Node.js and Electron (but not in runtime like browserify)
    if (typeof require === 'function') {
      var fs;
      try {
        fs = require('fs');
      } catch (err) {}
      if (fs && fs.ReadStream && param instanceof fs.ReadStream) {
        return true;
      }
    }
    // Buffer in Node.js
    if (typeof Buffer === 'function' && param instanceof Buffer) {
      return true;
    }
    // Blob in browser
    if (typeof Blob === 'function' && param instanceof Blob) {
      return true;
    }
    // File in browser (it seems File object is also instance of Blob, but keep this for safe)
    if (typeof File === 'function' && param instanceof File) {
      return true;
    }
    return false;
  };

  /**
   * Normalizes parameter values:
   * <ul>
   * <li>remove nils</li>
   * <li>keep files and arrays</li>
   * <li>format to string with `paramToString` for other cases</li>
   * </ul>
   * @param {Object.<String, Object>} params The parameters as object properties.
   * @returns {Object.<String, Object>} normalized parameters.
   */
  exports.prototype.normalizeParams = function(params) {
    var newParams = {};
    for (var key in params) {
      if (params.hasOwnProperty(key) && params[key] != undefined && params[key] != null) {
        var value = params[key];
        if (this.isFileParam(value) || Array.isArray(value)) {
          newParams[key] = value;
        } else {
          newParams[key] = this.paramToString(value);
        }
      }
    }
    return newParams;
  };

  /**
   * Enumeration of collection format separator strategies.
   * @enum {String}
   * @readonly
   */
  exports.CollectionFormatEnum = {
    /**
     * Comma-separated values. Value: <code>csv</code>
     * @const
     */
    CSV: ',',
    /**
     * Space-separated values. Value: <code>ssv</code>
     * @const
     */
    SSV: ' ',
    /**
     * Tab-separated values. Value: <code>tsv</code>
     * @const
     */
    TSV: '\t',
    /**
     * Pipe(|)-separated values. Value: <code>pipes</code>
     * @const
     */
    PIPES: '|',
    /**
     * Native array. Value: <code>multi</code>
     * @const
     */
    MULTI: 'multi'
  };

  /**
   * Builds a string representation of an array-type actual parameter, according to the given collection format.
   * @param {Array} param An array parameter.
   * @param {module:ApiClient.CollectionFormatEnum} collectionFormat The array element separator strategy.
   * @returns {String|Array} A string representation of the supplied collection, using the specified delimiter. Returns
   * <code>param</code> as is if <code>collectionFormat</code> is <code>multi</code>.
   */
  exports.prototype.buildCollectionParam = function buildCollectionParam(param, collectionFormat) {
    if (param == null) {
      return null;
    }
    switch (collectionFormat) {
      case 'csv':
        return param.map(this.paramToString).join(',');
      case 'ssv':
        return param.map(this.paramToString).join(' ');
      case 'tsv':
        return param.map(this.paramToString).join('\t');
      case 'pipes':
        return param.map(this.paramToString).join('|');
      case 'multi':
        // return the array directly as SuperAgent will handle it as expected
        return param.map(this.paramToString);
      default:
        throw new Error('Unknown collection format: ' + collectionFormat);
    }
  };

  /**
   * Applies authentication headers to the request.
   * @param {Object} request The request object created by a <code>superagent()</code> call.
   * @param {Array.<String>} authNames An array of authentication method names.
   */
  exports.prototype.applyAuthToRequest = function(request, authNames) {
    var _this = this;
    authNames.forEach(function(authName) {
      var auth = _this.authentications[authName];
      switch (auth.type) {
        case 'basic':
          if (auth.username || auth.password) {
            request.auth(auth.username || '', auth.password || '');
          }
          break;
        case 'apiKey':
          if (auth.apiKey) {
            var data = {};
            if (auth.apiKeyPrefix) {
              data[auth.name] = auth.apiKeyPrefix + ' ' + auth.apiKey;
            } else {
              data[auth.name] = auth.apiKey;
            }
            if (auth['in'] === 'header') {
              request.set(data);
            } else {
              request.query(data);
            }
          }
          break;
        case 'oauth2':
          if (auth.accessToken) {
            request.set({'Authorization': 'Bearer ' + auth.accessToken});
          }
          break;
        default:
          throw new Error('Unknown authentication type: ' + auth.type);
      }
    });
  };

  /**
   * Deserializes an HTTP response body into a value of the specified type.
   * @param {Object} response A SuperAgent response object.
   * @param {(String|Array.<String>|Object.<String, Object>|Function)} returnType The type to return. Pass a string for simple types
   * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
   * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
   * all properties on <code>data<code> will be converted to this type.
   * @returns A value of the specified type.
   */
  exports.prototype.deserialize = function deserialize(response, returnType) {
    if (response == null || returnType == null || response.status == 204) {
      return null;
    }
    // Rely on SuperAgent for parsing response body.
    // See http://visionmedia.github.io/superagent/#parsing-response-bodies
    var data = response.body;
    if (data == null || (typeof data === 'object' && typeof data.length === 'undefined' && !Object.keys(data).length)) {
      // SuperAgent does not always produce a body; use the unparsed response as a fallback
      data = response.text;
    }
    return exports.convertToType(data, returnType);
  };

  /**
   * Callback function to receive the result of the operation.
   * @callback module:ApiClient~callApiCallback
   * @param {String} error Error message, if any.
   * @param data The data returned by the service call.
   * @param {String} response The complete HTTP response.
   */

  /**
   * Invokes the REST service using the supplied settings and parameters.
   * @param {String} path The base URL to invoke.
   * @param {String} httpMethod The HTTP method to use.
   * @param {Object.<String, String>} pathParams A map of path parameters and their values.
   * @param {Object.<String, Object>} queryParams A map of query parameters and their values.
   * @param {Object.<String, Object>} collectionQueryParams A map of collection query parameters and their values.
   * @param {Object.<String, Object>} headerParams A map of header parameters and their values.
   * @param {Object.<String, Object>} formParams A map of form parameters and their values.
   * @param {Object} bodyParam The value to pass as the request body.
   * @param {Array.<String>} authNames An array of authentication type names.
   * @param {Array.<String>} contentTypes An array of request MIME types.
   * @param {Array.<String>} accepts An array of acceptable response MIME types.
   * @param {(String|Array|ObjectFunction)} returnType The required type to return; can be a string for simple types or the
   * constructor for a complex type.
   * @param {module:ApiClient~callApiCallback} callback The callback function.
   * @returns {Object} The SuperAgent request object.
   */
  exports.prototype.callApi = function callApi(path, httpMethod, pathParams,
      queryParams, collectionQueryParams, headerParams, formParams, bodyParam, authNames, contentTypes, accepts,
      returnType, callback) {

    var _this = this;
    var url = this.buildUrl(path, pathParams);
    var request = superagent(httpMethod, url);

    // apply authentications
    this.applyAuthToRequest(request, authNames);

    // set collection query parameters
    for (var key in collectionQueryParams) {
      if (collectionQueryParams.hasOwnProperty(key)) {
        var param = collectionQueryParams[key];
        if (param.collectionFormat === 'csv') {
          // SuperAgent normally percent-encodes all reserved characters in a query parameter. However,
          // commas are used as delimiters for the 'csv' collectionFormat so they must not be encoded. We
          // must therefore construct and encode 'csv' collection query parameters manually.
          if (param.value != null) {
            var value = param.value.map(this.paramToString).map(encodeURIComponent).join(',');
            request.query(encodeURIComponent(key) + "=" + value);
          }
        } else {
          // All other collection query parameters should be treated as ordinary query parameters.
          queryParams[key] = this.buildCollectionParam(param.value, param.collectionFormat);
        }
      }
    }

    // set query parameters
    if (httpMethod.toUpperCase() === 'GET' && this.cache === false) {
        queryParams['_'] = new Date().getTime();
    }
    request.query(this.normalizeParams(queryParams));

    // set header parameters
    request.set(this.defaultHeaders).set(this.normalizeParams(headerParams));


    // set requestAgent if it is set by user
    if (this.requestAgent) {
      request.agent(this.requestAgent);
    }

    // set request timeout
    request.timeout(this.timeout);

    var contentType = this.jsonPreferredMime(contentTypes);
    if (contentType) {
      // Issue with superagent and multipart/form-data (https://github.com/visionmedia/superagent/issues/746)
      if(contentType != 'multipart/form-data') {
        request.type(contentType);
      }
    } else if (!request.header['Content-Type']) {
      request.type('application/json');
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      request.send(querystring.stringify(this.normalizeParams(formParams)));
    } else if (contentType == 'multipart/form-data') {
      var _formParams = this.normalizeParams(formParams);
      for (var key in _formParams) {
        if (_formParams.hasOwnProperty(key)) {
          if (this.isFileParam(_formParams[key])) {
            // file field
            request.attach(key, _formParams[key]);
          } else {
            request.field(key, _formParams[key]);
          }
        }
      }
    } else if (bodyParam) {
      request.send(bodyParam);
    }

    var accept = this.jsonPreferredMime(accepts);
    if (accept) {
      request.accept(accept);
    }

    if (returnType === 'Blob') {
      request.responseType('blob');
    } else if (returnType === 'String') {
      request.responseType('string');
    }

    // Attach previously saved cookies, if enabled
    if (this.enableCookies){
      if (typeof window === 'undefined') {
        this.agent.attachCookies(request);
      }
      else {
        request.withCredentials();
      }
    }


    request.end(function(error, response) {
      if (callback) {
        var data = null;
        if (!error) {
          try {
            data = _this.deserialize(response, returnType);
            if (_this.enableCookies && typeof window === 'undefined'){
              _this.agent.saveCookies(response);
            }
          } catch (err) {
            error = err;
          }
        }
        callback(error, data, response);
      }
    });

    return request;
  };

  /**
   * Parses an ISO-8601 string representation of a date value.
   * @param {String} str The date value as a string.
   * @returns {Date} The parsed date object.
   */
  exports.parseDate = function(str) {
    return new Date(str.replace(/T/i, ' '));
  };

  /**
   * Converts a value to the specified type.
   * @param {(String|Object)} data The data to convert, as a string or object.
   * @param {(String|Array.<String>|Object.<String, Object>|Function)} type The type to return. Pass a string for simple types
   * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
   * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
   * all properties on <code>data<code> will be converted to this type.
   * @returns An instance of the specified type or null or undefined if data is null or undefined.
   */
  exports.convertToType = function(data, type) {
    if (data === null || data === undefined)
      return data

    switch (type) {
      case 'Boolean':
        return Boolean(data);
      case 'Integer':
        return parseInt(data, 10);
      case 'Number':
        return parseFloat(data);
      case 'String':
        return String(data);
      case 'Date':
        return this.parseDate(String(data));
      case 'Blob':
      	return data;
      default:
        if (type === Object) {
          // generic object, return directly
          return data;
        } else if (typeof type === 'function') {
          // for model type like: User
          return type.constructFromObject(data);
        } else if (Array.isArray(type)) {
          // for array type like: ['String']
          var itemType = type[0];
          return data.map(function(item) {
            return exports.convertToType(item, itemType);
          });
        } else if (typeof type === 'object') {
          // for plain object type like: {'String': 'Integer'}
          var keyType, valueType;
          for (var k in type) {
            if (type.hasOwnProperty(k)) {
              keyType = k;
              valueType = type[k];
              break;
            }
          }
          var result = {};
          for (var k in data) {
            if (data.hasOwnProperty(k)) {
              var key = exports.convertToType(k, keyType);
              var value = exports.convertToType(data[k], valueType);
              result[key] = value;
            }
          }
          return result;
        } else {
          // for unknown type, return the data directly
          return data;
        }
    }
  };

  /**
   * Constructs a new map or array model from REST data.
   * @param data {Object|Array} The REST data.
   * @param obj {Object|Array} The target object or array.
   */
  exports.constructFromObject = function(data, obj, itemType) {
    if (Array.isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        if (data.hasOwnProperty(i))
          obj[i] = exports.convertToType(data[i], itemType);
      }
    } else {
      for (var k in data) {
        if (data.hasOwnProperty(k))
          obj[k] = exports.convertToType(data[k], itemType);
      }
    }
  };

  /**
   * The default API client implementation.
   * @type {module:ApiClient}
   */
  exports.instance = new exports();

  return exports;
}));

}).call(this,require("buffer").Buffer)
},{"buffer":3,"fs":2,"querystring":7,"superagent":134}],10:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.CompareDocumentApi = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * CompareDocument service.
   * @module api/CompareDocumentApi
   * @version 1.2.7
   */

  /**
   * Constructs a new CompareDocumentApi. 
   * @alias module:api/CompareDocumentApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the compareDocumentDocx operation.
     * @callback module:api/CompareDocumentApi~compareDocumentDocxCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Compare Two Word DOCX
     * Compare two Office Word Documents (docx) files and highlight the differences
     * @param {File} inputFile1 First input file to perform the operation on.
     * @param {File} inputFile2 Second input file to perform the operation on (more than 2 can be supplied).
     * @param {module:api/CompareDocumentApi~compareDocumentDocxCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.compareDocumentDocx = function(inputFile1, inputFile2, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile1' is set
      if (inputFile1 === undefined || inputFile1 === null) {
        throw new Error("Missing the required parameter 'inputFile1' when calling compareDocumentDocx");
      }

      // verify the required parameter 'inputFile2' is set
      if (inputFile2 === undefined || inputFile2 === null) {
        throw new Error("Missing the required parameter 'inputFile2' when calling compareDocumentDocx");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile1': inputFile1,
        'inputFile2': inputFile2
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/compare/docx', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":9}],11:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.ConvertDataApi = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * ConvertData service.
   * @module api/ConvertDataApi
   * @version 1.2.7
   */

  /**
   * Constructs a new ConvertDataApi. 
   * @alias module:api/ConvertDataApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the convertDataCsvToJson operation.
     * @callback module:api/ConvertDataApi~convertDataCsvToJsonCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * CSV to JSON conversion
     * Convert a CSV file to a JSON object array
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDataApi~convertDataCsvToJsonCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    this.convertDataCsvToJson = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDataCsvToJson");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = Object;

      return this.apiClient.callApi(
        '/convert/csv/to/json', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertDataXmlToJson operation.
     * @callback module:api/ConvertDataApi~convertDataXmlToJsonCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * XML to JSON conversion
     * Convert an XML string or file into JSON
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDataApi~convertDataXmlToJsonCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    this.convertDataXmlToJson = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDataXmlToJson");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = Object;

      return this.apiClient.callApi(
        '/convert/xml/to/json', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":9}],12:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/PdfToPngResult'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/PdfToPngResult'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.ConvertDocumentApi = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.PdfToPngResult);
  }
}(this, function(ApiClient, PdfToPngResult) {
  'use strict';

  /**
   * ConvertDocument service.
   * @module api/ConvertDocumentApi
   * @version 1.2.7
   */

  /**
   * Constructs a new ConvertDocumentApi. 
   * @alias module:api/ConvertDocumentApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the convertDocumentAutodetectToPdf operation.
     * @callback module:api/ConvertDocumentApi~convertDocumentAutodetectToPdfCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Convert Document to PDF
     * Automatically detect file type and convert it to PDF.
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDocumentApi~convertDocumentAutodetectToPdfCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertDocumentAutodetectToPdf = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDocumentAutodetectToPdf");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/autodetect/to/pdf', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertDocumentCsvToXlsx operation.
     * @callback module:api/ConvertDocumentApi~convertDocumentCsvToXlsxCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * CSV to Excel XLSX
     * Convert CSV file to Office Excel XLSX Workbooks file format.
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDocumentApi~convertDocumentCsvToXlsxCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertDocumentCsvToXlsx = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDocumentCsvToXlsx");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/csv/to/xlsx', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertDocumentDocToDocx operation.
     * @callback module:api/ConvertDocumentApi~convertDocumentDocToDocxCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Word DOC (97-03) to DOCX
     * Convert/upgrade Office Word (97-2003 Format) Documents (doc) to the modern DOCX format
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDocumentApi~convertDocumentDocToDocxCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertDocumentDocToDocx = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDocumentDocToDocx");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/doc/to/docx', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertDocumentDocToPdf operation.
     * @callback module:api/ConvertDocumentApi~convertDocumentDocToPdfCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Word DOC (97-03) to PDF
     * Convert Office Word (97-2003 Format) Documents (doc) to standard PDF
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDocumentApi~convertDocumentDocToPdfCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertDocumentDocToPdf = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDocumentDocToPdf");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/doc/to/pdf', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertDocumentDocxToPdf operation.
     * @callback module:api/ConvertDocumentApi~convertDocumentDocxToPdfCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Word DOCX to PDF
     * Convert Office Word Documents (docx) to standard PDF
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDocumentApi~convertDocumentDocxToPdfCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertDocumentDocxToPdf = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDocumentDocxToPdf");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/docx/to/pdf', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertDocumentPdfToPngArray operation.
     * @callback module:api/ConvertDocumentApi~convertDocumentPdfToPngArrayCallback
     * @param {String} error Error message, if any.
     * @param {module:model/PdfToPngResult} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * PDF to PNG Array
     * Convert PDF document to PNG array, one image per page.
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDocumentApi~convertDocumentPdfToPngArrayCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/PdfToPngResult}
     */
    this.convertDocumentPdfToPngArray = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDocumentPdfToPngArray");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = PdfToPngResult;

      return this.apiClient.callApi(
        '/convert/pdf/to/png', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertDocumentPptToPdf operation.
     * @callback module:api/ConvertDocumentApi~convertDocumentPptToPdfCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * PowerPoint PPT (97-03) to PDF
     * Convert Office PowerPoint (97-2003) Documents (ppt) to standard PDF
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDocumentApi~convertDocumentPptToPdfCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertDocumentPptToPdf = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDocumentPptToPdf");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/ppt/to/pdf', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertDocumentPptToPptx operation.
     * @callback module:api/ConvertDocumentApi~convertDocumentPptToPptxCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * PowerPoint PPT (97-03) to PPTX
     * Convert/upgrade Office PowerPoint (97-2003) Documents (ppt) to modern PPTX
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDocumentApi~convertDocumentPptToPptxCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertDocumentPptToPptx = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDocumentPptToPptx");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/ppt/to/pptx', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertDocumentPptxToPdf operation.
     * @callback module:api/ConvertDocumentApi~convertDocumentPptxToPdfCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * PowerPoint PPTX to PDF
     * Convert Office PowerPoint Documents (pptx) to standard PDF
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDocumentApi~convertDocumentPptxToPdfCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertDocumentPptxToPdf = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDocumentPptxToPdf");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/pptx/to/pdf', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertDocumentXlsToPdf operation.
     * @callback module:api/ConvertDocumentApi~convertDocumentXlsToPdfCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Excel XLS (97-03) to PDF
     * Convert Office Excel (97-2003) Workbooks (xls) to standard PDF.  Converts all worksheets in the workbook to PDF.
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDocumentApi~convertDocumentXlsToPdfCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    this.convertDocumentXlsToPdf = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDocumentXlsToPdf");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/xls/to/pdf', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertDocumentXlsToXlsx operation.
     * @callback module:api/ConvertDocumentApi~convertDocumentXlsToXlsxCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Excel XLS (97-03) to XLSX
     * Convert/upgrade Office Excel (97-2003) Workbooks (xls) to modern XLSX format.
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDocumentApi~convertDocumentXlsToXlsxCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertDocumentXlsToXlsx = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDocumentXlsToXlsx");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/xls/to/xlsx', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertDocumentXlsxToCsv operation.
     * @callback module:api/ConvertDocumentApi~convertDocumentXlsxToCsvCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Excel XLSX to CSV
     * Convert Office Excel Workbooks (xlsx) to standard Comma-Separated Values (CSV) format.
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDocumentApi~convertDocumentXlsxToCsvCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertDocumentXlsxToCsv = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDocumentXlsxToCsv");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/xlsx/to/csv', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertDocumentXlsxToPdf operation.
     * @callback module:api/ConvertDocumentApi~convertDocumentXlsxToPdfCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Excel XLSX to PDF
     * Convert Office Excel Workbooks (xlsx) to standard PDF.  Converts all worksheets in the workbook to PDF.
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertDocumentApi~convertDocumentXlsxToPdfCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertDocumentXlsxToPdf = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertDocumentXlsxToPdf");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/xlsx/to/pdf', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":9,"../model/PdfToPngResult":82}],13:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/GetImageInfoResult'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/GetImageInfoResult'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.ConvertImageApi = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.GetImageInfoResult);
  }
}(this, function(ApiClient, GetImageInfoResult) {
  'use strict';

  /**
   * ConvertImage service.
   * @module api/ConvertImageApi
   * @version 1.2.7
   */

  /**
   * Constructs a new ConvertImageApi. 
   * @alias module:api/ConvertImageApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the convertImageGetImageInfo operation.
     * @callback module:api/ConvertImageApi~convertImageGetImageInfoCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetImageInfoResult} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get information about an image
     * Get details from an image such as size, format and MIME type, compression, EXIF data such as location, DPI, unique colors, transparency information, and more
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertImageApi~convertImageGetImageInfoCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetImageInfoResult}
     */
    this.convertImageGetImageInfo = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertImageGetImageInfo");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = GetImageInfoResult;

      return this.apiClient.callApi(
        '/convert/image/get-info', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertImageImageFormatConvert operation.
     * @callback module:api/ConvertImageApi~convertImageImageFormatConvertCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Image format conversion
     * Convert between over 100 file formats, including key formats such as Photoshop (PSD), PNG, JPG, GIF, NEF, and BMP.
     * @param {String} format1 Input file format as a 3+ letter file extension.  Supported formats include AAI, ART, ARW, AVS, BPG, BMP, BMP2, BMP3, BRF, CALS, CGM, CIN, CMYK, CMYKA, CR2, CRW, CUR, CUT, DCM, DCR, DCX, DDS, DIB, DJVU, DNG, DOT, DPX, EMF, EPDF, EPI, EPS, EPS2, EPS3, EPSF, EPSI, EPT, EXR, FAX, FIG, FITS, FPX, GIF, GPLT, GRAY, HDR, HEIC, HPGL, HRZ, ICO, ISOBRL, ISBRL6, JBIG, JNG, JP2, JPT, J2C, J2K, JPEG/JPG, JXR, MAT, MONO, MNG, M2V, MRW, MTV, NEF, ORF, OTB, P7, PALM, PAM, PBM, PCD, PCDS, PCL, PCX, PEF, PES, PFA, PFB, PFM, PGM, PICON, PICT, PIX, PNG, PNG8, PNG00, PNG24, PNG32, PNG48, PNG64, PNM, PPM, PSB, PSD, PTIF, PWB, RAD, RAF, RGB, RGBA, RGF, RLA, RLE, SCT, SFW, SGI, SID, SUN, SVG, TGA, TIFF, TIM, UIL, VIFF, VICAR, VBMP, WDP, WEBP, WPG, X, XBM, XCF, XPM, XWD, X3F, YCbCr, YCbCrA, YUV
     * @param {String} format2 Output (convert to this format) file format as a 3+ letter file extension.  Supported formats include AAI, ART, ARW, AVS, BPG, BMP, BMP2, BMP3, BRF, CALS, CGM, CIN, CMYK, CMYKA, CR2, CRW, CUR, CUT, DCM, DCR, DCX, DDS, DIB, DJVU, DNG, DOT, DPX, EMF, EPDF, EPI, EPS, EPS2, EPS3, EPSF, EPSI, EPT, EXR, FAX, FIG, FITS, FPX, GIF, GPLT, GRAY, HDR, HEIC, HPGL, HRZ, ICO, ISOBRL, ISBRL6, JBIG, JNG, JP2, JPT, J2C, J2K, JPEG/JPG, JXR, MAT, MONO, MNG, M2V, MRW, MTV, NEF, ORF, OTB, P7, PALM, PAM, PBM, PCD, PCDS, PCL, PCX, PEF, PES, PFA, PFB, PFM, PGM, PICON, PICT, PIX, PNG, PNG8, PNG00, PNG24, PNG32, PNG48, PNG64, PNM, PPM, PSB, PSD, PTIF, PWB, RAD, RAF, RGB, RGBA, RGF, RLA, RLE, SCT, SFW, SGI, SID, SUN, SVG, TGA, TIFF, TIM, UIL, VIFF, VICAR, VBMP, WDP, WEBP, WPG, X, XBM, XCF, XPM, XWD, X3F, YCbCr, YCbCrA, YUV
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertImageApi~convertImageImageFormatConvertCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertImageImageFormatConvert = function(format1, format2, inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'format1' is set
      if (format1 === undefined || format1 === null) {
        throw new Error("Missing the required parameter 'format1' when calling convertImageImageFormatConvert");
      }

      // verify the required parameter 'format2' is set
      if (format2 === undefined || format2 === null) {
        throw new Error("Missing the required parameter 'format2' when calling convertImageImageFormatConvert");
      }

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertImageImageFormatConvert");
      }


      var pathParams = {
        'format1': format1,
        'format2': format2
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/image/{format1}/to/{format2}', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertImageImageSetDPI operation.
     * @callback module:api/ConvertImageApi~convertImageImageSetDPICallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Change image DPI
     * Resize an image to have a different DPI
     * @param {Number} dpi New DPI in pixels-per-inch, for example 300 DPI or 600 DPI
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertImageApi~convertImageImageSetDPICallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertImageImageSetDPI = function(dpi, inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'dpi' is set
      if (dpi === undefined || dpi === null) {
        throw new Error("Missing the required parameter 'dpi' when calling convertImageImageSetDPI");
      }

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertImageImageSetDPI");
      }


      var pathParams = {
        'dpi': dpi
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/image/set-dpi/{dpi}', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":9,"../model/GetImageInfoResult":59}],14:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/HtmlTemplateApplicationRequest', 'model/HtmlTemplateApplicationResponse'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/HtmlTemplateApplicationRequest'), require('../model/HtmlTemplateApplicationResponse'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.ConvertTemplateApi = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.HtmlTemplateApplicationRequest, root.CloudmersiveConvertApiClient.HtmlTemplateApplicationResponse);
  }
}(this, function(ApiClient, HtmlTemplateApplicationRequest, HtmlTemplateApplicationResponse) {
  'use strict';

  /**
   * ConvertTemplate service.
   * @module api/ConvertTemplateApi
   * @version 1.2.7
   */

  /**
   * Constructs a new ConvertTemplateApi. 
   * @alias module:api/ConvertTemplateApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the convertTemplateApplyHtmlTemplate operation.
     * @callback module:api/ConvertTemplateApi~convertTemplateApplyHtmlTemplateCallback
     * @param {String} error Error message, if any.
     * @param {module:model/HtmlTemplateApplicationResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Apply HTML template
     * Apply operations to fill in an HTML template, generating a final HTML result
     * @param {module:model/HtmlTemplateApplicationRequest} value Operations to apply to template
     * @param {module:api/ConvertTemplateApi~convertTemplateApplyHtmlTemplateCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/HtmlTemplateApplicationResponse}
     */
    this.convertTemplateApplyHtmlTemplate = function(value, callback) {
      var postBody = value;

      // verify the required parameter 'value' is set
      if (value === undefined || value === null) {
        throw new Error("Missing the required parameter 'value' when calling convertTemplateApplyHtmlTemplate");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = HtmlTemplateApplicationResponse;

      return this.apiClient.callApi(
        '/convert/template/html/apply', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":9,"../model/HtmlTemplateApplicationRequest":71,"../model/HtmlTemplateApplicationResponse":72}],15:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/HtmlMdResult', 'model/HtmlToOfficeRequest', 'model/HtmlToPdfRequest', 'model/ScreenshotRequest'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/HtmlMdResult'), require('../model/HtmlToOfficeRequest'), require('../model/HtmlToPdfRequest'), require('../model/ScreenshotRequest'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.ConvertWebApi = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.HtmlMdResult, root.CloudmersiveConvertApiClient.HtmlToOfficeRequest, root.CloudmersiveConvertApiClient.HtmlToPdfRequest, root.CloudmersiveConvertApiClient.ScreenshotRequest);
  }
}(this, function(ApiClient, HtmlMdResult, HtmlToOfficeRequest, HtmlToPdfRequest, ScreenshotRequest) {
  'use strict';

  /**
   * ConvertWeb service.
   * @module api/ConvertWebApi
   * @version 1.2.7
   */

  /**
   * Constructs a new ConvertWebApi. 
   * @alias module:api/ConvertWebApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the convertWebHtmlToDocx operation.
     * @callback module:api/ConvertWebApi~convertWebHtmlToDocxCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * HTML to DOCX
     * Convert HTML to Office Word Document (DOCX) format
     * @param {module:model/HtmlToOfficeRequest} inputRequest 
     * @param {module:api/ConvertWebApi~convertWebHtmlToDocxCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertWebHtmlToDocx = function(inputRequest, callback) {
      var postBody = inputRequest;

      // verify the required parameter 'inputRequest' is set
      if (inputRequest === undefined || inputRequest === null) {
        throw new Error("Missing the required parameter 'inputRequest' when calling convertWebHtmlToDocx");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/html/to/docx', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertWebHtmlToPdf operation.
     * @callback module:api/ConvertWebApi~convertWebHtmlToPdfCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Convert HTML string to PDF
     * Fully renders a website and returns a PDF of the HTML.  Javascript, HTML5, CSS and other advanced features are all supported.
     * @param {module:model/HtmlToPdfRequest} input HTML to PDF request parameters
     * @param {module:api/ConvertWebApi~convertWebHtmlToPdfCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    this.convertWebHtmlToPdf = function(input, callback) {
      var postBody = input;

      // verify the required parameter 'input' is set
      if (input === undefined || input === null) {
        throw new Error("Missing the required parameter 'input' when calling convertWebHtmlToPdf");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/web/html/to/pdf', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertWebMdToHtml operation.
     * @callback module:api/ConvertWebApi~convertWebMdToHtmlCallback
     * @param {String} error Error message, if any.
     * @param {module:model/HtmlMdResult} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Convert Markdown to HTML
     * Convert a markdown file (.md) to HTML
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ConvertWebApi~convertWebMdToHtmlCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/HtmlMdResult}
     */
    this.convertWebMdToHtml = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling convertWebMdToHtml");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = HtmlMdResult;

      return this.apiClient.callApi(
        '/convert/web/md/to/html', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertWebUrlToPdf operation.
     * @callback module:api/ConvertWebApi~convertWebUrlToPdfCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Convert a URL to PDF
     * Fully renders a website and returns a PDF of the full page.  Javascript, HTML5, CSS and other advanced features are all supported.
     * @param {module:model/ScreenshotRequest} input URL to PDF request parameters
     * @param {module:api/ConvertWebApi~convertWebUrlToPdfCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertWebUrlToPdf = function(input, callback) {
      var postBody = input;

      // verify the required parameter 'input' is set
      if (input === undefined || input === null) {
        throw new Error("Missing the required parameter 'input' when calling convertWebUrlToPdf");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/web/url/to/pdf', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the convertWebUrlToScreenshot operation.
     * @callback module:api/ConvertWebApi~convertWebUrlToScreenshotCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Take screenshot of URL
     * Fully renders a website and returns a PNG screenshot of the full page image.  Javascript, HTML5, CSS and other advanced features are all supported.
     * @param {module:model/ScreenshotRequest} input Screenshot request parameters
     * @param {module:api/ConvertWebApi~convertWebUrlToScreenshotCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.convertWebUrlToScreenshot = function(input, callback) {
      var postBody = input;

      // verify the required parameter 'input' is set
      if (input === undefined || input === null) {
        throw new Error("Missing the required parameter 'input' when calling convertWebUrlToScreenshot");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/web/url/to/screenshot', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":9,"../model/HtmlMdResult":70,"../model/HtmlToOfficeRequest":74,"../model/HtmlToPdfRequest":75,"../model/ScreenshotRequest":86}],16:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxInsertImageRequest', 'model/DocxInsertImageResponse', 'model/DocxRemoveObjectRequest', 'model/DocxRemoveObjectResponse', 'model/DocxSetFooterRequest', 'model/DocxSetFooterResponse', 'model/DocxSetHeaderRequest', 'model/DocxSetHeaderResponse', 'model/FinishEditingRequest', 'model/GetDocxBodyRequest', 'model/GetDocxBodyResponse', 'model/GetDocxHeadersAndFootersRequest', 'model/GetDocxHeadersAndFootersResponse', 'model/GetDocxImagesRequest', 'model/GetDocxImagesResponse', 'model/GetDocxSectionsRequest', 'model/GetDocxSectionsResponse', 'model/GetDocxStylesRequest', 'model/GetDocxStylesResponse', 'model/GetDocxTablesRequest', 'model/GetDocxTablesResponse', 'model/GetXlsxColumnsRequest', 'model/GetXlsxColumnsResponse', 'model/GetXlsxImagesRequest', 'model/GetXlsxImagesResponse', 'model/GetXlsxRowsAndCellsRequest', 'model/GetXlsxRowsAndCellsResponse', 'model/GetXlsxStylesRequest', 'model/GetXlsxStylesResponse', 'model/GetXlsxWorksheetsRequest', 'model/GetXlsxWorksheetsResponse', 'model/InsertDocxInsertParagraphRequest', 'model/InsertDocxInsertParagraphResponse', 'model/InsertDocxTablesRequest', 'model/InsertDocxTablesResponse', 'model/InsertXlsxWorksheetRequest', 'model/InsertXlsxWorksheetResponse', 'model/RemoveDocxHeadersAndFootersRequest', 'model/RemoveDocxHeadersAndFootersResponse', 'model/ReplaceStringRequest'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/DocxInsertImageRequest'), require('../model/DocxInsertImageResponse'), require('../model/DocxRemoveObjectRequest'), require('../model/DocxRemoveObjectResponse'), require('../model/DocxSetFooterRequest'), require('../model/DocxSetFooterResponse'), require('../model/DocxSetHeaderRequest'), require('../model/DocxSetHeaderResponse'), require('../model/FinishEditingRequest'), require('../model/GetDocxBodyRequest'), require('../model/GetDocxBodyResponse'), require('../model/GetDocxHeadersAndFootersRequest'), require('../model/GetDocxHeadersAndFootersResponse'), require('../model/GetDocxImagesRequest'), require('../model/GetDocxImagesResponse'), require('../model/GetDocxSectionsRequest'), require('../model/GetDocxSectionsResponse'), require('../model/GetDocxStylesRequest'), require('../model/GetDocxStylesResponse'), require('../model/GetDocxTablesRequest'), require('../model/GetDocxTablesResponse'), require('../model/GetXlsxColumnsRequest'), require('../model/GetXlsxColumnsResponse'), require('../model/GetXlsxImagesRequest'), require('../model/GetXlsxImagesResponse'), require('../model/GetXlsxRowsAndCellsRequest'), require('../model/GetXlsxRowsAndCellsResponse'), require('../model/GetXlsxStylesRequest'), require('../model/GetXlsxStylesResponse'), require('../model/GetXlsxWorksheetsRequest'), require('../model/GetXlsxWorksheetsResponse'), require('../model/InsertDocxInsertParagraphRequest'), require('../model/InsertDocxInsertParagraphResponse'), require('../model/InsertDocxTablesRequest'), require('../model/InsertDocxTablesResponse'), require('../model/InsertXlsxWorksheetRequest'), require('../model/InsertXlsxWorksheetResponse'), require('../model/RemoveDocxHeadersAndFootersRequest'), require('../model/RemoveDocxHeadersAndFootersResponse'), require('../model/ReplaceStringRequest'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.EditDocumentApi = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxInsertImageRequest, root.CloudmersiveConvertApiClient.DocxInsertImageResponse, root.CloudmersiveConvertApiClient.DocxRemoveObjectRequest, root.CloudmersiveConvertApiClient.DocxRemoveObjectResponse, root.CloudmersiveConvertApiClient.DocxSetFooterRequest, root.CloudmersiveConvertApiClient.DocxSetFooterResponse, root.CloudmersiveConvertApiClient.DocxSetHeaderRequest, root.CloudmersiveConvertApiClient.DocxSetHeaderResponse, root.CloudmersiveConvertApiClient.FinishEditingRequest, root.CloudmersiveConvertApiClient.GetDocxBodyRequest, root.CloudmersiveConvertApiClient.GetDocxBodyResponse, root.CloudmersiveConvertApiClient.GetDocxHeadersAndFootersRequest, root.CloudmersiveConvertApiClient.GetDocxHeadersAndFootersResponse, root.CloudmersiveConvertApiClient.GetDocxImagesRequest, root.CloudmersiveConvertApiClient.GetDocxImagesResponse, root.CloudmersiveConvertApiClient.GetDocxSectionsRequest, root.CloudmersiveConvertApiClient.GetDocxSectionsResponse, root.CloudmersiveConvertApiClient.GetDocxStylesRequest, root.CloudmersiveConvertApiClient.GetDocxStylesResponse, root.CloudmersiveConvertApiClient.GetDocxTablesRequest, root.CloudmersiveConvertApiClient.GetDocxTablesResponse, root.CloudmersiveConvertApiClient.GetXlsxColumnsRequest, root.CloudmersiveConvertApiClient.GetXlsxColumnsResponse, root.CloudmersiveConvertApiClient.GetXlsxImagesRequest, root.CloudmersiveConvertApiClient.GetXlsxImagesResponse, root.CloudmersiveConvertApiClient.GetXlsxRowsAndCellsRequest, root.CloudmersiveConvertApiClient.GetXlsxRowsAndCellsResponse, root.CloudmersiveConvertApiClient.GetXlsxStylesRequest, root.CloudmersiveConvertApiClient.GetXlsxStylesResponse, root.CloudmersiveConvertApiClient.GetXlsxWorksheetsRequest, root.CloudmersiveConvertApiClient.GetXlsxWorksheetsResponse, root.CloudmersiveConvertApiClient.InsertDocxInsertParagraphRequest, root.CloudmersiveConvertApiClient.InsertDocxInsertParagraphResponse, root.CloudmersiveConvertApiClient.InsertDocxTablesRequest, root.CloudmersiveConvertApiClient.InsertDocxTablesResponse, root.CloudmersiveConvertApiClient.InsertXlsxWorksheetRequest, root.CloudmersiveConvertApiClient.InsertXlsxWorksheetResponse, root.CloudmersiveConvertApiClient.RemoveDocxHeadersAndFootersRequest, root.CloudmersiveConvertApiClient.RemoveDocxHeadersAndFootersResponse, root.CloudmersiveConvertApiClient.ReplaceStringRequest);
  }
}(this, function(ApiClient, DocxInsertImageRequest, DocxInsertImageResponse, DocxRemoveObjectRequest, DocxRemoveObjectResponse, DocxSetFooterRequest, DocxSetFooterResponse, DocxSetHeaderRequest, DocxSetHeaderResponse, FinishEditingRequest, GetDocxBodyRequest, GetDocxBodyResponse, GetDocxHeadersAndFootersRequest, GetDocxHeadersAndFootersResponse, GetDocxImagesRequest, GetDocxImagesResponse, GetDocxSectionsRequest, GetDocxSectionsResponse, GetDocxStylesRequest, GetDocxStylesResponse, GetDocxTablesRequest, GetDocxTablesResponse, GetXlsxColumnsRequest, GetXlsxColumnsResponse, GetXlsxImagesRequest, GetXlsxImagesResponse, GetXlsxRowsAndCellsRequest, GetXlsxRowsAndCellsResponse, GetXlsxStylesRequest, GetXlsxStylesResponse, GetXlsxWorksheetsRequest, GetXlsxWorksheetsResponse, InsertDocxInsertParagraphRequest, InsertDocxInsertParagraphResponse, InsertDocxTablesRequest, InsertDocxTablesResponse, InsertXlsxWorksheetRequest, InsertXlsxWorksheetResponse, RemoveDocxHeadersAndFootersRequest, RemoveDocxHeadersAndFootersResponse, ReplaceStringRequest) {
  'use strict';

  /**
   * EditDocument service.
   * @module api/EditDocumentApi
   * @version 1.2.7
   */

  /**
   * Constructs a new EditDocumentApi. 
   * @alias module:api/EditDocumentApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the editDocumentBeginEditing operation.
     * @callback module:api/EditDocumentApi~editDocumentBeginEditingCallback
     * @param {String} error Error message, if any.
     * @param {'String'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Begin editing a document
     * Uploads a document to Cloudmersive to begin a series of one or more editing operations
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/EditDocumentApi~editDocumentBeginEditingCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'String'}
     */
    this.editDocumentBeginEditing = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling editDocumentBeginEditing");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'String';

      return this.apiClient.callApi(
        '/convert/edit/begin-editing', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxBody operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxBodyCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetDocxBodyResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get body from a DOCX
     * Returns the body defined in the Word Document (DOCX) format file; this is the main content part of a DOCX document
     * @param {module:model/GetDocxBodyRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxBodyCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetDocxBodyResponse}
     */
    this.editDocumentDocxBody = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxBody");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = GetDocxBodyResponse;

      return this.apiClient.callApi(
        '/convert/edit/docx/get-body', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxGetHeadersAndFooters operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxGetHeadersAndFootersCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetDocxHeadersAndFootersResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get content of a footer from a DOCX
     * Returns the footer content from a Word Document (DOCX) format file
     * @param {module:model/GetDocxHeadersAndFootersRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxGetHeadersAndFootersCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetDocxHeadersAndFootersResponse}
     */
    this.editDocumentDocxGetHeadersAndFooters = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxGetHeadersAndFooters");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = GetDocxHeadersAndFootersResponse;

      return this.apiClient.callApi(
        '/convert/edit/docx/get-headers-and-footers', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxGetImages operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxGetImagesCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetDocxImagesResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get images from a DOCX
     * Returns the images defined in the Word Document (DOCX) format file
     * @param {module:model/GetDocxImagesRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxGetImagesCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetDocxImagesResponse}
     */
    this.editDocumentDocxGetImages = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxGetImages");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = GetDocxImagesResponse;

      return this.apiClient.callApi(
        '/convert/edit/docx/get-images', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxGetSections operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxGetSectionsCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetDocxSectionsResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get sections from a DOCX
     * Returns the sections defined in the Word Document (DOCX) format file
     * @param {module:model/GetDocxSectionsRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxGetSectionsCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetDocxSectionsResponse}
     */
    this.editDocumentDocxGetSections = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxGetSections");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = GetDocxSectionsResponse;

      return this.apiClient.callApi(
        '/convert/edit/docx/get-sections', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxGetStyles operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxGetStylesCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetDocxStylesResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get styles from a DOCX
     * Returns the styles defined in the Word Document (DOCX) format file
     * @param {module:model/GetDocxStylesRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxGetStylesCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetDocxStylesResponse}
     */
    this.editDocumentDocxGetStyles = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxGetStyles");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = GetDocxStylesResponse;

      return this.apiClient.callApi(
        '/convert/edit/docx/get-styles', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxGetTables operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxGetTablesCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetDocxTablesResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get tables in DOCX
     * Returns all the table objects in an Office Word Document (docx)
     * @param {module:model/GetDocxTablesRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxGetTablesCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetDocxTablesResponse}
     */
    this.editDocumentDocxGetTables = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxGetTables");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = GetDocxTablesResponse;

      return this.apiClient.callApi(
        '/convert/edit/docx/get-tables', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxInsertImage operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxInsertImageCallback
     * @param {String} error Error message, if any.
     * @param {module:model/DocxInsertImageResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Insert image into a DOCX
     * Set the footer in a Word Document (DOCX)
     * @param {module:model/DocxInsertImageRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxInsertImageCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/DocxInsertImageResponse}
     */
    this.editDocumentDocxInsertImage = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxInsertImage");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = DocxInsertImageResponse;

      return this.apiClient.callApi(
        '/convert/edit/docx/insert-image', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxInsertParagraph operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxInsertParagraphCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InsertDocxInsertParagraphResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Insert a new paragraph into a DOCX
     * Adds a new paragraph into a DOCX and returns the result.  You can insert at the beginning/end of a document, or before/after an existing object using its Path (location within the document).
     * @param {module:model/InsertDocxInsertParagraphRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxInsertParagraphCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InsertDocxInsertParagraphResponse}
     */
    this.editDocumentDocxInsertParagraph = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxInsertParagraph");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = InsertDocxInsertParagraphResponse;

      return this.apiClient.callApi(
        '/convert/edit/docx/insert-paragraph', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxInsertTable operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxInsertTableCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InsertDocxTablesResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Insert a new table into a DOCX
     * Adds a new table into a DOCX and returns the result
     * @param {module:model/InsertDocxTablesRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxInsertTableCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InsertDocxTablesResponse}
     */
    this.editDocumentDocxInsertTable = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxInsertTable");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = InsertDocxTablesResponse;

      return this.apiClient.callApi(
        '/convert/edit/docx/insert-table', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxRemoveHeadersAndFooters operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxRemoveHeadersAndFootersCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RemoveDocxHeadersAndFootersResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Remove headers and footers from DOCX
     * Remove all headers, or footers, or both from a Word Document (DOCX)
     * @param {module:model/RemoveDocxHeadersAndFootersRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxRemoveHeadersAndFootersCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/RemoveDocxHeadersAndFootersResponse}
     */
    this.editDocumentDocxRemoveHeadersAndFooters = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxRemoveHeadersAndFooters");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = RemoveDocxHeadersAndFootersResponse;

      return this.apiClient.callApi(
        '/convert/edit/docx/remove-headers-and-footers', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxRemoveObject operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxRemoveObjectCallback
     * @param {String} error Error message, if any.
     * @param {module:model/DocxRemoveObjectResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Delete any object in a DOCX
     * Delete any object, such as a paragraph, table, image, etc. from a Word Document (DOCX).  Pass in the Path of the object you would like to delete.  You can call other functions such as Get-Tables, Get-Images, Get-Body, etc. to get the paths of the objects in the document.
     * @param {module:model/DocxRemoveObjectRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxRemoveObjectCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/DocxRemoveObjectResponse}
     */
    this.editDocumentDocxRemoveObject = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxRemoveObject");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = DocxRemoveObjectResponse;

      return this.apiClient.callApi(
        '/convert/edit/docx/remove-object', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxReplace operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxReplaceCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Replace string in DOCX
     * Replace all instances of a string in an Office Word Document (docx)
     * @param {module:model/ReplaceStringRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxReplaceCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.editDocumentDocxReplace = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxReplace");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/edit/docx/replace-all', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxSetFooter operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxSetFooterCallback
     * @param {String} error Error message, if any.
     * @param {module:model/DocxSetFooterResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Set the footer in a DOCX
     * Set the footer in a Word Document (DOCX)
     * @param {module:model/DocxSetFooterRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxSetFooterCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/DocxSetFooterResponse}
     */
    this.editDocumentDocxSetFooter = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxSetFooter");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = DocxSetFooterResponse;

      return this.apiClient.callApi(
        '/convert/edit/docx/set-footer', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentDocxSetHeader operation.
     * @callback module:api/EditDocumentApi~editDocumentDocxSetHeaderCallback
     * @param {String} error Error message, if any.
     * @param {module:model/DocxSetHeaderResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Set the header in a DOCX
     * Set the header in a Word Document (DOCX)
     * @param {module:model/DocxSetHeaderRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentDocxSetHeaderCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/DocxSetHeaderResponse}
     */
    this.editDocumentDocxSetHeader = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentDocxSetHeader");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = DocxSetHeaderResponse;

      return this.apiClient.callApi(
        '/convert/edit/docx/set-header', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentFinishEditing operation.
     * @callback module:api/EditDocumentApi~editDocumentFinishEditingCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Download result from document editing
     * Once done editing a document, download the result.  Begin editing a document by calling begin-editing, then perform operations, then call finish-editing to get the result.
     * @param {module:model/FinishEditingRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentFinishEditingCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.editDocumentFinishEditing = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentFinishEditing");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/edit/finish-editing', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentPptxReplace operation.
     * @callback module:api/EditDocumentApi~editDocumentPptxReplaceCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Replace string in PPTX
     * Replace all instances of a string in an Office PowerPoint Document (pptx)
     * @param {module:model/ReplaceStringRequest} reqConfig 
     * @param {module:api/EditDocumentApi~editDocumentPptxReplaceCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.editDocumentPptxReplace = function(reqConfig, callback) {
      var postBody = reqConfig;

      // verify the required parameter 'reqConfig' is set
      if (reqConfig === undefined || reqConfig === null) {
        throw new Error("Missing the required parameter 'reqConfig' when calling editDocumentPptxReplace");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/edit/pptx/replace-all', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentXlsxGetColumns operation.
     * @callback module:api/EditDocumentApi~editDocumentXlsxGetColumnsCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetXlsxColumnsResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get rows and cells from a XLSX worksheet
     * Returns the rows and cells defined in the Excel Spreadsheet worksheet
     * @param {module:model/GetXlsxColumnsRequest} input 
     * @param {module:api/EditDocumentApi~editDocumentXlsxGetColumnsCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetXlsxColumnsResponse}
     */
    this.editDocumentXlsxGetColumns = function(input, callback) {
      var postBody = input;

      // verify the required parameter 'input' is set
      if (input === undefined || input === null) {
        throw new Error("Missing the required parameter 'input' when calling editDocumentXlsxGetColumns");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = GetXlsxColumnsResponse;

      return this.apiClient.callApi(
        '/convert/edit/xlsx/get-columns', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentXlsxGetImages operation.
     * @callback module:api/EditDocumentApi~editDocumentXlsxGetImagesCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetXlsxImagesResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get images from a XLSX worksheet
     * Returns the images defined in the Excel Spreadsheet worksheet
     * @param {module:model/GetXlsxImagesRequest} input 
     * @param {module:api/EditDocumentApi~editDocumentXlsxGetImagesCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetXlsxImagesResponse}
     */
    this.editDocumentXlsxGetImages = function(input, callback) {
      var postBody = input;

      // verify the required parameter 'input' is set
      if (input === undefined || input === null) {
        throw new Error("Missing the required parameter 'input' when calling editDocumentXlsxGetImages");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = GetXlsxImagesResponse;

      return this.apiClient.callApi(
        '/convert/edit/xlsx/get-images', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentXlsxGetRowsAndCells operation.
     * @callback module:api/EditDocumentApi~editDocumentXlsxGetRowsAndCellsCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetXlsxRowsAndCellsResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get rows and cells from a XLSX worksheet
     * Returns the rows and cells defined in the Excel Spreadsheet worksheet
     * @param {module:model/GetXlsxRowsAndCellsRequest} input 
     * @param {module:api/EditDocumentApi~editDocumentXlsxGetRowsAndCellsCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetXlsxRowsAndCellsResponse}
     */
    this.editDocumentXlsxGetRowsAndCells = function(input, callback) {
      var postBody = input;

      // verify the required parameter 'input' is set
      if (input === undefined || input === null) {
        throw new Error("Missing the required parameter 'input' when calling editDocumentXlsxGetRowsAndCells");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = GetXlsxRowsAndCellsResponse;

      return this.apiClient.callApi(
        '/convert/edit/xlsx/get-rows-and-cells', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentXlsxGetStyles operation.
     * @callback module:api/EditDocumentApi~editDocumentXlsxGetStylesCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetXlsxStylesResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get styles from a XLSX worksheet
     * Returns the style defined in the Excel Spreadsheet
     * @param {module:model/GetXlsxStylesRequest} input 
     * @param {module:api/EditDocumentApi~editDocumentXlsxGetStylesCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetXlsxStylesResponse}
     */
    this.editDocumentXlsxGetStyles = function(input, callback) {
      var postBody = input;

      // verify the required parameter 'input' is set
      if (input === undefined || input === null) {
        throw new Error("Missing the required parameter 'input' when calling editDocumentXlsxGetStyles");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = GetXlsxStylesResponse;

      return this.apiClient.callApi(
        '/convert/edit/xlsx/get-styles', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentXlsxGetWorksheets operation.
     * @callback module:api/EditDocumentApi~editDocumentXlsxGetWorksheetsCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetXlsxWorksheetsResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get worksheets from a XLSX
     * Returns the worksheets (tabs) defined in the Excel Spreadsheet (XLSX) format file
     * @param {module:model/GetXlsxWorksheetsRequest} input 
     * @param {module:api/EditDocumentApi~editDocumentXlsxGetWorksheetsCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetXlsxWorksheetsResponse}
     */
    this.editDocumentXlsxGetWorksheets = function(input, callback) {
      var postBody = input;

      // verify the required parameter 'input' is set
      if (input === undefined || input === null) {
        throw new Error("Missing the required parameter 'input' when calling editDocumentXlsxGetWorksheets");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = GetXlsxWorksheetsResponse;

      return this.apiClient.callApi(
        '/convert/edit/xlsx/get-worksheets', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDocumentXlsxInsertWorksheet operation.
     * @callback module:api/EditDocumentApi~editDocumentXlsxInsertWorksheetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InsertXlsxWorksheetResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Insert a new worksheet into an XLSX spreadsheet
     * Inserts a new worksheet into an Excel Spreadsheet
     * @param {module:model/InsertXlsxWorksheetRequest} input 
     * @param {module:api/EditDocumentApi~editDocumentXlsxInsertWorksheetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InsertXlsxWorksheetResponse}
     */
    this.editDocumentXlsxInsertWorksheet = function(input, callback) {
      var postBody = input;

      // verify the required parameter 'input' is set
      if (input === undefined || input === null) {
        throw new Error("Missing the required parameter 'input' when calling editDocumentXlsxInsertWorksheet");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/octet-stream'];
      var returnType = InsertXlsxWorksheetResponse;

      return this.apiClient.callApi(
        '/convert/edit/xlsx/insert-worksheet', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":9,"../model/DocxInsertImageRequest":29,"../model/DocxInsertImageResponse":30,"../model/DocxRemoveObjectRequest":32,"../model/DocxRemoveObjectResponse":33,"../model/DocxSetFooterRequest":36,"../model/DocxSetFooterResponse":37,"../model/DocxSetHeaderRequest":38,"../model/DocxSetHeaderResponse":39,"../model/FinishEditingRequest":46,"../model/GetDocxBodyRequest":47,"../model/GetDocxBodyResponse":48,"../model/GetDocxHeadersAndFootersRequest":49,"../model/GetDocxHeadersAndFootersResponse":50,"../model/GetDocxImagesRequest":51,"../model/GetDocxImagesResponse":52,"../model/GetDocxSectionsRequest":53,"../model/GetDocxSectionsResponse":54,"../model/GetDocxStylesRequest":55,"../model/GetDocxStylesResponse":56,"../model/GetDocxTablesRequest":57,"../model/GetDocxTablesResponse":58,"../model/GetXlsxColumnsRequest":60,"../model/GetXlsxColumnsResponse":61,"../model/GetXlsxImagesRequest":62,"../model/GetXlsxImagesResponse":63,"../model/GetXlsxRowsAndCellsRequest":64,"../model/GetXlsxRowsAndCellsResponse":65,"../model/GetXlsxStylesRequest":66,"../model/GetXlsxStylesResponse":67,"../model/GetXlsxWorksheetsRequest":68,"../model/GetXlsxWorksheetsResponse":69,"../model/InsertDocxInsertParagraphRequest":76,"../model/InsertDocxInsertParagraphResponse":77,"../model/InsertDocxTablesRequest":78,"../model/InsertDocxTablesResponse":79,"../model/InsertXlsxWorksheetRequest":80,"../model/InsertXlsxWorksheetResponse":81,"../model/RemoveDocxHeadersAndFootersRequest":83,"../model/RemoveDocxHeadersAndFootersResponse":84,"../model/ReplaceStringRequest":85}],17:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.MergeDocumentApi = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * MergeDocument service.
   * @module api/MergeDocumentApi
   * @version 1.2.7
   */

  /**
   * Constructs a new MergeDocumentApi. 
   * @alias module:api/MergeDocumentApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the mergeDocumentDocx operation.
     * @callback module:api/MergeDocumentApi~mergeDocumentDocxCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Merge Multple Word DOCX Together
     * Combine multiple Office Word Documents (docx) into one single Office Word document
     * @param {File} inputFile1 First input file to perform the operation on.
     * @param {File} inputFile2 Second input file to perform the operation on (more than 2 can be supplied).
     * @param {module:api/MergeDocumentApi~mergeDocumentDocxCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.mergeDocumentDocx = function(inputFile1, inputFile2, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile1' is set
      if (inputFile1 === undefined || inputFile1 === null) {
        throw new Error("Missing the required parameter 'inputFile1' when calling mergeDocumentDocx");
      }

      // verify the required parameter 'inputFile2' is set
      if (inputFile2 === undefined || inputFile2 === null) {
        throw new Error("Missing the required parameter 'inputFile2' when calling mergeDocumentDocx");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile1': inputFile1,
        'inputFile2': inputFile2
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/merge/docx', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the mergeDocumentPptx operation.
     * @callback module:api/MergeDocumentApi~mergeDocumentPptxCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Merge Multple PowerPoint PPTX Together
     * Combine multiple Office PowerPoint presentations (pptx) into one single Office PowerPoint presentation
     * @param {File} inputFile1 First input file to perform the operation on.
     * @param {File} inputFile2 Second input file to perform the operation on (more than 2 can be supplied).
     * @param {module:api/MergeDocumentApi~mergeDocumentPptxCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.mergeDocumentPptx = function(inputFile1, inputFile2, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile1' is set
      if (inputFile1 === undefined || inputFile1 === null) {
        throw new Error("Missing the required parameter 'inputFile1' when calling mergeDocumentPptx");
      }

      // verify the required parameter 'inputFile2' is set
      if (inputFile2 === undefined || inputFile2 === null) {
        throw new Error("Missing the required parameter 'inputFile2' when calling mergeDocumentPptx");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile1': inputFile1,
        'inputFile2': inputFile2
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/merge/pptx', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the mergeDocumentXlsx operation.
     * @callback module:api/MergeDocumentApi~mergeDocumentXlsxCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Merge Multple Excel XLSX Together
     * Combine multiple Office Excel spreadsheets (xlsx) into a single Office Excel spreadsheet
     * @param {File} inputFile1 First input file to perform the operation on.
     * @param {File} inputFile2 Second input file to perform the operation on (more than 2 can be supplied).
     * @param {module:api/MergeDocumentApi~mergeDocumentXlsxCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.mergeDocumentXlsx = function(inputFile1, inputFile2, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile1' is set
      if (inputFile1 === undefined || inputFile1 === null) {
        throw new Error("Missing the required parameter 'inputFile1' when calling mergeDocumentXlsx");
      }

      // verify the required parameter 'inputFile2' is set
      if (inputFile2 === undefined || inputFile2 === null) {
        throw new Error("Missing the required parameter 'inputFile2' when calling mergeDocumentXlsx");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile1': inputFile1,
        'inputFile2': inputFile2
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/convert/merge/xlsx', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":9}],18:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocumentValidationResult'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/DocumentValidationResult'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.ValidateDocumentApi = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocumentValidationResult);
  }
}(this, function(ApiClient, DocumentValidationResult) {
  'use strict';

  /**
   * ValidateDocument service.
   * @module api/ValidateDocumentApi
   * @version 1.2.7
   */

  /**
   * Constructs a new ValidateDocumentApi. 
   * @alias module:api/ValidateDocumentApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the validateDocumentDocxValidation operation.
     * @callback module:api/ValidateDocumentApi~validateDocumentDocxValidationCallback
     * @param {String} error Error message, if any.
     * @param {module:model/DocumentValidationResult} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Validate a Word document (DOCX)
     * Validate a Word document (DOCX); if the document is not valid, identifies the errors in the document
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ValidateDocumentApi~validateDocumentDocxValidationCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/DocumentValidationResult}
     */
    this.validateDocumentDocxValidation = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling validateDocumentDocxValidation");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = DocumentValidationResult;

      return this.apiClient.callApi(
        '/convert/validate/docx', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the validateDocumentPptxValidation operation.
     * @callback module:api/ValidateDocumentApi~validateDocumentPptxValidationCallback
     * @param {String} error Error message, if any.
     * @param {module:model/DocumentValidationResult} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Validate a PowerPoint presentation (PPTX)
     * Validate a PowerPoint presentation (PPTX); if the document is not valid, identifies the errors in the document
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ValidateDocumentApi~validateDocumentPptxValidationCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/DocumentValidationResult}
     */
    this.validateDocumentPptxValidation = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling validateDocumentPptxValidation");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = DocumentValidationResult;

      return this.apiClient.callApi(
        '/convert/validate/pptx', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the validateDocumentXlsxValidation operation.
     * @callback module:api/ValidateDocumentApi~validateDocumentXlsxValidationCallback
     * @param {String} error Error message, if any.
     * @param {module:model/DocumentValidationResult} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Validate a Excel document (XLSX)
     * Validate a Excel document (XLSX); if the document is not valid, identifies the errors in the document
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ValidateDocumentApi~validateDocumentXlsxValidationCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/DocumentValidationResult}
     */
    this.validateDocumentXlsxValidation = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling validateDocumentXlsxValidation");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = DocumentValidationResult;

      return this.apiClient.callApi(
        '/convert/validate/xlsx', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":9,"../model/DocumentValidationResult":23}],19:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/ViewerResponse'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/ViewerResponse'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.ViewerToolsApi = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.ViewerResponse);
  }
}(this, function(ApiClient, ViewerResponse) {
  'use strict';

  /**
   * ViewerTools service.
   * @module api/ViewerToolsApi
   * @version 1.2.7
   */

  /**
   * Constructs a new ViewerToolsApi. 
   * @alias module:api/ViewerToolsApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the viewerToolsCreateSimple operation.
     * @callback module:api/ViewerToolsApi~viewerToolsCreateSimpleCallback
     * @param {String} error Error message, if any.
     * @param {module:model/ViewerResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Create a web-based viewer
     * Creates an HTML embed code for a simple web-based viewer of a document; supports Office document types and PDF.
     * @param {File} inputFile Input file to perform the operation on.
     * @param {module:api/ViewerToolsApi~viewerToolsCreateSimpleCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/ViewerResponse}
     */
    this.viewerToolsCreateSimple = function(inputFile, callback) {
      var postBody = null;

      // verify the required parameter 'inputFile' is set
      if (inputFile === undefined || inputFile === null) {
        throw new Error("Missing the required parameter 'inputFile' when calling viewerToolsCreateSimple");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'inputFile': inputFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = ViewerResponse;

      return this.apiClient.callApi(
        '/convert/viewer/create/web/simple', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":9,"../model/ViewerResponse":87}],20:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/ConvertedPngPage', 'model/DocumentValidationError', 'model/DocumentValidationResult', 'model/DocxBody', 'model/DocxCellStyle', 'model/DocxFooter', 'model/DocxHeader', 'model/DocxImage', 'model/DocxInsertImageRequest', 'model/DocxInsertImageResponse', 'model/DocxParagraph', 'model/DocxRemoveObjectRequest', 'model/DocxRemoveObjectResponse', 'model/DocxRun', 'model/DocxSection', 'model/DocxSetFooterRequest', 'model/DocxSetFooterResponse', 'model/DocxSetHeaderRequest', 'model/DocxSetHeaderResponse', 'model/DocxStyle', 'model/DocxTable', 'model/DocxTableCell', 'model/DocxTableRow', 'model/DocxText', 'model/ExifValue', 'model/FinishEditingRequest', 'model/GetDocxBodyRequest', 'model/GetDocxBodyResponse', 'model/GetDocxHeadersAndFootersRequest', 'model/GetDocxHeadersAndFootersResponse', 'model/GetDocxImagesRequest', 'model/GetDocxImagesResponse', 'model/GetDocxSectionsRequest', 'model/GetDocxSectionsResponse', 'model/GetDocxStylesRequest', 'model/GetDocxStylesResponse', 'model/GetDocxTablesRequest', 'model/GetDocxTablesResponse', 'model/GetImageInfoResult', 'model/GetXlsxColumnsRequest', 'model/GetXlsxColumnsResponse', 'model/GetXlsxImagesRequest', 'model/GetXlsxImagesResponse', 'model/GetXlsxRowsAndCellsRequest', 'model/GetXlsxRowsAndCellsResponse', 'model/GetXlsxStylesRequest', 'model/GetXlsxStylesResponse', 'model/GetXlsxWorksheetsRequest', 'model/GetXlsxWorksheetsResponse', 'model/HtmlMdResult', 'model/HtmlTemplateApplicationRequest', 'model/HtmlTemplateApplicationResponse', 'model/HtmlTemplateOperation', 'model/HtmlToOfficeRequest', 'model/HtmlToPdfRequest', 'model/InsertDocxInsertParagraphRequest', 'model/InsertDocxInsertParagraphResponse', 'model/InsertDocxTablesRequest', 'model/InsertDocxTablesResponse', 'model/InsertXlsxWorksheetRequest', 'model/InsertXlsxWorksheetResponse', 'model/PdfToPngResult', 'model/RemoveDocxHeadersAndFootersRequest', 'model/RemoveDocxHeadersAndFootersResponse', 'model/ReplaceStringRequest', 'model/ScreenshotRequest', 'model/ViewerResponse', 'model/XlsxImage', 'model/XlsxSpreadsheetCell', 'model/XlsxSpreadsheetColumn', 'model/XlsxSpreadsheetRow', 'model/XlsxWorksheet', 'api/CompareDocumentApi', 'api/ConvertDataApi', 'api/ConvertDocumentApi', 'api/ConvertImageApi', 'api/ConvertTemplateApi', 'api/ConvertWebApi', 'api/EditDocumentApi', 'api/MergeDocumentApi', 'api/ValidateDocumentApi', 'api/ViewerToolsApi'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('./ApiClient'), require('./model/ConvertedPngPage'), require('./model/DocumentValidationError'), require('./model/DocumentValidationResult'), require('./model/DocxBody'), require('./model/DocxCellStyle'), require('./model/DocxFooter'), require('./model/DocxHeader'), require('./model/DocxImage'), require('./model/DocxInsertImageRequest'), require('./model/DocxInsertImageResponse'), require('./model/DocxParagraph'), require('./model/DocxRemoveObjectRequest'), require('./model/DocxRemoveObjectResponse'), require('./model/DocxRun'), require('./model/DocxSection'), require('./model/DocxSetFooterRequest'), require('./model/DocxSetFooterResponse'), require('./model/DocxSetHeaderRequest'), require('./model/DocxSetHeaderResponse'), require('./model/DocxStyle'), require('./model/DocxTable'), require('./model/DocxTableCell'), require('./model/DocxTableRow'), require('./model/DocxText'), require('./model/ExifValue'), require('./model/FinishEditingRequest'), require('./model/GetDocxBodyRequest'), require('./model/GetDocxBodyResponse'), require('./model/GetDocxHeadersAndFootersRequest'), require('./model/GetDocxHeadersAndFootersResponse'), require('./model/GetDocxImagesRequest'), require('./model/GetDocxImagesResponse'), require('./model/GetDocxSectionsRequest'), require('./model/GetDocxSectionsResponse'), require('./model/GetDocxStylesRequest'), require('./model/GetDocxStylesResponse'), require('./model/GetDocxTablesRequest'), require('./model/GetDocxTablesResponse'), require('./model/GetImageInfoResult'), require('./model/GetXlsxColumnsRequest'), require('./model/GetXlsxColumnsResponse'), require('./model/GetXlsxImagesRequest'), require('./model/GetXlsxImagesResponse'), require('./model/GetXlsxRowsAndCellsRequest'), require('./model/GetXlsxRowsAndCellsResponse'), require('./model/GetXlsxStylesRequest'), require('./model/GetXlsxStylesResponse'), require('./model/GetXlsxWorksheetsRequest'), require('./model/GetXlsxWorksheetsResponse'), require('./model/HtmlMdResult'), require('./model/HtmlTemplateApplicationRequest'), require('./model/HtmlTemplateApplicationResponse'), require('./model/HtmlTemplateOperation'), require('./model/HtmlToOfficeRequest'), require('./model/HtmlToPdfRequest'), require('./model/InsertDocxInsertParagraphRequest'), require('./model/InsertDocxInsertParagraphResponse'), require('./model/InsertDocxTablesRequest'), require('./model/InsertDocxTablesResponse'), require('./model/InsertXlsxWorksheetRequest'), require('./model/InsertXlsxWorksheetResponse'), require('./model/PdfToPngResult'), require('./model/RemoveDocxHeadersAndFootersRequest'), require('./model/RemoveDocxHeadersAndFootersResponse'), require('./model/ReplaceStringRequest'), require('./model/ScreenshotRequest'), require('./model/ViewerResponse'), require('./model/XlsxImage'), require('./model/XlsxSpreadsheetCell'), require('./model/XlsxSpreadsheetColumn'), require('./model/XlsxSpreadsheetRow'), require('./model/XlsxWorksheet'), require('./api/CompareDocumentApi'), require('./api/ConvertDataApi'), require('./api/ConvertDocumentApi'), require('./api/ConvertImageApi'), require('./api/ConvertTemplateApi'), require('./api/ConvertWebApi'), require('./api/EditDocumentApi'), require('./api/MergeDocumentApi'), require('./api/ValidateDocumentApi'), require('./api/ViewerToolsApi'));
  }
}(function(ApiClient, ConvertedPngPage, DocumentValidationError, DocumentValidationResult, DocxBody, DocxCellStyle, DocxFooter, DocxHeader, DocxImage, DocxInsertImageRequest, DocxInsertImageResponse, DocxParagraph, DocxRemoveObjectRequest, DocxRemoveObjectResponse, DocxRun, DocxSection, DocxSetFooterRequest, DocxSetFooterResponse, DocxSetHeaderRequest, DocxSetHeaderResponse, DocxStyle, DocxTable, DocxTableCell, DocxTableRow, DocxText, ExifValue, FinishEditingRequest, GetDocxBodyRequest, GetDocxBodyResponse, GetDocxHeadersAndFootersRequest, GetDocxHeadersAndFootersResponse, GetDocxImagesRequest, GetDocxImagesResponse, GetDocxSectionsRequest, GetDocxSectionsResponse, GetDocxStylesRequest, GetDocxStylesResponse, GetDocxTablesRequest, GetDocxTablesResponse, GetImageInfoResult, GetXlsxColumnsRequest, GetXlsxColumnsResponse, GetXlsxImagesRequest, GetXlsxImagesResponse, GetXlsxRowsAndCellsRequest, GetXlsxRowsAndCellsResponse, GetXlsxStylesRequest, GetXlsxStylesResponse, GetXlsxWorksheetsRequest, GetXlsxWorksheetsResponse, HtmlMdResult, HtmlTemplateApplicationRequest, HtmlTemplateApplicationResponse, HtmlTemplateOperation, HtmlToOfficeRequest, HtmlToPdfRequest, InsertDocxInsertParagraphRequest, InsertDocxInsertParagraphResponse, InsertDocxTablesRequest, InsertDocxTablesResponse, InsertXlsxWorksheetRequest, InsertXlsxWorksheetResponse, PdfToPngResult, RemoveDocxHeadersAndFootersRequest, RemoveDocxHeadersAndFootersResponse, ReplaceStringRequest, ScreenshotRequest, ViewerResponse, XlsxImage, XlsxSpreadsheetCell, XlsxSpreadsheetColumn, XlsxSpreadsheetRow, XlsxWorksheet, CompareDocumentApi, ConvertDataApi, ConvertDocumentApi, ConvertImageApi, ConvertTemplateApi, ConvertWebApi, EditDocumentApi, MergeDocumentApi, ValidateDocumentApi, ViewerToolsApi) {
  'use strict';

  /**
   * Convert_API_lets_you_effortlessly_convert_file_formats_and_types_.<br>
   * The <code>index</code> module provides access to constructors for all the classes which comprise the public API.
   * <p>
   * An AMD (recommended!) or CommonJS application will generally do something equivalent to the following:
   * <pre>
   * var CloudmersiveConvertApiClient = require('index'); // See note below*.
   * var xxxSvc = new CloudmersiveConvertApiClient.XxxApi(); // Allocate the API class we're going to use.
   * var yyyModel = new CloudmersiveConvertApiClient.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * <em>*NOTE: For a top-level AMD script, use require(['index'], function(){...})
   * and put the application logic within the callback function.</em>
   * </p>
   * <p>
   * A non-AMD browser application (discouraged) might do something like this:
   * <pre>
   * var xxxSvc = new CloudmersiveConvertApiClient.XxxApi(); // Allocate the API class we're going to use.
   * var yyy = new CloudmersiveConvertApiClient.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * </p>
   * @module index
   * @version 1.2.7
   */
  var exports = {
    /**
     * The ApiClient constructor.
     * @property {module:ApiClient}
     */
    ApiClient: ApiClient,
    /**
     * The ConvertedPngPage model constructor.
     * @property {module:model/ConvertedPngPage}
     */
    ConvertedPngPage: ConvertedPngPage,
    /**
     * The DocumentValidationError model constructor.
     * @property {module:model/DocumentValidationError}
     */
    DocumentValidationError: DocumentValidationError,
    /**
     * The DocumentValidationResult model constructor.
     * @property {module:model/DocumentValidationResult}
     */
    DocumentValidationResult: DocumentValidationResult,
    /**
     * The DocxBody model constructor.
     * @property {module:model/DocxBody}
     */
    DocxBody: DocxBody,
    /**
     * The DocxCellStyle model constructor.
     * @property {module:model/DocxCellStyle}
     */
    DocxCellStyle: DocxCellStyle,
    /**
     * The DocxFooter model constructor.
     * @property {module:model/DocxFooter}
     */
    DocxFooter: DocxFooter,
    /**
     * The DocxHeader model constructor.
     * @property {module:model/DocxHeader}
     */
    DocxHeader: DocxHeader,
    /**
     * The DocxImage model constructor.
     * @property {module:model/DocxImage}
     */
    DocxImage: DocxImage,
    /**
     * The DocxInsertImageRequest model constructor.
     * @property {module:model/DocxInsertImageRequest}
     */
    DocxInsertImageRequest: DocxInsertImageRequest,
    /**
     * The DocxInsertImageResponse model constructor.
     * @property {module:model/DocxInsertImageResponse}
     */
    DocxInsertImageResponse: DocxInsertImageResponse,
    /**
     * The DocxParagraph model constructor.
     * @property {module:model/DocxParagraph}
     */
    DocxParagraph: DocxParagraph,
    /**
     * The DocxRemoveObjectRequest model constructor.
     * @property {module:model/DocxRemoveObjectRequest}
     */
    DocxRemoveObjectRequest: DocxRemoveObjectRequest,
    /**
     * The DocxRemoveObjectResponse model constructor.
     * @property {module:model/DocxRemoveObjectResponse}
     */
    DocxRemoveObjectResponse: DocxRemoveObjectResponse,
    /**
     * The DocxRun model constructor.
     * @property {module:model/DocxRun}
     */
    DocxRun: DocxRun,
    /**
     * The DocxSection model constructor.
     * @property {module:model/DocxSection}
     */
    DocxSection: DocxSection,
    /**
     * The DocxSetFooterRequest model constructor.
     * @property {module:model/DocxSetFooterRequest}
     */
    DocxSetFooterRequest: DocxSetFooterRequest,
    /**
     * The DocxSetFooterResponse model constructor.
     * @property {module:model/DocxSetFooterResponse}
     */
    DocxSetFooterResponse: DocxSetFooterResponse,
    /**
     * The DocxSetHeaderRequest model constructor.
     * @property {module:model/DocxSetHeaderRequest}
     */
    DocxSetHeaderRequest: DocxSetHeaderRequest,
    /**
     * The DocxSetHeaderResponse model constructor.
     * @property {module:model/DocxSetHeaderResponse}
     */
    DocxSetHeaderResponse: DocxSetHeaderResponse,
    /**
     * The DocxStyle model constructor.
     * @property {module:model/DocxStyle}
     */
    DocxStyle: DocxStyle,
    /**
     * The DocxTable model constructor.
     * @property {module:model/DocxTable}
     */
    DocxTable: DocxTable,
    /**
     * The DocxTableCell model constructor.
     * @property {module:model/DocxTableCell}
     */
    DocxTableCell: DocxTableCell,
    /**
     * The DocxTableRow model constructor.
     * @property {module:model/DocxTableRow}
     */
    DocxTableRow: DocxTableRow,
    /**
     * The DocxText model constructor.
     * @property {module:model/DocxText}
     */
    DocxText: DocxText,
    /**
     * The ExifValue model constructor.
     * @property {module:model/ExifValue}
     */
    ExifValue: ExifValue,
    /**
     * The FinishEditingRequest model constructor.
     * @property {module:model/FinishEditingRequest}
     */
    FinishEditingRequest: FinishEditingRequest,
    /**
     * The GetDocxBodyRequest model constructor.
     * @property {module:model/GetDocxBodyRequest}
     */
    GetDocxBodyRequest: GetDocxBodyRequest,
    /**
     * The GetDocxBodyResponse model constructor.
     * @property {module:model/GetDocxBodyResponse}
     */
    GetDocxBodyResponse: GetDocxBodyResponse,
    /**
     * The GetDocxHeadersAndFootersRequest model constructor.
     * @property {module:model/GetDocxHeadersAndFootersRequest}
     */
    GetDocxHeadersAndFootersRequest: GetDocxHeadersAndFootersRequest,
    /**
     * The GetDocxHeadersAndFootersResponse model constructor.
     * @property {module:model/GetDocxHeadersAndFootersResponse}
     */
    GetDocxHeadersAndFootersResponse: GetDocxHeadersAndFootersResponse,
    /**
     * The GetDocxImagesRequest model constructor.
     * @property {module:model/GetDocxImagesRequest}
     */
    GetDocxImagesRequest: GetDocxImagesRequest,
    /**
     * The GetDocxImagesResponse model constructor.
     * @property {module:model/GetDocxImagesResponse}
     */
    GetDocxImagesResponse: GetDocxImagesResponse,
    /**
     * The GetDocxSectionsRequest model constructor.
     * @property {module:model/GetDocxSectionsRequest}
     */
    GetDocxSectionsRequest: GetDocxSectionsRequest,
    /**
     * The GetDocxSectionsResponse model constructor.
     * @property {module:model/GetDocxSectionsResponse}
     */
    GetDocxSectionsResponse: GetDocxSectionsResponse,
    /**
     * The GetDocxStylesRequest model constructor.
     * @property {module:model/GetDocxStylesRequest}
     */
    GetDocxStylesRequest: GetDocxStylesRequest,
    /**
     * The GetDocxStylesResponse model constructor.
     * @property {module:model/GetDocxStylesResponse}
     */
    GetDocxStylesResponse: GetDocxStylesResponse,
    /**
     * The GetDocxTablesRequest model constructor.
     * @property {module:model/GetDocxTablesRequest}
     */
    GetDocxTablesRequest: GetDocxTablesRequest,
    /**
     * The GetDocxTablesResponse model constructor.
     * @property {module:model/GetDocxTablesResponse}
     */
    GetDocxTablesResponse: GetDocxTablesResponse,
    /**
     * The GetImageInfoResult model constructor.
     * @property {module:model/GetImageInfoResult}
     */
    GetImageInfoResult: GetImageInfoResult,
    /**
     * The GetXlsxColumnsRequest model constructor.
     * @property {module:model/GetXlsxColumnsRequest}
     */
    GetXlsxColumnsRequest: GetXlsxColumnsRequest,
    /**
     * The GetXlsxColumnsResponse model constructor.
     * @property {module:model/GetXlsxColumnsResponse}
     */
    GetXlsxColumnsResponse: GetXlsxColumnsResponse,
    /**
     * The GetXlsxImagesRequest model constructor.
     * @property {module:model/GetXlsxImagesRequest}
     */
    GetXlsxImagesRequest: GetXlsxImagesRequest,
    /**
     * The GetXlsxImagesResponse model constructor.
     * @property {module:model/GetXlsxImagesResponse}
     */
    GetXlsxImagesResponse: GetXlsxImagesResponse,
    /**
     * The GetXlsxRowsAndCellsRequest model constructor.
     * @property {module:model/GetXlsxRowsAndCellsRequest}
     */
    GetXlsxRowsAndCellsRequest: GetXlsxRowsAndCellsRequest,
    /**
     * The GetXlsxRowsAndCellsResponse model constructor.
     * @property {module:model/GetXlsxRowsAndCellsResponse}
     */
    GetXlsxRowsAndCellsResponse: GetXlsxRowsAndCellsResponse,
    /**
     * The GetXlsxStylesRequest model constructor.
     * @property {module:model/GetXlsxStylesRequest}
     */
    GetXlsxStylesRequest: GetXlsxStylesRequest,
    /**
     * The GetXlsxStylesResponse model constructor.
     * @property {module:model/GetXlsxStylesResponse}
     */
    GetXlsxStylesResponse: GetXlsxStylesResponse,
    /**
     * The GetXlsxWorksheetsRequest model constructor.
     * @property {module:model/GetXlsxWorksheetsRequest}
     */
    GetXlsxWorksheetsRequest: GetXlsxWorksheetsRequest,
    /**
     * The GetXlsxWorksheetsResponse model constructor.
     * @property {module:model/GetXlsxWorksheetsResponse}
     */
    GetXlsxWorksheetsResponse: GetXlsxWorksheetsResponse,
    /**
     * The HtmlMdResult model constructor.
     * @property {module:model/HtmlMdResult}
     */
    HtmlMdResult: HtmlMdResult,
    /**
     * The HtmlTemplateApplicationRequest model constructor.
     * @property {module:model/HtmlTemplateApplicationRequest}
     */
    HtmlTemplateApplicationRequest: HtmlTemplateApplicationRequest,
    /**
     * The HtmlTemplateApplicationResponse model constructor.
     * @property {module:model/HtmlTemplateApplicationResponse}
     */
    HtmlTemplateApplicationResponse: HtmlTemplateApplicationResponse,
    /**
     * The HtmlTemplateOperation model constructor.
     * @property {module:model/HtmlTemplateOperation}
     */
    HtmlTemplateOperation: HtmlTemplateOperation,
    /**
     * The HtmlToOfficeRequest model constructor.
     * @property {module:model/HtmlToOfficeRequest}
     */
    HtmlToOfficeRequest: HtmlToOfficeRequest,
    /**
     * The HtmlToPdfRequest model constructor.
     * @property {module:model/HtmlToPdfRequest}
     */
    HtmlToPdfRequest: HtmlToPdfRequest,
    /**
     * The InsertDocxInsertParagraphRequest model constructor.
     * @property {module:model/InsertDocxInsertParagraphRequest}
     */
    InsertDocxInsertParagraphRequest: InsertDocxInsertParagraphRequest,
    /**
     * The InsertDocxInsertParagraphResponse model constructor.
     * @property {module:model/InsertDocxInsertParagraphResponse}
     */
    InsertDocxInsertParagraphResponse: InsertDocxInsertParagraphResponse,
    /**
     * The InsertDocxTablesRequest model constructor.
     * @property {module:model/InsertDocxTablesRequest}
     */
    InsertDocxTablesRequest: InsertDocxTablesRequest,
    /**
     * The InsertDocxTablesResponse model constructor.
     * @property {module:model/InsertDocxTablesResponse}
     */
    InsertDocxTablesResponse: InsertDocxTablesResponse,
    /**
     * The InsertXlsxWorksheetRequest model constructor.
     * @property {module:model/InsertXlsxWorksheetRequest}
     */
    InsertXlsxWorksheetRequest: InsertXlsxWorksheetRequest,
    /**
     * The InsertXlsxWorksheetResponse model constructor.
     * @property {module:model/InsertXlsxWorksheetResponse}
     */
    InsertXlsxWorksheetResponse: InsertXlsxWorksheetResponse,
    /**
     * The PdfToPngResult model constructor.
     * @property {module:model/PdfToPngResult}
     */
    PdfToPngResult: PdfToPngResult,
    /**
     * The RemoveDocxHeadersAndFootersRequest model constructor.
     * @property {module:model/RemoveDocxHeadersAndFootersRequest}
     */
    RemoveDocxHeadersAndFootersRequest: RemoveDocxHeadersAndFootersRequest,
    /**
     * The RemoveDocxHeadersAndFootersResponse model constructor.
     * @property {module:model/RemoveDocxHeadersAndFootersResponse}
     */
    RemoveDocxHeadersAndFootersResponse: RemoveDocxHeadersAndFootersResponse,
    /**
     * The ReplaceStringRequest model constructor.
     * @property {module:model/ReplaceStringRequest}
     */
    ReplaceStringRequest: ReplaceStringRequest,
    /**
     * The ScreenshotRequest model constructor.
     * @property {module:model/ScreenshotRequest}
     */
    ScreenshotRequest: ScreenshotRequest,
    /**
     * The ViewerResponse model constructor.
     * @property {module:model/ViewerResponse}
     */
    ViewerResponse: ViewerResponse,
    /**
     * The XlsxImage model constructor.
     * @property {module:model/XlsxImage}
     */
    XlsxImage: XlsxImage,
    /**
     * The XlsxSpreadsheetCell model constructor.
     * @property {module:model/XlsxSpreadsheetCell}
     */
    XlsxSpreadsheetCell: XlsxSpreadsheetCell,
    /**
     * The XlsxSpreadsheetColumn model constructor.
     * @property {module:model/XlsxSpreadsheetColumn}
     */
    XlsxSpreadsheetColumn: XlsxSpreadsheetColumn,
    /**
     * The XlsxSpreadsheetRow model constructor.
     * @property {module:model/XlsxSpreadsheetRow}
     */
    XlsxSpreadsheetRow: XlsxSpreadsheetRow,
    /**
     * The XlsxWorksheet model constructor.
     * @property {module:model/XlsxWorksheet}
     */
    XlsxWorksheet: XlsxWorksheet,
    /**
     * The CompareDocumentApi service constructor.
     * @property {module:api/CompareDocumentApi}
     */
    CompareDocumentApi: CompareDocumentApi,
    /**
     * The ConvertDataApi service constructor.
     * @property {module:api/ConvertDataApi}
     */
    ConvertDataApi: ConvertDataApi,
    /**
     * The ConvertDocumentApi service constructor.
     * @property {module:api/ConvertDocumentApi}
     */
    ConvertDocumentApi: ConvertDocumentApi,
    /**
     * The ConvertImageApi service constructor.
     * @property {module:api/ConvertImageApi}
     */
    ConvertImageApi: ConvertImageApi,
    /**
     * The ConvertTemplateApi service constructor.
     * @property {module:api/ConvertTemplateApi}
     */
    ConvertTemplateApi: ConvertTemplateApi,
    /**
     * The ConvertWebApi service constructor.
     * @property {module:api/ConvertWebApi}
     */
    ConvertWebApi: ConvertWebApi,
    /**
     * The EditDocumentApi service constructor.
     * @property {module:api/EditDocumentApi}
     */
    EditDocumentApi: EditDocumentApi,
    /**
     * The MergeDocumentApi service constructor.
     * @property {module:api/MergeDocumentApi}
     */
    MergeDocumentApi: MergeDocumentApi,
    /**
     * The ValidateDocumentApi service constructor.
     * @property {module:api/ValidateDocumentApi}
     */
    ValidateDocumentApi: ValidateDocumentApi,
    /**
     * The ViewerToolsApi service constructor.
     * @property {module:api/ViewerToolsApi}
     */
    ViewerToolsApi: ViewerToolsApi
  };

  return exports;
}));

},{"./ApiClient":9,"./api/CompareDocumentApi":10,"./api/ConvertDataApi":11,"./api/ConvertDocumentApi":12,"./api/ConvertImageApi":13,"./api/ConvertTemplateApi":14,"./api/ConvertWebApi":15,"./api/EditDocumentApi":16,"./api/MergeDocumentApi":17,"./api/ValidateDocumentApi":18,"./api/ViewerToolsApi":19,"./model/ConvertedPngPage":21,"./model/DocumentValidationError":22,"./model/DocumentValidationResult":23,"./model/DocxBody":24,"./model/DocxCellStyle":25,"./model/DocxFooter":26,"./model/DocxHeader":27,"./model/DocxImage":28,"./model/DocxInsertImageRequest":29,"./model/DocxInsertImageResponse":30,"./model/DocxParagraph":31,"./model/DocxRemoveObjectRequest":32,"./model/DocxRemoveObjectResponse":33,"./model/DocxRun":34,"./model/DocxSection":35,"./model/DocxSetFooterRequest":36,"./model/DocxSetFooterResponse":37,"./model/DocxSetHeaderRequest":38,"./model/DocxSetHeaderResponse":39,"./model/DocxStyle":40,"./model/DocxTable":41,"./model/DocxTableCell":42,"./model/DocxTableRow":43,"./model/DocxText":44,"./model/ExifValue":45,"./model/FinishEditingRequest":46,"./model/GetDocxBodyRequest":47,"./model/GetDocxBodyResponse":48,"./model/GetDocxHeadersAndFootersRequest":49,"./model/GetDocxHeadersAndFootersResponse":50,"./model/GetDocxImagesRequest":51,"./model/GetDocxImagesResponse":52,"./model/GetDocxSectionsRequest":53,"./model/GetDocxSectionsResponse":54,"./model/GetDocxStylesRequest":55,"./model/GetDocxStylesResponse":56,"./model/GetDocxTablesRequest":57,"./model/GetDocxTablesResponse":58,"./model/GetImageInfoResult":59,"./model/GetXlsxColumnsRequest":60,"./model/GetXlsxColumnsResponse":61,"./model/GetXlsxImagesRequest":62,"./model/GetXlsxImagesResponse":63,"./model/GetXlsxRowsAndCellsRequest":64,"./model/GetXlsxRowsAndCellsResponse":65,"./model/GetXlsxStylesRequest":66,"./model/GetXlsxStylesResponse":67,"./model/GetXlsxWorksheetsRequest":68,"./model/GetXlsxWorksheetsResponse":69,"./model/HtmlMdResult":70,"./model/HtmlTemplateApplicationRequest":71,"./model/HtmlTemplateApplicationResponse":72,"./model/HtmlTemplateOperation":73,"./model/HtmlToOfficeRequest":74,"./model/HtmlToPdfRequest":75,"./model/InsertDocxInsertParagraphRequest":76,"./model/InsertDocxInsertParagraphResponse":77,"./model/InsertDocxTablesRequest":78,"./model/InsertDocxTablesResponse":79,"./model/InsertXlsxWorksheetRequest":80,"./model/InsertXlsxWorksheetResponse":81,"./model/PdfToPngResult":82,"./model/RemoveDocxHeadersAndFootersRequest":83,"./model/RemoveDocxHeadersAndFootersResponse":84,"./model/ReplaceStringRequest":85,"./model/ScreenshotRequest":86,"./model/ViewerResponse":87,"./model/XlsxImage":88,"./model/XlsxSpreadsheetCell":89,"./model/XlsxSpreadsheetColumn":90,"./model/XlsxSpreadsheetRow":91,"./model/XlsxWorksheet":92}],21:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.ConvertedPngPage = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The ConvertedPngPage model module.
   * @module model/ConvertedPngPage
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>ConvertedPngPage</code>.
   * A single converted page
   * @alias module:model/ConvertedPngPage
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>ConvertedPngPage</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/ConvertedPngPage} obj Optional instance to populate.
   * @return {module:model/ConvertedPngPage} The populated <code>ConvertedPngPage</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('PageNumber')) {
        obj['PageNumber'] = ApiClient.convertToType(data['PageNumber'], 'Number');
      }
      if (data.hasOwnProperty('URL')) {
        obj['URL'] = ApiClient.convertToType(data['URL'], 'String');
      }
    }
    return obj;
  }

  /**
   * Page number of the converted page, starting with 1
   * @member {Number} PageNumber
   */
  exports.prototype['PageNumber'] = undefined;
  /**
   * URL to the PNG file of this page; file is stored in an in-memory cache and will be deleted
   * @member {String} URL
   */
  exports.prototype['URL'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],22:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocumentValidationError = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DocumentValidationError model module.
   * @module model/DocumentValidationError
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocumentValidationError</code>.
   * Validation error found in document
   * @alias module:model/DocumentValidationError
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>DocumentValidationError</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocumentValidationError} obj Optional instance to populate.
   * @return {module:model/DocumentValidationError} The populated <code>DocumentValidationError</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Description')) {
        obj['Description'] = ApiClient.convertToType(data['Description'], 'String');
      }
      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('Uri')) {
        obj['Uri'] = ApiClient.convertToType(data['Uri'], 'String');
      }
      if (data.hasOwnProperty('IsError')) {
        obj['IsError'] = ApiClient.convertToType(data['IsError'], 'Boolean');
      }
    }
    return obj;
  }

  /**
   * Description of the error
   * @member {String} Description
   */
  exports.prototype['Description'] = undefined;
  /**
   * XPath to the error
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * URI of the part in question
   * @member {String} Uri
   */
  exports.prototype['Uri'] = undefined;
  /**
   * True if this is an error, false otherwise
   * @member {Boolean} IsError
   */
  exports.prototype['IsError'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],23:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocumentValidationError'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocumentValidationError'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocumentValidationResult = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocumentValidationError);
  }
}(this, function(ApiClient, DocumentValidationError) {
  'use strict';




  /**
   * The DocumentValidationResult model module.
   * @module model/DocumentValidationResult
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocumentValidationResult</code>.
   * Document validation result
   * @alias module:model/DocumentValidationResult
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>DocumentValidationResult</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocumentValidationResult} obj Optional instance to populate.
   * @return {module:model/DocumentValidationResult} The populated <code>DocumentValidationResult</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('DocumentIsValid')) {
        obj['DocumentIsValid'] = ApiClient.convertToType(data['DocumentIsValid'], 'Boolean');
      }
      if (data.hasOwnProperty('ErrorCount')) {
        obj['ErrorCount'] = ApiClient.convertToType(data['ErrorCount'], 'Number');
      }
      if (data.hasOwnProperty('WarningCount')) {
        obj['WarningCount'] = ApiClient.convertToType(data['WarningCount'], 'Number');
      }
      if (data.hasOwnProperty('ErrorsAndWarnings')) {
        obj['ErrorsAndWarnings'] = ApiClient.convertToType(data['ErrorsAndWarnings'], [DocumentValidationError]);
      }
    }
    return obj;
  }

  /**
   * True if the document is valid and has no errors, false otherwise
   * @member {Boolean} DocumentIsValid
   */
  exports.prototype['DocumentIsValid'] = undefined;
  /**
   * Number of validation errors found in the document
   * @member {Number} ErrorCount
   */
  exports.prototype['ErrorCount'] = undefined;
  /**
   * Number of validation warnings found in the document
   * @member {Number} WarningCount
   */
  exports.prototype['WarningCount'] = undefined;
  /**
   * Details of errors and warnings found
   * @member {Array.<module:model/DocumentValidationError>} ErrorsAndWarnings
   */
  exports.prototype['ErrorsAndWarnings'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocumentValidationError":22}],24:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxParagraph', 'model/DocxTable'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxParagraph'), require('./DocxTable'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxBody = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxParagraph, root.CloudmersiveConvertApiClient.DocxTable);
  }
}(this, function(ApiClient, DocxParagraph, DocxTable) {
  'use strict';




  /**
   * The DocxBody model module.
   * @module model/DocxBody
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxBody</code>.
   * @alias module:model/DocxBody
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>DocxBody</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxBody} obj Optional instance to populate.
   * @return {module:model/DocxBody} The populated <code>DocxBody</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('AllParagraphs')) {
        obj['AllParagraphs'] = ApiClient.convertToType(data['AllParagraphs'], [DocxParagraph]);
      }
      if (data.hasOwnProperty('AllTables')) {
        obj['AllTables'] = ApiClient.convertToType(data['AllTables'], [DocxTable]);
      }
    }
    return obj;
  }

  /**
   * The Path of the location of this object; leave blank for new tables
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * All paragraphs anywhere in the document; these objects are not sequentially placed but are scatted across document
   * @member {Array.<module:model/DocxParagraph>} AllParagraphs
   */
  exports.prototype['AllParagraphs'] = undefined;
  /**
   * All tables anywhere in the document; these objects are not sequentially placed but are scatted across the document
   * @member {Array.<module:model/DocxTable>} AllTables
   */
  exports.prototype['AllTables'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxParagraph":31,"./DocxTable":41}],25:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxCellStyle = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DocxCellStyle model module.
   * @module model/DocxCellStyle
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxCellStyle</code>.
   * Style in an Excel spreadsheet
   * @alias module:model/DocxCellStyle
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>DocxCellStyle</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxCellStyle} obj Optional instance to populate.
   * @return {module:model/DocxCellStyle} The populated <code>DocxCellStyle</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('Name')) {
        obj['Name'] = ApiClient.convertToType(data['Name'], 'String');
      }
      if (data.hasOwnProperty('FormatID')) {
        obj['FormatID'] = ApiClient.convertToType(data['FormatID'], 'Number');
      }
      if (data.hasOwnProperty('BuiltInID')) {
        obj['BuiltInID'] = ApiClient.convertToType(data['BuiltInID'], 'Number');
      }
    }
    return obj;
  }

  /**
   * The Path of the location of this object; leave blank for new rows
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * Name of the style
   * @member {String} Name
   */
  exports.prototype['Name'] = undefined;
  /**
   * Format ID of the cell style
   * @member {Number} FormatID
   */
  exports.prototype['FormatID'] = undefined;
  /**
   * Built=in ID of the cell style
   * @member {Number} BuiltInID
   */
  exports.prototype['BuiltInID'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],26:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxParagraph', 'model/DocxSection'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxParagraph'), require('./DocxSection'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxFooter = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxParagraph, root.CloudmersiveConvertApiClient.DocxSection);
  }
}(this, function(ApiClient, DocxParagraph, DocxSection) {
  'use strict';




  /**
   * The DocxFooter model module.
   * @module model/DocxFooter
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxFooter</code>.
   * Footer in a Word Document (DOCX)
   * @alias module:model/DocxFooter
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>DocxFooter</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxFooter} obj Optional instance to populate.
   * @return {module:model/DocxFooter} The populated <code>DocxFooter</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('Paragraphs')) {
        obj['Paragraphs'] = ApiClient.convertToType(data['Paragraphs'], [DocxParagraph]);
      }
      if (data.hasOwnProperty('SectionsWithFooter')) {
        obj['SectionsWithFooter'] = ApiClient.convertToType(data['SectionsWithFooter'], [DocxSection]);
      }
    }
    return obj;
  }

  /**
   * The Path of the location of this object; leave blank for new tables
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * Paragraphs in this footer
   * @member {Array.<module:model/DocxParagraph>} Paragraphs
   */
  exports.prototype['Paragraphs'] = undefined;
  /**
   * Sections that the footer is applied to
   * @member {Array.<module:model/DocxSection>} SectionsWithFooter
   */
  exports.prototype['SectionsWithFooter'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxParagraph":31,"./DocxSection":35}],27:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxParagraph', 'model/DocxSection'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxParagraph'), require('./DocxSection'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxHeader = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxParagraph, root.CloudmersiveConvertApiClient.DocxSection);
  }
}(this, function(ApiClient, DocxParagraph, DocxSection) {
  'use strict';




  /**
   * The DocxHeader model module.
   * @module model/DocxHeader
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxHeader</code>.
   * Header of a Word Document (DOCX)
   * @alias module:model/DocxHeader
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>DocxHeader</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxHeader} obj Optional instance to populate.
   * @return {module:model/DocxHeader} The populated <code>DocxHeader</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('Paragraphs')) {
        obj['Paragraphs'] = ApiClient.convertToType(data['Paragraphs'], [DocxParagraph]);
      }
      if (data.hasOwnProperty('SectionsWithHeader')) {
        obj['SectionsWithHeader'] = ApiClient.convertToType(data['SectionsWithHeader'], [DocxSection]);
      }
    }
    return obj;
  }

  /**
   * The Path of the location of this object; leave blank for new tables
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * Paragraphs in this header
   * @member {Array.<module:model/DocxParagraph>} Paragraphs
   */
  exports.prototype['Paragraphs'] = undefined;
  /**
   * Sections that the header is applied to
   * @member {Array.<module:model/DocxSection>} SectionsWithHeader
   */
  exports.prototype['SectionsWithHeader'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxParagraph":31,"./DocxSection":35}],28:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxImage = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DocxImage model module.
   * @module model/DocxImage
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxImage</code>.
   * @alias module:model/DocxImage
   * @class
   */
  var exports = function() {
    var _this = this;














  };

  /**
   * Constructs a <code>DocxImage</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxImage} obj Optional instance to populate.
   * @return {module:model/DocxImage} The populated <code>DocxImage</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('ImageName')) {
        obj['ImageName'] = ApiClient.convertToType(data['ImageName'], 'String');
      }
      if (data.hasOwnProperty('ImageId')) {
        obj['ImageId'] = ApiClient.convertToType(data['ImageId'], 'Number');
      }
      if (data.hasOwnProperty('ImageDescription')) {
        obj['ImageDescription'] = ApiClient.convertToType(data['ImageDescription'], 'String');
      }
      if (data.hasOwnProperty('ImageWidth')) {
        obj['ImageWidth'] = ApiClient.convertToType(data['ImageWidth'], 'Number');
      }
      if (data.hasOwnProperty('ImageHeight')) {
        obj['ImageHeight'] = ApiClient.convertToType(data['ImageHeight'], 'Number');
      }
      if (data.hasOwnProperty('XOffset')) {
        obj['XOffset'] = ApiClient.convertToType(data['XOffset'], 'Number');
      }
      if (data.hasOwnProperty('YOffset')) {
        obj['YOffset'] = ApiClient.convertToType(data['YOffset'], 'Number');
      }
      if (data.hasOwnProperty('ImageDataEmbedId')) {
        obj['ImageDataEmbedId'] = ApiClient.convertToType(data['ImageDataEmbedId'], 'String');
      }
      if (data.hasOwnProperty('ImageDataContentType')) {
        obj['ImageDataContentType'] = ApiClient.convertToType(data['ImageDataContentType'], 'String');
      }
      if (data.hasOwnProperty('ImageInternalFileName')) {
        obj['ImageInternalFileName'] = ApiClient.convertToType(data['ImageInternalFileName'], 'String');
      }
      if (data.hasOwnProperty('ImageContentsURL')) {
        obj['ImageContentsURL'] = ApiClient.convertToType(data['ImageContentsURL'], 'String');
      }
      if (data.hasOwnProperty('Inline')) {
        obj['Inline'] = ApiClient.convertToType(data['Inline'], 'Boolean');
      }
    }
    return obj;
  }

  /**
   * The Path of the location of this object; leave blank for new tables
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * The Name of the image
   * @member {String} ImageName
   */
  exports.prototype['ImageName'] = undefined;
  /**
   * The Id of the image
   * @member {Number} ImageId
   */
  exports.prototype['ImageId'] = undefined;
  /**
   * The Description of the image
   * @member {String} ImageDescription
   */
  exports.prototype['ImageDescription'] = undefined;
  /**
   * Width of the image in EMUs (English Metric Units); set to 0 to default to page width and aspect-ratio based height
   * @member {Number} ImageWidth
   */
  exports.prototype['ImageWidth'] = undefined;
  /**
   * Height of the image in EMUs (English Metric Units); set to 0 to default to page width and aspect-ratio based height
   * @member {Number} ImageHeight
   */
  exports.prototype['ImageHeight'] = undefined;
  /**
   * X (horizontal) offset of the image
   * @member {Number} XOffset
   */
  exports.prototype['XOffset'] = undefined;
  /**
   * Y (vertical) offset of the image
   * @member {Number} YOffset
   */
  exports.prototype['YOffset'] = undefined;
  /**
   * Read-only; internal ID for the image contents
   * @member {String} ImageDataEmbedId
   */
  exports.prototype['ImageDataEmbedId'] = undefined;
  /**
   * Read-only; image data MIME content-type
   * @member {String} ImageDataContentType
   */
  exports.prototype['ImageDataContentType'] = undefined;
  /**
   * Read-only; internal file name/path for the image
   * @member {String} ImageInternalFileName
   */
  exports.prototype['ImageInternalFileName'] = undefined;
  /**
   * URL to the image contents; file is stored in an in-memory cache and will be deleted.  Call Finish-Editing to get the contents.
   * @member {String} ImageContentsURL
   */
  exports.prototype['ImageContentsURL'] = undefined;
  /**
   * True if the image is inline with the text; false if it is floating
   * @member {Boolean} Inline
   */
  exports.prototype['Inline'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],29:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxImage'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxImage'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxInsertImageRequest = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxImage);
  }
}(this, function(ApiClient, DocxImage) {
  'use strict';




  /**
   * The DocxInsertImageRequest model module.
   * @module model/DocxInsertImageRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxInsertImageRequest</code>.
   * Input to set-footer command
   * @alias module:model/DocxInsertImageRequest
   * @class
   */
  var exports = function() {
    var _this = this;








  };

  /**
   * Constructs a <code>DocxInsertImageRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxInsertImageRequest} obj Optional instance to populate.
   * @return {module:model/DocxInsertImageRequest} The populated <code>DocxInsertImageRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputDocumentFileBytes')) {
        obj['InputDocumentFileBytes'] = ApiClient.convertToType(data['InputDocumentFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputDocumentFileUrl')) {
        obj['InputDocumentFileUrl'] = ApiClient.convertToType(data['InputDocumentFileUrl'], 'String');
      }
      if (data.hasOwnProperty('InputImageFileBytes')) {
        obj['InputImageFileBytes'] = ApiClient.convertToType(data['InputImageFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputImageFileUrl')) {
        obj['InputImageFileUrl'] = ApiClient.convertToType(data['InputImageFileUrl'], 'String');
      }
      if (data.hasOwnProperty('ImageToAdd')) {
        obj['ImageToAdd'] = DocxImage.constructFromObject(data['ImageToAdd']);
      }
      if (data.hasOwnProperty('InsertPlacement')) {
        obj['InsertPlacement'] = ApiClient.convertToType(data['InsertPlacement'], 'String');
      }
      if (data.hasOwnProperty('InsertPath')) {
        obj['InsertPath'] = ApiClient.convertToType(data['InsertPath'], 'String');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputDocumentFileBytes
   */
  exports.prototype['InputDocumentFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputDocumentFileUrl
   */
  exports.prototype['InputDocumentFileUrl'] = undefined;
  /**
   * Optional: Bytes of the input image file to operate on; if you supply this value do not supply InputImageFileUrl or ImageToAdd.
   * @member {Blob} InputImageFileBytes
   */
  exports.prototype['InputImageFileBytes'] = undefined;
  /**
   * Optional: URL of an image file to operate on as input; if you supply this value do not supply InputImageFileBytes or ImageToAdd.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputImageFileUrl
   */
  exports.prototype['InputImageFileUrl'] = undefined;
  /**
   * Optional: Image to add; if you supply in this object, do not supply InputImageFileBytes or InputImageFileUrl.
   * @member {module:model/DocxImage} ImageToAdd
   */
  exports.prototype['ImageToAdd'] = undefined;
  /**
   * Optional; default is DocumentEnd.  Placement Type of the insert; possible values are: DocumentStart (very beginning of the document), DocumentEnd (very end of the document), BeforeExistingObject (right before an existing object - fill in the InsertPath field using the Path value from an existing object), AfterExistingObject (right after an existing object - fill in the InsertPath field using the Path value from an existing object)
   * @member {String} InsertPlacement
   */
  exports.prototype['InsertPlacement'] = undefined;
  /**
   * Optional; location within the document to insert the object; fill in the InsertPath field using the Path value from an existing object.  Used with InsertPlacement of BeforeExistingObject or AfterExistingObject
   * @member {String} InsertPath
   */
  exports.prototype['InsertPath'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxImage":28}],30:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxInsertImageResponse = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DocxInsertImageResponse model module.
   * @module model/DocxInsertImageResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxInsertImageResponse</code>.
   * Result of running a set-footer command
   * @alias module:model/DocxInsertImageResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>DocxInsertImageResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxInsertImageResponse} obj Optional instance to populate.
   * @return {module:model/DocxInsertImageResponse} The populated <code>DocxInsertImageResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('EditedDocumentURL')) {
        obj['EditedDocumentURL'] = ApiClient.convertToType(data['EditedDocumentURL'], 'String');
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * URL to the edited DOCX file; file is stored in an in-memory cache and will be deleted.  Call Finish-Editing to get the result document contents.
   * @member {String} EditedDocumentURL
   */
  exports.prototype['EditedDocumentURL'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],31:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxRun'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxRun'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxParagraph = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxRun);
  }
}(this, function(ApiClient, DocxRun) {
  'use strict';




  /**
   * The DocxParagraph model module.
   * @module model/DocxParagraph
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxParagraph</code>.
   * A paragraph in a Word Document (DOCX) file; there is where text, content and formatting are stored - similar to the paragraph tag in HTML
   * @alias module:model/DocxParagraph
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>DocxParagraph</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxParagraph} obj Optional instance to populate.
   * @return {module:model/DocxParagraph} The populated <code>DocxParagraph</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('ParagraphIndex')) {
        obj['ParagraphIndex'] = ApiClient.convertToType(data['ParagraphIndex'], 'Number');
      }
      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('ContentRuns')) {
        obj['ContentRuns'] = ApiClient.convertToType(data['ContentRuns'], [DocxRun]);
      }
      if (data.hasOwnProperty('StyleID')) {
        obj['StyleID'] = ApiClient.convertToType(data['StyleID'], 'String');
      }
    }
    return obj;
  }

  /**
   * The index of the paragraph; 0-based
   * @member {Number} ParagraphIndex
   */
  exports.prototype['ParagraphIndex'] = undefined;
  /**
   * The Path of the location of this object; leave blank for new tables
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * The content runs in the paragraph - this is where text is stored; similar to a span in HTML
   * @member {Array.<module:model/DocxRun>} ContentRuns
   */
  exports.prototype['ContentRuns'] = undefined;
  /**
   * Style ID of the style applied to the paragraph; null if no style is applied
   * @member {String} StyleID
   */
  exports.prototype['StyleID'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxRun":34}],32:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxRemoveObjectRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DocxRemoveObjectRequest model module.
   * @module model/DocxRemoveObjectRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxRemoveObjectRequest</code>.
   * Input to a Insert Paragraph request
   * @alias module:model/DocxRemoveObjectRequest
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>DocxRemoveObjectRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxRemoveObjectRequest} obj Optional instance to populate.
   * @return {module:model/DocxRemoveObjectRequest} The populated <code>DocxRemoveObjectRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
      if (data.hasOwnProperty('PathToObjectToRemove')) {
        obj['PathToObjectToRemove'] = ApiClient.convertToType(data['PathToObjectToRemove'], 'String');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;
  /**
   * Path within the document of the object to delete; fill in the PathToObjectToRemove field using the Path value from an existing object.
   * @member {String} PathToObjectToRemove
   */
  exports.prototype['PathToObjectToRemove'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],33:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxRemoveObjectResponse = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DocxRemoveObjectResponse model module.
   * @module model/DocxRemoveObjectResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxRemoveObjectResponse</code>.
   * Result of running an Remove-Object command
   * @alias module:model/DocxRemoveObjectResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>DocxRemoveObjectResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxRemoveObjectResponse} obj Optional instance to populate.
   * @return {module:model/DocxRemoveObjectResponse} The populated <code>DocxRemoveObjectResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('EditedDocumentURL')) {
        obj['EditedDocumentURL'] = ApiClient.convertToType(data['EditedDocumentURL'], 'String');
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * URL to the edited DOCX file; file is stored in an in-memory cache and will be deleted.  Call Finish-Editing to get the result document contents.
   * @member {String} EditedDocumentURL
   */
  exports.prototype['EditedDocumentURL'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],34:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxText'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxText'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxRun = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxText);
  }
}(this, function(ApiClient, DocxText) {
  'use strict';




  /**
   * The DocxRun model module.
   * @module model/DocxRun
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxRun</code>.
   * A content run in a Word Document (DOCX) file
   * @alias module:model/DocxRun
   * @class
   */
  var exports = function() {
    var _this = this;









  };

  /**
   * Constructs a <code>DocxRun</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxRun} obj Optional instance to populate.
   * @return {module:model/DocxRun} The populated <code>DocxRun</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('RunIndex')) {
        obj['RunIndex'] = ApiClient.convertToType(data['RunIndex'], 'Number');
      }
      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('TextItems')) {
        obj['TextItems'] = ApiClient.convertToType(data['TextItems'], [DocxText]);
      }
      if (data.hasOwnProperty('Bold')) {
        obj['Bold'] = ApiClient.convertToType(data['Bold'], 'Boolean');
      }
      if (data.hasOwnProperty('Italic')) {
        obj['Italic'] = ApiClient.convertToType(data['Italic'], 'Boolean');
      }
      if (data.hasOwnProperty('Underline')) {
        obj['Underline'] = ApiClient.convertToType(data['Underline'], 'String');
      }
      if (data.hasOwnProperty('FontFamily')) {
        obj['FontFamily'] = ApiClient.convertToType(data['FontFamily'], 'String');
      }
      if (data.hasOwnProperty('FontSize')) {
        obj['FontSize'] = ApiClient.convertToType(data['FontSize'], 'String');
      }
    }
    return obj;
  }

  /**
   * Index of the run, 0-based
   * @member {Number} RunIndex
   */
  exports.prototype['RunIndex'] = undefined;
  /**
   * The Path of the location of this object; leave blank for new tables
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * Text items inside the run; this is where the actual text content is stored
   * @member {Array.<module:model/DocxText>} TextItems
   */
  exports.prototype['TextItems'] = undefined;
  /**
   * True to make the text bold, false otherwise
   * @member {Boolean} Bold
   */
  exports.prototype['Bold'] = undefined;
  /**
   * True to make the text italic, false otherwise
   * @member {Boolean} Italic
   */
  exports.prototype['Italic'] = undefined;
  /**
   * Underline mode for the text; possible values are: Words, Double, Thick, Dotted, DottedHeavy, Dash, DashedHeavy, DashLong, DashLongHeavy, DotDash, DashDotHeavy, DotDotDash, DashDotDotHeavy, Wave, WavyHeavy, WavyDouble, None
   * @member {String} Underline
   */
  exports.prototype['Underline'] = undefined;
  /**
   * Font Family name for the text, e.g. \"Arial\" or \"Times New Roman\"
   * @member {String} FontFamily
   */
  exports.prototype['FontFamily'] = undefined;
  /**
   * Font size in font points (e.g. \"24\")
   * @member {String} FontSize
   */
  exports.prototype['FontSize'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxText":44}],35:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxSection = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DocxSection model module.
   * @module model/DocxSection
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxSection</code>.
   * Section of a Word Document (DOCX)
   * @alias module:model/DocxSection
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>DocxSection</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxSection} obj Optional instance to populate.
   * @return {module:model/DocxSection} The populated <code>DocxSection</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('StartingPageNumbers')) {
        obj['StartingPageNumbers'] = ApiClient.convertToType(data['StartingPageNumbers'], ['Number']);
      }
      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
    }
    return obj;
  }

  /**
   * Page numbers that the section starts at, typically just one
   * @member {Array.<Number>} StartingPageNumbers
   */
  exports.prototype['StartingPageNumbers'] = undefined;
  /**
   * The Path of the location of this object; leave blank for new tables
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],36:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxFooter'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxFooter'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxSetFooterRequest = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxFooter);
  }
}(this, function(ApiClient, DocxFooter) {
  'use strict';




  /**
   * The DocxSetFooterRequest model module.
   * @module model/DocxSetFooterRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxSetFooterRequest</code>.
   * Input to set-footer command
   * @alias module:model/DocxSetFooterRequest
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>DocxSetFooterRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxSetFooterRequest} obj Optional instance to populate.
   * @return {module:model/DocxSetFooterRequest} The populated <code>DocxSetFooterRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
      if (data.hasOwnProperty('FooterToApply')) {
        obj['FooterToApply'] = DocxFooter.constructFromObject(data['FooterToApply']);
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;
  /**
   * Footer to apply
   * @member {module:model/DocxFooter} FooterToApply
   */
  exports.prototype['FooterToApply'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxFooter":26}],37:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxSetFooterResponse = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DocxSetFooterResponse model module.
   * @module model/DocxSetFooterResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxSetFooterResponse</code>.
   * Result of running a set-footer command
   * @alias module:model/DocxSetFooterResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>DocxSetFooterResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxSetFooterResponse} obj Optional instance to populate.
   * @return {module:model/DocxSetFooterResponse} The populated <code>DocxSetFooterResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('EditedDocumentURL')) {
        obj['EditedDocumentURL'] = ApiClient.convertToType(data['EditedDocumentURL'], 'String');
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * URL to the edited DOCX file; file is stored in an in-memory cache and will be deleted.  Call Finish-Editing to get the result document contents.
   * @member {String} EditedDocumentURL
   */
  exports.prototype['EditedDocumentURL'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],38:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxHeader'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxHeader'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxSetHeaderRequest = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxHeader);
  }
}(this, function(ApiClient, DocxHeader) {
  'use strict';




  /**
   * The DocxSetHeaderRequest model module.
   * @module model/DocxSetHeaderRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxSetHeaderRequest</code>.
   * Input to a set-header command
   * @alias module:model/DocxSetHeaderRequest
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>DocxSetHeaderRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxSetHeaderRequest} obj Optional instance to populate.
   * @return {module:model/DocxSetHeaderRequest} The populated <code>DocxSetHeaderRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
      if (data.hasOwnProperty('HeaderToApply')) {
        obj['HeaderToApply'] = DocxHeader.constructFromObject(data['HeaderToApply']);
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;
  /**
   * Header to apply
   * @member {module:model/DocxHeader} HeaderToApply
   */
  exports.prototype['HeaderToApply'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxHeader":27}],39:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxSetHeaderResponse = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DocxSetHeaderResponse model module.
   * @module model/DocxSetHeaderResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxSetHeaderResponse</code>.
   * Result of running a set-header command
   * @alias module:model/DocxSetHeaderResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>DocxSetHeaderResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxSetHeaderResponse} obj Optional instance to populate.
   * @return {module:model/DocxSetHeaderResponse} The populated <code>DocxSetHeaderResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('EditedDocumentURL')) {
        obj['EditedDocumentURL'] = ApiClient.convertToType(data['EditedDocumentURL'], 'String');
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * URL to the edited DOCX file; file is stored in an in-memory cache and will be deleted.  Call Finish-Editing to get the result document contents.
   * @member {String} EditedDocumentURL
   */
  exports.prototype['EditedDocumentURL'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],40:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxStyle = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DocxStyle model module.
   * @module model/DocxStyle
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxStyle</code>.
   * Style in a DOCX Word Document
   * @alias module:model/DocxStyle
   * @class
   */
  var exports = function() {
    var _this = this;








  };

  /**
   * Constructs a <code>DocxStyle</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxStyle} obj Optional instance to populate.
   * @return {module:model/DocxStyle} The populated <code>DocxStyle</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('StyleID')) {
        obj['StyleID'] = ApiClient.convertToType(data['StyleID'], 'String');
      }
      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('Bold')) {
        obj['Bold'] = ApiClient.convertToType(data['Bold'], 'Boolean');
      }
      if (data.hasOwnProperty('Italic')) {
        obj['Italic'] = ApiClient.convertToType(data['Italic'], 'Boolean');
      }
      if (data.hasOwnProperty('Underline')) {
        obj['Underline'] = ApiClient.convertToType(data['Underline'], 'Boolean');
      }
      if (data.hasOwnProperty('FontSize')) {
        obj['FontSize'] = ApiClient.convertToType(data['FontSize'], 'String');
      }
      if (data.hasOwnProperty('FontFamily')) {
        obj['FontFamily'] = ApiClient.convertToType(data['FontFamily'], 'String');
      }
    }
    return obj;
  }

  /**
   * ID of the style
   * @member {String} StyleID
   */
  exports.prototype['StyleID'] = undefined;
  /**
   * The Path of the location of this object; leave blank for new tables
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * Style applies bold formatting
   * @member {Boolean} Bold
   */
  exports.prototype['Bold'] = undefined;
  /**
   * Style applies italic formatting
   * @member {Boolean} Italic
   */
  exports.prototype['Italic'] = undefined;
  /**
   * Style applies underline formatting
   * @member {Boolean} Underline
   */
  exports.prototype['Underline'] = undefined;
  /**
   * Font size
   * @member {String} FontSize
   */
  exports.prototype['FontSize'] = undefined;
  /**
   * Font family
   * @member {String} FontFamily
   */
  exports.prototype['FontFamily'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],41:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxTableRow'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxTableRow'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxTable = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxTableRow);
  }
}(this, function(ApiClient, DocxTableRow) {
  'use strict';




  /**
   * The DocxTable model module.
   * @module model/DocxTable
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxTable</code>.
   * A table in a Word Document (DOCX) file
   * @alias module:model/DocxTable
   * @class
   */
  var exports = function() {
    var _this = this;








































  };

  /**
   * Constructs a <code>DocxTable</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxTable} obj Optional instance to populate.
   * @return {module:model/DocxTable} The populated <code>DocxTable</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('TableID')) {
        obj['TableID'] = ApiClient.convertToType(data['TableID'], 'String');
      }
      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('Width')) {
        obj['Width'] = ApiClient.convertToType(data['Width'], 'String');
      }
      if (data.hasOwnProperty('WidthType')) {
        obj['WidthType'] = ApiClient.convertToType(data['WidthType'], 'String');
      }
      if (data.hasOwnProperty('TableRows')) {
        obj['TableRows'] = ApiClient.convertToType(data['TableRows'], [DocxTableRow]);
      }
      if (data.hasOwnProperty('TopBorderType')) {
        obj['TopBorderType'] = ApiClient.convertToType(data['TopBorderType'], 'String');
      }
      if (data.hasOwnProperty('TopBorderSize')) {
        obj['TopBorderSize'] = ApiClient.convertToType(data['TopBorderSize'], 'Number');
      }
      if (data.hasOwnProperty('TopBorderSpace')) {
        obj['TopBorderSpace'] = ApiClient.convertToType(data['TopBorderSpace'], 'Number');
      }
      if (data.hasOwnProperty('TopBorderColor')) {
        obj['TopBorderColor'] = ApiClient.convertToType(data['TopBorderColor'], 'String');
      }
      if (data.hasOwnProperty('BottomBorderType')) {
        obj['BottomBorderType'] = ApiClient.convertToType(data['BottomBorderType'], 'String');
      }
      if (data.hasOwnProperty('BottomBorderSize')) {
        obj['BottomBorderSize'] = ApiClient.convertToType(data['BottomBorderSize'], 'Number');
      }
      if (data.hasOwnProperty('BottomBorderSpace')) {
        obj['BottomBorderSpace'] = ApiClient.convertToType(data['BottomBorderSpace'], 'Number');
      }
      if (data.hasOwnProperty('BottomBorderColor')) {
        obj['BottomBorderColor'] = ApiClient.convertToType(data['BottomBorderColor'], 'String');
      }
      if (data.hasOwnProperty('LeftBorderType')) {
        obj['LeftBorderType'] = ApiClient.convertToType(data['LeftBorderType'], 'String');
      }
      if (data.hasOwnProperty('LeftBorderSize')) {
        obj['LeftBorderSize'] = ApiClient.convertToType(data['LeftBorderSize'], 'Number');
      }
      if (data.hasOwnProperty('LeftBorderSpace')) {
        obj['LeftBorderSpace'] = ApiClient.convertToType(data['LeftBorderSpace'], 'Number');
      }
      if (data.hasOwnProperty('LeftBorderColor')) {
        obj['LeftBorderColor'] = ApiClient.convertToType(data['LeftBorderColor'], 'String');
      }
      if (data.hasOwnProperty('RightBorderType')) {
        obj['RightBorderType'] = ApiClient.convertToType(data['RightBorderType'], 'String');
      }
      if (data.hasOwnProperty('RightBorderSize')) {
        obj['RightBorderSize'] = ApiClient.convertToType(data['RightBorderSize'], 'Number');
      }
      if (data.hasOwnProperty('RightBorderSpace')) {
        obj['RightBorderSpace'] = ApiClient.convertToType(data['RightBorderSpace'], 'Number');
      }
      if (data.hasOwnProperty('RightBorderColor')) {
        obj['RightBorderColor'] = ApiClient.convertToType(data['RightBorderColor'], 'String');
      }
      if (data.hasOwnProperty('CellHorizontalBorderType')) {
        obj['CellHorizontalBorderType'] = ApiClient.convertToType(data['CellHorizontalBorderType'], 'String');
      }
      if (data.hasOwnProperty('CellHorizontalBorderSize')) {
        obj['CellHorizontalBorderSize'] = ApiClient.convertToType(data['CellHorizontalBorderSize'], 'Number');
      }
      if (data.hasOwnProperty('CellHorizontalBorderSpace')) {
        obj['CellHorizontalBorderSpace'] = ApiClient.convertToType(data['CellHorizontalBorderSpace'], 'Number');
      }
      if (data.hasOwnProperty('CellHorizontalBorderColor')) {
        obj['CellHorizontalBorderColor'] = ApiClient.convertToType(data['CellHorizontalBorderColor'], 'String');
      }
      if (data.hasOwnProperty('CellVerticalBorderType')) {
        obj['CellVerticalBorderType'] = ApiClient.convertToType(data['CellVerticalBorderType'], 'String');
      }
      if (data.hasOwnProperty('CellVerticalBorderSize')) {
        obj['CellVerticalBorderSize'] = ApiClient.convertToType(data['CellVerticalBorderSize'], 'Number');
      }
      if (data.hasOwnProperty('CellVerticalBorderSpace')) {
        obj['CellVerticalBorderSpace'] = ApiClient.convertToType(data['CellVerticalBorderSpace'], 'Number');
      }
      if (data.hasOwnProperty('CellVerticalBorderColor')) {
        obj['CellVerticalBorderColor'] = ApiClient.convertToType(data['CellVerticalBorderColor'], 'String');
      }
      if (data.hasOwnProperty('StartBorderType')) {
        obj['StartBorderType'] = ApiClient.convertToType(data['StartBorderType'], 'String');
      }
      if (data.hasOwnProperty('StartBorderSize')) {
        obj['StartBorderSize'] = ApiClient.convertToType(data['StartBorderSize'], 'Number');
      }
      if (data.hasOwnProperty('StartBorderSpace')) {
        obj['StartBorderSpace'] = ApiClient.convertToType(data['StartBorderSpace'], 'Number');
      }
      if (data.hasOwnProperty('StartBorderColor')) {
        obj['StartBorderColor'] = ApiClient.convertToType(data['StartBorderColor'], 'String');
      }
      if (data.hasOwnProperty('EndBorderType')) {
        obj['EndBorderType'] = ApiClient.convertToType(data['EndBorderType'], 'String');
      }
      if (data.hasOwnProperty('EndBorderSize')) {
        obj['EndBorderSize'] = ApiClient.convertToType(data['EndBorderSize'], 'Number');
      }
      if (data.hasOwnProperty('EndBorderSpace')) {
        obj['EndBorderSpace'] = ApiClient.convertToType(data['EndBorderSpace'], 'Number');
      }
      if (data.hasOwnProperty('EndBorderColor')) {
        obj['EndBorderColor'] = ApiClient.convertToType(data['EndBorderColor'], 'String');
      }
      if (data.hasOwnProperty('TableIndentationMode')) {
        obj['TableIndentationMode'] = ApiClient.convertToType(data['TableIndentationMode'], 'String');
      }
      if (data.hasOwnProperty('TableIndentationWidth')) {
        obj['TableIndentationWidth'] = ApiClient.convertToType(data['TableIndentationWidth'], 'Number');
      }
    }
    return obj;
  }

  /**
   * The ID of the table; leave blank for new tables
   * @member {String} TableID
   */
  exports.prototype['TableID'] = undefined;
  /**
   * The Path of the location of this object; leave blank for new tables
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * The Width of the table, or 0 if not specified
   * @member {String} Width
   */
  exports.prototype['Width'] = undefined;
  /**
   * The Width configuration type of the table
   * @member {String} WidthType
   */
  exports.prototype['WidthType'] = undefined;
  /**
   * Rows in the table; this is where the contents is located
   * @member {Array.<module:model/DocxTableRow>} TableRows
   */
  exports.prototype['TableRows'] = undefined;
  /**
   * Type for the top border - can be a Single, DashDotStroked, Dashed, DashSmallGap, DotDash, DotDotDash, Dotted, Double, DoubleWave, Inset, Nil, None, Outset, Thick, ThickThinLargeGap, ThickThinMediumGap, ThickThinSmallGap, ThinThickLargeGap, ThinThickMediumGap, ThinThickSmallGap, ThinThickThinLargeGap, ThinThickThinMediumGap, ThinThickThinSmallGap, ThreeDEmboss, ThreeDEngrave, Triple, Wave
   * @member {String} TopBorderType
   */
  exports.prototype['TopBorderType'] = undefined;
  /**
   * Width of the border in points (1/72nd of an inch)
   * @member {Number} TopBorderSize
   */
  exports.prototype['TopBorderSize'] = undefined;
  /**
   * Spacing around the border in points (1/72nd of an inch)
   * @member {Number} TopBorderSpace
   */
  exports.prototype['TopBorderSpace'] = undefined;
  /**
   * HTML-style color hex value (do not include a #)
   * @member {String} TopBorderColor
   */
  exports.prototype['TopBorderColor'] = undefined;
  /**
   * Type for the bottom border - can be a Single, DashDotStroked, Dashed, DashSmallGap, DotDash, DotDotDash, Dotted, Double, DoubleWave, Inset, Nil, None, Outset, Thick, ThickThinLargeGap, ThickThinMediumGap, ThickThinSmallGap, ThinThickLargeGap, ThinThickMediumGap, ThinThickSmallGap, ThinThickThinLargeGap, ThinThickThinMediumGap, ThinThickThinSmallGap, ThreeDEmboss, ThreeDEngrave, Triple, Wave
   * @member {String} BottomBorderType
   */
  exports.prototype['BottomBorderType'] = undefined;
  /**
   * Width of the border in points (1/72nd of an inch)
   * @member {Number} BottomBorderSize
   */
  exports.prototype['BottomBorderSize'] = undefined;
  /**
   * Spacing around the border in points (1/72nd of an inch)
   * @member {Number} BottomBorderSpace
   */
  exports.prototype['BottomBorderSpace'] = undefined;
  /**
   * HTML-style color hex value (do not include a #)
   * @member {String} BottomBorderColor
   */
  exports.prototype['BottomBorderColor'] = undefined;
  /**
   * Type for the left border - can be a Single, DashDotStroked, Dashed, DashSmallGap, DotDash, DotDotDash, Dotted, Double, DoubleWave, Inset, Nil, None, Outset, Thick, ThickThinLargeGap, ThickThinMediumGap, ThickThinSmallGap, ThinThickLargeGap, ThinThickMediumGap, ThinThickSmallGap, ThinThickThinLargeGap, ThinThickThinMediumGap, ThinThickThinSmallGap, ThreeDEmboss, ThreeDEngrave, Triple, Wave
   * @member {String} LeftBorderType
   */
  exports.prototype['LeftBorderType'] = undefined;
  /**
   * Width of the border in points (1/72nd of an inch)
   * @member {Number} LeftBorderSize
   */
  exports.prototype['LeftBorderSize'] = undefined;
  /**
   * Spacing around the border in points (1/72nd of an inch)
   * @member {Number} LeftBorderSpace
   */
  exports.prototype['LeftBorderSpace'] = undefined;
  /**
   * HTML-style color hex value (do not include a #)
   * @member {String} LeftBorderColor
   */
  exports.prototype['LeftBorderColor'] = undefined;
  /**
   * Type for the right border - can be a Single, DashDotStroked, Dashed, DashSmallGap, DotDash, DotDotDash, Dotted, Double, DoubleWave, Inset, Nil, None, Outset, Thick, ThickThinLargeGap, ThickThinMediumGap, ThickThinSmallGap, ThinThickLargeGap, ThinThickMediumGap, ThinThickSmallGap, ThinThickThinLargeGap, ThinThickThinMediumGap, ThinThickThinSmallGap, ThreeDEmboss, ThreeDEngrave, Triple, Wave
   * @member {String} RightBorderType
   */
  exports.prototype['RightBorderType'] = undefined;
  /**
   * Width of the border in points (1/72nd of an inch)
   * @member {Number} RightBorderSize
   */
  exports.prototype['RightBorderSize'] = undefined;
  /**
   * Spacing around the border in points (1/72nd of an inch)
   * @member {Number} RightBorderSpace
   */
  exports.prototype['RightBorderSpace'] = undefined;
  /**
   * HTML-style color hex value (do not include a #)
   * @member {String} RightBorderColor
   */
  exports.prototype['RightBorderColor'] = undefined;
  /**
   * Type for the cell horizontal border - can be a Single, DashDotStroked, Dashed, DashSmallGap, DotDash, DotDotDash, Dotted, Double, DoubleWave, Inset, Nil, None, Outset, Thick, ThickThinLargeGap, ThickThinMediumGap, ThickThinSmallGap, ThinThickLargeGap, ThinThickMediumGap, ThinThickSmallGap, ThinThickThinLargeGap, ThinThickThinMediumGap, ThinThickThinSmallGap, ThreeDEmboss, ThreeDEngrave, Triple, Wave
   * @member {String} CellHorizontalBorderType
   */
  exports.prototype['CellHorizontalBorderType'] = undefined;
  /**
   * Width of the border in points (1/72nd of an inch)
   * @member {Number} CellHorizontalBorderSize
   */
  exports.prototype['CellHorizontalBorderSize'] = undefined;
  /**
   * Spacing around the border in points (1/72nd of an inch)
   * @member {Number} CellHorizontalBorderSpace
   */
  exports.prototype['CellHorizontalBorderSpace'] = undefined;
  /**
   * HTML-style color hex value (do not include a #)
   * @member {String} CellHorizontalBorderColor
   */
  exports.prototype['CellHorizontalBorderColor'] = undefined;
  /**
   * Type for the cell vertical border - can be a Single, DashDotStroked, Dashed, DashSmallGap, DotDash, DotDotDash, Dotted, Double, DoubleWave, Inset, Nil, None, Outset, Thick, ThickThinLargeGap, ThickThinMediumGap, ThickThinSmallGap, ThinThickLargeGap, ThinThickMediumGap, ThinThickSmallGap, ThinThickThinLargeGap, ThinThickThinMediumGap, ThinThickThinSmallGap, ThreeDEmboss, ThreeDEngrave, Triple, Wave
   * @member {String} CellVerticalBorderType
   */
  exports.prototype['CellVerticalBorderType'] = undefined;
  /**
   * Width of the border in points (1/72nd of an inch)
   * @member {Number} CellVerticalBorderSize
   */
  exports.prototype['CellVerticalBorderSize'] = undefined;
  /**
   * Spacing around the border in points (1/72nd of an inch)
   * @member {Number} CellVerticalBorderSpace
   */
  exports.prototype['CellVerticalBorderSpace'] = undefined;
  /**
   * HTML-style color hex value (do not include a #)
   * @member {String} CellVerticalBorderColor
   */
  exports.prototype['CellVerticalBorderColor'] = undefined;
  /**
   * Type for the start border - can be a Single, DashDotStroked, Dashed, DashSmallGap, DotDash, DotDotDash, Dotted, Double, DoubleWave, Inset, Nil, None, Outset, Thick, ThickThinLargeGap, ThickThinMediumGap, ThickThinSmallGap, ThinThickLargeGap, ThinThickMediumGap, ThinThickSmallGap, ThinThickThinLargeGap, ThinThickThinMediumGap, ThinThickThinSmallGap, ThreeDEmboss, ThreeDEngrave, Triple, Wave
   * @member {String} StartBorderType
   */
  exports.prototype['StartBorderType'] = undefined;
  /**
   * Width of the border in points (1/72nd of an inch)
   * @member {Number} StartBorderSize
   */
  exports.prototype['StartBorderSize'] = undefined;
  /**
   * Spacing around the border in points (1/72nd of an inch)
   * @member {Number} StartBorderSpace
   */
  exports.prototype['StartBorderSpace'] = undefined;
  /**
   * HTML-style color hex value (do not include a #)
   * @member {String} StartBorderColor
   */
  exports.prototype['StartBorderColor'] = undefined;
  /**
   * Type for the end border - can be a Single, DashDotStroked, Dashed, DashSmallGap, DotDash, DotDotDash, Dotted, Double, DoubleWave, Inset, Nil, None, Outset, Thick, ThickThinLargeGap, ThickThinMediumGap, ThickThinSmallGap, ThinThickLargeGap, ThinThickMediumGap, ThinThickSmallGap, ThinThickThinLargeGap, ThinThickThinMediumGap, ThinThickThinSmallGap, ThreeDEmboss, ThreeDEngrave, Triple, Wave
   * @member {String} EndBorderType
   */
  exports.prototype['EndBorderType'] = undefined;
  /**
   * Width of the border in points (1/72nd of an inch)
   * @member {Number} EndBorderSize
   */
  exports.prototype['EndBorderSize'] = undefined;
  /**
   * Spacing around the border in points (1/72nd of an inch)
   * @member {Number} EndBorderSpace
   */
  exports.prototype['EndBorderSpace'] = undefined;
  /**
   * HTML-style color hex value (do not include a #)
   * @member {String} EndBorderColor
   */
  exports.prototype['EndBorderColor'] = undefined;
  /**
   * Table indentation type
   * @member {String} TableIndentationMode
   */
  exports.prototype['TableIndentationMode'] = undefined;
  /**
   * Table indentation width
   * @member {Number} TableIndentationWidth
   */
  exports.prototype['TableIndentationWidth'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxTableRow":43}],42:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxParagraph'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxParagraph'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxTableCell = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxParagraph);
  }
}(this, function(ApiClient, DocxParagraph) {
  'use strict';




  /**
   * The DocxTableCell model module.
   * @module model/DocxTableCell
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxTableCell</code>.
   * A cell in a Word Document (DOCX) file
   * @alias module:model/DocxTableCell
   * @class
   */
  var exports = function() {
    var _this = this;









  };

  /**
   * Constructs a <code>DocxTableCell</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxTableCell} obj Optional instance to populate.
   * @return {module:model/DocxTableCell} The populated <code>DocxTableCell</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('CellIndex')) {
        obj['CellIndex'] = ApiClient.convertToType(data['CellIndex'], 'Number');
      }
      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('Paragraphs')) {
        obj['Paragraphs'] = ApiClient.convertToType(data['Paragraphs'], [DocxParagraph]);
      }
      if (data.hasOwnProperty('CellShadingColor')) {
        obj['CellShadingColor'] = ApiClient.convertToType(data['CellShadingColor'], 'String');
      }
      if (data.hasOwnProperty('CellShadingFill')) {
        obj['CellShadingFill'] = ApiClient.convertToType(data['CellShadingFill'], 'String');
      }
      if (data.hasOwnProperty('CellShadingPattern')) {
        obj['CellShadingPattern'] = ApiClient.convertToType(data['CellShadingPattern'], 'String');
      }
      if (data.hasOwnProperty('CellWidthMode')) {
        obj['CellWidthMode'] = ApiClient.convertToType(data['CellWidthMode'], 'String');
      }
      if (data.hasOwnProperty('CellWidth')) {
        obj['CellWidth'] = ApiClient.convertToType(data['CellWidth'], 'String');
      }
    }
    return obj;
  }

  /**
   * The index of the cell, 0-based
   * @member {Number} CellIndex
   */
  exports.prototype['CellIndex'] = undefined;
  /**
   * The Path of the location of this object; leave blank for new tables
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * Paragraphs inside the cell; this is where the contents of the cell are stored
   * @member {Array.<module:model/DocxParagraph>} Paragraphs
   */
  exports.prototype['Paragraphs'] = undefined;
  /**
   * Color of the cell shading
   * @member {String} CellShadingColor
   */
  exports.prototype['CellShadingColor'] = undefined;
  /**
   * Fill of the cell shading
   * @member {String} CellShadingFill
   */
  exports.prototype['CellShadingFill'] = undefined;
  /**
   * Pattern of the cell shading
   * @member {String} CellShadingPattern
   */
  exports.prototype['CellShadingPattern'] = undefined;
  /**
   * Width mode of the cell; can be auto (for automatic) or manual
   * @member {String} CellWidthMode
   */
  exports.prototype['CellWidthMode'] = undefined;
  /**
   * Width of the cell
   * @member {String} CellWidth
   */
  exports.prototype['CellWidth'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxParagraph":31}],43:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxTableCell'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxTableCell'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxTableRow = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxTableCell);
  }
}(this, function(ApiClient, DocxTableCell) {
  'use strict';




  /**
   * The DocxTableRow model module.
   * @module model/DocxTableRow
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxTableRow</code>.
   * A row in a Word Document (DOCX) file
   * @alias module:model/DocxTableRow
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>DocxTableRow</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxTableRow} obj Optional instance to populate.
   * @return {module:model/DocxTableRow} The populated <code>DocxTableRow</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('RowIndex')) {
        obj['RowIndex'] = ApiClient.convertToType(data['RowIndex'], 'Number');
      }
      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('RowCells')) {
        obj['RowCells'] = ApiClient.convertToType(data['RowCells'], [DocxTableCell]);
      }
    }
    return obj;
  }

  /**
   * Index of the row, 0-based
   * @member {Number} RowIndex
   */
  exports.prototype['RowIndex'] = undefined;
  /**
   * The Path of the location of this object; leave blank for new tables
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * Cells in the row; this is where the contents of the row is stored
   * @member {Array.<module:model/DocxTableCell>} RowCells
   */
  exports.prototype['RowCells'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxTableCell":42}],44:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.DocxText = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DocxText model module.
   * @module model/DocxText
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>DocxText</code>.
   * Unit of text content in a Word Document (DOCX) file
   * @alias module:model/DocxText
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>DocxText</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DocxText} obj Optional instance to populate.
   * @return {module:model/DocxText} The populated <code>DocxText</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('TextIndex')) {
        obj['TextIndex'] = ApiClient.convertToType(data['TextIndex'], 'Number');
      }
      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('TextContent')) {
        obj['TextContent'] = ApiClient.convertToType(data['TextContent'], 'String');
      }
    }
    return obj;
  }

  /**
   * Index of the text content in the run; 0-based
   * @member {Number} TextIndex
   */
  exports.prototype['TextIndex'] = undefined;
  /**
   * The Path of the location of this object; leave blank for new tables
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * Text string containing the text content of this text content item
   * @member {String} TextContent
   */
  exports.prototype['TextContent'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],45:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.ExifValue = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The ExifValue model module.
   * @module model/ExifValue
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>ExifValue</code>.
   * EXIF tag and value
   * @alias module:model/ExifValue
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>ExifValue</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/ExifValue} obj Optional instance to populate.
   * @return {module:model/ExifValue} The populated <code>ExifValue</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Tag')) {
        obj['Tag'] = ApiClient.convertToType(data['Tag'], 'String');
      }
      if (data.hasOwnProperty('DataType')) {
        obj['DataType'] = ApiClient.convertToType(data['DataType'], 'String');
      }
      if (data.hasOwnProperty('DataValue')) {
        obj['DataValue'] = ApiClient.convertToType(data['DataValue'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} Tag
   */
  exports.prototype['Tag'] = undefined;
  /**
   * @member {String} DataType
   */
  exports.prototype['DataType'] = undefined;
  /**
   * @member {String} DataValue
   */
  exports.prototype['DataValue'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],46:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.FinishEditingRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The FinishEditingRequest model module.
   * @module model/FinishEditingRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>FinishEditingRequest</code>.
   * Input to a Finish Editing request
   * @alias module:model/FinishEditingRequest
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>FinishEditingRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/FinishEditingRequest} obj Optional instance to populate.
   * @return {module:model/FinishEditingRequest} The populated <code>FinishEditingRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
    }
    return obj;
  }

  /**
   * URL of a document being edited to get the contents of.
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],47:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetDocxBodyRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The GetDocxBodyRequest model module.
   * @module model/GetDocxBodyRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetDocxBodyRequest</code>.
   * Input to a Get Body request
   * @alias module:model/GetDocxBodyRequest
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetDocxBodyRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetDocxBodyRequest} obj Optional instance to populate.
   * @return {module:model/GetDocxBodyRequest} The populated <code>GetDocxBodyRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],48:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxBody'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxBody'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetDocxBodyResponse = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxBody);
  }
}(this, function(ApiClient, DocxBody) {
  'use strict';




  /**
   * The GetDocxBodyResponse model module.
   * @module model/GetDocxBodyResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetDocxBodyResponse</code>.
   * Result of running a Get-Body command
   * @alias module:model/GetDocxBodyResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetDocxBodyResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetDocxBodyResponse} obj Optional instance to populate.
   * @return {module:model/GetDocxBodyResponse} The populated <code>GetDocxBodyResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Body')) {
        obj['Body'] = DocxBody.constructFromObject(data['Body']);
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Body in the DOCX document
   * @member {module:model/DocxBody} Body
   */
  exports.prototype['Body'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxBody":24}],49:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetDocxHeadersAndFootersRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The GetDocxHeadersAndFootersRequest model module.
   * @module model/GetDocxHeadersAndFootersRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetDocxHeadersAndFootersRequest</code>.
   * Input to a Get Tables request
   * @alias module:model/GetDocxHeadersAndFootersRequest
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetDocxHeadersAndFootersRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetDocxHeadersAndFootersRequest} obj Optional instance to populate.
   * @return {module:model/GetDocxHeadersAndFootersRequest} The populated <code>GetDocxHeadersAndFootersRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],50:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxFooter', 'model/DocxHeader'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxFooter'), require('./DocxHeader'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetDocxHeadersAndFootersResponse = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxFooter, root.CloudmersiveConvertApiClient.DocxHeader);
  }
}(this, function(ApiClient, DocxFooter, DocxHeader) {
  'use strict';




  /**
   * The GetDocxHeadersAndFootersResponse model module.
   * @module model/GetDocxHeadersAndFootersResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetDocxHeadersAndFootersResponse</code>.
   * Result of running a Get-Tables command
   * @alias module:model/GetDocxHeadersAndFootersResponse
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>GetDocxHeadersAndFootersResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetDocxHeadersAndFootersResponse} obj Optional instance to populate.
   * @return {module:model/GetDocxHeadersAndFootersResponse} The populated <code>GetDocxHeadersAndFootersResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Headers')) {
        obj['Headers'] = ApiClient.convertToType(data['Headers'], [DocxHeader]);
      }
      if (data.hasOwnProperty('Footers')) {
        obj['Footers'] = ApiClient.convertToType(data['Footers'], [DocxFooter]);
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * @member {Array.<module:model/DocxHeader>} Headers
   */
  exports.prototype['Headers'] = undefined;
  /**
   * @member {Array.<module:model/DocxFooter>} Footers
   */
  exports.prototype['Footers'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxFooter":26,"./DocxHeader":27}],51:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetDocxImagesRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The GetDocxImagesRequest model module.
   * @module model/GetDocxImagesRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetDocxImagesRequest</code>.
   * Input to a Get Images request
   * @alias module:model/GetDocxImagesRequest
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetDocxImagesRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetDocxImagesRequest} obj Optional instance to populate.
   * @return {module:model/GetDocxImagesRequest} The populated <code>GetDocxImagesRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],52:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxImage'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxImage'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetDocxImagesResponse = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxImage);
  }
}(this, function(ApiClient, DocxImage) {
  'use strict';




  /**
   * The GetDocxImagesResponse model module.
   * @module model/GetDocxImagesResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetDocxImagesResponse</code>.
   * Result of running a Get-Images command
   * @alias module:model/GetDocxImagesResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetDocxImagesResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetDocxImagesResponse} obj Optional instance to populate.
   * @return {module:model/GetDocxImagesResponse} The populated <code>GetDocxImagesResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Images')) {
        obj['Images'] = ApiClient.convertToType(data['Images'], [DocxImage]);
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Images in the DOCX document
   * @member {Array.<module:model/DocxImage>} Images
   */
  exports.prototype['Images'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxImage":28}],53:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetDocxSectionsRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The GetDocxSectionsRequest model module.
   * @module model/GetDocxSectionsRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetDocxSectionsRequest</code>.
   * Input to a Get Sections request
   * @alias module:model/GetDocxSectionsRequest
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetDocxSectionsRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetDocxSectionsRequest} obj Optional instance to populate.
   * @return {module:model/GetDocxSectionsRequest} The populated <code>GetDocxSectionsRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],54:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxSection'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxSection'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetDocxSectionsResponse = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxSection);
  }
}(this, function(ApiClient, DocxSection) {
  'use strict';




  /**
   * The GetDocxSectionsResponse model module.
   * @module model/GetDocxSectionsResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetDocxSectionsResponse</code>.
   * Result of running a Get-Sections command
   * @alias module:model/GetDocxSectionsResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetDocxSectionsResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetDocxSectionsResponse} obj Optional instance to populate.
   * @return {module:model/GetDocxSectionsResponse} The populated <code>GetDocxSectionsResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Sections')) {
        obj['Sections'] = ApiClient.convertToType(data['Sections'], [DocxSection]);
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Sections in the DOCX document
   * @member {Array.<module:model/DocxSection>} Sections
   */
  exports.prototype['Sections'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxSection":35}],55:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetDocxStylesRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The GetDocxStylesRequest model module.
   * @module model/GetDocxStylesRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetDocxStylesRequest</code>.
   * Input to a Get Tables request
   * @alias module:model/GetDocxStylesRequest
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetDocxStylesRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetDocxStylesRequest} obj Optional instance to populate.
   * @return {module:model/GetDocxStylesRequest} The populated <code>GetDocxStylesRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],56:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxStyle'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxStyle'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetDocxStylesResponse = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxStyle);
  }
}(this, function(ApiClient, DocxStyle) {
  'use strict';




  /**
   * The GetDocxStylesResponse model module.
   * @module model/GetDocxStylesResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetDocxStylesResponse</code>.
   * Result of running a Get-Tables command
   * @alias module:model/GetDocxStylesResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetDocxStylesResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetDocxStylesResponse} obj Optional instance to populate.
   * @return {module:model/GetDocxStylesResponse} The populated <code>GetDocxStylesResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Styles')) {
        obj['Styles'] = ApiClient.convertToType(data['Styles'], [DocxStyle]);
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Styles in the DOCX document
   * @member {Array.<module:model/DocxStyle>} Styles
   */
  exports.prototype['Styles'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxStyle":40}],57:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetDocxTablesRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The GetDocxTablesRequest model module.
   * @module model/GetDocxTablesRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetDocxTablesRequest</code>.
   * Input to a Get Tables request
   * @alias module:model/GetDocxTablesRequest
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetDocxTablesRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetDocxTablesRequest} obj Optional instance to populate.
   * @return {module:model/GetDocxTablesRequest} The populated <code>GetDocxTablesRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],58:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxTable'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxTable'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetDocxTablesResponse = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxTable);
  }
}(this, function(ApiClient, DocxTable) {
  'use strict';




  /**
   * The GetDocxTablesResponse model module.
   * @module model/GetDocxTablesResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetDocxTablesResponse</code>.
   * Result of running a Get-Tables command
   * @alias module:model/GetDocxTablesResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetDocxTablesResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetDocxTablesResponse} obj Optional instance to populate.
   * @return {module:model/GetDocxTablesResponse} The populated <code>GetDocxTablesResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Tables')) {
        obj['Tables'] = ApiClient.convertToType(data['Tables'], [DocxTable]);
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Tables in the DOCX file
   * @member {Array.<module:model/DocxTable>} Tables
   */
  exports.prototype['Tables'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxTable":41}],59:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/ExifValue'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./ExifValue'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetImageInfoResult = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.ExifValue);
  }
}(this, function(ApiClient, ExifValue) {
  'use strict';




  /**
   * The GetImageInfoResult model module.
   * @module model/GetImageInfoResult
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetImageInfoResult</code>.
   * Result of running a get-info operation on an image
   * @alias module:model/GetImageInfoResult
   * @class
   */
  var exports = function() {
    var _this = this;


















  };

  /**
   * Constructs a <code>GetImageInfoResult</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetImageInfoResult} obj Optional instance to populate.
   * @return {module:model/GetImageInfoResult} The populated <code>GetImageInfoResult</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('ColorSpace')) {
        obj['ColorSpace'] = ApiClient.convertToType(data['ColorSpace'], 'String');
      }
      if (data.hasOwnProperty('ColorType')) {
        obj['ColorType'] = ApiClient.convertToType(data['ColorType'], 'String');
      }
      if (data.hasOwnProperty('Width')) {
        obj['Width'] = ApiClient.convertToType(data['Width'], 'Number');
      }
      if (data.hasOwnProperty('Height')) {
        obj['Height'] = ApiClient.convertToType(data['Height'], 'Number');
      }
      if (data.hasOwnProperty('CompressionLevel')) {
        obj['CompressionLevel'] = ApiClient.convertToType(data['CompressionLevel'], 'Number');
      }
      if (data.hasOwnProperty('ImageHashSignature')) {
        obj['ImageHashSignature'] = ApiClient.convertToType(data['ImageHashSignature'], 'String');
      }
      if (data.hasOwnProperty('HasTransparency')) {
        obj['HasTransparency'] = ApiClient.convertToType(data['HasTransparency'], 'Boolean');
      }
      if (data.hasOwnProperty('MimeType')) {
        obj['MimeType'] = ApiClient.convertToType(data['MimeType'], 'String');
      }
      if (data.hasOwnProperty('ImageFormat')) {
        obj['ImageFormat'] = ApiClient.convertToType(data['ImageFormat'], 'String');
      }
      if (data.hasOwnProperty('DPIUnit')) {
        obj['DPIUnit'] = ApiClient.convertToType(data['DPIUnit'], 'String');
      }
      if (data.hasOwnProperty('DPI')) {
        obj['DPI'] = ApiClient.convertToType(data['DPI'], 'Number');
      }
      if (data.hasOwnProperty('ColorCount')) {
        obj['ColorCount'] = ApiClient.convertToType(data['ColorCount'], 'Number');
      }
      if (data.hasOwnProperty('BitDepth')) {
        obj['BitDepth'] = ApiClient.convertToType(data['BitDepth'], 'Number');
      }
      if (data.hasOwnProperty('Comment')) {
        obj['Comment'] = ApiClient.convertToType(data['Comment'], 'String');
      }
      if (data.hasOwnProperty('ExifProfileName')) {
        obj['ExifProfileName'] = ApiClient.convertToType(data['ExifProfileName'], 'String');
      }
      if (data.hasOwnProperty('ExifValues')) {
        obj['ExifValues'] = ApiClient.convertToType(data['ExifValues'], [ExifValue]);
      }
    }
    return obj;
  }

  /**
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Color space of the image
   * @member {String} ColorSpace
   */
  exports.prototype['ColorSpace'] = undefined;
  /**
   * Color type of the image
   * @member {String} ColorType
   */
  exports.prototype['ColorType'] = undefined;
  /**
   * Width in pixels of the image
   * @member {Number} Width
   */
  exports.prototype['Width'] = undefined;
  /**
   * Height in pixels of the image
   * @member {Number} Height
   */
  exports.prototype['Height'] = undefined;
  /**
   * Compression level value from 0 (lowest quality) to 100 (highest quality)
   * @member {Number} CompressionLevel
   */
  exports.prototype['CompressionLevel'] = undefined;
  /**
   * SHA256 hash signature of the image
   * @member {String} ImageHashSignature
   */
  exports.prototype['ImageHashSignature'] = undefined;
  /**
   * True if the image contains transparency, otherwise false
   * @member {Boolean} HasTransparency
   */
  exports.prototype['HasTransparency'] = undefined;
  /**
   * MIME type of the image format
   * @member {String} MimeType
   */
  exports.prototype['MimeType'] = undefined;
  /**
   * Image format
   * @member {String} ImageFormat
   */
  exports.prototype['ImageFormat'] = undefined;
  /**
   * Units of the DPI measurement; can be either in Inches or Centimeters
   * @member {String} DPIUnit
   */
  exports.prototype['DPIUnit'] = undefined;
  /**
   * DPI (pixels per unit, e.g. pixels per inch) of the image
   * @member {Number} DPI
   */
  exports.prototype['DPI'] = undefined;
  /**
   * Unique colors in the image
   * @member {Number} ColorCount
   */
  exports.prototype['ColorCount'] = undefined;
  /**
   * Bit depth of the image
   * @member {Number} BitDepth
   */
  exports.prototype['BitDepth'] = undefined;
  /**
   * Comment string in the image
   * @member {String} Comment
   */
  exports.prototype['Comment'] = undefined;
  /**
   * Name of the EXIF profile used
   * @member {String} ExifProfileName
   */
  exports.prototype['ExifProfileName'] = undefined;
  /**
   * EXIF tags and values embedded in the image
   * @member {Array.<module:model/ExifValue>} ExifValues
   */
  exports.prototype['ExifValues'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./ExifValue":45}],60:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/XlsxWorksheet'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./XlsxWorksheet'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetXlsxColumnsRequest = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.XlsxWorksheet);
  }
}(this, function(ApiClient, XlsxWorksheet) {
  'use strict';




  /**
   * The GetXlsxColumnsRequest model module.
   * @module model/GetXlsxColumnsRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetXlsxColumnsRequest</code>.
   * Input to a Get Columns request
   * @alias module:model/GetXlsxColumnsRequest
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>GetXlsxColumnsRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetXlsxColumnsRequest} obj Optional instance to populate.
   * @return {module:model/GetXlsxColumnsRequest} The populated <code>GetXlsxColumnsRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
      if (data.hasOwnProperty('WorksheetToQuery')) {
        obj['WorksheetToQuery'] = XlsxWorksheet.constructFromObject(data['WorksheetToQuery']);
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;
  /**
   * Optional; Worksheet (tab) within the spreadsheet to get the columns of; leave blank to default to the first worksheet
   * @member {module:model/XlsxWorksheet} WorksheetToQuery
   */
  exports.prototype['WorksheetToQuery'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./XlsxWorksheet":92}],61:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/XlsxSpreadsheetColumn'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./XlsxSpreadsheetColumn'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetXlsxColumnsResponse = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.XlsxSpreadsheetColumn);
  }
}(this, function(ApiClient, XlsxSpreadsheetColumn) {
  'use strict';




  /**
   * The GetXlsxColumnsResponse model module.
   * @module model/GetXlsxColumnsResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetXlsxColumnsResponse</code>.
   * Result of running a Get-Columns command
   * @alias module:model/GetXlsxColumnsResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetXlsxColumnsResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetXlsxColumnsResponse} obj Optional instance to populate.
   * @return {module:model/GetXlsxColumnsResponse} The populated <code>GetXlsxColumnsResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Columns')) {
        obj['Columns'] = ApiClient.convertToType(data['Columns'], [XlsxSpreadsheetColumn]);
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Spreadsheet Columns in the DOCX document
   * @member {Array.<module:model/XlsxSpreadsheetColumn>} Columns
   */
  exports.prototype['Columns'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./XlsxSpreadsheetColumn":90}],62:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/XlsxWorksheet'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./XlsxWorksheet'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetXlsxImagesRequest = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.XlsxWorksheet);
  }
}(this, function(ApiClient, XlsxWorksheet) {
  'use strict';




  /**
   * The GetXlsxImagesRequest model module.
   * @module model/GetXlsxImagesRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetXlsxImagesRequest</code>.
   * Input to a Get Images request
   * @alias module:model/GetXlsxImagesRequest
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>GetXlsxImagesRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetXlsxImagesRequest} obj Optional instance to populate.
   * @return {module:model/GetXlsxImagesRequest} The populated <code>GetXlsxImagesRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
      if (data.hasOwnProperty('WorksheetToQuery')) {
        obj['WorksheetToQuery'] = XlsxWorksheet.constructFromObject(data['WorksheetToQuery']);
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;
  /**
   * Optional; Worksheet (tab) within the spreadsheet to get the images of; leave blank to default to the first worksheet
   * @member {module:model/XlsxWorksheet} WorksheetToQuery
   */
  exports.prototype['WorksheetToQuery'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./XlsxWorksheet":92}],63:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/XlsxImage'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./XlsxImage'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetXlsxImagesResponse = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.XlsxImage);
  }
}(this, function(ApiClient, XlsxImage) {
  'use strict';




  /**
   * The GetXlsxImagesResponse model module.
   * @module model/GetXlsxImagesResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetXlsxImagesResponse</code>.
   * Result of running a Get-Images command
   * @alias module:model/GetXlsxImagesResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetXlsxImagesResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetXlsxImagesResponse} obj Optional instance to populate.
   * @return {module:model/GetXlsxImagesResponse} The populated <code>GetXlsxImagesResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Images')) {
        obj['Images'] = ApiClient.convertToType(data['Images'], [XlsxImage]);
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Spreadsheet Columns in the DOCX document
   * @member {Array.<module:model/XlsxImage>} Images
   */
  exports.prototype['Images'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./XlsxImage":88}],64:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/XlsxWorksheet'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./XlsxWorksheet'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetXlsxRowsAndCellsRequest = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.XlsxWorksheet);
  }
}(this, function(ApiClient, XlsxWorksheet) {
  'use strict';




  /**
   * The GetXlsxRowsAndCellsRequest model module.
   * @module model/GetXlsxRowsAndCellsRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetXlsxRowsAndCellsRequest</code>.
   * Input to a Get Worksheets request
   * @alias module:model/GetXlsxRowsAndCellsRequest
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>GetXlsxRowsAndCellsRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetXlsxRowsAndCellsRequest} obj Optional instance to populate.
   * @return {module:model/GetXlsxRowsAndCellsRequest} The populated <code>GetXlsxRowsAndCellsRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
      if (data.hasOwnProperty('WorksheetToQuery')) {
        obj['WorksheetToQuery'] = XlsxWorksheet.constructFromObject(data['WorksheetToQuery']);
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;
  /**
   * Optional; Worksheet (tab) within the spreadsheet to get the rows and cells of; leave blank to default to the first worksheet
   * @member {module:model/XlsxWorksheet} WorksheetToQuery
   */
  exports.prototype['WorksheetToQuery'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./XlsxWorksheet":92}],65:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/XlsxSpreadsheetRow'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./XlsxSpreadsheetRow'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetXlsxRowsAndCellsResponse = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.XlsxSpreadsheetRow);
  }
}(this, function(ApiClient, XlsxSpreadsheetRow) {
  'use strict';




  /**
   * The GetXlsxRowsAndCellsResponse model module.
   * @module model/GetXlsxRowsAndCellsResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetXlsxRowsAndCellsResponse</code>.
   * Result of running a Get-Worksheets command
   * @alias module:model/GetXlsxRowsAndCellsResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetXlsxRowsAndCellsResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetXlsxRowsAndCellsResponse} obj Optional instance to populate.
   * @return {module:model/GetXlsxRowsAndCellsResponse} The populated <code>GetXlsxRowsAndCellsResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Rows')) {
        obj['Rows'] = ApiClient.convertToType(data['Rows'], [XlsxSpreadsheetRow]);
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Spreadsheet Rows in the DOCX document
   * @member {Array.<module:model/XlsxSpreadsheetRow>} Rows
   */
  exports.prototype['Rows'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./XlsxSpreadsheetRow":91}],66:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetXlsxStylesRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The GetXlsxStylesRequest model module.
   * @module model/GetXlsxStylesRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetXlsxStylesRequest</code>.
   * Input to a Get Worksheets request
   * @alias module:model/GetXlsxStylesRequest
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetXlsxStylesRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetXlsxStylesRequest} obj Optional instance to populate.
   * @return {module:model/GetXlsxStylesRequest} The populated <code>GetXlsxStylesRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],67:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxCellStyle'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxCellStyle'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetXlsxStylesResponse = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxCellStyle);
  }
}(this, function(ApiClient, DocxCellStyle) {
  'use strict';




  /**
   * The GetXlsxStylesResponse model module.
   * @module model/GetXlsxStylesResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetXlsxStylesResponse</code>.
   * Result of running a Get-Worksheets command
   * @alias module:model/GetXlsxStylesResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetXlsxStylesResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetXlsxStylesResponse} obj Optional instance to populate.
   * @return {module:model/GetXlsxStylesResponse} The populated <code>GetXlsxStylesResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('CellStyles')) {
        obj['CellStyles'] = ApiClient.convertToType(data['CellStyles'], [DocxCellStyle]);
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Cell styles
   * @member {Array.<module:model/DocxCellStyle>} CellStyles
   */
  exports.prototype['CellStyles'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxCellStyle":25}],68:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetXlsxWorksheetsRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The GetXlsxWorksheetsRequest model module.
   * @module model/GetXlsxWorksheetsRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetXlsxWorksheetsRequest</code>.
   * Input to a Get Worksheets request
   * @alias module:model/GetXlsxWorksheetsRequest
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetXlsxWorksheetsRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetXlsxWorksheetsRequest} obj Optional instance to populate.
   * @return {module:model/GetXlsxWorksheetsRequest} The populated <code>GetXlsxWorksheetsRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],69:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/XlsxWorksheet'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./XlsxWorksheet'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.GetXlsxWorksheetsResponse = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.XlsxWorksheet);
  }
}(this, function(ApiClient, XlsxWorksheet) {
  'use strict';




  /**
   * The GetXlsxWorksheetsResponse model module.
   * @module model/GetXlsxWorksheetsResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>GetXlsxWorksheetsResponse</code>.
   * Result of running a Get-Worksheets command
   * @alias module:model/GetXlsxWorksheetsResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>GetXlsxWorksheetsResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetXlsxWorksheetsResponse} obj Optional instance to populate.
   * @return {module:model/GetXlsxWorksheetsResponse} The populated <code>GetXlsxWorksheetsResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Worksheets')) {
        obj['Worksheets'] = ApiClient.convertToType(data['Worksheets'], [XlsxWorksheet]);
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Styles in the DOCX document
   * @member {Array.<module:model/XlsxWorksheet>} Worksheets
   */
  exports.prototype['Worksheets'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./XlsxWorksheet":92}],70:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.HtmlMdResult = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The HtmlMdResult model module.
   * @module model/HtmlMdResult
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>HtmlMdResult</code>.
   * Result from converting a Markdown file to HTML
   * @alias module:model/HtmlMdResult
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>HtmlMdResult</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/HtmlMdResult} obj Optional instance to populate.
   * @return {module:model/HtmlMdResult} The populated <code>HtmlMdResult</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Html')) {
        obj['Html'] = ApiClient.convertToType(data['Html'], 'String');
      }
    }
    return obj;
  }

  /**
   * True if operation was successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Resulting HTML from the conversion
   * @member {String} Html
   */
  exports.prototype['Html'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],71:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/HtmlTemplateOperation'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./HtmlTemplateOperation'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.HtmlTemplateApplicationRequest = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.HtmlTemplateOperation);
  }
}(this, function(ApiClient, HtmlTemplateOperation) {
  'use strict';




  /**
   * The HtmlTemplateApplicationRequest model module.
   * @module model/HtmlTemplateApplicationRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>HtmlTemplateApplicationRequest</code>.
   * HTML template application request
   * @alias module:model/HtmlTemplateApplicationRequest
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>HtmlTemplateApplicationRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/HtmlTemplateApplicationRequest} obj Optional instance to populate.
   * @return {module:model/HtmlTemplateApplicationRequest} The populated <code>HtmlTemplateApplicationRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('HtmlTemplate')) {
        obj['HtmlTemplate'] = ApiClient.convertToType(data['HtmlTemplate'], 'String');
      }
      if (data.hasOwnProperty('HtmlTemplateUrl')) {
        obj['HtmlTemplateUrl'] = ApiClient.convertToType(data['HtmlTemplateUrl'], 'String');
      }
      if (data.hasOwnProperty('Operations')) {
        obj['Operations'] = ApiClient.convertToType(data['Operations'], [HtmlTemplateOperation]);
      }
    }
    return obj;
  }

  /**
   * @member {String} HtmlTemplate
   */
  exports.prototype['HtmlTemplate'] = undefined;
  /**
   * @member {String} HtmlTemplateUrl
   */
  exports.prototype['HtmlTemplateUrl'] = undefined;
  /**
   * @member {Array.<module:model/HtmlTemplateOperation>} Operations
   */
  exports.prototype['Operations'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./HtmlTemplateOperation":73}],72:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.HtmlTemplateApplicationResponse = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The HtmlTemplateApplicationResponse model module.
   * @module model/HtmlTemplateApplicationResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>HtmlTemplateApplicationResponse</code>.
   * Response from an HTML template application
   * @alias module:model/HtmlTemplateApplicationResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>HtmlTemplateApplicationResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/HtmlTemplateApplicationResponse} obj Optional instance to populate.
   * @return {module:model/HtmlTemplateApplicationResponse} The populated <code>HtmlTemplateApplicationResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('FinalHtml')) {
        obj['FinalHtml'] = ApiClient.convertToType(data['FinalHtml'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * @member {String} FinalHtml
   */
  exports.prototype['FinalHtml'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],73:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.HtmlTemplateOperation = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The HtmlTemplateOperation model module.
   * @module model/HtmlTemplateOperation
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>HtmlTemplateOperation</code>.
   * @alias module:model/HtmlTemplateOperation
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>HtmlTemplateOperation</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/HtmlTemplateOperation} obj Optional instance to populate.
   * @return {module:model/HtmlTemplateOperation} The populated <code>HtmlTemplateOperation</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Action')) {
        obj['Action'] = ApiClient.convertToType(data['Action'], 'Number');
      }
      if (data.hasOwnProperty('MatchAgsint')) {
        obj['MatchAgsint'] = ApiClient.convertToType(data['MatchAgsint'], 'String');
      }
      if (data.hasOwnProperty('ReplaceWith')) {
        obj['ReplaceWith'] = ApiClient.convertToType(data['ReplaceWith'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {module:model/HtmlTemplateOperation.ActionEnum} Action
   */
  exports.prototype['Action'] = undefined;
  /**
   * @member {String} MatchAgsint
   */
  exports.prototype['MatchAgsint'] = undefined;
  /**
   * @member {String} ReplaceWith
   */
  exports.prototype['ReplaceWith'] = undefined;


  /**
   * Allowed values for the <code>Action</code> property.
   * @enum {Number}
   * @readonly
   */
  exports.ActionEnum = {
    /**
     * value: 1
     * @const
     */
    "1": 1  };


  return exports;
}));



},{"../ApiClient":9}],74:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.HtmlToOfficeRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The HtmlToOfficeRequest model module.
   * @module model/HtmlToOfficeRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>HtmlToOfficeRequest</code>.
   * Details of the HTML to Office request
   * @alias module:model/HtmlToOfficeRequest
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>HtmlToOfficeRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/HtmlToOfficeRequest} obj Optional instance to populate.
   * @return {module:model/HtmlToOfficeRequest} The populated <code>HtmlToOfficeRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Html')) {
        obj['Html'] = ApiClient.convertToType(data['Html'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} Html
   */
  exports.prototype['Html'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],75:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.HtmlToPdfRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The HtmlToPdfRequest model module.
   * @module model/HtmlToPdfRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>HtmlToPdfRequest</code>.
   * Details of the HTML to PDF request
   * @alias module:model/HtmlToPdfRequest
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>HtmlToPdfRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/HtmlToPdfRequest} obj Optional instance to populate.
   * @return {module:model/HtmlToPdfRequest} The populated <code>HtmlToPdfRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Html')) {
        obj['Html'] = ApiClient.convertToType(data['Html'], 'String');
      }
      if (data.hasOwnProperty('ExtraLoadingWait')) {
        obj['ExtraLoadingWait'] = ApiClient.convertToType(data['ExtraLoadingWait'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {String} Html
   */
  exports.prototype['Html'] = undefined;
  /**
   * @member {Number} ExtraLoadingWait
   */
  exports.prototype['ExtraLoadingWait'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],76:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxParagraph'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxParagraph'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.InsertDocxInsertParagraphRequest = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxParagraph);
  }
}(this, function(ApiClient, DocxParagraph) {
  'use strict';




  /**
   * The InsertDocxInsertParagraphRequest model module.
   * @module model/InsertDocxInsertParagraphRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>InsertDocxInsertParagraphRequest</code>.
   * Input to a Insert Paragraph request
   * @alias module:model/InsertDocxInsertParagraphRequest
   * @class
   */
  var exports = function() {
    var _this = this;






  };

  /**
   * Constructs a <code>InsertDocxInsertParagraphRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InsertDocxInsertParagraphRequest} obj Optional instance to populate.
   * @return {module:model/InsertDocxInsertParagraphRequest} The populated <code>InsertDocxInsertParagraphRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
      if (data.hasOwnProperty('ParagraphToInsert')) {
        obj['ParagraphToInsert'] = DocxParagraph.constructFromObject(data['ParagraphToInsert']);
      }
      if (data.hasOwnProperty('InsertPlacement')) {
        obj['InsertPlacement'] = ApiClient.convertToType(data['InsertPlacement'], 'String');
      }
      if (data.hasOwnProperty('InsertPath')) {
        obj['InsertPath'] = ApiClient.convertToType(data['InsertPath'], 'String');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;
  /**
   * Table you would like to insert
   * @member {module:model/DocxParagraph} ParagraphToInsert
   */
  exports.prototype['ParagraphToInsert'] = undefined;
  /**
   * Optional; default is DocumentEnd.  Placement Type of the insert; possible values are: DocumentStart (very beginning of the document), DocumentEnd (very end of the document), BeforeExistingObject (right before an existing object - fill in the InsertPath field using the Path value from an existing object), AfterExistingObject (right after an existing object - fill in the InsertPath field using the Path value from an existing object)
   * @member {String} InsertPlacement
   */
  exports.prototype['InsertPlacement'] = undefined;
  /**
   * Optional; location within the document to insert the object; fill in the InsertPath field using the Path value from an existing object.  Used with InsertPlacement of BeforeExistingObject or AfterExistingObject
   * @member {String} InsertPath
   */
  exports.prototype['InsertPath'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxParagraph":31}],77:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.InsertDocxInsertParagraphResponse = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InsertDocxInsertParagraphResponse model module.
   * @module model/InsertDocxInsertParagraphResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>InsertDocxInsertParagraphResponse</code>.
   * Result of running an Insert-Paragraph command
   * @alias module:model/InsertDocxInsertParagraphResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>InsertDocxInsertParagraphResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InsertDocxInsertParagraphResponse} obj Optional instance to populate.
   * @return {module:model/InsertDocxInsertParagraphResponse} The populated <code>InsertDocxInsertParagraphResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('EditedDocumentURL')) {
        obj['EditedDocumentURL'] = ApiClient.convertToType(data['EditedDocumentURL'], 'String');
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * URL to the edited DOCX file; file is stored in an in-memory cache and will be deleted.  Call Finish-Editing to get the result document contents.
   * @member {String} EditedDocumentURL
   */
  exports.prototype['EditedDocumentURL'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],78:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DocxTable'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DocxTable'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.InsertDocxTablesRequest = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.DocxTable);
  }
}(this, function(ApiClient, DocxTable) {
  'use strict';




  /**
   * The InsertDocxTablesRequest model module.
   * @module model/InsertDocxTablesRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>InsertDocxTablesRequest</code>.
   * Input to a Insert Tables request
   * @alias module:model/InsertDocxTablesRequest
   * @class
   */
  var exports = function() {
    var _this = this;






  };

  /**
   * Constructs a <code>InsertDocxTablesRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InsertDocxTablesRequest} obj Optional instance to populate.
   * @return {module:model/InsertDocxTablesRequest} The populated <code>InsertDocxTablesRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
      if (data.hasOwnProperty('TableToInsert')) {
        obj['TableToInsert'] = DocxTable.constructFromObject(data['TableToInsert']);
      }
      if (data.hasOwnProperty('InsertPlacement')) {
        obj['InsertPlacement'] = ApiClient.convertToType(data['InsertPlacement'], 'String');
      }
      if (data.hasOwnProperty('InsertPath')) {
        obj['InsertPath'] = ApiClient.convertToType(data['InsertPath'], 'String');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;
  /**
   * Table you would like to insert
   * @member {module:model/DocxTable} TableToInsert
   */
  exports.prototype['TableToInsert'] = undefined;
  /**
   * Optional; default is DocumentEnd.  Placement Type of the insert; possible values are: DocumentStart (very beginning of the document), DocumentEnd (very end of the document), BeforeExistingObject (right before an existing object - fill in the InsertPath field using the Path value from an existing object), AfterExistingObject (right after an existing object - fill in the InsertPath field using the Path value from an existing object)
   * @member {String} InsertPlacement
   */
  exports.prototype['InsertPlacement'] = undefined;
  /**
   * Optional; location within the document to insert the object; fill in the InsertPath field using the Path value from an existing object.  Used with InsertPlacement of BeforeExistingObject or AfterExistingObject
   * @member {String} InsertPath
   */
  exports.prototype['InsertPath'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./DocxTable":41}],79:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.InsertDocxTablesResponse = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InsertDocxTablesResponse model module.
   * @module model/InsertDocxTablesResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>InsertDocxTablesResponse</code>.
   * Result of running an Insert-Tables command
   * @alias module:model/InsertDocxTablesResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>InsertDocxTablesResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InsertDocxTablesResponse} obj Optional instance to populate.
   * @return {module:model/InsertDocxTablesResponse} The populated <code>InsertDocxTablesResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('EditedDocumentURL')) {
        obj['EditedDocumentURL'] = ApiClient.convertToType(data['EditedDocumentURL'], 'String');
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * URL to the edited DOCX file; file is stored in an in-memory cache and will be deleted.  Call Finish-Editing to get the result document contents.
   * @member {String} EditedDocumentURL
   */
  exports.prototype['EditedDocumentURL'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],80:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/XlsxWorksheet'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./XlsxWorksheet'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.InsertXlsxWorksheetRequest = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.XlsxWorksheet);
  }
}(this, function(ApiClient, XlsxWorksheet) {
  'use strict';




  /**
   * The InsertXlsxWorksheetRequest model module.
   * @module model/InsertXlsxWorksheetRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>InsertXlsxWorksheetRequest</code>.
   * Input to a Get Worksheets request
   * @alias module:model/InsertXlsxWorksheetRequest
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>InsertXlsxWorksheetRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InsertXlsxWorksheetRequest} obj Optional instance to populate.
   * @return {module:model/InsertXlsxWorksheetRequest} The populated <code>InsertXlsxWorksheetRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
      if (data.hasOwnProperty('WorksheetToInsert')) {
        obj['WorksheetToInsert'] = XlsxWorksheet.constructFromObject(data['WorksheetToInsert']);
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;
  /**
   * Workersheet to insert
   * @member {module:model/XlsxWorksheet} WorksheetToInsert
   */
  exports.prototype['WorksheetToInsert'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./XlsxWorksheet":92}],81:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.InsertXlsxWorksheetResponse = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InsertXlsxWorksheetResponse model module.
   * @module model/InsertXlsxWorksheetResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>InsertXlsxWorksheetResponse</code>.
   * Result of running a Get-Worksheets command
   * @alias module:model/InsertXlsxWorksheetResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>InsertXlsxWorksheetResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InsertXlsxWorksheetResponse} obj Optional instance to populate.
   * @return {module:model/InsertXlsxWorksheetResponse} The populated <code>InsertXlsxWorksheetResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('EditedDocumentURL')) {
        obj['EditedDocumentURL'] = ApiClient.convertToType(data['EditedDocumentURL'], 'String');
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * URL to the edited XLSX file; file is stored in an in-memory cache and will be deleted.  Call Finish-Editing to get the result document contents.
   * @member {String} EditedDocumentURL
   */
  exports.prototype['EditedDocumentURL'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],82:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/ConvertedPngPage'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./ConvertedPngPage'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.PdfToPngResult = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.ConvertedPngPage);
  }
}(this, function(ApiClient, ConvertedPngPage) {
  'use strict';




  /**
   * The PdfToPngResult model module.
   * @module model/PdfToPngResult
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>PdfToPngResult</code>.
   * Result of converting a PDF to a PNG array
   * @alias module:model/PdfToPngResult
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>PdfToPngResult</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/PdfToPngResult} obj Optional instance to populate.
   * @return {module:model/PdfToPngResult} The populated <code>PdfToPngResult</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('PngResultPages')) {
        obj['PngResultPages'] = ApiClient.convertToType(data['PngResultPages'], [ConvertedPngPage]);
      }
    }
    return obj;
  }

  /**
   * True if the operation was successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Array of converted pages
   * @member {Array.<module:model/ConvertedPngPage>} PngResultPages
   */
  exports.prototype['PngResultPages'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./ConvertedPngPage":21}],83:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.RemoveDocxHeadersAndFootersRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The RemoveDocxHeadersAndFootersRequest model module.
   * @module model/RemoveDocxHeadersAndFootersRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>RemoveDocxHeadersAndFootersRequest</code>.
   * Input to a Remove Headers and Footers request
   * @alias module:model/RemoveDocxHeadersAndFootersRequest
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>RemoveDocxHeadersAndFootersRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/RemoveDocxHeadersAndFootersRequest} obj Optional instance to populate.
   * @return {module:model/RemoveDocxHeadersAndFootersRequest} The populated <code>RemoveDocxHeadersAndFootersRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
      if (data.hasOwnProperty('RemoveHeaders')) {
        obj['RemoveHeaders'] = ApiClient.convertToType(data['RemoveHeaders'], 'Boolean');
      }
      if (data.hasOwnProperty('RemoveFooters')) {
        obj['RemoveFooters'] = ApiClient.convertToType(data['RemoveFooters'], 'Boolean');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;
  /**
   * True if you would like to remove all headers from the input document, false otherwise
   * @member {Boolean} RemoveHeaders
   */
  exports.prototype['RemoveHeaders'] = undefined;
  /**
   * True if you would like to remove all footers from the input document, false otherwise
   * @member {Boolean} RemoveFooters
   */
  exports.prototype['RemoveFooters'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],84:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.RemoveDocxHeadersAndFootersResponse = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The RemoveDocxHeadersAndFootersResponse model module.
   * @module model/RemoveDocxHeadersAndFootersResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>RemoveDocxHeadersAndFootersResponse</code>.
   * Result of running a Remove Headers and Footers command
   * @alias module:model/RemoveDocxHeadersAndFootersResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>RemoveDocxHeadersAndFootersResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/RemoveDocxHeadersAndFootersResponse} obj Optional instance to populate.
   * @return {module:model/RemoveDocxHeadersAndFootersResponse} The populated <code>RemoveDocxHeadersAndFootersResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('EditedDocumentURL')) {
        obj['EditedDocumentURL'] = ApiClient.convertToType(data['EditedDocumentURL'], 'String');
      }
    }
    return obj;
  }

  /**
   * True if successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * URL of the resulting edited document; this is a secure URL and cannot be downloaded without adding the Apikey header; it is also temporary, stored in an in-memory cache and will be deleted.  Call Finish-Editing to get the result document contents.
   * @member {String} EditedDocumentURL
   */
  exports.prototype['EditedDocumentURL'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],85:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.ReplaceStringRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The ReplaceStringRequest model module.
   * @module model/ReplaceStringRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>ReplaceStringRequest</code>.
   * Input to a string replacement request
   * @alias module:model/ReplaceStringRequest
   * @class
   */
  var exports = function() {
    var _this = this;






  };

  /**
   * Constructs a <code>ReplaceStringRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/ReplaceStringRequest} obj Optional instance to populate.
   * @return {module:model/ReplaceStringRequest} The populated <code>ReplaceStringRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('InputFileBytes')) {
        obj['InputFileBytes'] = ApiClient.convertToType(data['InputFileBytes'], 'Blob');
      }
      if (data.hasOwnProperty('InputFileUrl')) {
        obj['InputFileUrl'] = ApiClient.convertToType(data['InputFileUrl'], 'String');
      }
      if (data.hasOwnProperty('MatchString')) {
        obj['MatchString'] = ApiClient.convertToType(data['MatchString'], 'String');
      }
      if (data.hasOwnProperty('ReplaceString')) {
        obj['ReplaceString'] = ApiClient.convertToType(data['ReplaceString'], 'String');
      }
      if (data.hasOwnProperty('MatchCase')) {
        obj['MatchCase'] = ApiClient.convertToType(data['MatchCase'], 'Boolean');
      }
    }
    return obj;
  }

  /**
   * Optional: Bytes of the input file to operate on
   * @member {Blob} InputFileBytes
   */
  exports.prototype['InputFileBytes'] = undefined;
  /**
   * Optional: URL of a file to operate on as input.  This can be a public URL, or you can also use the begin-editing API to upload a document and pass in the secure URL result from that operation as the URL here (this URL is not public).
   * @member {String} InputFileUrl
   */
  exports.prototype['InputFileUrl'] = undefined;
  /**
   * String to search for and match against, to be replaced
   * @member {String} MatchString
   */
  exports.prototype['MatchString'] = undefined;
  /**
   * String to replace the matched values with
   * @member {String} ReplaceString
   */
  exports.prototype['ReplaceString'] = undefined;
  /**
   * True if the case should be matched, false for case insensitive match
   * @member {Boolean} MatchCase
   */
  exports.prototype['MatchCase'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],86:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.ScreenshotRequest = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The ScreenshotRequest model module.
   * @module model/ScreenshotRequest
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>ScreenshotRequest</code>.
   * Details of the screenshot request
   * @alias module:model/ScreenshotRequest
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>ScreenshotRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/ScreenshotRequest} obj Optional instance to populate.
   * @return {module:model/ScreenshotRequest} The populated <code>ScreenshotRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Url')) {
        obj['Url'] = ApiClient.convertToType(data['Url'], 'String');
      }
      if (data.hasOwnProperty('ExtraLoadingWait')) {
        obj['ExtraLoadingWait'] = ApiClient.convertToType(data['ExtraLoadingWait'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {String} Url
   */
  exports.prototype['Url'] = undefined;
  /**
   * @member {Number} ExtraLoadingWait
   */
  exports.prototype['ExtraLoadingWait'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],87:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.ViewerResponse = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The ViewerResponse model module.
   * @module model/ViewerResponse
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>ViewerResponse</code>.
   * Result of creating a viewer
   * @alias module:model/ViewerResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>ViewerResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/ViewerResponse} obj Optional instance to populate.
   * @return {module:model/ViewerResponse} The populated <code>ViewerResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('HtmlEmbed')) {
        obj['HtmlEmbed'] = ApiClient.convertToType(data['HtmlEmbed'], 'String');
      }
      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
    }
    return obj;
  }

  /**
   * @member {String} HtmlEmbed
   */
  exports.prototype['HtmlEmbed'] = undefined;
  /**
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],88:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.XlsxImage = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The XlsxImage model module.
   * @module model/XlsxImage
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>XlsxImage</code>.
   * @alias module:model/XlsxImage
   * @class
   */
  var exports = function() {
    var _this = this;






  };

  /**
   * Constructs a <code>XlsxImage</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/XlsxImage} obj Optional instance to populate.
   * @return {module:model/XlsxImage} The populated <code>XlsxImage</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('ImageDataEmbedId')) {
        obj['ImageDataEmbedId'] = ApiClient.convertToType(data['ImageDataEmbedId'], 'String');
      }
      if (data.hasOwnProperty('ImageDataContentType')) {
        obj['ImageDataContentType'] = ApiClient.convertToType(data['ImageDataContentType'], 'String');
      }
      if (data.hasOwnProperty('ImageInternalFileName')) {
        obj['ImageInternalFileName'] = ApiClient.convertToType(data['ImageInternalFileName'], 'String');
      }
      if (data.hasOwnProperty('ImageContentsURL')) {
        obj['ImageContentsURL'] = ApiClient.convertToType(data['ImageContentsURL'], 'String');
      }
    }
    return obj;
  }

  /**
   * The Path of the location of this object; leave blank for new rows
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * Read-only; internal ID for the image contents
   * @member {String} ImageDataEmbedId
   */
  exports.prototype['ImageDataEmbedId'] = undefined;
  /**
   * Read-only; image data MIME content-type
   * @member {String} ImageDataContentType
   */
  exports.prototype['ImageDataContentType'] = undefined;
  /**
   * Read-only; internal file name/path for the image
   * @member {String} ImageInternalFileName
   */
  exports.prototype['ImageInternalFileName'] = undefined;
  /**
   * URL to the image contents; file is stored in an in-memory cache and will be deleted.  Call Finish-Editing to get the contents.
   * @member {String} ImageContentsURL
   */
  exports.prototype['ImageContentsURL'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],89:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.XlsxSpreadsheetCell = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The XlsxSpreadsheetCell model module.
   * @module model/XlsxSpreadsheetCell
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>XlsxSpreadsheetCell</code>.
   * Cell in an Excel Spreadsheet worksheet
   * @alias module:model/XlsxSpreadsheetCell
   * @class
   */
  var exports = function() {
    var _this = this;






  };

  /**
   * Constructs a <code>XlsxSpreadsheetCell</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/XlsxSpreadsheetCell} obj Optional instance to populate.
   * @return {module:model/XlsxSpreadsheetCell} The populated <code>XlsxSpreadsheetCell</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('TextValue')) {
        obj['TextValue'] = ApiClient.convertToType(data['TextValue'], 'String');
      }
      if (data.hasOwnProperty('CellIdentifier')) {
        obj['CellIdentifier'] = ApiClient.convertToType(data['CellIdentifier'], 'String');
      }
      if (data.hasOwnProperty('StyleIndex')) {
        obj['StyleIndex'] = ApiClient.convertToType(data['StyleIndex'], 'Number');
      }
      if (data.hasOwnProperty('Formula')) {
        obj['Formula'] = ApiClient.convertToType(data['Formula'], 'String');
      }
    }
    return obj;
  }

  /**
   * The Path of the location of this object; leave blank for new rows
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * Text value of the cell
   * @member {String} TextValue
   */
  exports.prototype['TextValue'] = undefined;
  /**
   * Cell reference of the cell, e.g. A1, Z22, etc.
   * @member {String} CellIdentifier
   */
  exports.prototype['CellIdentifier'] = undefined;
  /**
   * Identifier for the style to apply to this style
   * @member {Number} StyleIndex
   */
  exports.prototype['StyleIndex'] = undefined;
  /**
   * @member {String} Formula
   */
  exports.prototype['Formula'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],90:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/XlsxSpreadsheetCell'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./XlsxSpreadsheetCell'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.XlsxSpreadsheetColumn = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.XlsxSpreadsheetCell);
  }
}(this, function(ApiClient, XlsxSpreadsheetCell) {
  'use strict';




  /**
   * The XlsxSpreadsheetColumn model module.
   * @module model/XlsxSpreadsheetColumn
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>XlsxSpreadsheetColumn</code>.
   * Column in an Excel spreadsheet worksheet
   * @alias module:model/XlsxSpreadsheetColumn
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>XlsxSpreadsheetColumn</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/XlsxSpreadsheetColumn} obj Optional instance to populate.
   * @return {module:model/XlsxSpreadsheetColumn} The populated <code>XlsxSpreadsheetColumn</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('HeadingCell')) {
        obj['HeadingCell'] = XlsxSpreadsheetCell.constructFromObject(data['HeadingCell']);
      }
    }
    return obj;
  }

  /**
   * The Path of the location of this object; leave blank for new rows
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * Heading cell for this column
   * @member {module:model/XlsxSpreadsheetCell} HeadingCell
   */
  exports.prototype['HeadingCell'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./XlsxSpreadsheetCell":89}],91:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/XlsxSpreadsheetCell'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./XlsxSpreadsheetCell'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.XlsxSpreadsheetRow = factory(root.CloudmersiveConvertApiClient.ApiClient, root.CloudmersiveConvertApiClient.XlsxSpreadsheetCell);
  }
}(this, function(ApiClient, XlsxSpreadsheetCell) {
  'use strict';




  /**
   * The XlsxSpreadsheetRow model module.
   * @module model/XlsxSpreadsheetRow
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>XlsxSpreadsheetRow</code>.
   * Row in an Excel spreadsheet worksheet
   * @alias module:model/XlsxSpreadsheetRow
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>XlsxSpreadsheetRow</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/XlsxSpreadsheetRow} obj Optional instance to populate.
   * @return {module:model/XlsxSpreadsheetRow} The populated <code>XlsxSpreadsheetRow</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('Cells')) {
        obj['Cells'] = ApiClient.convertToType(data['Cells'], [XlsxSpreadsheetCell]);
      }
    }
    return obj;
  }

  /**
   * The Path of the location of this object; leave blank for new rows
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * Spreadsheet Cells in the spreadsheet row
   * @member {Array.<module:model/XlsxSpreadsheetCell>} Cells
   */
  exports.prototype['Cells'] = undefined;



  return exports;
}));



},{"../ApiClient":9,"./XlsxSpreadsheetCell":89}],92:[function(require,module,exports){
/**
 * convertapi
 * Convert API lets you effortlessly convert file formats and types.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveConvertApiClient) {
      root.CloudmersiveConvertApiClient = {};
    }
    root.CloudmersiveConvertApiClient.XlsxWorksheet = factory(root.CloudmersiveConvertApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The XlsxWorksheet model module.
   * @module model/XlsxWorksheet
   * @version 1.2.7
   */

  /**
   * Constructs a new <code>XlsxWorksheet</code>.
   * A worksheet (tab) in an Excel (XLSX) spreadsheet
   * @alias module:model/XlsxWorksheet
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>XlsxWorksheet</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/XlsxWorksheet} obj Optional instance to populate.
   * @return {module:model/XlsxWorksheet} The populated <code>XlsxWorksheet</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Path')) {
        obj['Path'] = ApiClient.convertToType(data['Path'], 'String');
      }
      if (data.hasOwnProperty('WorksheetName')) {
        obj['WorksheetName'] = ApiClient.convertToType(data['WorksheetName'], 'String');
      }
    }
    return obj;
  }

  /**
   * The Path of the location of this object; leave blank for new worksheets
   * @member {String} Path
   */
  exports.prototype['Path'] = undefined;
  /**
   * User-facing name of the worksheet tab
   * @member {String} WorksheetName
   */
  exports.prototype['WorksheetName'] = undefined;



  return exports;
}));



},{"../ApiClient":9}],93:[function(require,module,exports){
(function (Buffer){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['superagent', 'querystring'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('superagent'), require('querystring'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.ApiClient = factory(root.superagent, root.querystring);
  }
}(this, function(superagent, querystring) {
  'use strict';

  /**
   * @module ApiClient
   * @version 1.1.4
   */

  /**
   * Manages low level client-server communications, parameter marshalling, etc. There should not be any need for an
   * application to use this class directly - the *Api and model classes provide the public API for the service. The
   * contents of this file should be regarded as internal but are documented for completeness.
   * @alias module:ApiClient
   * @class
   */
  var exports = function() {
    /**
     * The base URL against which to resolve every API call's (relative) path.
     * @type {String}
     * @default https://api.cloudmersive.com
     */
    this.basePath = 'https://api.cloudmersive.com'.replace(/\/+$/, '');

    /**
     * The authentication methods to be included for all API calls.
     * @type {Array.<String>}
     */
    this.authentications = {
      'Apikey': {type: 'apiKey', 'in': 'header', name: 'Apikey'}
    };
    /**
     * The default HTTP headers to be included for all API calls.
     * @type {Array.<String>}
     * @default {}
     */
    this.defaultHeaders = {};

    /**
     * The default HTTP timeout for all API calls.
     * @type {Number}
     * @default 60000
     */
    this.timeout = 60000;

    /**
     * If set to false an additional timestamp parameter is added to all API GET calls to
     * prevent browser caching
     * @type {Boolean}
     * @default true
     */
    this.cache = true;

    /**
     * If set to true, the client will save the cookies from each server
     * response, and return them in the next request.
     * @default false
     */
    this.enableCookies = false;

    /*
     * Used to save and return cookies in a node.js (non-browser) setting,
     * if this.enableCookies is set to true.
     */
    if (typeof window === 'undefined') {
      this.agent = new superagent.agent();
    }

    /*
     * Allow user to override superagent agent
     */
    this.requestAgent = null;
  };

  /**
   * Returns a string representation for an actual parameter.
   * @param param The actual parameter.
   * @returns {String} The string representation of <code>param</code>.
   */
  exports.prototype.paramToString = function(param) {
    if (param == undefined || param == null) {
      return '';
    }
    if (param instanceof Date) {
      return param.toJSON();
    }
    return param.toString();
  };

  /**
   * Builds full URL by appending the given path to the base URL and replacing path parameter place-holders with parameter values.
   * NOTE: query parameters are not handled here.
   * @param {String} path The path to append to the base URL.
   * @param {Object} pathParams The parameter values to append.
   * @returns {String} The encoded path with parameter values substituted.
   */
  exports.prototype.buildUrl = function(path, pathParams) {
    if (!path.match(/^\//)) {
      path = '/' + path;
    }
    var url = this.basePath + path;
    var _this = this;
    url = url.replace(/\{([\w-]+)\}/g, function(fullMatch, key) {
      var value;
      if (pathParams.hasOwnProperty(key)) {
        value = _this.paramToString(pathParams[key]);
      } else {
        value = fullMatch;
      }
      return encodeURIComponent(value);
    });
    return url;
  };

  /**
   * Checks whether the given content type represents JSON.<br>
   * JSON content type examples:<br>
   * <ul>
   * <li>application/json</li>
   * <li>application/json; charset=UTF8</li>
   * <li>APPLICATION/JSON</li>
   * </ul>
   * @param {String} contentType The MIME content type to check.
   * @returns {Boolean} <code>true</code> if <code>contentType</code> represents JSON, otherwise <code>false</code>.
   */
  exports.prototype.isJsonMime = function(contentType) {
    return Boolean(contentType != null && contentType.match(/^application\/json(;.*)?$/i));
  };

  /**
   * Chooses a content type from the given array, with JSON preferred; i.e. return JSON if included, otherwise return the first.
   * @param {Array.<String>} contentTypes
   * @returns {String} The chosen content type, preferring JSON.
   */
  exports.prototype.jsonPreferredMime = function(contentTypes) {
    for (var i = 0; i < contentTypes.length; i++) {
      if (this.isJsonMime(contentTypes[i])) {
        return contentTypes[i];
      }
    }
    return contentTypes[0];
  };

  /**
   * Checks whether the given parameter value represents file-like content.
   * @param param The parameter to check.
   * @returns {Boolean} <code>true</code> if <code>param</code> represents a file.
   */
  exports.prototype.isFileParam = function(param) {
    // fs.ReadStream in Node.js and Electron (but not in runtime like browserify)
    if (typeof require === 'function') {
      var fs;
      try {
        fs = require('fs');
      } catch (err) {}
      if (fs && fs.ReadStream && param instanceof fs.ReadStream) {
        return true;
      }
    }
    // Buffer in Node.js
    if (typeof Buffer === 'function' && param instanceof Buffer) {
      return true;
    }
    // Blob in browser
    if (typeof Blob === 'function' && param instanceof Blob) {
      return true;
    }
    // File in browser (it seems File object is also instance of Blob, but keep this for safe)
    if (typeof File === 'function' && param instanceof File) {
      return true;
    }
    return false;
  };

  /**
   * Normalizes parameter values:
   * <ul>
   * <li>remove nils</li>
   * <li>keep files and arrays</li>
   * <li>format to string with `paramToString` for other cases</li>
   * </ul>
   * @param {Object.<String, Object>} params The parameters as object properties.
   * @returns {Object.<String, Object>} normalized parameters.
   */
  exports.prototype.normalizeParams = function(params) {
    var newParams = {};
    for (var key in params) {
      if (params.hasOwnProperty(key) && params[key] != undefined && params[key] != null) {
        var value = params[key];
        if (this.isFileParam(value) || Array.isArray(value)) {
          newParams[key] = value;
        } else {
          newParams[key] = this.paramToString(value);
        }
      }
    }
    return newParams;
  };

  /**
   * Enumeration of collection format separator strategies.
   * @enum {String}
   * @readonly
   */
  exports.CollectionFormatEnum = {
    /**
     * Comma-separated values. Value: <code>csv</code>
     * @const
     */
    CSV: ',',
    /**
     * Space-separated values. Value: <code>ssv</code>
     * @const
     */
    SSV: ' ',
    /**
     * Tab-separated values. Value: <code>tsv</code>
     * @const
     */
    TSV: '\t',
    /**
     * Pipe(|)-separated values. Value: <code>pipes</code>
     * @const
     */
    PIPES: '|',
    /**
     * Native array. Value: <code>multi</code>
     * @const
     */
    MULTI: 'multi'
  };

  /**
   * Builds a string representation of an array-type actual parameter, according to the given collection format.
   * @param {Array} param An array parameter.
   * @param {module:ApiClient.CollectionFormatEnum} collectionFormat The array element separator strategy.
   * @returns {String|Array} A string representation of the supplied collection, using the specified delimiter. Returns
   * <code>param</code> as is if <code>collectionFormat</code> is <code>multi</code>.
   */
  exports.prototype.buildCollectionParam = function buildCollectionParam(param, collectionFormat) {
    if (param == null) {
      return null;
    }
    switch (collectionFormat) {
      case 'csv':
        return param.map(this.paramToString).join(',');
      case 'ssv':
        return param.map(this.paramToString).join(' ');
      case 'tsv':
        return param.map(this.paramToString).join('\t');
      case 'pipes':
        return param.map(this.paramToString).join('|');
      case 'multi':
        // return the array directly as SuperAgent will handle it as expected
        return param.map(this.paramToString);
      default:
        throw new Error('Unknown collection format: ' + collectionFormat);
    }
  };

  /**
   * Applies authentication headers to the request.
   * @param {Object} request The request object created by a <code>superagent()</code> call.
   * @param {Array.<String>} authNames An array of authentication method names.
   */
  exports.prototype.applyAuthToRequest = function(request, authNames) {
    var _this = this;
    authNames.forEach(function(authName) {
      var auth = _this.authentications[authName];
      switch (auth.type) {
        case 'basic':
          if (auth.username || auth.password) {
            request.auth(auth.username || '', auth.password || '');
          }
          break;
        case 'apiKey':
          if (auth.apiKey) {
            var data = {};
            if (auth.apiKeyPrefix) {
              data[auth.name] = auth.apiKeyPrefix + ' ' + auth.apiKey;
            } else {
              data[auth.name] = auth.apiKey;
            }
            if (auth['in'] === 'header') {
              request.set(data);
            } else {
              request.query(data);
            }
          }
          break;
        case 'oauth2':
          if (auth.accessToken) {
            request.set({'Authorization': 'Bearer ' + auth.accessToken});
          }
          break;
        default:
          throw new Error('Unknown authentication type: ' + auth.type);
      }
    });
  };

  /**
   * Deserializes an HTTP response body into a value of the specified type.
   * @param {Object} response A SuperAgent response object.
   * @param {(String|Array.<String>|Object.<String, Object>|Function)} returnType The type to return. Pass a string for simple types
   * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
   * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
   * all properties on <code>data<code> will be converted to this type.
   * @returns A value of the specified type.
   */
  exports.prototype.deserialize = function deserialize(response, returnType) {
    if (response == null || returnType == null || response.status == 204) {
      return null;
    }
    // Rely on SuperAgent for parsing response body.
    // See http://visionmedia.github.io/superagent/#parsing-response-bodies
    var data = response.body;
    if (data == null || (typeof data === 'object' && typeof data.length === 'undefined' && !Object.keys(data).length)) {
      // SuperAgent does not always produce a body; use the unparsed response as a fallback
      data = response.text;
    }
    return exports.convertToType(data, returnType);
  };

  /**
   * Callback function to receive the result of the operation.
   * @callback module:ApiClient~callApiCallback
   * @param {String} error Error message, if any.
   * @param data The data returned by the service call.
   * @param {String} response The complete HTTP response.
   */

  /**
   * Invokes the REST service using the supplied settings and parameters.
   * @param {String} path The base URL to invoke.
   * @param {String} httpMethod The HTTP method to use.
   * @param {Object.<String, String>} pathParams A map of path parameters and their values.
   * @param {Object.<String, Object>} queryParams A map of query parameters and their values.
   * @param {Object.<String, Object>} collectionQueryParams A map of collection query parameters and their values.
   * @param {Object.<String, Object>} headerParams A map of header parameters and their values.
   * @param {Object.<String, Object>} formParams A map of form parameters and their values.
   * @param {Object} bodyParam The value to pass as the request body.
   * @param {Array.<String>} authNames An array of authentication type names.
   * @param {Array.<String>} contentTypes An array of request MIME types.
   * @param {Array.<String>} accepts An array of acceptable response MIME types.
   * @param {(String|Array|ObjectFunction)} returnType The required type to return; can be a string for simple types or the
   * constructor for a complex type.
   * @param {module:ApiClient~callApiCallback} callback The callback function.
   * @returns {Object} The SuperAgent request object.
   */
  exports.prototype.callApi = function callApi(path, httpMethod, pathParams,
      queryParams, collectionQueryParams, headerParams, formParams, bodyParam, authNames, contentTypes, accepts,
      returnType, callback) {

    var _this = this;
    var url = this.buildUrl(path, pathParams);
    var request = superagent(httpMethod, url);

    // apply authentications
    this.applyAuthToRequest(request, authNames);

    // set collection query parameters
    for (var key in collectionQueryParams) {
      if (collectionQueryParams.hasOwnProperty(key)) {
        var param = collectionQueryParams[key];
        if (param.collectionFormat === 'csv') {
          // SuperAgent normally percent-encodes all reserved characters in a query parameter. However,
          // commas are used as delimiters for the 'csv' collectionFormat so they must not be encoded. We
          // must therefore construct and encode 'csv' collection query parameters manually.
          if (param.value != null) {
            var value = param.value.map(this.paramToString).map(encodeURIComponent).join(',');
            request.query(encodeURIComponent(key) + "=" + value);
          }
        } else {
          // All other collection query parameters should be treated as ordinary query parameters.
          queryParams[key] = this.buildCollectionParam(param.value, param.collectionFormat);
        }
      }
    }

    // set query parameters
    if (httpMethod.toUpperCase() === 'GET' && this.cache === false) {
        queryParams['_'] = new Date().getTime();
    }
    request.query(this.normalizeParams(queryParams));

    // set header parameters
    request.set(this.defaultHeaders).set(this.normalizeParams(headerParams));


    // set requestAgent if it is set by user
    if (this.requestAgent) {
      request.agent(this.requestAgent);
    }

    // set request timeout
    request.timeout(this.timeout);

    var contentType = this.jsonPreferredMime(contentTypes);
    if (contentType) {
      // Issue with superagent and multipart/form-data (https://github.com/visionmedia/superagent/issues/746)
      if(contentType != 'multipart/form-data') {
        request.type(contentType);
      }
    } else if (!request.header['Content-Type']) {
      request.type('application/json');
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      request.send(querystring.stringify(this.normalizeParams(formParams)));
    } else if (contentType == 'multipart/form-data') {
      var _formParams = this.normalizeParams(formParams);
      for (var key in _formParams) {
        if (_formParams.hasOwnProperty(key)) {
          if (this.isFileParam(_formParams[key])) {
            // file field
            request.attach(key, _formParams[key]);
          } else {
            request.field(key, _formParams[key]);
          }
        }
      }
    } else if (bodyParam) {
      request.send(bodyParam);
    }

    var accept = this.jsonPreferredMime(accepts);
    if (accept) {
      request.accept(accept);
    }

    if (returnType === 'Blob') {
      request.responseType('blob');
    } else if (returnType === 'String') {
      request.responseType('string');
    }

    // Attach previously saved cookies, if enabled
    if (this.enableCookies){
      if (typeof window === 'undefined') {
        this.agent.attachCookies(request);
      }
      else {
        request.withCredentials();
      }
    }


    request.end(function(error, response) {
      if (callback) {
        var data = null;
        if (!error) {
          try {
            data = _this.deserialize(response, returnType);
            if (_this.enableCookies && typeof window === 'undefined'){
              _this.agent.saveCookies(response);
            }
          } catch (err) {
            error = err;
          }
        }
        callback(error, data, response);
      }
    });

    return request;
  };

  /**
   * Parses an ISO-8601 string representation of a date value.
   * @param {String} str The date value as a string.
   * @returns {Date} The parsed date object.
   */
  exports.parseDate = function(str) {
    return new Date(str.replace(/T/i, ' '));
  };

  /**
   * Converts a value to the specified type.
   * @param {(String|Object)} data The data to convert, as a string or object.
   * @param {(String|Array.<String>|Object.<String, Object>|Function)} type The type to return. Pass a string for simple types
   * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
   * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
   * all properties on <code>data<code> will be converted to this type.
   * @returns An instance of the specified type or null or undefined if data is null or undefined.
   */
  exports.convertToType = function(data, type) {
    if (data === null || data === undefined)
      return data

    switch (type) {
      case 'Boolean':
        return Boolean(data);
      case 'Integer':
        return parseInt(data, 10);
      case 'Number':
        return parseFloat(data);
      case 'String':
        return String(data);
      case 'Date':
        return this.parseDate(String(data));
      case 'Blob':
      	return data;
      default:
        if (type === Object) {
          // generic object, return directly
          return data;
        } else if (typeof type === 'function') {
          // for model type like: User
          return type.constructFromObject(data);
        } else if (Array.isArray(type)) {
          // for array type like: ['String']
          var itemType = type[0];
          return data.map(function(item) {
            return exports.convertToType(item, itemType);
          });
        } else if (typeof type === 'object') {
          // for plain object type like: {'String': 'Integer'}
          var keyType, valueType;
          for (var k in type) {
            if (type.hasOwnProperty(k)) {
              keyType = k;
              valueType = type[k];
              break;
            }
          }
          var result = {};
          for (var k in data) {
            if (data.hasOwnProperty(k)) {
              var key = exports.convertToType(k, keyType);
              var value = exports.convertToType(data[k], valueType);
              result[key] = value;
            }
          }
          return result;
        } else {
          // for unknown type, return the data directly
          return data;
        }
    }
  };

  /**
   * Constructs a new map or array model from REST data.
   * @param data {Object|Array} The REST data.
   * @param obj {Object|Array} The target object or array.
   */
  exports.constructFromObject = function(data, obj, itemType) {
    if (Array.isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        if (data.hasOwnProperty(i))
          obj[i] = exports.convertToType(data[i], itemType);
      }
    } else {
      for (var k in data) {
        if (data.hasOwnProperty(k))
          obj[k] = exports.convertToType(data[k], itemType);
      }
    }
  };

  /**
   * The default API client implementation.
   * @type {module:ApiClient}
   */
  exports.instance = new exports();

  return exports;
}));

}).call(this,require("buffer").Buffer)
},{"buffer":3,"fs":2,"querystring":7,"superagent":134}],94:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.ArtisticApi = factory(root.CloudmersiveImageApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * Artistic service.
   * @module api/ArtisticApi
   * @version 1.1.4
   */

  /**
   * Constructs a new ArtisticApi. 
   * @alias module:api/ArtisticApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the artisticPainting operation.
     * @callback module:api/ArtisticApi~artisticPaintingCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Transform an image into an artistic painting automatically
     * Uses machine learning to automatically transform an image into an artistic painting.  Due to depth of AI processing, depending on image size this operation can take up to 20 seconds.
     * @param {String} style The style of the painting to apply.  To start, try \&quot;udnie\&quot; a painting style.  Possible values are: \&quot;udnie\&quot;, \&quot;wave\&quot;, \&quot;la_muse\&quot;, \&quot;rain_princess\&quot;.
     * @param {File} imageFile Image file to perform the operation on.  Common file formats such as PNG, JPEG are supported.
     * @param {module:api/ArtisticApi~artisticPaintingCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.artisticPainting = function(style, imageFile, callback) {
      var postBody = null;

      // verify the required parameter 'style' is set
      if (style === undefined || style === null) {
        throw new Error("Missing the required parameter 'style' when calling artisticPainting");
      }

      // verify the required parameter 'imageFile' is set
      if (imageFile === undefined || imageFile === null) {
        throw new Error("Missing the required parameter 'imageFile' when calling artisticPainting");
      }


      var pathParams = {
        'style': style
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'imageFile': imageFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/image/artistic/painting/{style}', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":93}],95:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DrawRectangleRequest', 'model/DrawTextRequest'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/DrawRectangleRequest'), require('../model/DrawTextRequest'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.EditApi = factory(root.CloudmersiveImageApiClient.ApiClient, root.CloudmersiveImageApiClient.DrawRectangleRequest, root.CloudmersiveImageApiClient.DrawTextRequest);
  }
}(this, function(ApiClient, DrawRectangleRequest, DrawTextRequest) {
  'use strict';

  /**
   * Edit service.
   * @module api/EditApi
   * @version 1.1.4
   */

  /**
   * Constructs a new EditApi. 
   * @alias module:api/EditApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the editCompositeBasic operation.
     * @callback module:api/EditApi~editCompositeBasicCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Composite two images together
     * Composites two input images together; a layered image onto a base image.  The first image you input is the base image.  The second image (the layered image) will be composited on top of this base image.  Supports PNG transparency.  To control padding you can include transparent pixels at the border(s) of your layered images as appropriate.
     * @param {String} location Location to composite the layered images; possible values are: \&quot;center\&quot;, \&quot;top-left\&quot;, \&quot;top-center\&quot;, \&quot;top-right\&quot;, \&quot;center-left\&quot;, \&quot;center-right\&quot;, \&quot;bottom-left\&quot;, \&quot;bottom-center\&quot;, \&quot;bottom-right\&quot;
     * @param {File} baseImage Image file to perform the operation on.  Common file formats such as PNG, JPEG are supported.
     * @param {File} layeredImage Image to layer on top of the base image.
     * @param {module:api/EditApi~editCompositeBasicCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    this.editCompositeBasic = function(location, baseImage, layeredImage, callback) {
      var postBody = null;

      // verify the required parameter 'location' is set
      if (location === undefined || location === null) {
        throw new Error("Missing the required parameter 'location' when calling editCompositeBasic");
      }

      // verify the required parameter 'baseImage' is set
      if (baseImage === undefined || baseImage === null) {
        throw new Error("Missing the required parameter 'baseImage' when calling editCompositeBasic");
      }

      // verify the required parameter 'layeredImage' is set
      if (layeredImage === undefined || layeredImage === null) {
        throw new Error("Missing the required parameter 'layeredImage' when calling editCompositeBasic");
      }


      var pathParams = {
        'location': location
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'baseImage': baseImage,
        'layeredImage': layeredImage
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['image/png'];
      var returnType = Object;

      return this.apiClient.callApi(
        '/image/edit/composite/{location}', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDrawRectangle operation.
     * @callback module:api/EditApi~editDrawRectangleCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Draw rectangle onto an image
     * Draw one or more rectangles, with customized visuals, onto an image
     * @param {module:model/DrawRectangleRequest} request 
     * @param {module:api/EditApi~editDrawRectangleCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    this.editDrawRectangle = function(request, callback) {
      var postBody = request;

      // verify the required parameter 'request' is set
      if (request === undefined || request === null) {
        throw new Error("Missing the required parameter 'request' when calling editDrawRectangle");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['image/png'];
      var returnType = Object;

      return this.apiClient.callApi(
        '/image/edit/draw/rectangle', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the editDrawText operation.
     * @callback module:api/EditApi~editDrawTextCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Draw text onto an image
     * Draw one or more pieces of text, with customized visuals, onto an image
     * @param {module:model/DrawTextRequest} request 
     * @param {module:api/EditApi~editDrawTextCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    this.editDrawText = function(request, callback) {
      var postBody = request;

      // verify the required parameter 'request' is set
      if (request === undefined || request === null) {
        throw new Error("Missing the required parameter 'request' when calling editDrawText");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['image/png'];
      var returnType = Object;

      return this.apiClient.callApi(
        '/image/edit/draw/text', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":93,"../model/DrawRectangleRequest":105,"../model/DrawTextRequest":107}],96:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/AgeDetectionResult', 'model/FaceLocateResponse'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/AgeDetectionResult'), require('../model/FaceLocateResponse'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.FaceApi = factory(root.CloudmersiveImageApiClient.ApiClient, root.CloudmersiveImageApiClient.AgeDetectionResult, root.CloudmersiveImageApiClient.FaceLocateResponse);
  }
}(this, function(ApiClient, AgeDetectionResult, FaceLocateResponse) {
  'use strict';

  /**
   * Face service.
   * @module api/FaceApi
   * @version 1.1.4
   */

  /**
   * Constructs a new FaceApi. 
   * @alias module:api/FaceApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the faceCropFirst operation.
     * @callback module:api/FaceApi~faceCropFirstCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Crop image to face (square)
     * Crop an image to the face (rectangular crop).  If there is more than one face present, choose the first one.
     * @param {File} imageFile Image file to perform the operation on.  Common file formats such as PNG, JPEG are supported.
     * @param {module:api/FaceApi~faceCropFirstCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.faceCropFirst = function(imageFile, callback) {
      var postBody = null;

      // verify the required parameter 'imageFile' is set
      if (imageFile === undefined || imageFile === null) {
        throw new Error("Missing the required parameter 'imageFile' when calling faceCropFirst");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'imageFile': imageFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/image/face/crop/first', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the faceCropFirstRound operation.
     * @callback module:api/FaceApi~faceCropFirstRoundCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Crop image to face (round)
     * Crop an image to the face (circular/round crop).  If there is more than one face present, choose the first one.
     * @param {File} imageFile Image file to perform the operation on.  Common file formats such as PNG, JPEG are supported.
     * @param {module:api/FaceApi~faceCropFirstRoundCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.faceCropFirstRound = function(imageFile, callback) {
      var postBody = null;

      // verify the required parameter 'imageFile' is set
      if (imageFile === undefined || imageFile === null) {
        throw new Error("Missing the required parameter 'imageFile' when calling faceCropFirstRound");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'imageFile': imageFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/image/face/crop/first/round', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the faceDetectAge operation.
     * @callback module:api/FaceApi~faceDetectAgeCallback
     * @param {String} error Error message, if any.
     * @param {module:model/AgeDetectionResult} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Detect the age of people in an image
     * Identify the age, position, and size of human faces in an image, along with a recognition confidence level.  People in the image do NOT need to be facing the camera; they can be facing away, edge-on, etc.
     * @param {File} imageFile Image file to perform the operation on.  Common file formats such as PNG, JPEG are supported.
     * @param {module:api/FaceApi~faceDetectAgeCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/AgeDetectionResult}
     */
    this.faceDetectAge = function(imageFile, callback) {
      var postBody = null;

      // verify the required parameter 'imageFile' is set
      if (imageFile === undefined || imageFile === null) {
        throw new Error("Missing the required parameter 'imageFile' when calling faceDetectAge");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'imageFile': imageFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = AgeDetectionResult;

      return this.apiClient.callApi(
        '/image/face/detect-age', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the faceLocate operation.
     * @callback module:api/FaceApi~faceLocateCallback
     * @param {String} error Error message, if any.
     * @param {module:model/FaceLocateResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Find faces in an image
     * Locate the positions of all faces in an image
     * @param {File} imageFile Image file to perform the operation on.  Common file formats such as PNG, JPEG are supported.
     * @param {module:api/FaceApi~faceLocateCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/FaceLocateResponse}
     */
    this.faceLocate = function(imageFile, callback) {
      var postBody = null;

      // verify the required parameter 'imageFile' is set
      if (imageFile === undefined || imageFile === null) {
        throw new Error("Missing the required parameter 'imageFile' when calling faceLocate");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'imageFile': imageFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = FaceLocateResponse;

      return this.apiClient.callApi(
        '/image/face/locate', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":93,"../model/AgeDetectionResult":101,"../model/FaceLocateResponse":109}],97:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/NsfwResult'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/NsfwResult'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.NsfwApi = factory(root.CloudmersiveImageApiClient.ApiClient, root.CloudmersiveImageApiClient.NsfwResult);
  }
}(this, function(ApiClient, NsfwResult) {
  'use strict';

  /**
   * Nsfw service.
   * @module api/NsfwApi
   * @version 1.1.4
   */

  /**
   * Constructs a new NsfwApi. 
   * @alias module:api/NsfwApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the nsfwClassify operation.
     * @callback module:api/NsfwApi~nsfwClassifyCallback
     * @param {String} error Error message, if any.
     * @param {module:model/NsfwResult} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Not safe for work (NSFW) racy content classification
     * Classify an image into Not Safe For Work (NSFW)/Porn/Racy content and Safe Content.
     * @param {File} imageFile Image file to perform the operation on.  Common file formats such as PNG, JPEG are supported.
     * @param {module:api/NsfwApi~nsfwClassifyCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/NsfwResult}
     */
    this.nsfwClassify = function(imageFile, callback) {
      var postBody = null;

      // verify the required parameter 'imageFile' is set
      if (imageFile === undefined || imageFile === null) {
        throw new Error("Missing the required parameter 'imageFile' when calling nsfwClassify");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'imageFile': imageFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = NsfwResult;

      return this.apiClient.callApi(
        '/image/nsfw/classify', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":93,"../model/NsfwResult":111}],98:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/ImageDescriptionResponse', 'model/ObjectDetectionResult', 'model/VehicleLicensePlateDetectionResult'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/ImageDescriptionResponse'), require('../model/ObjectDetectionResult'), require('../model/VehicleLicensePlateDetectionResult'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.RecognizeApi = factory(root.CloudmersiveImageApiClient.ApiClient, root.CloudmersiveImageApiClient.ImageDescriptionResponse, root.CloudmersiveImageApiClient.ObjectDetectionResult, root.CloudmersiveImageApiClient.VehicleLicensePlateDetectionResult);
  }
}(this, function(ApiClient, ImageDescriptionResponse, ObjectDetectionResult, VehicleLicensePlateDetectionResult) {
  'use strict';

  /**
   * Recognize service.
   * @module api/RecognizeApi
   * @version 1.1.4
   */

  /**
   * Constructs a new RecognizeApi. 
   * @alias module:api/RecognizeApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the recognizeDescribe operation.
     * @callback module:api/RecognizeApi~recognizeDescribeCallback
     * @param {String} error Error message, if any.
     * @param {module:model/ImageDescriptionResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Describe an image in natural language
     * Generate an English language text description of the image as a sentence.
     * @param {File} imageFile Image file to perform the operation on.  Common file formats such as PNG, JPEG are supported.
     * @param {module:api/RecognizeApi~recognizeDescribeCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/ImageDescriptionResponse}
     */
    this.recognizeDescribe = function(imageFile, callback) {
      var postBody = null;

      // verify the required parameter 'imageFile' is set
      if (imageFile === undefined || imageFile === null) {
        throw new Error("Missing the required parameter 'imageFile' when calling recognizeDescribe");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'imageFile': imageFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = ImageDescriptionResponse;

      return this.apiClient.callApi(
        '/image/recognize/describe', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the recognizeDetectAndUnskewDocument operation.
     * @callback module:api/RecognizeApi~recognizeDetectAndUnskewDocumentCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Detect and unskew a photo of a document
     * Detect and unskew a photo of a document (e.g. taken on a cell phone) into a perfectly square image.  Great for document scanning applications; once unskewed, this image is perfect for converting to PDF using the Convert API or optical character recognition using the OCR API.
     * @param {File} imageFile Image file to perform the operation on.  Common file formats such as PNG, JPEG are supported.
     * @param {Object} opts Optional parameters
     * @param {String} opts.postProcessingEffect Optional, post-processing effects to apply to the email, default is None.  Possible values are None and BlackAndWhite (force the image into a black and white view to aid in OCR operations).
     * @param {module:api/RecognizeApi~recognizeDetectAndUnskewDocumentCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.recognizeDetectAndUnskewDocument = function(imageFile, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'imageFile' is set
      if (imageFile === undefined || imageFile === null) {
        throw new Error("Missing the required parameter 'imageFile' when calling recognizeDetectAndUnskewDocument");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
        'PostProcessingEffect': opts['postProcessingEffect']
      };
      var formParams = {
        'imageFile': imageFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/image/recognize/detect-document/unskew', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the recognizeDetectObjects operation.
     * @callback module:api/RecognizeApi~recognizeDetectObjectsCallback
     * @param {String} error Error message, if any.
     * @param {module:model/ObjectDetectionResult} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Detect objects, including types and locations, in an image
     * Identify the position, size and description of objects in an image, along with a recognition confidence level.  Detects both human people and objects in an image.
     * @param {File} imageFile Image file to perform the operation on.  Common file formats such as PNG, JPEG are supported.
     * @param {module:api/RecognizeApi~recognizeDetectObjectsCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/ObjectDetectionResult}
     */
    this.recognizeDetectObjects = function(imageFile, callback) {
      var postBody = null;

      // verify the required parameter 'imageFile' is set
      if (imageFile === undefined || imageFile === null) {
        throw new Error("Missing the required parameter 'imageFile' when calling recognizeDetectObjects");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'imageFile': imageFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = ObjectDetectionResult;

      return this.apiClient.callApi(
        '/image/recognize/detect-objects', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the recognizeDetectPeople operation.
     * @callback module:api/RecognizeApi~recognizeDetectPeopleCallback
     * @param {String} error Error message, if any.
     * @param {module:model/ObjectDetectionResult} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Detect people, including locations, in an image
     * Identify the position, and size of human people in an image, along with a recognition confidence level.  People in the image do NOT need to be facing the camera; they can be facing away, edge-on, etc.
     * @param {File} imageFile Image file to perform the operation on.  Common file formats such as PNG, JPEG are supported.
     * @param {module:api/RecognizeApi~recognizeDetectPeopleCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/ObjectDetectionResult}
     */
    this.recognizeDetectPeople = function(imageFile, callback) {
      var postBody = null;

      // verify the required parameter 'imageFile' is set
      if (imageFile === undefined || imageFile === null) {
        throw new Error("Missing the required parameter 'imageFile' when calling recognizeDetectPeople");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'imageFile': imageFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = ObjectDetectionResult;

      return this.apiClient.callApi(
        '/image/recognize/detect-people', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the recognizeDetectVehicleLicensePlates operation.
     * @callback module:api/RecognizeApi~recognizeDetectVehicleLicensePlatesCallback
     * @param {String} error Error message, if any.
     * @param {module:model/VehicleLicensePlateDetectionResult} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Detect vehicle license plates in an image
     * Identify the position, and size, and content of vehicle license plates in an image.  License plates should be within 15-20 degrees on-axis to the camera.
     * @param {File} imageFile Image file to perform the operation on.  Common file formats such as PNG, JPEG are supported.
     * @param {module:api/RecognizeApi~recognizeDetectVehicleLicensePlatesCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/VehicleLicensePlateDetectionResult}
     */
    this.recognizeDetectVehicleLicensePlates = function(imageFile, callback) {
      var postBody = null;

      // verify the required parameter 'imageFile' is set
      if (imageFile === undefined || imageFile === null) {
        throw new Error("Missing the required parameter 'imageFile' when calling recognizeDetectVehicleLicensePlates");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'imageFile': imageFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = VehicleLicensePlateDetectionResult;

      return this.apiClient.callApi(
        '/image/recognize/detect-vehicle-license-plates', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":93,"../model/ImageDescriptionResponse":110,"../model/ObjectDetectionResult":112,"../model/VehicleLicensePlateDetectionResult":115}],99:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.ResizeApi = factory(root.CloudmersiveImageApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';

  /**
   * Resize service.
   * @module api/ResizeApi
   * @version 1.1.4
   */

  /**
   * Constructs a new ResizeApi. 
   * @alias module:api/ResizeApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the resizePost operation.
     * @callback module:api/ResizeApi~resizePostCallback
     * @param {String} error Error message, if any.
     * @param {'Blob'} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Resize an image with parameters
     * Resize an image to a maximum width and maximum height, while preserving the image&#39;s original aspect ratio
     * @param {Number} maxWidth Maximum width of the output image - final image will be as large as possible while less than or equial to this width
     * @param {Number} maxHeight Maximum height of the output image - final image will be as large as possible while less than or equial to this height
     * @param {File} imageFile Image file to perform the operation on.  Common file formats such as PNG, JPEG are supported.
     * @param {module:api/ResizeApi~resizePostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link 'Blob'}
     */
    this.resizePost = function(maxWidth, maxHeight, imageFile, callback) {
      var postBody = null;

      // verify the required parameter 'maxWidth' is set
      if (maxWidth === undefined || maxWidth === null) {
        throw new Error("Missing the required parameter 'maxWidth' when calling resizePost");
      }

      // verify the required parameter 'maxHeight' is set
      if (maxHeight === undefined || maxHeight === null) {
        throw new Error("Missing the required parameter 'maxHeight' when calling resizePost");
      }

      // verify the required parameter 'imageFile' is set
      if (imageFile === undefined || imageFile === null) {
        throw new Error("Missing the required parameter 'imageFile' when calling resizePost");
      }


      var pathParams = {
        'maxWidth': maxWidth,
        'maxHeight': maxHeight
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
        'imageFile': imageFile
      };

      var authNames = ['Apikey'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['image/png'];
      var returnType = 'Blob';

      return this.apiClient.callApi(
        '/image/resize/preserveAspectRatio/{maxWidth}/{maxHeight}', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":93}],100:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/AgeDetectionResult', 'model/DetectedLicensePlate', 'model/DetectedObject', 'model/DrawRectangleInstance', 'model/DrawRectangleRequest', 'model/DrawTextInstance', 'model/DrawTextRequest', 'model/Face', 'model/FaceLocateResponse', 'model/ImageDescriptionResponse', 'model/NsfwResult', 'model/ObjectDetectionResult', 'model/PersonWithAge', 'model/RecognitionOutcome', 'model/VehicleLicensePlateDetectionResult', 'api/ArtisticApi', 'api/EditApi', 'api/FaceApi', 'api/NsfwApi', 'api/RecognizeApi', 'api/ResizeApi'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('./ApiClient'), require('./model/AgeDetectionResult'), require('./model/DetectedLicensePlate'), require('./model/DetectedObject'), require('./model/DrawRectangleInstance'), require('./model/DrawRectangleRequest'), require('./model/DrawTextInstance'), require('./model/DrawTextRequest'), require('./model/Face'), require('./model/FaceLocateResponse'), require('./model/ImageDescriptionResponse'), require('./model/NsfwResult'), require('./model/ObjectDetectionResult'), require('./model/PersonWithAge'), require('./model/RecognitionOutcome'), require('./model/VehicleLicensePlateDetectionResult'), require('./api/ArtisticApi'), require('./api/EditApi'), require('./api/FaceApi'), require('./api/NsfwApi'), require('./api/RecognizeApi'), require('./api/ResizeApi'));
  }
}(function(ApiClient, AgeDetectionResult, DetectedLicensePlate, DetectedObject, DrawRectangleInstance, DrawRectangleRequest, DrawTextInstance, DrawTextRequest, Face, FaceLocateResponse, ImageDescriptionResponse, NsfwResult, ObjectDetectionResult, PersonWithAge, RecognitionOutcome, VehicleLicensePlateDetectionResult, ArtisticApi, EditApi, FaceApi, NsfwApi, RecognizeApi, ResizeApi) {
  'use strict';

  /**
   * Image_Recognition_and_Processing_APIs_let_you_use_Machine_Learning_to_recognize_and_process_images_and_also_perform_useful_image_modification_operations_.<br>
   * The <code>index</code> module provides access to constructors for all the classes which comprise the public API.
   * <p>
   * An AMD (recommended!) or CommonJS application will generally do something equivalent to the following:
   * <pre>
   * var CloudmersiveImageApiClient = require('index'); // See note below*.
   * var xxxSvc = new CloudmersiveImageApiClient.XxxApi(); // Allocate the API class we're going to use.
   * var yyyModel = new CloudmersiveImageApiClient.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * <em>*NOTE: For a top-level AMD script, use require(['index'], function(){...})
   * and put the application logic within the callback function.</em>
   * </p>
   * <p>
   * A non-AMD browser application (discouraged) might do something like this:
   * <pre>
   * var xxxSvc = new CloudmersiveImageApiClient.XxxApi(); // Allocate the API class we're going to use.
   * var yyy = new CloudmersiveImageApiClient.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * </p>
   * @module index
   * @version 1.1.4
   */
  var exports = {
    /**
     * The ApiClient constructor.
     * @property {module:ApiClient}
     */
    ApiClient: ApiClient,
    /**
     * The AgeDetectionResult model constructor.
     * @property {module:model/AgeDetectionResult}
     */
    AgeDetectionResult: AgeDetectionResult,
    /**
     * The DetectedLicensePlate model constructor.
     * @property {module:model/DetectedLicensePlate}
     */
    DetectedLicensePlate: DetectedLicensePlate,
    /**
     * The DetectedObject model constructor.
     * @property {module:model/DetectedObject}
     */
    DetectedObject: DetectedObject,
    /**
     * The DrawRectangleInstance model constructor.
     * @property {module:model/DrawRectangleInstance}
     */
    DrawRectangleInstance: DrawRectangleInstance,
    /**
     * The DrawRectangleRequest model constructor.
     * @property {module:model/DrawRectangleRequest}
     */
    DrawRectangleRequest: DrawRectangleRequest,
    /**
     * The DrawTextInstance model constructor.
     * @property {module:model/DrawTextInstance}
     */
    DrawTextInstance: DrawTextInstance,
    /**
     * The DrawTextRequest model constructor.
     * @property {module:model/DrawTextRequest}
     */
    DrawTextRequest: DrawTextRequest,
    /**
     * The Face model constructor.
     * @property {module:model/Face}
     */
    Face: Face,
    /**
     * The FaceLocateResponse model constructor.
     * @property {module:model/FaceLocateResponse}
     */
    FaceLocateResponse: FaceLocateResponse,
    /**
     * The ImageDescriptionResponse model constructor.
     * @property {module:model/ImageDescriptionResponse}
     */
    ImageDescriptionResponse: ImageDescriptionResponse,
    /**
     * The NsfwResult model constructor.
     * @property {module:model/NsfwResult}
     */
    NsfwResult: NsfwResult,
    /**
     * The ObjectDetectionResult model constructor.
     * @property {module:model/ObjectDetectionResult}
     */
    ObjectDetectionResult: ObjectDetectionResult,
    /**
     * The PersonWithAge model constructor.
     * @property {module:model/PersonWithAge}
     */
    PersonWithAge: PersonWithAge,
    /**
     * The RecognitionOutcome model constructor.
     * @property {module:model/RecognitionOutcome}
     */
    RecognitionOutcome: RecognitionOutcome,
    /**
     * The VehicleLicensePlateDetectionResult model constructor.
     * @property {module:model/VehicleLicensePlateDetectionResult}
     */
    VehicleLicensePlateDetectionResult: VehicleLicensePlateDetectionResult,
    /**
     * The ArtisticApi service constructor.
     * @property {module:api/ArtisticApi}
     */
    ArtisticApi: ArtisticApi,
    /**
     * The EditApi service constructor.
     * @property {module:api/EditApi}
     */
    EditApi: EditApi,
    /**
     * The FaceApi service constructor.
     * @property {module:api/FaceApi}
     */
    FaceApi: FaceApi,
    /**
     * The NsfwApi service constructor.
     * @property {module:api/NsfwApi}
     */
    NsfwApi: NsfwApi,
    /**
     * The RecognizeApi service constructor.
     * @property {module:api/RecognizeApi}
     */
    RecognizeApi: RecognizeApi,
    /**
     * The ResizeApi service constructor.
     * @property {module:api/ResizeApi}
     */
    ResizeApi: ResizeApi
  };

  return exports;
}));

},{"./ApiClient":93,"./api/ArtisticApi":94,"./api/EditApi":95,"./api/FaceApi":96,"./api/NsfwApi":97,"./api/RecognizeApi":98,"./api/ResizeApi":99,"./model/AgeDetectionResult":101,"./model/DetectedLicensePlate":102,"./model/DetectedObject":103,"./model/DrawRectangleInstance":104,"./model/DrawRectangleRequest":105,"./model/DrawTextInstance":106,"./model/DrawTextRequest":107,"./model/Face":108,"./model/FaceLocateResponse":109,"./model/ImageDescriptionResponse":110,"./model/NsfwResult":111,"./model/ObjectDetectionResult":112,"./model/PersonWithAge":113,"./model/RecognitionOutcome":114,"./model/VehicleLicensePlateDetectionResult":115}],101:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/PersonWithAge'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./PersonWithAge'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.AgeDetectionResult = factory(root.CloudmersiveImageApiClient.ApiClient, root.CloudmersiveImageApiClient.PersonWithAge);
  }
}(this, function(ApiClient, PersonWithAge) {
  'use strict';




  /**
   * The AgeDetectionResult model module.
   * @module model/AgeDetectionResult
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>AgeDetectionResult</code>.
   * Result from classifying the Age of people in an image
   * @alias module:model/AgeDetectionResult
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>AgeDetectionResult</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/AgeDetectionResult} obj Optional instance to populate.
   * @return {module:model/AgeDetectionResult} The populated <code>AgeDetectionResult</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('PeopleWithAge')) {
        obj['PeopleWithAge'] = ApiClient.convertToType(data['PeopleWithAge'], [PersonWithAge]);
      }
      if (data.hasOwnProperty('PeopleIdentified')) {
        obj['PeopleIdentified'] = ApiClient.convertToType(data['PeopleIdentified'], 'Number');
      }
    }
    return obj;
  }

  /**
   * True if the operation was successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * People in the image annotated with age information
   * @member {Array.<module:model/PersonWithAge>} PeopleWithAge
   */
  exports.prototype['PeopleWithAge'] = undefined;
  /**
   * Number of people identified in the image with an age
   * @member {Number} PeopleIdentified
   */
  exports.prototype['PeopleIdentified'] = undefined;



  return exports;
}));



},{"../ApiClient":93,"./PersonWithAge":113}],102:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.DetectedLicensePlate = factory(root.CloudmersiveImageApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DetectedLicensePlate model module.
   * @module model/DetectedLicensePlate
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>DetectedLicensePlate</code>.
   * License plate found in the image
   * @alias module:model/DetectedLicensePlate
   * @class
   */
  var exports = function() {
    var _this = this;








  };

  /**
   * Constructs a <code>DetectedLicensePlate</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DetectedLicensePlate} obj Optional instance to populate.
   * @return {module:model/DetectedLicensePlate} The populated <code>DetectedLicensePlate</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('LocationX')) {
        obj['LocationX'] = ApiClient.convertToType(data['LocationX'], 'Number');
      }
      if (data.hasOwnProperty('LocationY')) {
        obj['LocationY'] = ApiClient.convertToType(data['LocationY'], 'Number');
      }
      if (data.hasOwnProperty('Width')) {
        obj['Width'] = ApiClient.convertToType(data['Width'], 'Number');
      }
      if (data.hasOwnProperty('Height')) {
        obj['Height'] = ApiClient.convertToType(data['Height'], 'Number');
      }
      if (data.hasOwnProperty('LicensePlateText_BestMatch')) {
        obj['LicensePlateText_BestMatch'] = ApiClient.convertToType(data['LicensePlateText_BestMatch'], 'String');
      }
      if (data.hasOwnProperty('LicensePlateText_RunnerUp')) {
        obj['LicensePlateText_RunnerUp'] = ApiClient.convertToType(data['LicensePlateText_RunnerUp'], 'String');
      }
      if (data.hasOwnProperty('LicensePlateRecognitionConfidenceLevel')) {
        obj['LicensePlateRecognitionConfidenceLevel'] = ApiClient.convertToType(data['LicensePlateRecognitionConfidenceLevel'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {Number} LocationX
   */
  exports.prototype['LocationX'] = undefined;
  /**
   * @member {Number} LocationY
   */
  exports.prototype['LocationY'] = undefined;
  /**
   * @member {Number} Width
   */
  exports.prototype['Width'] = undefined;
  /**
   * @member {Number} Height
   */
  exports.prototype['Height'] = undefined;
  /**
   * Text from the license plate, highest-confidence result
   * @member {String} LicensePlateText_BestMatch
   */
  exports.prototype['LicensePlateText_BestMatch'] = undefined;
  /**
   * Alternate text from the license plate, based on second-highest-confidence result
   * @member {String} LicensePlateText_RunnerUp
   */
  exports.prototype['LicensePlateText_RunnerUp'] = undefined;
  /**
   * Confidence score on a range of 0.0 - 1.0 of the accuracy of the detected license plate, with higher scores being better; values about 0.75 are high confidence
   * @member {Number} LicensePlateRecognitionConfidenceLevel
   */
  exports.prototype['LicensePlateRecognitionConfidenceLevel'] = undefined;



  return exports;
}));



},{"../ApiClient":93}],103:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.DetectedObject = factory(root.CloudmersiveImageApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DetectedObject model module.
   * @module model/DetectedObject
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>DetectedObject</code>.
   * Single object instance, and associated details, detected in an image
   * @alias module:model/DetectedObject
   * @class
   */
  var exports = function() {
    var _this = this;







  };

  /**
   * Constructs a <code>DetectedObject</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DetectedObject} obj Optional instance to populate.
   * @return {module:model/DetectedObject} The populated <code>DetectedObject</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('ObjectClassName')) {
        obj['ObjectClassName'] = ApiClient.convertToType(data['ObjectClassName'], 'String');
      }
      if (data.hasOwnProperty('Height')) {
        obj['Height'] = ApiClient.convertToType(data['Height'], 'Number');
      }
      if (data.hasOwnProperty('Width')) {
        obj['Width'] = ApiClient.convertToType(data['Width'], 'Number');
      }
      if (data.hasOwnProperty('Score')) {
        obj['Score'] = ApiClient.convertToType(data['Score'], 'Number');
      }
      if (data.hasOwnProperty('X')) {
        obj['X'] = ApiClient.convertToType(data['X'], 'Number');
      }
      if (data.hasOwnProperty('Y')) {
        obj['Y'] = ApiClient.convertToType(data['Y'], 'Number');
      }
    }
    return obj;
  }

  /**
   * Class of the object.  Example values are \"person\", \"car\", \"dining table\", etc.
   * @member {String} ObjectClassName
   */
  exports.prototype['ObjectClassName'] = undefined;
  /**
   * Height, in pixels, of the object
   * @member {Number} Height
   */
  exports.prototype['Height'] = undefined;
  /**
   * Width, in pixels, of the object
   * @member {Number} Width
   */
  exports.prototype['Width'] = undefined;
  /**
   * Confidence score of detected object; possible values are between 0.0 and 1.0; values closer to 1.0 are higher confidence
   * @member {Number} Score
   */
  exports.prototype['Score'] = undefined;
  /**
   * X location, in pixels, of the left side location of the object, with the right side being X + Width
   * @member {Number} X
   */
  exports.prototype['X'] = undefined;
  /**
   * Y location, in pixels, of the top side location of the object, with the bottom side being Y + Height
   * @member {Number} Y
   */
  exports.prototype['Y'] = undefined;



  return exports;
}));



},{"../ApiClient":93}],104:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.DrawRectangleInstance = factory(root.CloudmersiveImageApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DrawRectangleInstance model module.
   * @module model/DrawRectangleInstance
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>DrawRectangleInstance</code>.
   * Rectangle instance to draw on an image
   * @alias module:model/DrawRectangleInstance
   * @class
   */
  var exports = function() {
    var _this = this;








  };

  /**
   * Constructs a <code>DrawRectangleInstance</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DrawRectangleInstance} obj Optional instance to populate.
   * @return {module:model/DrawRectangleInstance} The populated <code>DrawRectangleInstance</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('BorderColor')) {
        obj['BorderColor'] = ApiClient.convertToType(data['BorderColor'], 'String');
      }
      if (data.hasOwnProperty('BorderWidth')) {
        obj['BorderWidth'] = ApiClient.convertToType(data['BorderWidth'], 'Number');
      }
      if (data.hasOwnProperty('FillColor')) {
        obj['FillColor'] = ApiClient.convertToType(data['FillColor'], 'String');
      }
      if (data.hasOwnProperty('X')) {
        obj['X'] = ApiClient.convertToType(data['X'], 'Number');
      }
      if (data.hasOwnProperty('Y')) {
        obj['Y'] = ApiClient.convertToType(data['Y'], 'Number');
      }
      if (data.hasOwnProperty('Width')) {
        obj['Width'] = ApiClient.convertToType(data['Width'], 'Number');
      }
      if (data.hasOwnProperty('Height')) {
        obj['Height'] = ApiClient.convertToType(data['Height'], 'Number');
      }
    }
    return obj;
  }

  /**
   * Border Color to use - can be a hex value (with #) or HTML common color name.  Transparent colors are supported.
   * @member {String} BorderColor
   */
  exports.prototype['BorderColor'] = undefined;
  /**
   * Width in pixels of the border.  Pass in 0 to draw a rectangle with no border
   * @member {Number} BorderWidth
   */
  exports.prototype['BorderWidth'] = undefined;
  /**
   * Fill Color to use - can be a hex value (with #) or HTML common color name.  Transparent colors are supported.  Leave blank to not fill the rectangle.
   * @member {String} FillColor
   */
  exports.prototype['FillColor'] = undefined;
  /**
   * Pixel location of the left edge of the rectangle location
   * @member {Number} X
   */
  exports.prototype['X'] = undefined;
  /**
   * Pixel location of the top edge of the rectangle location
   * @member {Number} Y
   */
  exports.prototype['Y'] = undefined;
  /**
   * Width in pixels of the rectangle
   * @member {Number} Width
   */
  exports.prototype['Width'] = undefined;
  /**
   * Height in pixels of the rectangle
   * @member {Number} Height
   */
  exports.prototype['Height'] = undefined;



  return exports;
}));



},{"../ApiClient":93}],105:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DrawRectangleInstance'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DrawRectangleInstance'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.DrawRectangleRequest = factory(root.CloudmersiveImageApiClient.ApiClient, root.CloudmersiveImageApiClient.DrawRectangleInstance);
  }
}(this, function(ApiClient, DrawRectangleInstance) {
  'use strict';




  /**
   * The DrawRectangleRequest model module.
   * @module model/DrawRectangleRequest
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>DrawRectangleRequest</code>.
   * Request to draw one or more rectangles on a base image
   * @alias module:model/DrawRectangleRequest
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>DrawRectangleRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DrawRectangleRequest} obj Optional instance to populate.
   * @return {module:model/DrawRectangleRequest} The populated <code>DrawRectangleRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('BaseImageBytes')) {
        obj['BaseImageBytes'] = ApiClient.convertToType(data['BaseImageBytes'], 'Blob');
      }
      if (data.hasOwnProperty('BaseImageUrl')) {
        obj['BaseImageUrl'] = ApiClient.convertToType(data['BaseImageUrl'], 'String');
      }
      if (data.hasOwnProperty('RectanglesToDraw')) {
        obj['RectanglesToDraw'] = ApiClient.convertToType(data['RectanglesToDraw'], [DrawRectangleInstance]);
      }
    }
    return obj;
  }

  /**
   * Image to draw rectangles on, in bytes.  You can also use the BaseImageUrl instead to supply image input as a URL
   * @member {Blob} BaseImageBytes
   */
  exports.prototype['BaseImageBytes'] = undefined;
  /**
   * Image to draw rectangles on, as an HTTP or HTTPS fully-qualified URL
   * @member {String} BaseImageUrl
   */
  exports.prototype['BaseImageUrl'] = undefined;
  /**
   * Rectangles to draw on the image.  Rectangles are drawn in index order.
   * @member {Array.<module:model/DrawRectangleInstance>} RectanglesToDraw
   */
  exports.prototype['RectanglesToDraw'] = undefined;



  return exports;
}));



},{"../ApiClient":93,"./DrawRectangleInstance":104}],106:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.DrawTextInstance = factory(root.CloudmersiveImageApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The DrawTextInstance model module.
   * @module model/DrawTextInstance
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>DrawTextInstance</code>.
   * Text instance to draw on an image
   * @alias module:model/DrawTextInstance
   * @class
   */
  var exports = function() {
    var _this = this;









  };

  /**
   * Constructs a <code>DrawTextInstance</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DrawTextInstance} obj Optional instance to populate.
   * @return {module:model/DrawTextInstance} The populated <code>DrawTextInstance</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Text')) {
        obj['Text'] = ApiClient.convertToType(data['Text'], 'String');
      }
      if (data.hasOwnProperty('FontFamilyName')) {
        obj['FontFamilyName'] = ApiClient.convertToType(data['FontFamilyName'], 'String');
      }
      if (data.hasOwnProperty('FontSize')) {
        obj['FontSize'] = ApiClient.convertToType(data['FontSize'], 'Number');
      }
      if (data.hasOwnProperty('Color')) {
        obj['Color'] = ApiClient.convertToType(data['Color'], 'String');
      }
      if (data.hasOwnProperty('X')) {
        obj['X'] = ApiClient.convertToType(data['X'], 'Number');
      }
      if (data.hasOwnProperty('Y')) {
        obj['Y'] = ApiClient.convertToType(data['Y'], 'Number');
      }
      if (data.hasOwnProperty('Width')) {
        obj['Width'] = ApiClient.convertToType(data['Width'], 'Number');
      }
      if (data.hasOwnProperty('Height')) {
        obj['Height'] = ApiClient.convertToType(data['Height'], 'Number');
      }
    }
    return obj;
  }

  /**
   * Text string to draw
   * @member {String} Text
   */
  exports.prototype['Text'] = undefined;
  /**
   * Font Family to use.  Leave blank to default to \"Arial\".
   * @member {String} FontFamilyName
   */
  exports.prototype['FontFamilyName'] = undefined;
  /**
   * Font size to use.
   * @member {Number} FontSize
   */
  exports.prototype['FontSize'] = undefined;
  /**
   * Color to use - can be a hex value (with #) or HTML common color name
   * @member {String} Color
   */
  exports.prototype['Color'] = undefined;
  /**
   * Pixel location of the left edge of the text location
   * @member {Number} X
   */
  exports.prototype['X'] = undefined;
  /**
   * Pixel location of the top edge of the text location
   * @member {Number} Y
   */
  exports.prototype['Y'] = undefined;
  /**
   * Width in pixels of the text box to draw the text in; text will wrap inside this box
   * @member {Number} Width
   */
  exports.prototype['Width'] = undefined;
  /**
   * Height in pixels of the text box to draw the text in; text will wrap inside this box
   * @member {Number} Height
   */
  exports.prototype['Height'] = undefined;



  return exports;
}));



},{"../ApiClient":93}],107:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DrawTextInstance'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DrawTextInstance'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.DrawTextRequest = factory(root.CloudmersiveImageApiClient.ApiClient, root.CloudmersiveImageApiClient.DrawTextInstance);
  }
}(this, function(ApiClient, DrawTextInstance) {
  'use strict';




  /**
   * The DrawTextRequest model module.
   * @module model/DrawTextRequest
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>DrawTextRequest</code>.
   * Request to draw one or more pieces of text onto an image
   * @alias module:model/DrawTextRequest
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>DrawTextRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DrawTextRequest} obj Optional instance to populate.
   * @return {module:model/DrawTextRequest} The populated <code>DrawTextRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('BaseImageBytes')) {
        obj['BaseImageBytes'] = ApiClient.convertToType(data['BaseImageBytes'], 'Blob');
      }
      if (data.hasOwnProperty('BaseImageUrl')) {
        obj['BaseImageUrl'] = ApiClient.convertToType(data['BaseImageUrl'], 'String');
      }
      if (data.hasOwnProperty('TextToDraw')) {
        obj['TextToDraw'] = ApiClient.convertToType(data['TextToDraw'], [DrawTextInstance]);
      }
    }
    return obj;
  }

  /**
   * Image to draw text on, in bytes.  You can also use the BaseImageUrl instead to supply image input as a URL
   * @member {Blob} BaseImageBytes
   */
  exports.prototype['BaseImageBytes'] = undefined;
  /**
   * Image to draw text on, as an HTTP or HTTPS fully-qualified URL
   * @member {String} BaseImageUrl
   */
  exports.prototype['BaseImageUrl'] = undefined;
  /**
   * One or more pieces of text to draw onto the image
   * @member {Array.<module:model/DrawTextInstance>} TextToDraw
   */
  exports.prototype['TextToDraw'] = undefined;



  return exports;
}));



},{"../ApiClient":93,"./DrawTextInstance":106}],108:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.Face = factory(root.CloudmersiveImageApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Face model module.
   * @module model/Face
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>Face</code>.
   * Location of one face in an image
   * @alias module:model/Face
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>Face</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Face} obj Optional instance to populate.
   * @return {module:model/Face} The populated <code>Face</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('LeftX')) {
        obj['LeftX'] = ApiClient.convertToType(data['LeftX'], 'Number');
      }
      if (data.hasOwnProperty('TopY')) {
        obj['TopY'] = ApiClient.convertToType(data['TopY'], 'Number');
      }
      if (data.hasOwnProperty('RightX')) {
        obj['RightX'] = ApiClient.convertToType(data['RightX'], 'Number');
      }
      if (data.hasOwnProperty('BottomY')) {
        obj['BottomY'] = ApiClient.convertToType(data['BottomY'], 'Number');
      }
    }
    return obj;
  }

  /**
   * X coordinate of the left side of the face
   * @member {Number} LeftX
   */
  exports.prototype['LeftX'] = undefined;
  /**
   * Y coordinate of the top side of the face
   * @member {Number} TopY
   */
  exports.prototype['TopY'] = undefined;
  /**
   * X coordinate of the right side of the face
   * @member {Number} RightX
   */
  exports.prototype['RightX'] = undefined;
  /**
   * Y coordinate of the bottom side of the face
   * @member {Number} BottomY
   */
  exports.prototype['BottomY'] = undefined;



  return exports;
}));



},{"../ApiClient":93}],109:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Face'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./Face'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.FaceLocateResponse = factory(root.CloudmersiveImageApiClient.ApiClient, root.CloudmersiveImageApiClient.Face);
  }
}(this, function(ApiClient, Face) {
  'use strict';




  /**
   * The FaceLocateResponse model module.
   * @module model/FaceLocateResponse
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>FaceLocateResponse</code>.
   * Results of locating faces in an image
   * @alias module:model/FaceLocateResponse
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>FaceLocateResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/FaceLocateResponse} obj Optional instance to populate.
   * @return {module:model/FaceLocateResponse} The populated <code>FaceLocateResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('ErrorDetails')) {
        obj['ErrorDetails'] = ApiClient.convertToType(data['ErrorDetails'], 'String');
      }
      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Faces')) {
        obj['Faces'] = ApiClient.convertToType(data['Faces'], [Face]);
      }
      if (data.hasOwnProperty('FaceCount')) {
        obj['FaceCount'] = ApiClient.convertToType(data['FaceCount'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {String} ErrorDetails
   */
  exports.prototype['ErrorDetails'] = undefined;
  /**
   * True if the operation was successful, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Array of faces found in the image
   * @member {Array.<module:model/Face>} Faces
   */
  exports.prototype['Faces'] = undefined;
  /**
   * Number of faces found in the image
   * @member {Number} FaceCount
   */
  exports.prototype['FaceCount'] = undefined;



  return exports;
}));



},{"../ApiClient":93,"./Face":108}],110:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/RecognitionOutcome'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./RecognitionOutcome'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.ImageDescriptionResponse = factory(root.CloudmersiveImageApiClient.ApiClient, root.CloudmersiveImageApiClient.RecognitionOutcome);
  }
}(this, function(ApiClient, RecognitionOutcome) {
  'use strict';




  /**
   * The ImageDescriptionResponse model module.
   * @module model/ImageDescriptionResponse
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>ImageDescriptionResponse</code>.
   * Result of recognizing an image
   * @alias module:model/ImageDescriptionResponse
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>ImageDescriptionResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/ImageDescriptionResponse} obj Optional instance to populate.
   * @return {module:model/ImageDescriptionResponse} The populated <code>ImageDescriptionResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Highconfidence')) {
        obj['Highconfidence'] = ApiClient.convertToType(data['Highconfidence'], 'Boolean');
      }
      if (data.hasOwnProperty('BestOutcome')) {
        obj['BestOutcome'] = RecognitionOutcome.constructFromObject(data['BestOutcome']);
      }
      if (data.hasOwnProperty('RunnerUpOutcome')) {
        obj['RunnerUpOutcome'] = RecognitionOutcome.constructFromObject(data['RunnerUpOutcome']);
      }
    }
    return obj;
  }

  /**
   * Was the image processed successfully?
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Is the resulting best outcome recognition a high confidence outcome?
   * @member {Boolean} Highconfidence
   */
  exports.prototype['Highconfidence'] = undefined;
  /**
   * The best Machine Learning outcome
   * @member {module:model/RecognitionOutcome} BestOutcome
   */
  exports.prototype['BestOutcome'] = undefined;
  /**
   * Best backup (\"runner up\") Machine Learning outcome
   * @member {module:model/RecognitionOutcome} RunnerUpOutcome
   */
  exports.prototype['RunnerUpOutcome'] = undefined;



  return exports;
}));



},{"../ApiClient":93,"./RecognitionOutcome":114}],111:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.NsfwResult = factory(root.CloudmersiveImageApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The NsfwResult model module.
   * @module model/NsfwResult
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>NsfwResult</code>.
   * Result of an NSFW classification
   * @alias module:model/NsfwResult
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>NsfwResult</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/NsfwResult} obj Optional instance to populate.
   * @return {module:model/NsfwResult} The populated <code>NsfwResult</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Score')) {
        obj['Score'] = ApiClient.convertToType(data['Score'], 'Number');
      }
      if (data.hasOwnProperty('ClassificationOutcome')) {
        obj['ClassificationOutcome'] = ApiClient.convertToType(data['ClassificationOutcome'], 'String');
      }
    }
    return obj;
  }

  /**
   * True if the classification was successfully run, false otherwise
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Score between 0.0 and 1.0.  Scores of 0.0-0.2 represent high probability safe content, while scores 0.8-1.0 represent high probability unsafe content.  Content between 0.2 and 0.8 is of increasing raciness.
   * @member {Number} Score
   */
  exports.prototype['Score'] = undefined;
  /**
   * Classification result into four categories: SafeContent_HighProbability, UnsafeContent_HighProbability, RacyContent, SafeContent_ModerateProbability
   * @member {String} ClassificationOutcome
   */
  exports.prototype['ClassificationOutcome'] = undefined;



  return exports;
}));



},{"../ApiClient":93}],112:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DetectedObject'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DetectedObject'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.ObjectDetectionResult = factory(root.CloudmersiveImageApiClient.ApiClient, root.CloudmersiveImageApiClient.DetectedObject);
  }
}(this, function(ApiClient, DetectedObject) {
  'use strict';




  /**
   * The ObjectDetectionResult model module.
   * @module model/ObjectDetectionResult
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>ObjectDetectionResult</code>.
   * Result of detecting objects in an image
   * @alias module:model/ObjectDetectionResult
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>ObjectDetectionResult</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/ObjectDetectionResult} obj Optional instance to populate.
   * @return {module:model/ObjectDetectionResult} The populated <code>ObjectDetectionResult</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('Objects')) {
        obj['Objects'] = ApiClient.convertToType(data['Objects'], [DetectedObject]);
      }
      if (data.hasOwnProperty('ObjectCount')) {
        obj['ObjectCount'] = ApiClient.convertToType(data['ObjectCount'], 'Number');
      }
    }
    return obj;
  }

  /**
   * Was the image processed successfully?
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Array of objects detected in the scene
   * @member {Array.<module:model/DetectedObject>} Objects
   */
  exports.prototype['Objects'] = undefined;
  /**
   * Number of objects detected in the scene
   * @member {Number} ObjectCount
   */
  exports.prototype['ObjectCount'] = undefined;



  return exports;
}));



},{"../ApiClient":93,"./DetectedObject":103}],113:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Face'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./Face'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.PersonWithAge = factory(root.CloudmersiveImageApiClient.ApiClient, root.CloudmersiveImageApiClient.Face);
  }
}(this, function(ApiClient, Face) {
  'use strict';




  /**
   * The PersonWithAge model module.
   * @module model/PersonWithAge
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>PersonWithAge</code>.
   * A person identified in an image age classification operation
   * @alias module:model/PersonWithAge
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>PersonWithAge</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/PersonWithAge} obj Optional instance to populate.
   * @return {module:model/PersonWithAge} The populated <code>PersonWithAge</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('FaceLocation')) {
        obj['FaceLocation'] = Face.constructFromObject(data['FaceLocation']);
      }
      if (data.hasOwnProperty('AgeClassificationConfidence')) {
        obj['AgeClassificationConfidence'] = ApiClient.convertToType(data['AgeClassificationConfidence'], 'Number');
      }
      if (data.hasOwnProperty('AgeClass')) {
        obj['AgeClass'] = ApiClient.convertToType(data['AgeClass'], 'String');
      }
    }
    return obj;
  }

  /**
   * Location and other information about the person's face corresponding to this age classification
   * @member {module:model/Face} FaceLocation
   */
  exports.prototype['FaceLocation'] = undefined;
  /**
   * Confidence level of age classification; possible values are between 0.0 and 1.0; higher is better, with values &gt; 0.50 being high confidence results
   * @member {Number} AgeClassificationConfidence
   */
  exports.prototype['AgeClassificationConfidence'] = undefined;
  /**
   * The person's age range classification result in years; possible values are \"0-2\", \"4-6\", \"8-13\", \"15-20\", \"25-32\", \"38-43\", \"48-53\", \"60+\"
   * @member {String} AgeClass
   */
  exports.prototype['AgeClass'] = undefined;



  return exports;
}));



},{"../ApiClient":93,"./Face":108}],114:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.RecognitionOutcome = factory(root.CloudmersiveImageApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The RecognitionOutcome model module.
   * @module model/RecognitionOutcome
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>RecognitionOutcome</code>.
   * Specific recognition outcome
   * @alias module:model/RecognitionOutcome
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>RecognitionOutcome</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/RecognitionOutcome} obj Optional instance to populate.
   * @return {module:model/RecognitionOutcome} The populated <code>RecognitionOutcome</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('ConfidenceScore')) {
        obj['ConfidenceScore'] = ApiClient.convertToType(data['ConfidenceScore'], 'Number');
      }
      if (data.hasOwnProperty('Description')) {
        obj['Description'] = ApiClient.convertToType(data['Description'], 'String');
      }
    }
    return obj;
  }

  /**
   * Scores closer to 1 are better than scores closer to 0
   * @member {Number} ConfidenceScore
   */
  exports.prototype['ConfidenceScore'] = undefined;
  /**
   * English language description of the image
   * @member {String} Description
   */
  exports.prototype['Description'] = undefined;



  return exports;
}));



},{"../ApiClient":93}],115:[function(require,module,exports){
/**
 * imageapi
 * Image Recognition and Processing APIs let you use Machine Learning to recognize and process images, and also perform useful image modification operations.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/DetectedLicensePlate'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DetectedLicensePlate'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveImageApiClient) {
      root.CloudmersiveImageApiClient = {};
    }
    root.CloudmersiveImageApiClient.VehicleLicensePlateDetectionResult = factory(root.CloudmersiveImageApiClient.ApiClient, root.CloudmersiveImageApiClient.DetectedLicensePlate);
  }
}(this, function(ApiClient, DetectedLicensePlate) {
  'use strict';




  /**
   * The VehicleLicensePlateDetectionResult model module.
   * @module model/VehicleLicensePlateDetectionResult
   * @version 1.1.4
   */

  /**
   * Constructs a new <code>VehicleLicensePlateDetectionResult</code>.
   * Result of detecting vehicle license plates in an image
   * @alias module:model/VehicleLicensePlateDetectionResult
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>VehicleLicensePlateDetectionResult</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/VehicleLicensePlateDetectionResult} obj Optional instance to populate.
   * @return {module:model/VehicleLicensePlateDetectionResult} The populated <code>VehicleLicensePlateDetectionResult</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('DetectedLicensePlates')) {
        obj['DetectedLicensePlates'] = ApiClient.convertToType(data['DetectedLicensePlates'], [DetectedLicensePlate]);
      }
      if (data.hasOwnProperty('DetectedLicensePlateCount')) {
        obj['DetectedLicensePlateCount'] = ApiClient.convertToType(data['DetectedLicensePlateCount'], 'Number');
      }
    }
    return obj;
  }

  /**
   * Was the image processed successfully?
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * License plates found in the image
   * @member {Array.<module:model/DetectedLicensePlate>} DetectedLicensePlates
   */
  exports.prototype['DetectedLicensePlates'] = undefined;
  /**
   * The number of license plates detected in the image
   * @member {Number} DetectedLicensePlateCount
   */
  exports.prototype['DetectedLicensePlateCount'] = undefined;



  return exports;
}));



},{"../ApiClient":93,"./DetectedLicensePlate":102}],116:[function(require,module,exports){
(function (Buffer){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['superagent', 'querystring'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('superagent'), require('querystring'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.ApiClient = factory(root.superagent, root.querystring);
  }
}(this, function(superagent, querystring) {
  'use strict';

  /**
   * @module ApiClient
   * @version 1.1.2
   */

  /**
   * Manages low level client-server communications, parameter marshalling, etc. There should not be any need for an
   * application to use this class directly - the *Api and model classes provide the public API for the service. The
   * contents of this file should be regarded as internal but are documented for completeness.
   * @alias module:ApiClient
   * @class
   */
  var exports = function() {
    /**
     * The base URL against which to resolve every API call's (relative) path.
     * @type {String}
     * @default https://api.cloudmersive.com
     */
    this.basePath = 'https://api.cloudmersive.com'.replace(/\/+$/, '');

    /**
     * The authentication methods to be included for all API calls.
     * @type {Array.<String>}
     */
    this.authentications = {
      'Apikey': {type: 'apiKey', 'in': 'header', name: 'Apikey'}
    };
    /**
     * The default HTTP headers to be included for all API calls.
     * @type {Array.<String>}
     * @default {}
     */
    this.defaultHeaders = {};

    /**
     * The default HTTP timeout for all API calls.
     * @type {Number}
     * @default 60000
     */
    this.timeout = 60000;

    /**
     * If set to false an additional timestamp parameter is added to all API GET calls to
     * prevent browser caching
     * @type {Boolean}
     * @default true
     */
    this.cache = true;

    /**
     * If set to true, the client will save the cookies from each server
     * response, and return them in the next request.
     * @default false
     */
    this.enableCookies = false;

    /*
     * Used to save and return cookies in a node.js (non-browser) setting,
     * if this.enableCookies is set to true.
     */
    if (typeof window === 'undefined') {
      this.agent = new superagent.agent();
    }

    /*
     * Allow user to override superagent agent
     */
    this.requestAgent = null;
  };

  /**
   * Returns a string representation for an actual parameter.
   * @param param The actual parameter.
   * @returns {String} The string representation of <code>param</code>.
   */
  exports.prototype.paramToString = function(param) {
    if (param == undefined || param == null) {
      return '';
    }
    if (param instanceof Date) {
      return param.toJSON();
    }
    return param.toString();
  };

  /**
   * Builds full URL by appending the given path to the base URL and replacing path parameter place-holders with parameter values.
   * NOTE: query parameters are not handled here.
   * @param {String} path The path to append to the base URL.
   * @param {Object} pathParams The parameter values to append.
   * @returns {String} The encoded path with parameter values substituted.
   */
  exports.prototype.buildUrl = function(path, pathParams) {
    if (!path.match(/^\//)) {
      path = '/' + path;
    }
    var url = this.basePath + path;
    var _this = this;
    url = url.replace(/\{([\w-]+)\}/g, function(fullMatch, key) {
      var value;
      if (pathParams.hasOwnProperty(key)) {
        value = _this.paramToString(pathParams[key]);
      } else {
        value = fullMatch;
      }
      return encodeURIComponent(value);
    });
    return url;
  };

  /**
   * Checks whether the given content type represents JSON.<br>
   * JSON content type examples:<br>
   * <ul>
   * <li>application/json</li>
   * <li>application/json; charset=UTF8</li>
   * <li>APPLICATION/JSON</li>
   * </ul>
   * @param {String} contentType The MIME content type to check.
   * @returns {Boolean} <code>true</code> if <code>contentType</code> represents JSON, otherwise <code>false</code>.
   */
  exports.prototype.isJsonMime = function(contentType) {
    return Boolean(contentType != null && contentType.match(/^application\/json(;.*)?$/i));
  };

  /**
   * Chooses a content type from the given array, with JSON preferred; i.e. return JSON if included, otherwise return the first.
   * @param {Array.<String>} contentTypes
   * @returns {String} The chosen content type, preferring JSON.
   */
  exports.prototype.jsonPreferredMime = function(contentTypes) {
    for (var i = 0; i < contentTypes.length; i++) {
      if (this.isJsonMime(contentTypes[i])) {
        return contentTypes[i];
      }
    }
    return contentTypes[0];
  };

  /**
   * Checks whether the given parameter value represents file-like content.
   * @param param The parameter to check.
   * @returns {Boolean} <code>true</code> if <code>param</code> represents a file.
   */
  exports.prototype.isFileParam = function(param) {
    // fs.ReadStream in Node.js and Electron (but not in runtime like browserify)
    if (typeof require === 'function') {
      var fs;
      try {
        fs = require('fs');
      } catch (err) {}
      if (fs && fs.ReadStream && param instanceof fs.ReadStream) {
        return true;
      }
    }
    // Buffer in Node.js
    if (typeof Buffer === 'function' && param instanceof Buffer) {
      return true;
    }
    // Blob in browser
    if (typeof Blob === 'function' && param instanceof Blob) {
      return true;
    }
    // File in browser (it seems File object is also instance of Blob, but keep this for safe)
    if (typeof File === 'function' && param instanceof File) {
      return true;
    }
    return false;
  };

  /**
   * Normalizes parameter values:
   * <ul>
   * <li>remove nils</li>
   * <li>keep files and arrays</li>
   * <li>format to string with `paramToString` for other cases</li>
   * </ul>
   * @param {Object.<String, Object>} params The parameters as object properties.
   * @returns {Object.<String, Object>} normalized parameters.
   */
  exports.prototype.normalizeParams = function(params) {
    var newParams = {};
    for (var key in params) {
      if (params.hasOwnProperty(key) && params[key] != undefined && params[key] != null) {
        var value = params[key];
        if (this.isFileParam(value) || Array.isArray(value)) {
          newParams[key] = value;
        } else {
          newParams[key] = this.paramToString(value);
        }
      }
    }
    return newParams;
  };

  /**
   * Enumeration of collection format separator strategies.
   * @enum {String}
   * @readonly
   */
  exports.CollectionFormatEnum = {
    /**
     * Comma-separated values. Value: <code>csv</code>
     * @const
     */
    CSV: ',',
    /**
     * Space-separated values. Value: <code>ssv</code>
     * @const
     */
    SSV: ' ',
    /**
     * Tab-separated values. Value: <code>tsv</code>
     * @const
     */
    TSV: '\t',
    /**
     * Pipe(|)-separated values. Value: <code>pipes</code>
     * @const
     */
    PIPES: '|',
    /**
     * Native array. Value: <code>multi</code>
     * @const
     */
    MULTI: 'multi'
  };

  /**
   * Builds a string representation of an array-type actual parameter, according to the given collection format.
   * @param {Array} param An array parameter.
   * @param {module:ApiClient.CollectionFormatEnum} collectionFormat The array element separator strategy.
   * @returns {String|Array} A string representation of the supplied collection, using the specified delimiter. Returns
   * <code>param</code> as is if <code>collectionFormat</code> is <code>multi</code>.
   */
  exports.prototype.buildCollectionParam = function buildCollectionParam(param, collectionFormat) {
    if (param == null) {
      return null;
    }
    switch (collectionFormat) {
      case 'csv':
        return param.map(this.paramToString).join(',');
      case 'ssv':
        return param.map(this.paramToString).join(' ');
      case 'tsv':
        return param.map(this.paramToString).join('\t');
      case 'pipes':
        return param.map(this.paramToString).join('|');
      case 'multi':
        // return the array directly as SuperAgent will handle it as expected
        return param.map(this.paramToString);
      default:
        throw new Error('Unknown collection format: ' + collectionFormat);
    }
  };

  /**
   * Applies authentication headers to the request.
   * @param {Object} request The request object created by a <code>superagent()</code> call.
   * @param {Array.<String>} authNames An array of authentication method names.
   */
  exports.prototype.applyAuthToRequest = function(request, authNames) {
    var _this = this;
    authNames.forEach(function(authName) {
      var auth = _this.authentications[authName];
      switch (auth.type) {
        case 'basic':
          if (auth.username || auth.password) {
            request.auth(auth.username || '', auth.password || '');
          }
          break;
        case 'apiKey':
          if (auth.apiKey) {
            var data = {};
            if (auth.apiKeyPrefix) {
              data[auth.name] = auth.apiKeyPrefix + ' ' + auth.apiKey;
            } else {
              data[auth.name] = auth.apiKey;
            }
            if (auth['in'] === 'header') {
              request.set(data);
            } else {
              request.query(data);
            }
          }
          break;
        case 'oauth2':
          if (auth.accessToken) {
            request.set({'Authorization': 'Bearer ' + auth.accessToken});
          }
          break;
        default:
          throw new Error('Unknown authentication type: ' + auth.type);
      }
    });
  };

  /**
   * Deserializes an HTTP response body into a value of the specified type.
   * @param {Object} response A SuperAgent response object.
   * @param {(String|Array.<String>|Object.<String, Object>|Function)} returnType The type to return. Pass a string for simple types
   * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
   * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
   * all properties on <code>data<code> will be converted to this type.
   * @returns A value of the specified type.
   */
  exports.prototype.deserialize = function deserialize(response, returnType) {
    if (response == null || returnType == null || response.status == 204) {
      return null;
    }
    // Rely on SuperAgent for parsing response body.
    // See http://visionmedia.github.io/superagent/#parsing-response-bodies
    var data = response.body;
    if (data == null || (typeof data === 'object' && typeof data.length === 'undefined' && !Object.keys(data).length)) {
      // SuperAgent does not always produce a body; use the unparsed response as a fallback
      data = response.text;
    }
    return exports.convertToType(data, returnType);
  };

  /**
   * Callback function to receive the result of the operation.
   * @callback module:ApiClient~callApiCallback
   * @param {String} error Error message, if any.
   * @param data The data returned by the service call.
   * @param {String} response The complete HTTP response.
   */

  /**
   * Invokes the REST service using the supplied settings and parameters.
   * @param {String} path The base URL to invoke.
   * @param {String} httpMethod The HTTP method to use.
   * @param {Object.<String, String>} pathParams A map of path parameters and their values.
   * @param {Object.<String, Object>} queryParams A map of query parameters and their values.
   * @param {Object.<String, Object>} collectionQueryParams A map of collection query parameters and their values.
   * @param {Object.<String, Object>} headerParams A map of header parameters and their values.
   * @param {Object.<String, Object>} formParams A map of form parameters and their values.
   * @param {Object} bodyParam The value to pass as the request body.
   * @param {Array.<String>} authNames An array of authentication type names.
   * @param {Array.<String>} contentTypes An array of request MIME types.
   * @param {Array.<String>} accepts An array of acceptable response MIME types.
   * @param {(String|Array|ObjectFunction)} returnType The required type to return; can be a string for simple types or the
   * constructor for a complex type.
   * @param {module:ApiClient~callApiCallback} callback The callback function.
   * @returns {Object} The SuperAgent request object.
   */
  exports.prototype.callApi = function callApi(path, httpMethod, pathParams,
      queryParams, collectionQueryParams, headerParams, formParams, bodyParam, authNames, contentTypes, accepts,
      returnType, callback) {

    var _this = this;
    var url = this.buildUrl(path, pathParams);
    var request = superagent(httpMethod, url);

    // apply authentications
    this.applyAuthToRequest(request, authNames);

    // set collection query parameters
    for (var key in collectionQueryParams) {
      if (collectionQueryParams.hasOwnProperty(key)) {
        var param = collectionQueryParams[key];
        if (param.collectionFormat === 'csv') {
          // SuperAgent normally percent-encodes all reserved characters in a query parameter. However,
          // commas are used as delimiters for the 'csv' collectionFormat so they must not be encoded. We
          // must therefore construct and encode 'csv' collection query parameters manually.
          if (param.value != null) {
            var value = param.value.map(this.paramToString).map(encodeURIComponent).join(',');
            request.query(encodeURIComponent(key) + "=" + value);
          }
        } else {
          // All other collection query parameters should be treated as ordinary query parameters.
          queryParams[key] = this.buildCollectionParam(param.value, param.collectionFormat);
        }
      }
    }

    // set query parameters
    if (httpMethod.toUpperCase() === 'GET' && this.cache === false) {
        queryParams['_'] = new Date().getTime();
    }
    request.query(this.normalizeParams(queryParams));

    // set header parameters
    request.set(this.defaultHeaders).set(this.normalizeParams(headerParams));


    // set requestAgent if it is set by user
    if (this.requestAgent) {
      request.agent(this.requestAgent);
    }

    // set request timeout
    request.timeout(this.timeout);

    var contentType = this.jsonPreferredMime(contentTypes);
    if (contentType) {
      // Issue with superagent and multipart/form-data (https://github.com/visionmedia/superagent/issues/746)
      if(contentType != 'multipart/form-data') {
        request.type(contentType);
      }
    } else if (!request.header['Content-Type']) {
      request.type('application/json');
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      request.send(querystring.stringify(this.normalizeParams(formParams)));
    } else if (contentType == 'multipart/form-data') {
      var _formParams = this.normalizeParams(formParams);
      for (var key in _formParams) {
        if (_formParams.hasOwnProperty(key)) {
          if (this.isFileParam(_formParams[key])) {
            // file field
            request.attach(key, _formParams[key]);
          } else {
            request.field(key, _formParams[key]);
          }
        }
      }
    } else if (bodyParam) {
      request.send(bodyParam);
    }

    var accept = this.jsonPreferredMime(accepts);
    if (accept) {
      request.accept(accept);
    }

    if (returnType === 'Blob') {
      request.responseType('blob');
    } else if (returnType === 'String') {
      request.responseType('string');
    }

    // Attach previously saved cookies, if enabled
    if (this.enableCookies){
      if (typeof window === 'undefined') {
        this.agent.attachCookies(request);
      }
      else {
        request.withCredentials();
      }
    }


    request.end(function(error, response) {
      if (callback) {
        var data = null;
        if (!error) {
          try {
            data = _this.deserialize(response, returnType);
            if (_this.enableCookies && typeof window === 'undefined'){
              _this.agent.saveCookies(response);
            }
          } catch (err) {
            error = err;
          }
        }
        callback(error, data, response);
      }
    });

    return request;
  };

  /**
   * Parses an ISO-8601 string representation of a date value.
   * @param {String} str The date value as a string.
   * @returns {Date} The parsed date object.
   */
  exports.parseDate = function(str) {
    return new Date(str.replace(/T/i, ' '));
  };

  /**
   * Converts a value to the specified type.
   * @param {(String|Object)} data The data to convert, as a string or object.
   * @param {(String|Array.<String>|Object.<String, Object>|Function)} type The type to return. Pass a string for simple types
   * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
   * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
   * all properties on <code>data<code> will be converted to this type.
   * @returns An instance of the specified type or null or undefined if data is null or undefined.
   */
  exports.convertToType = function(data, type) {
    if (data === null || data === undefined)
      return data

    switch (type) {
      case 'Boolean':
        return Boolean(data);
      case 'Integer':
        return parseInt(data, 10);
      case 'Number':
        return parseFloat(data);
      case 'String':
        return String(data);
      case 'Date':
        return this.parseDate(String(data));
      case 'Blob':
      	return data;
      default:
        if (type === Object) {
          // generic object, return directly
          return data;
        } else if (typeof type === 'function') {
          // for model type like: User
          return type.constructFromObject(data);
        } else if (Array.isArray(type)) {
          // for array type like: ['String']
          var itemType = type[0];
          return data.map(function(item) {
            return exports.convertToType(item, itemType);
          });
        } else if (typeof type === 'object') {
          // for plain object type like: {'String': 'Integer'}
          var keyType, valueType;
          for (var k in type) {
            if (type.hasOwnProperty(k)) {
              keyType = k;
              valueType = type[k];
              break;
            }
          }
          var result = {};
          for (var k in data) {
            if (data.hasOwnProperty(k)) {
              var key = exports.convertToType(k, keyType);
              var value = exports.convertToType(data[k], valueType);
              result[key] = value;
            }
          }
          return result;
        } else {
          // for unknown type, return the data directly
          return data;
        }
    }
  };

  /**
   * Constructs a new map or array model from REST data.
   * @param data {Object|Array} The REST data.
   * @param obj {Object|Array} The target object or array.
   */
  exports.constructFromObject = function(data, obj, itemType) {
    if (Array.isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        if (data.hasOwnProperty(i))
          obj[i] = exports.convertToType(data[i], itemType);
      }
    } else {
      for (var k in data) {
        if (data.hasOwnProperty(k))
          obj[k] = exports.convertToType(data[k], itemType);
      }
    }
  };

  /**
   * The default API client implementation.
   * @type {module:ApiClient}
   */
  exports.instance = new exports();

  return exports;
}));

}).call(this,require("buffer").Buffer)
},{"buffer":3,"fs":2,"querystring":7,"superagent":134}],117:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/CheckResponse', 'model/WhoisResponse'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/CheckResponse'), require('../model/WhoisResponse'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.DomainApi = factory(root.CloudmersiveValidateApiClient.ApiClient, root.CloudmersiveValidateApiClient.CheckResponse, root.CloudmersiveValidateApiClient.WhoisResponse);
  }
}(this, function(ApiClient, CheckResponse, WhoisResponse) {
  'use strict';

  /**
   * Domain service.
   * @module api/DomainApi
   * @version 1.1.2
   */

  /**
   * Constructs a new DomainApi. 
   * @alias module:api/DomainApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the domainCheck operation.
     * @callback module:api/DomainApi~domainCheckCallback
     * @param {String} error Error message, if any.
     * @param {module:model/CheckResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Validate a domain name
     * Check whether a domain name is valid or not.  API performs a live validation by contacting DNS services to validate the existence of the domain name.
     * @param {String} domain Domain name to check, for example \&quot;cloudmersive.com\&quot;.  The input is a string so be sure to enclose it in double-quotes.
     * @param {module:api/DomainApi~domainCheckCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/CheckResponse}
     */
    this.domainCheck = function(domain, callback) {
      var postBody = domain;

      // verify the required parameter 'domain' is set
      if (domain === undefined || domain === null) {
        throw new Error("Missing the required parameter 'domain' when calling domainCheck");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = CheckResponse;

      return this.apiClient.callApi(
        '/validate/domain/check', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the domainPost operation.
     * @callback module:api/DomainApi~domainPostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/WhoisResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get WHOIS information for a domain
     * Validate whether a domain name exists, and also return the full WHOIS record for that domain name.  WHOIS records include all the registration details of the domain name, such as information about the domain&#39;s owners.
     * @param {String} domain Domain name to check, for example \&quot;cloudmersive.com\&quot;.   The input is a string so be sure to enclose it in double-quotes.
     * @param {module:api/DomainApi~domainPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/WhoisResponse}
     */
    this.domainPost = function(domain, callback) {
      var postBody = domain;

      // verify the required parameter 'domain' is set
      if (domain === undefined || domain === null) {
        throw new Error("Missing the required parameter 'domain' when calling domainPost");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = WhoisResponse;

      return this.apiClient.callApi(
        '/validate/domain/whois', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":116,"../model/CheckResponse":125,"../model/WhoisResponse":132}],118:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/AddressGetServersResponse', 'model/AddressVerifySyntaxOnlyResponse', 'model/FullEmailValidationResponse'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/AddressGetServersResponse'), require('../model/AddressVerifySyntaxOnlyResponse'), require('../model/FullEmailValidationResponse'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.EmailApi = factory(root.CloudmersiveValidateApiClient.ApiClient, root.CloudmersiveValidateApiClient.AddressGetServersResponse, root.CloudmersiveValidateApiClient.AddressVerifySyntaxOnlyResponse, root.CloudmersiveValidateApiClient.FullEmailValidationResponse);
  }
}(this, function(ApiClient, AddressGetServersResponse, AddressVerifySyntaxOnlyResponse, FullEmailValidationResponse) {
  'use strict';

  /**
   * Email service.
   * @module api/EmailApi
   * @version 1.1.2
   */

  /**
   * Constructs a new EmailApi. 
   * @alias module:api/EmailApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the emailAddressGetServers operation.
     * @callback module:api/EmailApi~emailAddressGetServersCallback
     * @param {String} error Error message, if any.
     * @param {module:model/AddressGetServersResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Partially check whether an email address is valid
     * Validate an email address by identifying whether its parent domain has email servers defined.  This call is less limited than syntaxOnly but not as comprehensive as address/full.
     * @param {String} email Email address to validate, e.g. \&quot;support@cloudmersive.com\&quot;.    The input is a string so be sure to enclose it in double-quotes.
     * @param {module:api/EmailApi~emailAddressGetServersCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/AddressGetServersResponse}
     */
    this.emailAddressGetServers = function(email, callback) {
      var postBody = email;

      // verify the required parameter 'email' is set
      if (email === undefined || email === null) {
        throw new Error("Missing the required parameter 'email' when calling emailAddressGetServers");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = AddressGetServersResponse;

      return this.apiClient.callApi(
        '/validate/email/address/servers', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the emailFullValidation operation.
     * @callback module:api/EmailApi~emailFullValidationCallback
     * @param {String} error Error message, if any.
     * @param {module:model/FullEmailValidationResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Fully validate an email address
     * Performs a full validation of the email address.  Checks for syntactic correctness, identifies the mail server in question if any, and then contacts the email server to validate the existence of the account - without sending any emails.
     * @param {String} email Email address to validate, e.g. \&quot;support@cloudmersive.com\&quot;.    The input is a string so be sure to enclose it in double-quotes.
     * @param {module:api/EmailApi~emailFullValidationCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/FullEmailValidationResponse}
     */
    this.emailFullValidation = function(email, callback) {
      var postBody = email;

      // verify the required parameter 'email' is set
      if (email === undefined || email === null) {
        throw new Error("Missing the required parameter 'email' when calling emailFullValidation");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = FullEmailValidationResponse;

      return this.apiClient.callApi(
        '/validate/email/address/full', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the emailPost operation.
     * @callback module:api/EmailApi~emailPostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/AddressVerifySyntaxOnlyResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Validate email adddress for syntactic correctness only
     * Validate whether a given email address is syntactically correct via a limited local-only check.  Use the address/full API to do a full validation.
     * @param {String} value Email address to validate, e.g. \&quot;support@cloudmersive.com\&quot;.    The input is a string so be sure to enclose it in double-quotes.
     * @param {module:api/EmailApi~emailPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/AddressVerifySyntaxOnlyResponse}
     */
    this.emailPost = function(value, callback) {
      var postBody = value;

      // verify the required parameter 'value' is set
      if (value === undefined || value === null) {
        throw new Error("Missing the required parameter 'value' when calling emailPost");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = AddressVerifySyntaxOnlyResponse;

      return this.apiClient.callApi(
        '/validate/email/address/syntaxOnly', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":116,"../model/AddressGetServersResponse":123,"../model/AddressVerifySyntaxOnlyResponse":124,"../model/FullEmailValidationResponse":126}],119:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/GeolocateResponse'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/GeolocateResponse'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.IPAddressApi = factory(root.CloudmersiveValidateApiClient.ApiClient, root.CloudmersiveValidateApiClient.GeolocateResponse);
  }
}(this, function(ApiClient, GeolocateResponse) {
  'use strict';

  /**
   * IPAddress service.
   * @module api/IPAddressApi
   * @version 1.1.2
   */

  /**
   * Constructs a new IPAddressApi. 
   * @alias module:api/IPAddressApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the iPAddressPost operation.
     * @callback module:api/IPAddressApi~iPAddressPostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GeolocateResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Geolocate an IP address
     * Identify an IP address Country, State/Provence, City, Zip/Postal Code, etc.  Useful for security and UX applications.
     * @param {String} value IP address to geolocate, e.g. \&quot;55.55.55.55\&quot;.  The input is a string so be sure to enclose it in double-quotes.
     * @param {module:api/IPAddressApi~iPAddressPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GeolocateResponse}
     */
    this.iPAddressPost = function(value, callback) {
      var postBody = value;

      // verify the required parameter 'value' is set
      if (value === undefined || value === null) {
        throw new Error("Missing the required parameter 'value' when calling iPAddressPost");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = GeolocateResponse;

      return this.apiClient.callApi(
        '/validate/ip/geolocate', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":116,"../model/GeolocateResponse":127}],120:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/PhoneNumberValidateRequest', 'model/PhoneNumberValidationResponse'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/PhoneNumberValidateRequest'), require('../model/PhoneNumberValidationResponse'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.PhoneNumberApi = factory(root.CloudmersiveValidateApiClient.ApiClient, root.CloudmersiveValidateApiClient.PhoneNumberValidateRequest, root.CloudmersiveValidateApiClient.PhoneNumberValidationResponse);
  }
}(this, function(ApiClient, PhoneNumberValidateRequest, PhoneNumberValidationResponse) {
  'use strict';

  /**
   * PhoneNumber service.
   * @module api/PhoneNumberApi
   * @version 1.1.2
   */

  /**
   * Constructs a new PhoneNumberApi. 
   * @alias module:api/PhoneNumberApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the phoneNumberSyntaxOnly operation.
     * @callback module:api/PhoneNumberApi~phoneNumberSyntaxOnlyCallback
     * @param {String} error Error message, if any.
     * @param {module:model/PhoneNumberValidationResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Validate phone number (basic)
     * Validate a phone number by analyzing the syntax
     * @param {module:model/PhoneNumberValidateRequest} value Phone number to validate in a PhoneNumberValidateRequest object.  Try a phone number such as \&quot;1.800.463.3339\&quot;, and either leave DefaultCountryCode blank or use \&quot;US\&quot;.
     * @param {module:api/PhoneNumberApi~phoneNumberSyntaxOnlyCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/PhoneNumberValidationResponse}
     */
    this.phoneNumberSyntaxOnly = function(value, callback) {
      var postBody = value;

      // verify the required parameter 'value' is set
      if (value === undefined || value === null) {
        throw new Error("Missing the required parameter 'value' when calling phoneNumberSyntaxOnly");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = PhoneNumberValidationResponse;

      return this.apiClient.callApi(
        '/validate/phonenumber/basic', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":116,"../model/PhoneNumberValidateRequest":128,"../model/PhoneNumberValidationResponse":129}],121:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/VatLookupRequest', 'model/VatLookupResponse'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/VatLookupRequest'), require('../model/VatLookupResponse'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.VatApi = factory(root.CloudmersiveValidateApiClient.ApiClient, root.CloudmersiveValidateApiClient.VatLookupRequest, root.CloudmersiveValidateApiClient.VatLookupResponse);
  }
}(this, function(ApiClient, VatLookupRequest, VatLookupResponse) {
  'use strict';

  /**
   * Vat service.
   * @module api/VatApi
   * @version 1.1.2
   */

  /**
   * Constructs a new VatApi. 
   * @alias module:api/VatApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the vatVatLookup operation.
     * @callback module:api/VatApi~vatVatLookupCallback
     * @param {String} error Error message, if any.
     * @param {module:model/VatLookupResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Lookup a VAT code
     * Checks if a VAT code is valid, and if it is, returns more information about it
     * @param {module:model/VatLookupRequest} input Input VAT code
     * @param {module:api/VatApi~vatVatLookupCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/VatLookupResponse}
     */
    this.vatVatLookup = function(input, callback) {
      var postBody = input;

      // verify the required parameter 'input' is set
      if (input === undefined || input === null) {
        throw new Error("Missing the required parameter 'input' when calling vatVatLookup");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var collectionQueryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['Apikey'];
      var contentTypes = ['application/json', 'text/json', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'];
      var accepts = ['application/json', 'text/json', 'application/xml', 'text/xml'];
      var returnType = VatLookupResponse;

      return this.apiClient.callApi(
        '/validate/vat/lookup', 'POST',
        pathParams, queryParams, collectionQueryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":116,"../model/VatLookupRequest":130,"../model/VatLookupResponse":131}],122:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/AddressGetServersResponse', 'model/AddressVerifySyntaxOnlyResponse', 'model/CheckResponse', 'model/FullEmailValidationResponse', 'model/GeolocateResponse', 'model/PhoneNumberValidateRequest', 'model/PhoneNumberValidationResponse', 'model/VatLookupRequest', 'model/VatLookupResponse', 'model/WhoisResponse', 'api/DomainApi', 'api/EmailApi', 'api/IPAddressApi', 'api/PhoneNumberApi', 'api/VatApi'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('./ApiClient'), require('./model/AddressGetServersResponse'), require('./model/AddressVerifySyntaxOnlyResponse'), require('./model/CheckResponse'), require('./model/FullEmailValidationResponse'), require('./model/GeolocateResponse'), require('./model/PhoneNumberValidateRequest'), require('./model/PhoneNumberValidationResponse'), require('./model/VatLookupRequest'), require('./model/VatLookupResponse'), require('./model/WhoisResponse'), require('./api/DomainApi'), require('./api/EmailApi'), require('./api/IPAddressApi'), require('./api/PhoneNumberApi'), require('./api/VatApi'));
  }
}(function(ApiClient, AddressGetServersResponse, AddressVerifySyntaxOnlyResponse, CheckResponse, FullEmailValidationResponse, GeolocateResponse, PhoneNumberValidateRequest, PhoneNumberValidationResponse, VatLookupRequest, VatLookupResponse, WhoisResponse, DomainApi, EmailApi, IPAddressApi, PhoneNumberApi, VatApi) {
  'use strict';

  /**
   * The_validation_APIs_help_you_validate_data__Check_if_an_E_mail_address_is_real__Check_if_a_domain_is_real__Check_up_on_an_IP_address_and_even_where_it_is_located__All_this_and_much_more_is_available_in_the_validation_API_.<br>
   * The <code>index</code> module provides access to constructors for all the classes which comprise the public API.
   * <p>
   * An AMD (recommended!) or CommonJS application will generally do something equivalent to the following:
   * <pre>
   * var CloudmersiveValidateApiClient = require('index'); // See note below*.
   * var xxxSvc = new CloudmersiveValidateApiClient.XxxApi(); // Allocate the API class we're going to use.
   * var yyyModel = new CloudmersiveValidateApiClient.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * <em>*NOTE: For a top-level AMD script, use require(['index'], function(){...})
   * and put the application logic within the callback function.</em>
   * </p>
   * <p>
   * A non-AMD browser application (discouraged) might do something like this:
   * <pre>
   * var xxxSvc = new CloudmersiveValidateApiClient.XxxApi(); // Allocate the API class we're going to use.
   * var yyy = new CloudmersiveValidateApiClient.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * </p>
   * @module index
   * @version 1.1.2
   */
  var exports = {
    /**
     * The ApiClient constructor.
     * @property {module:ApiClient}
     */
    ApiClient: ApiClient,
    /**
     * The AddressGetServersResponse model constructor.
     * @property {module:model/AddressGetServersResponse}
     */
    AddressGetServersResponse: AddressGetServersResponse,
    /**
     * The AddressVerifySyntaxOnlyResponse model constructor.
     * @property {module:model/AddressVerifySyntaxOnlyResponse}
     */
    AddressVerifySyntaxOnlyResponse: AddressVerifySyntaxOnlyResponse,
    /**
     * The CheckResponse model constructor.
     * @property {module:model/CheckResponse}
     */
    CheckResponse: CheckResponse,
    /**
     * The FullEmailValidationResponse model constructor.
     * @property {module:model/FullEmailValidationResponse}
     */
    FullEmailValidationResponse: FullEmailValidationResponse,
    /**
     * The GeolocateResponse model constructor.
     * @property {module:model/GeolocateResponse}
     */
    GeolocateResponse: GeolocateResponse,
    /**
     * The PhoneNumberValidateRequest model constructor.
     * @property {module:model/PhoneNumberValidateRequest}
     */
    PhoneNumberValidateRequest: PhoneNumberValidateRequest,
    /**
     * The PhoneNumberValidationResponse model constructor.
     * @property {module:model/PhoneNumberValidationResponse}
     */
    PhoneNumberValidationResponse: PhoneNumberValidationResponse,
    /**
     * The VatLookupRequest model constructor.
     * @property {module:model/VatLookupRequest}
     */
    VatLookupRequest: VatLookupRequest,
    /**
     * The VatLookupResponse model constructor.
     * @property {module:model/VatLookupResponse}
     */
    VatLookupResponse: VatLookupResponse,
    /**
     * The WhoisResponse model constructor.
     * @property {module:model/WhoisResponse}
     */
    WhoisResponse: WhoisResponse,
    /**
     * The DomainApi service constructor.
     * @property {module:api/DomainApi}
     */
    DomainApi: DomainApi,
    /**
     * The EmailApi service constructor.
     * @property {module:api/EmailApi}
     */
    EmailApi: EmailApi,
    /**
     * The IPAddressApi service constructor.
     * @property {module:api/IPAddressApi}
     */
    IPAddressApi: IPAddressApi,
    /**
     * The PhoneNumberApi service constructor.
     * @property {module:api/PhoneNumberApi}
     */
    PhoneNumberApi: PhoneNumberApi,
    /**
     * The VatApi service constructor.
     * @property {module:api/VatApi}
     */
    VatApi: VatApi
  };

  return exports;
}));

},{"./ApiClient":116,"./api/DomainApi":117,"./api/EmailApi":118,"./api/IPAddressApi":119,"./api/PhoneNumberApi":120,"./api/VatApi":121,"./model/AddressGetServersResponse":123,"./model/AddressVerifySyntaxOnlyResponse":124,"./model/CheckResponse":125,"./model/FullEmailValidationResponse":126,"./model/GeolocateResponse":127,"./model/PhoneNumberValidateRequest":128,"./model/PhoneNumberValidationResponse":129,"./model/VatLookupRequest":130,"./model/VatLookupResponse":131,"./model/WhoisResponse":132}],123:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.AddressGetServersResponse = factory(root.CloudmersiveValidateApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The AddressGetServersResponse model module.
   * @module model/AddressGetServersResponse
   * @version 1.1.2
   */

  /**
   * Constructs a new <code>AddressGetServersResponse</code>.
   * Result of a partial email address validation
   * @alias module:model/AddressGetServersResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>AddressGetServersResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/AddressGetServersResponse} obj Optional instance to populate.
   * @return {module:model/AddressGetServersResponse} The populated <code>AddressGetServersResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Success')) {
        obj['Success'] = ApiClient.convertToType(data['Success'], 'Boolean');
      }
      if (data.hasOwnProperty('Servers')) {
        obj['Servers'] = ApiClient.convertToType(data['Servers'], ['String']);
      }
    }
    return obj;
  }

  /**
   * @member {Boolean} Success
   */
  exports.prototype['Success'] = undefined;
  /**
   * @member {Array.<String>} Servers
   */
  exports.prototype['Servers'] = undefined;



  return exports;
}));



},{"../ApiClient":116}],124:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.AddressVerifySyntaxOnlyResponse = factory(root.CloudmersiveValidateApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The AddressVerifySyntaxOnlyResponse model module.
   * @module model/AddressVerifySyntaxOnlyResponse
   * @version 1.1.2
   */

  /**
   * Constructs a new <code>AddressVerifySyntaxOnlyResponse</code>.
   * Syntactic validity of email address
   * @alias module:model/AddressVerifySyntaxOnlyResponse
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>AddressVerifySyntaxOnlyResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/AddressVerifySyntaxOnlyResponse} obj Optional instance to populate.
   * @return {module:model/AddressVerifySyntaxOnlyResponse} The populated <code>AddressVerifySyntaxOnlyResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('ValidAddress')) {
        obj['ValidAddress'] = ApiClient.convertToType(data['ValidAddress'], 'Boolean');
      }
    }
    return obj;
  }

  /**
   * True if the email address is syntactically valid, false if it is not
   * @member {Boolean} ValidAddress
   */
  exports.prototype['ValidAddress'] = undefined;



  return exports;
}));



},{"../ApiClient":116}],125:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.CheckResponse = factory(root.CloudmersiveValidateApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The CheckResponse model module.
   * @module model/CheckResponse
   * @version 1.1.2
   */

  /**
   * Constructs a new <code>CheckResponse</code>.
   * Result of a validation operation
   * @alias module:model/CheckResponse
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>CheckResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/CheckResponse} obj Optional instance to populate.
   * @return {module:model/CheckResponse} The populated <code>CheckResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('ValidDomain')) {
        obj['ValidDomain'] = ApiClient.convertToType(data['ValidDomain'], 'Boolean');
      }
    }
    return obj;
  }

  /**
   * True if the domain name was valid, false if it is not
   * @member {Boolean} ValidDomain
   */
  exports.prototype['ValidDomain'] = undefined;



  return exports;
}));



},{"../ApiClient":116}],126:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.FullEmailValidationResponse = factory(root.CloudmersiveValidateApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The FullEmailValidationResponse model module.
   * @module model/FullEmailValidationResponse
   * @version 1.1.2
   */

  /**
   * Constructs a new <code>FullEmailValidationResponse</code>.
   * Full email addresss validation result
   * @alias module:model/FullEmailValidationResponse
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>FullEmailValidationResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/FullEmailValidationResponse} obj Optional instance to populate.
   * @return {module:model/FullEmailValidationResponse} The populated <code>FullEmailValidationResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('ValidAddress')) {
        obj['ValidAddress'] = ApiClient.convertToType(data['ValidAddress'], 'Boolean');
      }
      if (data.hasOwnProperty('MailServerUsedForValidation')) {
        obj['MailServerUsedForValidation'] = ApiClient.convertToType(data['MailServerUsedForValidation'], 'String');
      }
    }
    return obj;
  }

  /**
   * True if the email address is valid, false otherwise
   * @member {Boolean} ValidAddress
   */
  exports.prototype['ValidAddress'] = undefined;
  /**
   * Email server connected to for verification
   * @member {String} MailServerUsedForValidation
   */
  exports.prototype['MailServerUsedForValidation'] = undefined;



  return exports;
}));



},{"../ApiClient":116}],127:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.GeolocateResponse = factory(root.CloudmersiveValidateApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The GeolocateResponse model module.
   * @module model/GeolocateResponse
   * @version 1.1.2
   */

  /**
   * Constructs a new <code>GeolocateResponse</code>.
   * Geolocation result
   * @alias module:model/GeolocateResponse
   * @class
   */
  var exports = function() {
    var _this = this;










  };

  /**
   * Constructs a <code>GeolocateResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GeolocateResponse} obj Optional instance to populate.
   * @return {module:model/GeolocateResponse} The populated <code>GeolocateResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('CountryCode')) {
        obj['CountryCode'] = ApiClient.convertToType(data['CountryCode'], 'String');
      }
      if (data.hasOwnProperty('CountryName')) {
        obj['CountryName'] = ApiClient.convertToType(data['CountryName'], 'String');
      }
      if (data.hasOwnProperty('City')) {
        obj['City'] = ApiClient.convertToType(data['City'], 'String');
      }
      if (data.hasOwnProperty('RegionCode')) {
        obj['RegionCode'] = ApiClient.convertToType(data['RegionCode'], 'String');
      }
      if (data.hasOwnProperty('RegionName')) {
        obj['RegionName'] = ApiClient.convertToType(data['RegionName'], 'String');
      }
      if (data.hasOwnProperty('ZipCode')) {
        obj['ZipCode'] = ApiClient.convertToType(data['ZipCode'], 'String');
      }
      if (data.hasOwnProperty('TimezoneStandardName')) {
        obj['TimezoneStandardName'] = ApiClient.convertToType(data['TimezoneStandardName'], 'String');
      }
      if (data.hasOwnProperty('Latitude')) {
        obj['Latitude'] = ApiClient.convertToType(data['Latitude'], 'Number');
      }
      if (data.hasOwnProperty('Longitude')) {
        obj['Longitude'] = ApiClient.convertToType(data['Longitude'], 'Number');
      }
    }
    return obj;
  }

  /**
   * Two-letter country code of IP address
   * @member {String} CountryCode
   */
  exports.prototype['CountryCode'] = undefined;
  /**
   * Country name of IP address
   * @member {String} CountryName
   */
  exports.prototype['CountryName'] = undefined;
  /**
   * City of IP address
   * @member {String} City
   */
  exports.prototype['City'] = undefined;
  /**
   * State/region code of IP address
   * @member {String} RegionCode
   */
  exports.prototype['RegionCode'] = undefined;
  /**
   * State/region of IP address
   * @member {String} RegionName
   */
  exports.prototype['RegionName'] = undefined;
  /**
   * Zip or postal code of IP address
   * @member {String} ZipCode
   */
  exports.prototype['ZipCode'] = undefined;
  /**
   * Timezone of IP address
   * @member {String} TimezoneStandardName
   */
  exports.prototype['TimezoneStandardName'] = undefined;
  /**
   * Latitude of IP address
   * @member {Number} Latitude
   */
  exports.prototype['Latitude'] = undefined;
  /**
   * Longitude of IP address
   * @member {Number} Longitude
   */
  exports.prototype['Longitude'] = undefined;



  return exports;
}));



},{"../ApiClient":116}],128:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.PhoneNumberValidateRequest = factory(root.CloudmersiveValidateApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The PhoneNumberValidateRequest model module.
   * @module model/PhoneNumberValidateRequest
   * @version 1.1.2
   */

  /**
   * Constructs a new <code>PhoneNumberValidateRequest</code>.
   * Request to validate a phone number
   * @alias module:model/PhoneNumberValidateRequest
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>PhoneNumberValidateRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/PhoneNumberValidateRequest} obj Optional instance to populate.
   * @return {module:model/PhoneNumberValidateRequest} The populated <code>PhoneNumberValidateRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('PhoneNumber')) {
        obj['PhoneNumber'] = ApiClient.convertToType(data['PhoneNumber'], 'String');
      }
      if (data.hasOwnProperty('DefaultCountryCode')) {
        obj['DefaultCountryCode'] = ApiClient.convertToType(data['DefaultCountryCode'], 'String');
      }
    }
    return obj;
  }

  /**
   * Raw phone number string to parse as input for validation
   * @member {String} PhoneNumber
   */
  exports.prototype['PhoneNumber'] = undefined;
  /**
   * Optional, default country code.  If left blank, will default to \"US\".
   * @member {String} DefaultCountryCode
   */
  exports.prototype['DefaultCountryCode'] = undefined;



  return exports;
}));



},{"../ApiClient":116}],129:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.PhoneNumberValidationResponse = factory(root.CloudmersiveValidateApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The PhoneNumberValidationResponse model module.
   * @module model/PhoneNumberValidationResponse
   * @version 1.1.2
   */

  /**
   * Constructs a new <code>PhoneNumberValidationResponse</code>.
   * Result from validating a phone number
   * @alias module:model/PhoneNumberValidationResponse
   * @class
   */
  var exports = function() {
    var _this = this;









  };

  /**
   * Constructs a <code>PhoneNumberValidationResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/PhoneNumberValidationResponse} obj Optional instance to populate.
   * @return {module:model/PhoneNumberValidationResponse} The populated <code>PhoneNumberValidationResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('IsValid')) {
        obj['IsValid'] = ApiClient.convertToType(data['IsValid'], 'Boolean');
      }
      if (data.hasOwnProperty('Successful')) {
        obj['Successful'] = ApiClient.convertToType(data['Successful'], 'Boolean');
      }
      if (data.hasOwnProperty('PhoneNumberType')) {
        obj['PhoneNumberType'] = ApiClient.convertToType(data['PhoneNumberType'], 'String');
      }
      if (data.hasOwnProperty('E164Format')) {
        obj['E164Format'] = ApiClient.convertToType(data['E164Format'], 'String');
      }
      if (data.hasOwnProperty('InternationalFormat')) {
        obj['InternationalFormat'] = ApiClient.convertToType(data['InternationalFormat'], 'String');
      }
      if (data.hasOwnProperty('NationalFormat')) {
        obj['NationalFormat'] = ApiClient.convertToType(data['NationalFormat'], 'String');
      }
      if (data.hasOwnProperty('CountryCode')) {
        obj['CountryCode'] = ApiClient.convertToType(data['CountryCode'], 'String');
      }
      if (data.hasOwnProperty('CountryName')) {
        obj['CountryName'] = ApiClient.convertToType(data['CountryName'], 'String');
      }
    }
    return obj;
  }

  /**
   * True if the phone number is valid, false otherwise
   * @member {Boolean} IsValid
   */
  exports.prototype['IsValid'] = undefined;
  /**
   * True if the operation was successful, false if there was an error during validation.  See IsValid for validation result.
   * @member {Boolean} Successful
   */
  exports.prototype['Successful'] = undefined;
  /**
   * Type of phone number; possible values are: FixedLine, Mobile, FixedLineOrMobile, TollFree, PremiumRate,   SharedCost, Voip, PersonalNumber, Pager, Uan, Voicemail, Unknown
   * @member {String} PhoneNumberType
   */
  exports.prototype['PhoneNumberType'] = undefined;
  /**
   * E.164 format of the phone number
   * @member {String} E164Format
   */
  exports.prototype['E164Format'] = undefined;
  /**
   * Internaltional format of the phone number
   * @member {String} InternationalFormat
   */
  exports.prototype['InternationalFormat'] = undefined;
  /**
   * National format of the phone number
   * @member {String} NationalFormat
   */
  exports.prototype['NationalFormat'] = undefined;
  /**
   * Two digit country code of the phone number
   * @member {String} CountryCode
   */
  exports.prototype['CountryCode'] = undefined;
  /**
   * User-friendly long name of the country for the phone number
   * @member {String} CountryName
   */
  exports.prototype['CountryName'] = undefined;



  return exports;
}));



},{"../ApiClient":116}],130:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.VatLookupRequest = factory(root.CloudmersiveValidateApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The VatLookupRequest model module.
   * @module model/VatLookupRequest
   * @version 1.1.2
   */

  /**
   * Constructs a new <code>VatLookupRequest</code>.
   * Input to a VAT lookup request
   * @alias module:model/VatLookupRequest
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>VatLookupRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/VatLookupRequest} obj Optional instance to populate.
   * @return {module:model/VatLookupRequest} The populated <code>VatLookupRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('VatCode')) {
        obj['VatCode'] = ApiClient.convertToType(data['VatCode'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} VatCode
   */
  exports.prototype['VatCode'] = undefined;



  return exports;
}));



},{"../ApiClient":116}],131:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.VatLookupResponse = factory(root.CloudmersiveValidateApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The VatLookupResponse model module.
   * @module model/VatLookupResponse
   * @version 1.1.2
   */

  /**
   * Constructs a new <code>VatLookupResponse</code>.
   * @alias module:model/VatLookupResponse
   * @class
   */
  var exports = function() {
    var _this = this;






  };

  /**
   * Constructs a <code>VatLookupResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/VatLookupResponse} obj Optional instance to populate.
   * @return {module:model/VatLookupResponse} The populated <code>VatLookupResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('CountryCode')) {
        obj['CountryCode'] = ApiClient.convertToType(data['CountryCode'], 'String');
      }
      if (data.hasOwnProperty('VatNumber')) {
        obj['VatNumber'] = ApiClient.convertToType(data['VatNumber'], 'String');
      }
      if (data.hasOwnProperty('IsValid')) {
        obj['IsValid'] = ApiClient.convertToType(data['IsValid'], 'Boolean');
      }
      if (data.hasOwnProperty('BusinessName')) {
        obj['BusinessName'] = ApiClient.convertToType(data['BusinessName'], 'String');
      }
      if (data.hasOwnProperty('BusinessAddress')) {
        obj['BusinessAddress'] = ApiClient.convertToType(data['BusinessAddress'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} CountryCode
   */
  exports.prototype['CountryCode'] = undefined;
  /**
   * @member {String} VatNumber
   */
  exports.prototype['VatNumber'] = undefined;
  /**
   * @member {Boolean} IsValid
   */
  exports.prototype['IsValid'] = undefined;
  /**
   * @member {String} BusinessName
   */
  exports.prototype['BusinessName'] = undefined;
  /**
   * @member {String} BusinessAddress
   */
  exports.prototype['BusinessAddress'] = undefined;



  return exports;
}));



},{"../ApiClient":116}],132:[function(require,module,exports){
/**
 * validateapi
 * The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
 *
 * OpenAPI spec version: v1
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: unset
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.CloudmersiveValidateApiClient) {
      root.CloudmersiveValidateApiClient = {};
    }
    root.CloudmersiveValidateApiClient.WhoisResponse = factory(root.CloudmersiveValidateApiClient.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The WhoisResponse model module.
   * @module model/WhoisResponse
   * @version 1.1.2
   */

  /**
   * Constructs a new <code>WhoisResponse</code>.
   * Result of a WHOIS operation
   * @alias module:model/WhoisResponse
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>WhoisResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/WhoisResponse} obj Optional instance to populate.
   * @return {module:model/WhoisResponse} The populated <code>WhoisResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('ValidDomain')) {
        obj['ValidDomain'] = ApiClient.convertToType(data['ValidDomain'], 'Boolean');
      }
      if (data.hasOwnProperty('WhoisServer')) {
        obj['WhoisServer'] = ApiClient.convertToType(data['WhoisServer'], 'String');
      }
      if (data.hasOwnProperty('RawTextRecord')) {
        obj['RawTextRecord'] = ApiClient.convertToType(data['RawTextRecord'], 'String');
      }
      if (data.hasOwnProperty('CreatedDt')) {
        obj['CreatedDt'] = ApiClient.convertToType(data['CreatedDt'], 'Date');
      }
    }
    return obj;
  }

  /**
   * True if the domain is valid, false if it is not
   * @member {Boolean} ValidDomain
   */
  exports.prototype['ValidDomain'] = undefined;
  /**
   * Server used to lookup WHOIS information (may change based on lookup).
   * @member {String} WhoisServer
   */
  exports.prototype['WhoisServer'] = undefined;
  /**
   * WHOIS raw text record
   * @member {String} RawTextRecord
   */
  exports.prototype['RawTextRecord'] = undefined;
  /**
   * Creation date for the record
   * @member {Date} CreatedDt
   */
  exports.prototype['CreatedDt'] = undefined;



  return exports;
}));



},{"../ApiClient":116}],133:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],134:[function(require,module,exports){
/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  console.warn("Using browser-only version of superagent in non-browser environment");
  root = this;
}

var Emitter = require('component-emitter');
var RequestBase = require('./request-base');
var isObject = require('./is-object');
var ResponseBase = require('./response-base');
var shouldRetry = require('./should-retry');

/**
 * Noop.
 */

function noop(){};

/**
 * Expose `request`.
 */

var request = exports = module.exports = function(method, url) {
  // callback
  if ('function' == typeof url) {
    return new exports.Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new exports.Request('GET', method);
  }

  return new exports.Request(method, url);
}

exports.Request = Request;

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  throw Error("Browser-only version of superagent could not find XHR");
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    pushEncodedKeyValuePair(pairs, key, obj[key]);
  }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (val != null) {
    if (Array.isArray(val)) {
      val.forEach(function(v) {
        pushEncodedKeyValuePair(pairs, key, v);
      });
    } else if (isObject(val)) {
      for(var subkey in val) {
        pushEncodedKeyValuePair(pairs, key + '[' + subkey + ']', val[subkey]);
      }
    } else {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(val));
    }
  } else if (val === null) {
    pairs.push(encodeURIComponent(key));
  }
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var pair;
  var pos;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    pos = pair.indexOf('=');
    if (pos == -1) {
      obj[decodeURIComponent(pair)] = '';
    } else {
      obj[decodeURIComponent(pair.slice(0, pos))] =
        decodeURIComponent(pair.slice(pos + 1));
    }
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'text/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    if (index === -1) { // could be empty line, just skip it
      continue;
    }
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  return /[\/+]json\b/.test(mime);
}

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req) {
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  var status = this.xhr.status;
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
      status = 204;
  }
  this._setStatusProperties(status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this._setHeaderProperties(this.header);

  if (null === this.text && req._responseType) {
    this.body = this.xhr.response;
  } else {
    this.body = this.req.method != 'HEAD'
      ? this._parseBody(this.text ? this.text : this.xhr.response)
      : null;
  }
}

ResponseBase(Response.prototype);

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype._parseBody = function(str){
  var parse = request.parse[this.type];
  if(this.req._parser) {
    return this.req._parser(this, str);
  }
  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case
  this._header = {}; // coerces header names to lowercase
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      // issue #675: return the raw response if the response parsing fails
      if (self.xhr) {
        // ie9 doesn't have 'response' property
        err.rawResponse = typeof self.xhr.responseType == 'undefined' ? self.xhr.responseText : self.xhr.response;
        // issue #876: return the http status code if the response parsing fails
        err.status = self.xhr.status ? self.xhr.status : null;
        err.statusCode = err.status; // backwards-compat only
      } else {
        err.rawResponse = null;
        err.status = null;
      }

      return self.callback(err);
    }

    self.emit('response', res);

    var new_err;
    try {
      if (!self._isResponseOK(res)) {
        new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
      }
    } catch(custom_err) {
      new_err = custom_err; // ok() callback can throw
    }

    // #1000 don't catch errors from the callback to avoid double calling it
    if (new_err) {
      new_err.original = err;
      new_err.response = res;
      new_err.status = res.status;
      self.callback(new_err, res);
    } else {
      self.callback(null, res);
    }
  });
}

/**
 * Mixin `Emitter` and `RequestBase`.
 */

Emitter(Request.prototype);
RequestBase(Request.prototype);

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} [pass] optional in case of using 'bearer' as type
 * @param {Object} options with 'type' property 'auto', 'basic' or 'bearer' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass, options){
  if (typeof pass === 'object' && pass !== null) { // pass is optional and can substitute for options
    options = pass;
  }
  if (!options) {
    options = {
      type: 'function' === typeof btoa ? 'basic' : 'auto',
    }
  }

  switch (options.type) {
    case 'basic':
      this.set('Authorization', 'Basic ' + btoa(user + ':' + pass));
    break;

    case 'auto':
      this.username = user;
      this.password = pass;
    break;

    case 'bearer': // usage would be .auth(accessToken, { type: 'bearer' })
      this.set('Authorization', 'Bearer ' + user);
    break;
  }
  return this;
};

/**
 * Add query-string `val`.
 *
 * Examples:
 *
 *   request.get('/shoes')
 *     .query('size=10')
 *     .query({ color: 'blue' })
 *
 * @param {Object|String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `options` (or filename).
 *
 * ``` js
 * request.post('/upload')
 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String|Object} options
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, options){
  if (file) {
    if (this._data) {
      throw Error("superagent can't mix .send() and .attach()");
    }

    this._getFormData().append(field, file, options || file.name);
  }
  return this;
};

Request.prototype._getFormData = function(){
  if (!this._formData) {
    this._formData = new root.FormData();
  }
  return this._formData;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  // console.log(this._retries, this._maxRetries)
  if (this._maxRetries && this._retries++ < this._maxRetries && shouldRetry(err, res)) {
    return this._retry();
  }

  var fn = this._callback;
  this.clearTimeout();

  if (err) {
    if (this._maxRetries) err.retries = this._retries - 1;
    this.emit('error', err);
  }

  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;

  err.status = this.status;
  err.method = this.method;
  err.url = this.url;

  this.callback(err);
};

// This only warns, because the request is still likely to work
Request.prototype.buffer = Request.prototype.ca = Request.prototype.agent = function(){
  console.warn("This is not supported in browser version of superagent");
  return this;
};

// This throws, because it can't send/receive data as expected
Request.prototype.pipe = Request.prototype.write = function(){
  throw Error("Streaming is not supported in browser version of superagent");
};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
Request.prototype._isHost = function _isHost(obj) {
  // Native objects stringify to [object File], [object Blob], [object FormData], etc.
  return obj && 'object' === typeof obj && !Array.isArray(obj) && Object.prototype.toString.call(obj) !== '[object Object]';
}

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  if (this._endCalled) {
    console.warn("Warning: .end() was called twice. This is not supported in superagent");
  }
  this._endCalled = true;

  // store callback
  this._callback = fn || noop;

  // querystring
  this._finalizeQueryString();

  return this._end();
};

Request.prototype._end = function() {
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var data = this._formData || this._data;

  this._setTimeouts();

  // state change
  xhr.onreadystatechange = function(){
    var readyState = xhr.readyState;
    if (readyState >= 2 && self._responseTimeoutTimer) {
      clearTimeout(self._responseTimeoutTimer);
    }
    if (4 != readyState) {
      return;
    }

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (!status) {
      if (self.timedout || self._aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(direction, e) {
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    e.direction = direction;
    self.emit('progress', e);
  }
  if (this.hasListeners('progress')) {
    try {
      xhr.onprogress = handleProgress.bind(null, 'download');
      if (xhr.upload) {
        xhr.upload.onprogress = handleProgress.bind(null, 'upload');
      }
    } catch(e) {
      // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
      // Reported here:
      // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
    }
  }

  // initiate request
  try {
    if (this.username && this.password) {
      xhr.open(this.method, this.url, true, this.username, this.password);
    } else {
      xhr.open(this.method, this.url, true);
    }
  } catch (err) {
    // see #1149
    return this.callback(err);
  }

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if (!this._formData && 'GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];
    var serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (!serialize && isJSON(contentType)) {
      serialize = request.serialize['application/json'];
    }
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;

    if (this.header.hasOwnProperty(field))
      xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * OPTIONS query to `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.options = function(url, data, fn){
  var req = request('OPTIONS', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

function del(url, data, fn){
  var req = request('DELETE', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

request['del'] = del;
request['delete'] = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

},{"./is-object":135,"./request-base":136,"./response-base":137,"./should-retry":138,"component-emitter":133}],135:[function(require,module,exports){
'use strict';

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return null !== obj && 'object' === typeof obj;
}

module.exports = isObject;

},{}],136:[function(require,module,exports){
'use strict';

/**
 * Module of mixed-in functions shared between node and client code
 */
var isObject = require('./is-object');

/**
 * Expose `RequestBase`.
 */

module.exports = RequestBase;

/**
 * Initialize a new `RequestBase`.
 *
 * @api public
 */

function RequestBase(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in RequestBase.prototype) {
    obj[key] = RequestBase.prototype[key];
  }
  return obj;
}

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.clearTimeout = function _clearTimeout(){
  clearTimeout(this._timer);
  clearTimeout(this._responseTimeoutTimer);
  delete this._timer;
  delete this._responseTimeoutTimer;
  return this;
};

/**
 * Override default response body parser
 *
 * This function will be called to convert incoming data into request.body
 *
 * @param {Function}
 * @api public
 */

RequestBase.prototype.parse = function parse(fn){
  this._parser = fn;
  return this;
};

/**
 * Set format of binary response body.
 * In browser valid formats are 'blob' and 'arraybuffer',
 * which return Blob and ArrayBuffer, respectively.
 *
 * In Node all values result in Buffer.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.responseType = function(val){
  this._responseType = val;
  return this;
};

/**
 * Override default request body serializer
 *
 * This function will be called to convert data set via .send or .attach into payload to send
 *
 * @param {Function}
 * @api public
 */

RequestBase.prototype.serialize = function serialize(fn){
  this._serializer = fn;
  return this;
};

/**
 * Set timeouts.
 *
 * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
 * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
 *
 * Value of 0 or false means no timeout.
 *
 * @param {Number|Object} ms or {response, deadline}
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.timeout = function timeout(options){
  if (!options || 'object' !== typeof options) {
    this._timeout = options;
    this._responseTimeout = 0;
    return this;
  }

  for(var option in options) {
    switch(option) {
      case 'deadline':
        this._timeout = options.deadline;
        break;
      case 'response':
        this._responseTimeout = options.response;
        break;
      default:
        console.warn("Unknown timeout option", option);
    }
  }
  return this;
};

/**
 * Set number of retry attempts on error.
 *
 * Failed requests will be retried 'count' times if timeout or err.code >= 500.
 *
 * @param {Number} count
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.retry = function retry(count){
  // Default to 1 if no count passed or true
  if (arguments.length === 0 || count === true) count = 1;
  if (count <= 0) count = 0;
  this._maxRetries = count;
  this._retries = 0;
  return this;
};

/**
 * Retry request
 *
 * @return {Request} for chaining
 * @api private
 */

RequestBase.prototype._retry = function() {
  this.clearTimeout();

  // node
  if (this.req) {
    this.req = null;
    this.req = this.request();
  }

  this._aborted = false;
  this.timedout = false;

  return this._end();
};

/**
 * Promise support
 *
 * @param {Function} resolve
 * @param {Function} [reject]
 * @return {Request}
 */

RequestBase.prototype.then = function then(resolve, reject) {
  if (!this._fullfilledPromise) {
    var self = this;
    if (this._endCalled) {
      console.warn("Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises");
    }
    this._fullfilledPromise = new Promise(function(innerResolve, innerReject){
      self.end(function(err, res){
        if (err) innerReject(err); else innerResolve(res);
      });
    });
  }
  return this._fullfilledPromise.then(resolve, reject);
}

RequestBase.prototype.catch = function(cb) {
  return this.then(undefined, cb);
};

/**
 * Allow for extension
 */

RequestBase.prototype.use = function use(fn) {
  fn(this);
  return this;
}

RequestBase.prototype.ok = function(cb) {
  if ('function' !== typeof cb) throw Error("Callback required");
  this._okCallback = cb;
  return this;
};

RequestBase.prototype._isResponseOK = function(res) {
  if (!res) {
    return false;
  }

  if (this._okCallback) {
    return this._okCallback(res);
  }

  return res.status >= 200 && res.status < 300;
};


/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

RequestBase.prototype.get = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */

RequestBase.prototype.getHeader = RequestBase.prototype.get;

/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 */
RequestBase.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Write the field `name` and `val`, or multiple fields with one object
 * for "multipart/form-data" request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 *
 * request.post('/upload')
 *   .field({ foo: 'bar', baz: 'qux' })
 *   .end(callback);
 * ```
 *
 * @param {String|Object} name
 * @param {String|Blob|File|Buffer|fs.ReadStream} val
 * @return {Request} for chaining
 * @api public
 */
RequestBase.prototype.field = function(name, val) {

  // name should be either a string or an object.
  if (null === name ||  undefined === name) {
    throw new Error('.field(name, val) name can not be empty');
  }

  if (this._data) {
    console.error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObject(name)) {
    for (var key in name) {
      this.field(key, name[key]);
    }
    return this;
  }

  if (Array.isArray(val)) {
    for (var i in val) {
      this.field(name, val[i]);
    }
    return this;
  }

  // val should be defined now
  if (null === val || undefined === val) {
    throw new Error('.field(name, val) val can not be empty');
  }
  if ('boolean' === typeof val) {
    val = '' + val;
  }
  this._getFormData().append(name, val);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */
RequestBase.prototype.abort = function(){
  if (this._aborted) {
    return this;
  }
  this._aborted = true;
  this.xhr && this.xhr.abort(); // browser
  this.req && this.req.abort(); // node
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

RequestBase.prototype.withCredentials = function(on){
  // This is browser-only functionality. Node side is no-op.
  if(on==undefined) on = true;
  this._withCredentials = on;
  return this;
};

/**
 * Set the max redirects to `n`. Does noting in browser XHR implementation.
 *
 * @param {Number} n
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.redirects = function(n){
  this._maxRedirects = n;
  return this;
};

/**
 * Maximum size of buffered response body, in bytes. Counts uncompressed size.
 * Default 200MB.
 *
 * @param {Number} n
 * @return {Request} for chaining
 */
RequestBase.prototype.maxResponseSize = function(n){
  if ('number' !== typeof n) {
    throw TypeError("Invalid argument");
  }
  this._maxResponseSize = n;
  return this;
};

/**
 * Convert to a plain javascript object (not JSON string) of scalar properties.
 * Note as this method is designed to return a useful non-this value,
 * it cannot be chained.
 *
 * @return {Object} describing method, url, and data of this request
 * @api public
 */

RequestBase.prototype.toJSON = function(){
  return {
    method: this.method,
    url: this.url,
    data: this._data,
    headers: this._header
  };
};


/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
 *      request.post('/user')
 *        .send('name=tobi')
 *        .send('species=ferret')
 *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.send = function(data){
  var isObj = isObject(data);
  var type = this._header['content-type'];

  if (this._formData) {
    console.error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObj && !this._data) {
    if (Array.isArray(data)) {
      this._data = [];
    } else if (!this._isHost(data)) {
      this._data = {};
    }
  } else if (data && this._data && this._isHost(this._data)) {
    throw Error("Can't merge these send calls");
  }

  // merge
  if (isObj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    // default to x-www-form-urlencoded
    if (!type) this.type('form');
    type = this._header['content-type'];
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!isObj || this._isHost(data)) {
    return this;
  }

  // default to json
  if (!type) this.type('json');
  return this;
};


/**
 * Sort `querystring` by the sort function
 *
 *
 * Examples:
 *
 *       // default order
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery()
 *         .end(callback)
 *
 *       // customized sort function
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery(function(a, b){
 *           return a.length - b.length;
 *         })
 *         .end(callback)
 *
 *
 * @param {Function} sort
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.sortQuery = function(sort) {
  // _sort default to true but otherwise can be a function or boolean
  this._sort = typeof sort === 'undefined' ? true : sort;
  return this;
};

/**
 * Compose querystring to append to req.url
 *
 * @api private
 */
RequestBase.prototype._finalizeQueryString = function(){
  var query = this._query.join('&');
  if (query) {
    this.url += (this.url.indexOf('?') >= 0 ? '&' : '?') + query;
  }
  this._query.length = 0; // Makes the call idempotent

  if (this._sort) {
    var index = this.url.indexOf('?');
    if (index >= 0) {
      var queryArr = this.url.substring(index + 1).split('&');
      if ('function' === typeof this._sort) {
        queryArr.sort(this._sort);
      } else {
        queryArr.sort();
      }
      this.url = this.url.substring(0, index) + '?' + queryArr.join('&');
    }
  }
};

// For backwards compat only
RequestBase.prototype._appendQueryString = function() {console.trace("Unsupported");}

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

RequestBase.prototype._timeoutError = function(reason, timeout, errno){
  if (this._aborted) {
    return;
  }
  var err = new Error(reason + timeout + 'ms exceeded');
  err.timeout = timeout;
  err.code = 'ECONNABORTED';
  err.errno = errno;
  this.timedout = true;
  this.abort();
  this.callback(err);
};

RequestBase.prototype._setTimeouts = function() {
  var self = this;

  // deadline
  if (this._timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self._timeoutError('Timeout of ', self._timeout, 'ETIME');
    }, this._timeout);
  }
  // response timeout
  if (this._responseTimeout && !this._responseTimeoutTimer) {
    this._responseTimeoutTimer = setTimeout(function(){
      self._timeoutError('Response timeout of ', self._responseTimeout, 'ETIMEDOUT');
    }, this._responseTimeout);
  }
}

},{"./is-object":135}],137:[function(require,module,exports){
'use strict';

/**
 * Module dependencies.
 */

var utils = require('./utils');

/**
 * Expose `ResponseBase`.
 */

module.exports = ResponseBase;

/**
 * Initialize a new `ResponseBase`.
 *
 * @api public
 */

function ResponseBase(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in ResponseBase.prototype) {
    obj[key] = ResponseBase.prototype[key];
  }
  return obj;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

ResponseBase.prototype.get = function(field){
    return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

ResponseBase.prototype._setHeaderProperties = function(header){
    // TODO: moar!
    // TODO: make this a util

    // content-type
    var ct = header['content-type'] || '';
    this.type = utils.type(ct);

    // params
    var params = utils.params(ct);
    for (var key in params) this[key] = params[key];

    this.links = {};

    // links
    try {
        if (header.link) {
            this.links = utils.parseLinks(header.link);
        }
    } catch (err) {
        // ignore
    }
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

ResponseBase.prototype._setStatusProperties = function(status){
    var type = status / 100 | 0;

    // status / class
    this.status = this.statusCode = status;
    this.statusType = type;

    // basics
    this.info = 1 == type;
    this.ok = 2 == type;
    this.redirect = 3 == type;
    this.clientError = 4 == type;
    this.serverError = 5 == type;
    this.error = (4 == type || 5 == type)
        ? this.toError()
        : false;

    // sugar
    this.accepted = 202 == status;
    this.noContent = 204 == status;
    this.badRequest = 400 == status;
    this.unauthorized = 401 == status;
    this.notAcceptable = 406 == status;
    this.forbidden = 403 == status;
    this.notFound = 404 == status;
};

},{"./utils":139}],138:[function(require,module,exports){
'use strict';

var ERROR_CODES = [
  'ECONNRESET',
  'ETIMEDOUT',
  'EADDRINFO',
  'ESOCKETTIMEDOUT'
];

/**
 * Determine if a request should be retried.
 * (Borrowed from segmentio/superagent-retry)
 *
 * @param {Error} err
 * @param {Response} [res]
 * @returns {Boolean}
 */
module.exports = function shouldRetry(err, res) {
  if (err && err.code && ~ERROR_CODES.indexOf(err.code)) return true;
  if (res && res.status && res.status >= 500) return true;
  // Superagent timeout
  if (err && 'timeout' in err && err.code == 'ECONNABORTED') return true;
  if (err && 'crossDomain' in err) return true;
  return false;
};

},{}],139:[function(require,module,exports){
'use strict';

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.type = function(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

exports.params = function(str){
  return str.split(/ *; */).reduce(function(obj, str){
    var parts = str.split(/ *= */);
    var key = parts.shift();
    var val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Parse Link header fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

exports.parseLinks = function(str){
  return str.split(/ *, */).reduce(function(obj, str){
    var parts = str.split(/ *; */);
    var url = parts[0].slice(1, -1);
    var rel = parts[1].split(/ *= */)[1].slice(1, -1);
    obj[rel] = url;
    return obj;
  }, {});
};

/**
 * Strip content related fields from `header`.
 *
 * @param {Object} header
 * @return {Object} header
 * @api private
 */

exports.cleanHeader = function(header, shouldStripCookie){
  delete header['content-type'];
  delete header['content-length'];
  delete header['transfer-encoding'];
  delete header['host'];
  if (shouldStripCookie) {
    delete header['cookie'];
  }
  return header;
};

},{}]},{},[8]);
