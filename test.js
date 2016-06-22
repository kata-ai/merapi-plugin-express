"use strict";

const merapi = require("@yesboss/merapi");
const Component = require("@yesboss/merapi/component");

let container = merapi({
    basepath: __dirname,
    config: {
        name: "test",
        version: "1.0.0",

        components: {
            "app": {type:"express"}
        },

        main: "con",

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
});

container.registerPlugin("express@yesboss", require("./index.js")(container));

container.register("con", class Con extends Component {
    constructor(logger) {
        super();
        this.logger = logger;
    }
    get(req, res) {
        res.send("hello");
    }
    post(req, res) {
        res.send("post");
    }
    getTest(req, res) {
        res.send("test");
    }
    start() {
        this.logger.info("start");
    }
    access(req, res, next) {
        let token = req.query.token;
        if (token == "access")
            next();
        else
            res.status(401).end("Unauthorized");
    }
});

container.start().catch(function(e){
    console.error(e);
});
