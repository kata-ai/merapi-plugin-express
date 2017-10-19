"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const router = require("./lib/router");
const getfn = require("./lib/getfn");

module.exports = function (merapi) {

    return {
        apps: [],

        typeExpress(name, opt) {
            this.apps.push(name);
            return function* (config, injector, logger) {
                let app = express();

                let getFn = getfn(injector);

                opt.config = opt.config || "app";
                let cfg = config.default(opt.config, {});

                let port = cfg.port || 8080;
                let host = cfg.host || "localhost";
                let routerOptions = Object.assign({}, { mergeParams: true }, cfg.router);
                let bodyParserOptions = cfg.bodyParser || {};
                let middleware = cfg.middleware || [];
                let routes = cfg.routes || {};

                app.use(bodyParser.json(bodyParserOptions));
                app.use(bodyParser.urlencoded({ extended: true }));

                let isRoutesInMiddleware = false;
                
                for (let i = 0; i < middleware.length; i++) {
                    if (middleware[i] === 'routes') {
                        app.use(yield router(injector, routes, routerOptions));
                        isRoutesInMiddleware = !isRoutesInMiddleware;
                    } else {
                        app.use(yield getFn(middleware[i]));
                    }
                }

                if (!isRoutesInMiddleware) app.use(yield router(injector, routes, routerOptions));

                app.start = function () {
                    app.listen(port, host);
                    logger.info(`Starting express on ${host}:${port}`);
                };
                return app;
            };
        },

        *onStart() {
            for (let i = 0; i < this.apps.length; i++) {
                let app = yield merapi.resolve(this.apps[i]);
                app.start();
            }
        }
    };
};