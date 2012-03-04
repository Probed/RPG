Server Side Stuff
-----------------

All requests are processed through [rpgApp.njs](https://github.com/Probed/RPG/blob/master/server/rpgApp.njs)

### rpgApp.njs

Starts the server listening the specified port. In the case of IISNode we need to use 'process.env.PORT'

# Imports

* [/server/User/User.njs](https://github.com/Probed/RPG/blob/master/server/User/User.njs) - User Creation / Session Management
* [/common/pages.js](https://github.com/Probed/RPG/blob/master/common/pages.js) - Client/Server viewable pages

# Exports

* RPG.App

## Request Handling

All requests begin at `onRequest` and are handled in the following order:

0. Attach an event handler to the request object to start receiving incoming data from post requests. Upon receiving all the data the `request.data` variable will be populated with this data.
1. Determine who the user is by looking at their cookies (create a user if not found) continue on to step 2 when a determination has been made.
2. Check to see if an XmlHttpRequest is being made.
    a. `false` : No XHR means initial load - Send the client the `/server/index.html` template. End Request
    b. `true` : pass control to `routeXHR`
3 `routeXHR` uses the querystring parameter `a` as the 'Action' to be performed. `a` can contain a hashtag which signifies the `/server/pages/` to use
    a. if `a` contains a `?` in it's value, everything after the `?` (seperated by `::`) is converted into a querystring an appended to the current querystring
4. attempt to handle the request using the `/common/pages.js` object.
    a. if a suitable handler is found then control is passed to the handler.
5. attempt to handle the request in other ways
    a. if a suitable handler is found then control is passed to the handler.
6   return an error if no suitable handler was found.

## Response Handling

All responses should go through `onRequestComplete`. The `onRequestComplete` function is attached to each response object so the callback can occur anywhere the response object goes.

To end a request simply use: `response.onResponseComplete(response,results)`

if the result is an error object: eg `{ error : errorStuff }` then `onRequestComplete` will use a 500 header instead of a 200 header.