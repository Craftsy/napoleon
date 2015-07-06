(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.Napoleon = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, '__esModule', {
        value: true
    });

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

    var URLStructure = (function () {
        function URLStructure(url) {
            var _this = this;

            _classCallCheck(this, URLStructure);

            // remove any protocol/host/port
            var hostMatch = url.match(/.*?\/\/.*?\//);
            var host = hostMatch ? hostMatch[0] : '/';
            url = url.replace(host, '/');

            var _url$match = url.match(/(.*?)($|\?(.*))/);

            var path = _url$match[1];
            var querystring = _url$match[3];

            this.url = url;

            // find path components
            this.components = path.split('/').filter(function (component) {
                return component.length > 0;
            });

            // parse querystring
            this.querystring = {};
            if (querystring != null) {
                querystring.split('&').forEach(function (keyValue) {
                    var _keyValue$split = keyValue.split('=');

                    var key = _keyValue$split[0];
                    var value = _keyValue$split[1];

                    _this.querystring[key] = decodeURIComponent(value);
                });
            }
        }

        URLStructure.getComponentKey = function getComponentKey(component) {
            var componentKey = null;
            if (component.charAt(0) === '{' && component.charAt(component.length - 1) === '}') {
                componentKey = component.slice(1, -1);
            }
            return componentKey;
        };

        URLStructure.prototype.applyState = function applyState(state) {
            // build path
            var componentKeys = [];
            var path = this.components.reduce(function (url, component) {
                var componentKey = URLStructure.getComponentKey(component);
                componentKeys.push(componentKey);
                if (componentKey != null) {
                    var componentValue = state[componentKey];
                    if (componentValue != null) {
                        url += '/' + componentValue;
                    }
                } else {
                    url += '/' + component;
                }

                return url;
            }, '');

            // build querystring
            var queryParams = [];
            var stateKeys = Object.keys(state);
            for (var i = 0; i < stateKeys.length; i++) {
                var key = stateKeys[i];
                if (componentKeys.indexOf(key) === -1) {
                    // ensure this key wasn't used in the path
                    var value = state[key];
                    queryParams.push(key + '=' + encodeURIComponent(value));
                }
            }
            if (queryParams.length > 0) {
                path += '?' + queryParams.join('&');
            }

            return path;
        };

        URLStructure.prototype.extractParameters = function extractParameters(url) {
            var urlStructure = new URLStructure(url);
            var parameters = {};

            // match path parameters
            this.components.forEach(function (component, idx) {
                var componentKey = URLStructure.getComponentKey(component);
                if (componentKey != null) {
                    parameters[componentKey] = urlStructure.components[idx];
                }
            });

            // add querystring parameters
            var querystringKeys = Object.keys(urlStructure.querystring);
            querystringKeys.forEach(function (key) {
                // Don't overwrite a value we already identified
                if (!parameters.hasOwnProperty(key)) {
                    var value = urlStructure.querystring[key];
                    parameters[key] = value;
                }
            });

            return parameters;
        };

        return URLStructure;
    })();

    exports.URLStructure = URLStructure;

    var DYNAMIC_ROUTE_KEY = '?dynamic?';

    var TreeRoute = (function () {
        function TreeRoute() {
            _classCallCheck(this, TreeRoute);

            this.leaf = null;
            this.children = {};
        }

        TreeRoute.prototype.addRoute = function addRoute(handler, urlStructure) {
            var componentIndex = arguments[2] === undefined ? 0 : arguments[2];

            var component = urlStructure.components[componentIndex];

            if (component == null) {
                // we've reached the end of this route's path
                if (this.leaf == null) {
                    // there's no leaf node here, make this one it
                    this.leaf = { urlStructure: urlStructure, handler: handler };
                } else {
                    // there is already a matching route here, throw an error
                    throw new Error('Route ' + urlStructure.path + ' already mounted: ' + this.leaf.urlStructure.path);
                }
            } else {
                var componentKey = URLStructure.getComponentKey(component);
                var childKey = componentKey == null ? component : DYNAMIC_ROUTE_KEY;
                if (!this.children.hasOwnProperty(childKey)) {
                    // child node doesn't exist, create it
                    this.children[childKey] = new TreeRoute();
                }
                this.children[childKey].addRoute(handler, urlStructure, componentIndex + 1);
            }
        };

        TreeRoute.prototype.matchPath = function matchPath(urlStructure) {
            var componentIndex = arguments[1] === undefined ? 0 : arguments[1];

            var match = null;

            if (componentIndex === urlStructure.components.length) {
                // We've reached the end, cool, is there a route here?
                match = this.leaf;
            } else {
                // Not at the end of the path yet!
                var component = urlStructure.components[componentIndex];

                if (this.children.hasOwnProperty(component)) {
                    // Yay, there's an exact match at this level
                    match = this.children[component].matchPath(urlStructure, componentIndex + 1);
                }

                if (match == null && this.children.hasOwnProperty(DYNAMIC_ROUTE_KEY)) {
                    // There wasn't a more-exact route that matched so maybe it's dynamic?
                    match = this.children[DYNAMIC_ROUTE_KEY].matchPath(urlStructure, componentIndex + 1);
                }
            }

            return match;
        };

        return TreeRoute;
    })();

    var Router = (function () {
        function Router() {
            _classCallCheck(this, Router);

            this.trees = {
                GET: new TreeRoute(),
                POST: new TreeRoute(),
                PUT: new TreeRoute(),
                DELETE: new TreeRoute()
            };
        }

        Router.prototype.mount = function mount(method, path, handler) {
            if (method !== 'GET' && method !== 'POST' && method !== 'PUT' && method !== 'DELETE') {
                throw new Error('Route method must be either GET, POST, PUT, or DELETE');
            }

            var urlStructure = new URLStructure(path);
            this.trees[method].addRoute(handler, urlStructure);
        };

        Router.prototype.matchRoute = function matchRoute(method, url) {
            if (method !== 'GET' && method !== 'POST') {
                throw new Error('Route method must be either GET or POST');
            }

            var urlStructure = new URLStructure(url);
            return this.trees[method].matchPath(urlStructure);
        };

        Router.prototype.route = function route(method, url) {
            var match = this.matchRoute(method, url);

            if (match != null) {
                var parameters = match.urlStructure.extractParameters(url);
                match.handler(url, parameters);
            }
        };

        return Router;
    })();

    exports.Router = Router;

    var Napoleon = (function () {
        var _pageUrlDefinition = null;
        var _onStateChange = null;

        var pageState = {
            isNapoleon: true,
            url: {},
            extras: {}
        };

        var handleStateChange = function handleStateChange() {
            // If the browser's state isn't from Napoleon then parse the url and use it for state
            if (window.history.state == null || window.history.state.isNapoleon !== true) {
                // Existing state isn't from Napoleon, set it from the URL
                pageState = {
                    isNapoleon: true,
                    url: _pageUrlDefinition.extractParameters(location.href),
                    extras: {}
                };
            } else {
                // Existing state is from Napoleon, just use it
                pageState = window.history.state;
            }

            var url = pageState.url;
            var extras = pageState.extras;

            _onStateChange({ url: url, extras: extras });
        };

        return {
            attach: function attach(config) {
                var url = config.url;
                var onStateChange = config.onStateChange;

                if (url == null) {
                    throw new Error('Missing `url` in Napoleon config');
                }
                if (onStateChange == null) {
                    throw new Error('Missing `onStateChange` in Napoleon config');
                }

                _pageUrlDefinition = new URLStructure(url);
                _onStateChange = onStateChange;

                window.addEventListener('popstate', handleStateChange);

                handleStateChange();
            },

            modifyState: function modifyState(config) {
                var urlParams = config.url;
                var extraParams = config.extras;
                var replace = config.replace;

                if (urlParams != null) {
                    for (var key in urlParams) {
                        if (urlParams.hasOwnProperty(key)) {
                            var value = urlParams[key];
                            if (value == null) {
                                delete pageState.url[key];
                            } else {
                                pageState.url[key] = value;
                            }
                        }
                    }
                }

                if (extraParams != null) {
                    for (var key in extraParams) {
                        if (extraParams.hasOwnProperty(key)) {
                            var value = extraParams[key];
                            if (value == null) {
                                delete pageState.extras[key];
                            } else {
                                pageState.extras[key] = value;
                            }
                        }
                    }
                }

                if (replace === true) {
                    window.history.replaceState(pageState, '', _pageUrlDefinition.applyState(pageState.url));
                } else {
                    window.history.pushState(pageState, '', _pageUrlDefinition.applyState(pageState.url));
                }

                handleStateChange();
            }
        };
    })(undefined);

    exports['default'] = Napoleon;
});