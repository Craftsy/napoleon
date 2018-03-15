# Napoleon

An isomorphic JavaScript routing and HTML5 history library.

## Quick Start

```javascript
const Napoleon = require('napoleon');
const router = new Napoleon.Router();
router.mount({
    name: 'userprofile',
    method: 'GET',
    url: '/user/{userId}',
    handler: () => {
        console.log('Routed to user profile');
    }
});

router.route('GET', '/user/15'); // calls the handler above, logging "Routed to user profile" to console
```

## Routing
Routes are stored in a tree structure for fast insertion and lookup.

### Adding routes
`mount({method = 'GET', url, handler, name})`
* **method**: GET|POST|PUT|DELETE|etc - case insensitive, defaults to GET
* **url**: URL path to match, named variable parameters are identified by brackets: `/user/{userId}`
* **handler**: function which is called when the path is matched
    * **parameters**: key/value object with parameters pulled from the route and querystring
    * **data**: an argument that is passed through to the handler by the `route` method

URLs can be parameterized by wrapping one of the path segments in `{}` brackets. For example, when matching a route `/user/{userId}` anything in the segment following `/user/` will be extracted into a `userId` value. Star characters can be used as a match-all: `/users/{userId}/*`

```javascript
let router = new Napoleon.Router();
router.mount({
    name: 'userprofile',
    method: 'GET',
    url: '/user/{userId}',
    handler: parameters => {
        const {userId} = parameters;
        console.log(`user profile was called for user ${userId}`);
    }
});
```

### Calling route handlers
Call `route` to trigger a route handler for a given path.
 
```javascript
router.route('GET', url);
```

### Retrieving route declaration object
You can retrieve the route object used when a route was mounted by calling `matchRoute`

```javascript
const route = router.matchRoute('GET', url);
```

### Development
- `npm install` install packages
- `npm test` will build napoleon, build tests, and run tests
- `npm run build` will build napoleon
