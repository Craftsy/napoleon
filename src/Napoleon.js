// @TODO Let routes be named so URLs can be created from routes
// @TODO Client-side routing, have router initialize from url and pick up changes
// @TODO add global events like `urlChanged` or `routeHandled`, aka a way to fire Optimizly after content changed

export class URLStructure {
    static isSegmentKey(segment) {
        return segment.charAt(0) === '{' && segment.charAt(segment.length - 1) === '}';
    }

    static getSegmentKey(segment) {
        let segmentKey = null;
        if (URLStructure.isSegmentKey(segment)) {
            segmentKey = segment.slice(1, -1);
        }
        return segmentKey;
    }

    static getPathname(url) {
        // remove any protocol/host/port
        let hostMatch = url.match(/^[^?]*?\/\/.*?\//);
        let host = hostMatch ? hostMatch[0] : '/';
        return url.replace(host, '/');
    }

    constructor(url) {
        url = URLStructure.getPathname(url);

        let {1: path, 3: querystring} = url.match(/(.*?)($|\?(.*))/);

        // find path segments
        this.segments = path.split('/').filter((segment => segment.length > 0));

        // parse querystring
        this.querystring = {};
        if (querystring != null) {
            querystring.split('&').forEach(
                (keyValue) => {
                    let {0: key, 1: value} = keyValue.split('=');
                    this.querystring[key] = decodeURIComponent(value);
                }
            );
        }
    }

    getUrlForState(state) {
        // build path
        let segmentKeys = [];
        let segments = this.segments
            .map(
                segment => {
                    let segmentKey = URLStructure.getSegmentKey(segment);
                    segmentKeys.push(segmentKey);
                    if (segmentKey != null) {
                        let segmentValue = state[segmentKey];
                        if (segmentValue != null) {
                            return segmentValue;
                        } else {
                            return null;
                        }
                    } else {
                        return segment;
                    }
                }
            )
            .filter(segment => segment != null);
        let path = `/${segments.join('/')}`;

        // build querystring
        let queryParams = [];
        let stateKeys = Object.keys(state);
        for (let i = 0; i < stateKeys.length; i++) {
            let key = stateKeys[i];
            if (segmentKeys.indexOf(key) === -1) { // ensure this key wasn't used in the path
                let value = state[key];
                queryParams.push(`${key}=${encodeURIComponent(value)}`);
            }
        }
        if (queryParams.length > 0) {
            path += `?${queryParams.join('&')}`;
        }

        return path;
    }

    extractParameters(url) {
        let urlStructure = new URLStructure(url);
        let parameters = {};

        // match path parameters
        this.segments.forEach(
            (segment, idx) => {
                let segmentKey = URLStructure.getSegmentKey(segment);
                if (segmentKey != null) {
                    // this is a named segment, get the value
                    parameters[segmentKey] = urlStructure.segments[idx];
                } else if (segment === '*') {
                    // this is a blat, return the rest of the url
                    parameters['blat'] = urlStructure.segments.slice(idx).join('/');
                }
            }
        );

        // add querystring parameters
        let querystringKeys = Object.keys(urlStructure.querystring);
        querystringKeys.forEach(
            (key) => {
                // Don't overwrite a value we already identified
                if (!parameters.hasOwnProperty(key)) {
                    let value = urlStructure.querystring[key];
                    parameters[key] = value;
                }
            }
        );

        return parameters;
    }

    toString() {
        // Builds the URL from segments & querystring
        let path = `/${this.segments.join('/')}`;
        let query = [];
        let queryString = '';

        for (let key of Object.keys(this.querystring)) {
            query.push(`key=${encodeURIComponent(this.querystring[key])}`);
        }
        if (query.length > 0) {
            queryString = `?${query.join('&')}`;
        }

        return `${path}${queryString}`;
    }
}

const DYNAMIC_ROUTE_KEY = '?dynamic?';
const BLAT_ROUTE_KEY = '?blat?';

export class TreeRoute {
    constructor() {
        this.leaf = null;
        this.children = {};
    }

    addRoute(handler, urlStructure, segmentIndex = 0) {
        let segment = urlStructure.segments[segmentIndex];

        if (segment == null) {
            // we've reached the end of this route's path
            if (this.leaf == null) {
                // there's no leaf node here, make this one it
                this.leaf = {urlStructure, handler};
            } else {
                // there is already a matching route here, throw an error
                throw new Error(`Route ${urlStructure} already mounted: ${this.leaf.urlStructure}`);
            }
        } else {
            let childKey;
            if (segment === '*') {
                // ackbar: It's a blat!
                // if the blat segment is not the last one throw an error
                if (segmentIndex < urlStructure.segments.length - 1) {
                    throw new Error(`Route ${urlStructure} cannot have path segments after the blat (*)`);
                }
                childKey = BLAT_ROUTE_KEY;
            } else {
                let segmentKey = URLStructure.getSegmentKey(segment);
                childKey = segmentKey == null ? segment : DYNAMIC_ROUTE_KEY;
            }

            if (!this.children.hasOwnProperty(childKey)) {
                // child node doesn't exist, create it
                this.children[childKey] = new TreeRoute();
            }
            this.children[childKey].addRoute(handler, urlStructure, segmentIndex+1);
        }
    }

