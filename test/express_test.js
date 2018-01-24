"use strict";

const merapi = require("merapi");
const { async, Component } = require("merapi");
const request = require("supertest");

/* eslint-env node, mocha */
describe("Merapi Plugin: Express", () => {
    let port = 10000;

    afterEach(function () {
        port++;
    });

    it("should get route array resolved", async(function* () {
        let routes = [
            "com.access",
            { "GET /get": "com.get" }
        ];

        let container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                components: { "app": { type: "express" } },
                main: "com",
                app: { routes, port }
            }
        });

        container.registerPlugin("express", require("../index.js")(container));
        container.register("com", class Com extends Component {
            constructor() { super(); }
            start() { }
            get(req, res) { res.send(); }
            access(req, res, next) {
                let token = req.query.token;
                if (token == "access") next();
                else res.status(401).end("Unauthorized");
            }
        });

        yield container.initialize();
        let app = yield container.resolve("app");

        yield request(app).get("/get").expect(401);
        yield request(app).get("/get").query({ token: "access" }).expect(200);
    }));

    it("should get route object resolved", async(function* () {
        let routes = {
            "GET /get": "com.get",
            "GET /get-second": {
                "/": "com.get"
            },
            "GET": "com.get",
            "POST": {
                "/": "com.post"
            },
            "/what": "com.get",
            "/get-third": {
                "GET": "com.get"
            }
        };

        let container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                components: { "app": { type: "express" } },
                main: "com",
                app: { routes, port }
            }
        });

        container.registerPlugin("express", require("../index.js")(container));
        container.register("com", class Com extends Component {
            constructor() { super(); }
            start() { }
            get(req, res) { res.send(); }
            what(req, res) { res.send(); }
            post(req, res) { res.send(); }
        });

        yield container.initialize();
        let app = yield container.resolve("app");

        yield request(app).get("/get").expect(200);
        yield request(app).get("/get-second").expect(200);
        yield request(app).get("/").expect(200);
        yield request(app).post("/").expect(200);
        yield request(app).get("/what").expect(200);
        yield request(app).get("/get-third").expect(200);
    }));

    it("should get route string resolved", async(function* () {
        let routes = "com.get";

        let container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                components: { "app": { type: "express" } },
                main: "com",
                app: { routes, port }
            }
        });

        container.registerPlugin("express", require("../index.js")(container));
        container.register("com", class Com extends Component {
            constructor() { super(); }
            start() { }
            get(req, res) { res.send(); }
        });

        yield container.initialize();
        let app = yield container.resolve("app");

        yield request(app).get("/get").expect(200);
    }));

    it("should get resolved without routes", async(function* () {
        let container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                components: { "app": { type: "express" } },
                main: "com",
                app: { "middleware": ["com.access"] }
            }
        });

        container.registerPlugin("express", require("../index.js")(container));
        container.register("com", class Com extends Component {
            constructor() { super(); }
            start() { }
            access(req, res, next) {
                let token = req.query.token;
                if (token == "access") next();
                else res.status(401).end("Unauthorized");
            }
        });

        yield container.start();
        let app = yield container.resolve("app");

        yield request(app).get("/").expect(401);
    }));

    it("should get resolved with route array in middleware", async(function* () {
        let routes = [
            "com.access",
            { "GET /get": "com.get" }
        ];

        let container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                components: { "app": { type: "express" } },
                main: "com",
                app: { routes, port, "middleware": ["routes", "com.response"] }
            }
        });

        container.registerPlugin("express", require("../index.js")(container));
        container.register("com", class Com extends Component {
            constructor() { super(); }
            start() { }
            get(req, res, next) { next(); }
            access(req, res, next) {
                let token = req.query.token;
                if (token == "access") next();
                else res.status(401).end("Unauthorized");
            }
            response(req, res) { res.send(); }
        });

        yield container.start();
        let app = yield container.resolve("app");

        yield request(app).get("/get").expect(401);
        yield request(app).get("/get").query({ token: "access" }).expect(200);
    }));

    it("should get resolved with route string in middleware", async(function* () {
        let routes = "com.get";

        let container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                components: { "app": { type: "express" } },
                main: "com",
                app: { routes, port, "middleware": ["com.access", "routes", "com.response"] }
            }
        });

        container.registerPlugin("express", require("../index.js")(container));
        container.register("com", class Com extends Component {
            constructor() { super(); }
            start() { }
            get(req, res, next) { next(); }
            access(req, res, next) {
                let token = req.query.token;
                if (token == "access") next();
                else res.status(401).end("Unauthorized");
            }
            response(req, res) { res.send(); }
        });

        yield container.start();
        let app = yield container.resolve("app");

        yield request(app).get("/").expect(401);
        yield request(app).get("/").query({ token: "access" }).expect(200);
    }));

    it("should get resolved with route object in middleware", async(function* () {
        let routes = {
            "GET /get": "com.get",
            "GET /get-second": {
                "/": "com.get"
            },
            "GET": "com.get",
            "POST": {
                "/": "com.post"
            },
            "/what": "com.get",
            "/get-third": {
                "GET": "com.get"
            }
        };

        let container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                components: { "app": { type: "express" } },
                main: "com",
                app: { routes, port, "middleware": ["com.access", "routes", "com.response"] }
            }
        });

        container.registerPlugin("express", require("../index.js")(container));
        container.register("com", class Com extends Component {
            constructor() { super(); }
            start() { }
            get(req, res, next) { next(); }
            what(req, res, next) { next(); }
            post(req, res, next) { next(); }
            access(req, res, next) {
                let token = req.query.token;
                if (token == "access") next();
                else res.status(401).end("Unauthorized");
            }
            response(req, res) { res.send(); }
        });

        yield container.start();
        let app = yield container.resolve("app");

        yield request(app).get("/get").expect(401);
        yield request(app).get("/get-second").expect(401);
        yield request(app).get("/").expect(401);
        yield request(app).post("/").expect(401);
        yield request(app).get("/what").expect(401);
        yield request(app).get("/get-third").expect(401);

        yield request(app).get("/get").query({ token: "access" }).expect(200);
        yield request(app).get("/get-second").query({ token: "access" }).expect(200);
        yield request(app).get("/").query({ token: "access" }).expect(200);
        yield request(app).post("/").query({ token: "access" }).expect(200);
        yield request(app).get("/what").query({ token: "access" }).expect(200);
        yield request(app).get("/get-third").query({ token: "access" }).expect(200);
    }));

    it("should resolve methods in bodyParserOptions.verify ", async(function* () {
        let routes = {
            "POST": {
                "/": "com.post"
            }
        };

        let container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                components: { "app": { type: "express" } },
                main: "com",
                app: {
                    routes,
                    bodyParser: {
                        verify: "com.verify"
                    },
                    port
                }
            }
        });

        container.registerPlugin("express", require("../index.js")(container));
        container.register("com", class Com extends Component {
            constructor() { super(); }
            start() { }
            post(req, res) {
                let data = JSON.parse(req.rawBody.toString());
                res.json(data);
            }
            verify(req, res, buf) {
                req.rawBody = buf;
            }
        });

        yield container.initialize();
        let app = yield container.resolve("app");

        let bodyTest = {
            a: 123,
            b: "abc"
        };
        yield request(app).post("/").send(bodyTest).expect(bodyTest);
    }));
});