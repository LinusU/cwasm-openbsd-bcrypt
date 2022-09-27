/* global WebAssembly */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const code = fs.readFileSync(path.join(__dirname, 'bcrypt.wasm'))
const wasmModule = new WebAssembly.Module(code)
const instance = new WebAssembly.Instance(wasmModule, {
  wasi_snapshot_preview1: {
    fd_close: () => { throw new Error('Unexpected call to fd_close') },
    fd_seek: () => { throw new Error('Unexpected call to fd_seek') },
    fd_write: () => { throw new Error('Unexpected call to fd_write') },

    random_get: (pointer, byteLength) => {
      crypto.randomFillSync(new Uint8Array(instance.exports.memory.buffer, pointer, byteLength))
    }
  }
})

function allocateString (data) {
  // Allocate memory to hand over the input data to WASM
  const pointer = instance.exports.malloc(data.byteLength + 1)
  const view = new Uint8Array(instance.exports.memory.buffer, pointer, data.byteLength + 1)

  // Copy input data into WASM readable memory
  view.set(data)
  view[data.byteLength] = 0

  return pointer
}

const OUTPUT_SIZE = 60
const SALT_SIZE = 29

exports.compareSync = function (password, hash) {
  if (typeof password !== 'string') throw new TypeError('password must be a string')
  if (typeof hash !== 'string') throw new TypeError('hash must be a string')

  const expected = Buffer.from(hash, 'utf8')

  const saltPointer = allocateString(expected)
  const passwordPointer = allocateString(Buffer.from(password, 'utf8'))
  const hashPointer = instance.exports.bcrypt(passwordPointer, saltPointer)

  // Free the input data in WASM land
  instance.exports.free(passwordPointer)
  instance.exports.free(saltPointer)

  if (hashPointer === 0) {
    throw new Error('Something went wrong')
  }

  const actual = Buffer.from(instance.exports.memory.buffer, hashPointer, OUTPUT_SIZE)

  return crypto.timingSafeEqual(actual, expected)
}

exports.genSaltSync = function (rounds) {
  if (typeof rounds !== 'number') throw new TypeError('rounds must be a number')

  const saltPointer = instance.exports.bcrypt_gensalt(rounds)

  return Buffer.from(instance.exports.memory.buffer, saltPointer, SALT_SIZE).toString('utf8')
}

exports.hashSync = function (password, rounds) {
  if (typeof password !== 'string') throw new TypeError('password must be a string')
  if (typeof rounds !== 'number') throw new TypeError('rounds must be a number')

  const saltPointer = instance.exports.bcrypt_gensalt(rounds)
  const passwordPointer = allocateString(Buffer.from(password, 'utf8'))
  const hashPointer = instance.exports.bcrypt(passwordPointer, saltPointer)

  // Free the input data in WASM land
  instance.exports.free(passwordPointer)

  if (hashPointer === 0) {
    throw new Error('Something went wrong')
  }

  return Buffer.from(instance.exports.memory.buffer, hashPointer, OUTPUT_SIZE).toString('utf8')
}
