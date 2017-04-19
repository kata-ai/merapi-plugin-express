"use strict";

const { async, Component } = require("@yesboss/merapi");
const merapi = require("@yesboss/merapi");
const getfn = require("../lib/getfn");
const { expect } = require("chai");

describe("getfn", () => {

    let com, fn;

    beforeEach((async(function* () {
        let container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                main: "com"
            }
        });

        container.register("com", class Com extends Component {
            constructor() { super(); }

            start() { }

            method(req) {
                let y = 0;
                if (req) { let x = req.args; for (let i in x) y += x[i]; }
                return y;
            }

        });

        container.start();

        com = yield container.resolve("com");
        let injector = yield container.resolve("injector");
        let getFn = getfn(injector);
        fn = yield getFn("com.method");
    })));

    it("should resolve function", () => {
        expect(typeof fn).to.equal("function");
    });

    it("should return the correct function", () => {
        expect(fn({ params: {}, args: {} })).to.equal(com.method());
    });

    it("should return function with merged args and params", () => {
        let x = fn({ params: { a: 1 }, args: { b: 2 } });
        let y = com.method({ args: { a: 1, b: 2 } });
        expect(x).to.equal(y);
    });
});