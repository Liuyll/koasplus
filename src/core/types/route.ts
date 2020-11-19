enum HttpVerb {
    PUT = 'PUT',
    GET = 'GET',
    POST = 'POST',
    DELETE = 'DELETE',
}

interface RouteHandler {
    path: string,
    verb: HttpVerb
}

export  { 
    HttpVerb,
    RouteHandler
}