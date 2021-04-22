import send from '@polka/send'

// Fail after X queries
let failAfter = 0
// Progress
let i = failAfter

export function get(req, res, next) {
  send(res, 200, i-- > 0 ? 'progress' : 'error')
}

export function post(req, res, next) {
  // Reset progress
  i = failAfter
  send(res)
}
