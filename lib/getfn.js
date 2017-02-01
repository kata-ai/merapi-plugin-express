"use strict";

const async = require("@yesboss/merapi/async");

module.exports = function (merapi) {
    return async(function* (str) {
        let [comName, fn] = str.split(".");
        let com = yield merapi.resolve(comName);
        if (com && com[fn])
            return com[fn].bind(com);
        throw new Error(`Cannot find function '${fn}' of component '${comName}'`);
    });
};