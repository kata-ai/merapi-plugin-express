"use strict";

const { async, Component } = require("@yesboss/merapi");
const merapi = require("@yesboss/merapi");
const getfn = require("../lib/getfn");
const { expect } = require("chai");

describe("getfn", () => {

    let com, fn, fnWithParams;

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

            methodWithArgs(a, b, c, req) {
                return a == 1 && b == 2 && c == 3 && req.args.a == 1;
            }
        });

        container.initialize();

        com = yield container.resolve("com");
        let injector = yield container.resolve("injector");
        let getFn = getfn(injector);
        fn = yield getFn("com.method");
        fnWithParams = yield getFn("com.methodWithArgs(1, 2, 3)");
    })));

    it("should resolve function", () => {
        expect(typeof fn).to.equal("function");
    });

    it("should return the correct function", () => {
        let real = com.method();

        let req = { params: {}, args: {} };
        let expectation = fn(req);

        expect(real).to.equal(expectation);
    });

    it("should return function with merged args and params", () => {
        let real = com.method({ args: { a: 1, b: 2 } });

        let req = { params: { a: 1 }, args: { b: 2 } };
        let expectation = fn(req);

        expect(real).to.equal(expectation);
    });

    it("should return function with bound args", () => {
        let real = com.methodWithArgs(1, 2, 3, { args: { a: 1 } });

        let req = { params: {}, args: { a: 1 } };
        let expectation = fnWithParams(req);

        expect(real).to.equal(expectation);
    });

    it("should throw error if no function found", async(function* () {
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
        });

        container.initialize();

        com = yield container.resolve("com");
        let injector = yield container.resolve("injector");
        let getFn = getfn(injector);

        let e;
        try { fn = yield getFn("com.method"); }
        catch (ex) { e = ex; }

        expect(e).to.be.an("error");
    }));
});