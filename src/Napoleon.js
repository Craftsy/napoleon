export class URLStructure {
    constructor(path) {
        this.path = path;
        this.components = this.path.split('/').filter((component => component.length > 0));
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
}

class TreeRoute {
    constructor() {
        this.urlStructure = null;
        this.children = {};
    }

    addRoute(urlStructure, componentIndex = 0) {
        let component = urlStructure.components[componentIndex];

        if (component == null) {
            // we've reached the end of this route's path
            if (this.urlStructure == null) {
                // there's no leaf node here, make this one it
                this.urlStructure = urlStructure;
            } else {
                // there is already a matching route here, throw an error
                throw new Error(`Route ${urlStructure.path} already mounted: ${this.urlStructure.path}`);
            }
        } else {
            let componentKey = URLStructure.getComponentKey(component);
            let childKey = componentKey == null ? component : 'dynamic';
            if (!this.children.hasOwnProperty(childKey)) {
                // child node doesn't exist, create it
                this.children[childKey] = new TreeRoute();
            }
            this.children[childKey].addRoute(urlStructure, componentIndex+1);
        }
    }
}

export class Router {
    constructor() {
        this.trees = {
            GET: new TreeRoute(),
            POST: new TreeRoute()
        };
    }

    mount(method, path) {
        if (method !== 'GET' && method !== 'POST') {
            throw new Error('Route method must be either GET or POST');
        }

        let urlStructure = new URLStructure(path);

        this.trees[method].addRoute(urlStructure);

        console.log( urlStructure.applyState({userId: 614307}) );
    }
}

let Napoleon = {

};

export default Napoleon;