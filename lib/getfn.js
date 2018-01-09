"use strict";

const { async } = require("merapi");

module.exports = function (merapi) {
    return async(function* (str) {
        let [comName, fns] = str.split(".");
        let com = yield merapi.resolve(comName);

        let foundIndex = fns.search(/\(.*\)/);
        let fnName = fns;
        let params;

        if (foundIndex > -1) {
            fnName = fns.substring(0, foundIndex);
            params = fns.substring(foundIndex + 1, fns.length - 1);
            params = JSON.parse(`[${params}]`);
        }

        if (com && com[fnName]) {
            let func = Array.isArray(params) ? com[fnName].bind(com, ...params) : com[fnName].bind(com);
            if (func.length === 4) {
                return function (err, req, res, next) {
                    req.args = Object.assign({}, req.params, req.args);
                    return func(err, req, res, next);
                };
            } else {
                return function (req, res, next) {
                    req.args = Object.assign({}, req.params, req.args);
                    return func(req, res, next);
                };
            }
        }

        throw new Error(`Cannot find function '${fnName}' of component '${comName}'`);
    });
};
