# Napoleon
A JavaScript routing and HTML5 history library.

## Routing
Routes are stored in a tree structure for fast insertion and lookup. Napoleon supports the GET, POST, PUT, and DELETE methods.

###Adding routes
```mount(METHOD, PATH, HANDLER)```
* **method**: GET|POST|PUT|DELETE
* **path**: URL path to match
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
router.route('GET', url);