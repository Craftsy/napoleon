export class URLStructure {
    constructor(url) {
        let {1: path, 3: querystring} = url.match(/(.*?)($|\?(.*))/);

        this.url = url;

        // find path components
        this.components = path.split('/').filter((component => component.length > 0));

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

    static getComponentKey(component) {
        let componentKey = null;
        if (component.charAt(0) === '{' && component.charAt(component.length - 1) === '}') {
            componentKey = component.slice(1, -1);
        }
        return componentKey;
    }

    applyState(state) {
        // build path
        let componentKeys = [];
        let path = this.components.reduce(
            (url, component) => {
                let componentKey = URLStructure.getComponentKey(component);
                componentKeys.push(componentKey);
                if (componentKey != null) {
                    let componentValue = state[componentKey];
                    if (componentValue != null) {
                        url += `/${componentValue}`;
                    }
                } else {
                    url += `/${component}`;
                }

                return url;
            },
            ''
        );

        // build querystring
        let queryParams = [];
        let stateKeys = Object.keys(state);
        for (let i = 0; i < stateKeys.length; i++) {
            let key = stateKeys[i];
            if (componentKeys.indexOf(key) === -1) { // ensure this key wasn't used in the path
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
        this.components.forEach(
            (component, idx) => {
                let componentKey = URLStructure.getComponentKey(component);
                if (componentKey != null) {
                    parameters[componentKey] = urlStructure.components[idx];
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
}

const DYNAMIC_ROUTE_KEY = '?dynamic?';

class TreeRoute {
    constructor() {
        this.leaf = null;
        this.children = {};
    }

    addRoute(handler, urlStructure, componentIndex = 0) {
        let component = urlStructure.components[componentIndex];

        if (component == null) {
            // we've reached the end of this route's path
            if (this.leaf == null) {
                // there's no leaf node here, make this one it
                this.leaf = {urlStructure, handler};
            } else {
                // there is already a matching route here, throw an error
                throw new Error(`Route ${urlStructure.path} already mounted: ${this.leaf.urlStructure.path}`);
            }
        } else {
            let componentKey = URLStructure.getComponentKey(component);
            let childKey = componentKey == null ? component : DYNAMIC_ROUTE_KEY;
            if (!this.children.hasOwnProperty(childKey)) {
                // child node doesn't exist, create it
                this.children[childKey] = new TreeRoute();
            }
            this.children[childKey].addRoute(handler, urlStructure, componentIndex+1);
        }
    }

    matchPath(urlStructure, componentIndex = 0) {
        let match = null;

        if (componentIndex === urlStructure.components.length) {
            // We've reached the end, cool, is there a route here?
            match = this.leaf;
        } else {
            // Not at the end of the path yet!
            let component = urlStructure.components[componentIndex];

            if (this.children.hasOwnProperty(component)) {
                // Yay, there's an exact match at this level
                match = this.children[component].matchPath(urlStructure, componentIndex+1);
            }

            if (match == null && this.children.hasOwnProperty(DYNAMIC_ROUTE_KEY)) {
                // There wasn't a more-exact route that matched so maybe it's dynamic?
                match = this.children[DYNAMIC_ROUTE_KEY].matchPath(urlStructure, componentIndex+1);
            }
        }

        return match;
    }
}

export class Router {
    constructor() {
        this.trees = {
            GET: new TreeRoute(),
            POST: new TreeRoute(),
            PUT: new TreeRoute(),
            DELETE: new TreeRoute()
        };
    }

    mount(method, path, handler) {
        if (method !== 'GET' && method !== 'POST' && method !== 'PUT' && method !== 'DELETE') {
            throw new Error('Route method must be either GET, POST, PUT, or DELETE');
        }

        let urlStructure = new URLStructure(path);
        this.trees[method].addRoute(handler, urlStructure);
    }

    matchRoute(method, url) {
        if (method !== 'GET' && method !== 'POST') {
            throw new Error('Route method must be either GET or POST');
        }

        let urlStructure = new URLStructure(url);
        return this.trees[method].matchPath(urlStructure);
    }

    route(method, url) {
        let match = this.matchRoute(method, url);

        if (match != null) {
            let parameters = match.urlStructure.extractParameters(url);
            match.handler(url, parameters);
        }
    }
}

let Napoleon = {
    
};

export default Napoleon;