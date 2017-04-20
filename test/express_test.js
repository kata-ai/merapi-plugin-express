"use strict";

const merapi = require("@yesboss/merapi");
const { async, Component } = require("@yesboss/merapi");
const chai = require("chai");
const { expect, should } = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);

describe("Merapi Plugin: Express", () => {

    it("should get route array resolved", async(function* (done) {
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
                app: { routes }
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

        container.initialize();
        let app = yield container.resolve("app");
        expect(app).to.exist;
        chai.request(app).get("/get").end((e, r) => { expect(r.status).to.equal(401); });
        chai.request(app).get("/get").query({ token: "access" }).end((e, r) => { expect(r.status).to.equal(200); });
        done;
    }));

    it("should get route object resolved", async(function* (done) {
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
                app: { routes }
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

        container.initialize();
        let app = yield container.resolve("app");
        expect(app).to.exist;
        chai.request(app).get("/get").end((e, r) => { expect(r.status).to.equal(200); });
        chai.request(app).get("/get-second").end((e, r) => { expect(r.status).to.equal(200); });
        chai.request(app).get("/").end((e, r) => { expect(r.status).to.equal(200); });
        chai.request(app).post("/").end((e, r) => { expect(r.status).to.equal(200); });
        chai.request(app).get("/what").end((e, r) => { expect(r.status).to.equal(200); });
        chai.request(app).get("/get-third").end((e, r) => { expect(r.status).to.equal(200); });
        done;
    }));

    it("should get route string resolved", async(function* (done) {
        let routes = "com.get";

        let container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                components: { "app": { type: "express" } },
                main: "com",
                app: { routes }
            }
        });

        container.registerPlugin("express", require("../index.js")(container));
        container.register("com", class Com extends Component {
            constructor() { super(); }
            start() { }
            get(req, res) { res.send(); }
        });

        container.start();
        let app = yield container.resolve("app");
        expect(app).to.exist;
        chai.request(app).get("/").end((e, r) => { expect(r.status).to.equal(200); });
        done;
    }));
});