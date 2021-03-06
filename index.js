"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const router = require("./lib/router");
const getfn = require("./lib/getfn");
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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
                let swaggerEnable = (cfg.swagger && cfg.swagger.enable) ? cfg.swagger.enable : false
                if (swaggerEnable) {
                    let swaggerPath = (cfg.swagger.path != '' && cfg.swagger.path != '/') ? cfg.swagger.path : '/api-docs';
                    let swaggerInfo = cfg.swagger.info || {
                        title: 'API Documentation',
                        version: '1.0.0',
                    };
                    let swaggerSpec = swaggerJsdoc({
                        definition: {
                          openapi: '3.0.0',
                          info: swaggerInfo,
                        },
                        apis: [
                            './lib/components/controllers/*_controller.js',
                            './lib/components/managers/*_manager.js',
                            './lib/components/swagger/*.yaml'
                        ],
                    });
                    app.use(swaggerPath, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
                }

                if (bodyParserOptions.verify) {
                    bodyParserOptions.verify = yield getFn(bodyParserOptions.verify);
                }

                app.use(bodyParser.json(bodyParserOptions));
                app.use(bodyParser.urlencoded(Object.assign({ extended: true }, bodyParserOptions)));
                // app.use(bodyParser.raw(Object.assign({ type: "*/*" }, bodyParserOptions)));

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
                    app.__listen = app.listen(port, host);
                    app.__logger = logger;
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
        },

        *onStop() {
            for (let i = 0; i < this.apps.length; i++) {
                let app = yield merapi.resolve(this.apps[i]);
                if (app.__listen) {
                    app.__listen.close(() => {
                        app.__logger.info("Shutting down express plugin...");
                    })
                }
            }
        }
    };
};
