import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { clsContext } from '../plugins/cls'

function setContextInfo(ctx: Koa.Context, next) {
    const mapContextInfo = ['url', 'method', 'query', 'href', 'req', 'res']
    mapContextInfo.forEach(key => {
        clsContext.set(key, ctx[key])
    })
    next()
}   

function initServer(app: Koa, ...middlewares: Koa.Middleware[]) {
    app.use(setContextInfo)
    app.use(bodyParser())
    middlewares.forEach(middleware => {
        app.use(middleware)
    })
}

export {
    initServer
}