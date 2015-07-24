# Napoleon

## This is still in active development and not quite ready for real use

An isomorphic JavaScript routing and HTML5 history library.

- quick use case & code example -
- examples directory -

## Routing
Routes are stored in a tree structure for fast insertion and lookup.

- document that all parameters come through as strings -

###Adding routes
`mount(METHOD, PATH, HANDLER)`
* **method**: GET|POST|PUT|DELETE|etc - case insensitive
* **path**: URL path to match - needs example
* **handler**: function which is called when the path is matched
    * **url**: url that matched the route
    * **parameters**: key/value object with parameters pulled from the route and querystring

```javascript
let router = new Napoleon.Router();
router.mount(
    'GET',
    '/user/{userId}',
    function(url, parameters) {
        console.log(url, 'was called with parameters', parameters);
    }
);
```

###Calling routes
- needs better documentation -
router.route('GET', url); - this will automatically fire the route hander
- document router.matchRoute

## HTML5 History
Napoleon also provides a way to manage browsers' HTML5 history through state management.
- browser support, and this is browser only -
- basic example use case -
- create data flow diagram -
- why is this separate from the routing library -

###State
- don't introduce `extras` here, move that down after the basic use of `url` params is familiar
Napoleon's concept of state has two parts: `url` and `extras`. The `url` state matches the browser's URL, any values
defined in the url path are extracted and combined with querystring parameters. e.g. a url definition of `/{category}`
and actual url `/turtles?mutants=true` will yield the url state

```javascript
{
    category: "turtles",
    mutants: "true"
}
```

The `extras` state can be given key/values which will not be represented in the URL. These are hidden from the user and
can be used to hold additional state information for the page.

###Attaching
```javascript
Napoleon.attach({
    url: '/{category}/{section}',
    onStateChange: function(state) {
        console.log('new state', state);
    }
});
```

The `onStateChange` function is called every time there is a new state, which happens at three points:
* When Napoleon attaches - the state either already exists (page reload) or it's generated from the URL
* The user navigates Forward or Backward through the browser's history
* The page state is modified through Napoleon's API

###Modifying State
- document that this fires onStateChange callback -
Napoleon has a `modifyState` method which sets the `url` and `extras` states. Both of the configuration objects are optional.

```javascript
Napoleon.modifyState({
    url: {category: 'turtles', mutants: true},
    extras: {}
});
```

There is a third configuration that can be set: `replace`. Setting `replace` to true will replace the existing browser
history item instead of creating a new one.
- give example -