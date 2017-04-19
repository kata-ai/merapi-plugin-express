"use strict";

const merapi = require("@yesboss/merapi");
const { async, Component } = require("@yesboss/merapi");
const chai = require("chai");
const { expect } = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);

describe("Merapi Plugin: Express", () => {

    let container;
    let app;

    before(async(function* (done) {
        container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                components: { "app": { type: "express" } },
                main: "con",
                app: {
                    routes: {
                        "/": ["con.access", {
                            "GET": "con.get",
                            "/post": {
                                "POST": "con.post"
                            }
                        }],
                        "GET /test": "con.getTest"
                    }
                }
            }
        });

        container.registerPlugin("express", require("../index.js")(container));
        container.register("con", class Con extends Component {
            constructor() { super(); }

            start() { }

            get(req, res) { res.send("hello"); }
            post(req, res) { res.send("post"); }
            getTest(req, res) { res.send("test"); }

            access(req, res, next) {
                let token = req.query.token;
                if (token == "access")
                    next();
                else
                    res.status(401).end("Unauthorized");
            }
        });

        container.start();
        app = yield container.resolve("app");
        done;
    }));

    it("should get app resolved", () => {
        expect(app).to.exist;
    });

    it("should get 401 status code if no token", () => {
        chai.request(app).get("/").end((err, res) => {
            expect(res.status).to.equal(401);
        });

        chai.request(app).get("/test").end((err, res) => {
            expect(res.status).to.equal(401);
        });

        chai.request(app).post("/post").end((err, res) => {
            expect(res.status).to.equal(401);
        });
    });

    it("should get 200 status code if there's a token", () => {
        chai.request(app).get("/").query({ token: "access" }).end((err, res) => {
            expect(res.status).to.equal(200);
        });

        chai.request(app).get("/test").query({ token: "access" }).end((err, res) => {
            expect(res.status).to.equal(200);
        });

        chai.request(app).post("/post").query({ token: "access" }).end((err, res) => {
            expect(res.status).to.equal(200);
        });
    });
});