"use strict";

const { typeCheck } = require("type-check");
const Router = require("express").Router;
const getfn = require("./getfn");
const async = require("merapi/async");

const createRouter = async(function* (injector, routes, mergeParams) {

    let router = Router({ mergeParams });

    let getFn = getfn(injector);

    if (typeCheck("Array", routes)) {
        for (let i = 0; i < routes.length; i++) {
            let route = routes[i];
            if (typeCheck("String", route)) {
                router.use(yield getFn(route));
            } else if (typeCheck("Object", route)) {
                router.use("/", yield createRouter(injector, route, mergeParams));
            }
        }

        return router;
    }

    if (typeCheck("Object", routes)) {
        for (let i in routes) {
            let [verb, path] = i.split(/\s+/);
            let route = routes[i];
            switch (verb) {
                case "GET":
                case "POST":
                case "PUT":
                case "DELETE":
                    if (path) {
                        if (typeCheck("String", route))
                            router[verb.toLowerCase()](path, yield getFn(route));
                        else
                            router[verb.toLowerCase()](path, yield createRouter(injector, route, mergeParams));
                    } else {
                        if (typeCheck("String", route))
                            router[verb.toLowerCase()]("/", yield getFn(route));
                        else
                            router[verb.toLowerCase()]("/", yield createRouter(injector, route, mergeParams));
                    }
                    break;
                default:
                    if (typeCheck("String", route))
                        router.use(verb, yield getFn(route));
                    else {
                        let routeFunc = yield createRouter(injector, route, mergeParams);
                        router.use(verb, function (req, res, next) {
                            req.args = Object.assign({}, req.params, req.args);
                            routeFunc(req, res, next);
                        });
                    }
            }
        }
        return router;
    }

    if (typeCheck("String", routes)) {
        router.use(yield getFn(routes));
    }

    return router;
});

module.exports = createRouter;