    matchPath(urlStructure, segmentIndex = 0) {
        let match = null;

        if (segmentIndex === urlStructure.segments.length) {
            // We've reached the end, cool, is there a route here?
            match = this.leaf;

            if (match == null && segmentIndex === 0) {
                // this is an attempt to match `/` against a route, so make an exception if there's a blat child
                if (match == null && this.children.hasOwnProperty(BLAT_ROUTE_KEY)) {
                    match = this.children[BLAT_ROUTE_KEY].leaf;
                }
            }
        } else {
            // Not at the end of the path yet!
            let segment = urlStructure.segments[segmentIndex];

            if (this.children.hasOwnProperty(segment)) {
                // Yay, there's an exact match at this level
                match = this.children[segment].matchPath(urlStructure, segmentIndex+1);
            }

            if (match == null && this.children.hasOwnProperty(DYNAMIC_ROUTE_KEY)) {
                // There wasn't a more-exact route that matched so maybe it's dynamic?
                match = this.children[DYNAMIC_ROUTE_KEY].matchPath(urlStructure, segmentIndex+1);
            }

            if (match == null && this.children.hasOwnProperty(BLAT_ROUTE_KEY)) {
                // No exact match, no dynamic route, but there's a blat!
                match = this.children[BLAT_ROUTE_KEY].leaf;
            }
        }

        return match;
    }
}

export class Router {
    constructor() {
        this.namedRoutes = {};
        this.trees = {};
    }

    mount(config) {
        let {method = 'get', url, handler, name} = config;
        method = method.toLowerCase();

        let urlStructure = new URLStructure(url);

        // Add to the route tree
        if (this.trees[method] == null) {
            this.trees[method] = new TreeRoute();
        }
        this.trees[method].addRoute(handler, urlStructure);

        // If its named, add to the named routes
        if (name != null) {
            if (this.namedRoutes.hasOwnProperty(name)) {
                throw new Error(`Conflict for route name ${name}: ${url} / ${this.namedRoutes[name].url}`);
            }
            this.namedRoutes[name] = config;
        }

        return this;
    }

    matchRoute(method, url) {
        method = method.toLowerCase();
        let urlStructure = new URLStructure(url);
        let match = null;
        if (this.trees.hasOwnProperty(method)) {
            match = this.trees[method].matchPath(urlStructure);
        }
        return match;
    }

    route(method, url, data) {
        method = method.toLowerCase();
        let match = this.matchRoute(method, url);
        let parameters = null;

        if (match != null) {
            parameters = match.urlStructure.extractParameters(url);
            match.handler(parameters, data);
        }

        return parameters;
    }

    getNamedRoute(name) {
        return this.namedRoutes[name] || null;
    }
}

let Napoleon = (function(){
    let _pageUrlDefinition = null;
    let _onStateChange = null;

    let pageState = {
        isNapoleon: true,
        url: {},
        extras: {}
    };

    let handleStateChange = function() {
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

        let {url, extras} = pageState;
        // @TODO throw a warn if this call to _onStateChange modifies state
        _onStateChange({url, extras});
    };

    return {
        attach: function(config) {
            let {url, onStateChange} = config;

            if (url == null) {
                throw new Error('Missing `url` in Napoleon config');
            }
            if (onStateChange == null) {
                throw new Error('Missing `onStateChange` in Napoleon config');
            }

            _pageUrlDefinition = new URLStructure(url);
            _onStateChange = onStateChange;

            window.addEventListener('popstate', handleStateChange);

            // @TODO don't call state change on init, have a second callback
            handleStateChange();
        },

        modifyState: function(config) {
            let {url: urlParams, extras: extraParams, replace} = config;

            if (urlParams != null) {
                for (let key in urlParams) {
                    if (urlParams.hasOwnProperty(key)) {
                        let value = urlParams[key];
                        if (value == null) {
                            delete pageState.url[key];
                        } else {
                            pageState.url[key] = value;
                        }
                    }
                }
            }

            if (extraParams != null) {
                for (let key in extraParams) {
                    if (extraParams.hasOwnProperty(key)) {
                        let value = extraParams[key];
                        if (value == null) {
                            delete pageState.extras[key];
                        } else {
                            pageState.extras[key] = value;
                        }
                    }
                }
            }

            if (replace === true) {
                window.history.replaceState(pageState, '', _pageUrlDefinition.getUrlForState(pageState.url));
            } else {
                window.history.pushState(pageState, '', _pageUrlDefinition.getUrlForState(pageState.url));
            }

            handleStateChange();
        }
    }
})(this);

export default Napoleon;
