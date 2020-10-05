"use strict";

const xssDetection = function (req, res, next) {
  const keys = getJsonKeys(req.body)

  for (const key of keys) {
    const value = eval('req.body' + key)
    if (typeof value == 'string') {
      if (isXssAttack(value)) {
        res.json({ message: 'XSS Attack Detection !' });
        return
      }
    }
  }

  next()
}

function getJsonKeys(body) {
  const keys = [];

  function f(o, s) {
    if (!o) {
      return
    }

    [o] == o || Object.keys(o).map(k => f(o[k], k = s ? (isNumeric(k) ? `${s}[${k}]` : `${s}.${k}`) : (isNumeric(k) ? `[${k}]` : `.${k}`), keys.push(k)))
  }

  f(body)

  return keys
}

function isNumeric(value) {
  return /^-?\d+$/.test(value);
}

function isXssAttack(value) {
  return /\<(|\s+)script(|\s+)\>|\<\/(|\s+)script(|\s+)\>/g.test(value);
}

module.exports = xssDetection