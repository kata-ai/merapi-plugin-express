"use strict";

const async = require("@yesboss/merapi/async");

module.exports = function (merapi) {
    return async(function* (str) {
        let [comName, fn] = str.split(".");
        let com = yield merapi.resolve(comName);
        if (com && com[fn]) {
            let func = com[fn].bind(com);
            return function (req, res, next) {
                req.args = Object.assign({}, req.params, req.args);
                return func(req, res, next);
            };
        }
        throw new Error(`Cannot find function '${fn}' of component '${comName}'`);
    });
};