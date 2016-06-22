"use strict";

const {typeCheck} = require("type-check");
const Router = require("express").Router;
const getfn = require("./getfn");
const async = require("@yesboss/merapi/async");

const createRouter = async(function*(injector, routes) {

    let router = Router();

    let getFn = getfn(injector);
    
    if (typeCheck("Array", routes)) {
        for (let i=0; i<routes.length; i++) {
            let route = routes[i];
            if (typeCheck("String", route)) {
                router.use(yield getFn(route));
            } else if(typeCheck("Object", route)) {
                router.use("/", yield createRouter(injector, route));
            }
        }

        return router;
    }
    
    if (typeCheck("Object", routes)) {
        for (let i in routes) {
            let [verb, path] = i.split(/\s+/);
            let route = routes[i];
            switch(verb) {
            case "GET":
            case "POST":
            case "PUT":
            case "DELETE":
                if (path) {
                    if (typeCheck("String", route))
                        router[verb.toLowerCase()](path, yield getFn(route));
                    else
                        router[verb.toLowerCase()](path, yield createRouter(injector, route));
                } else {
                    if (typeCheck("String", route))
                        router[verb.toLowerCase()]("/", yield getFn(route));
                    else
                        router[verb.toLowerCase()]("/", yield createRouter(injector, route));
                }
                break;
            default:
                if (typeCheck("String", route))
                    router.use(verb, yield getFn(route));
                else
                    router.use(verb, yield createRouter(injector, route));
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