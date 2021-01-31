import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { clsContext } from '../plugins/cls'
import process from 'process'
import fs from 'fs'

type LogType = 'log' | 'debug' | 'err' | 'warning'
async function setContextInfo(ctx: Koa.Context, next) {
    const mapContextInfo = ['url', 'method', 'query', 'href', 'request', 'response']
    mapContextInfo.forEach(key => {
        clsContext.set(key, ctx[key])
    })
    await next()
}   

async function setLogger(ctx: Koa.Context, next) {
    const [url, method] = ['url', 'method'].map(k => clsContext.get(k))
    clsContext.set('logger', {
        log(desc: string, type:LogType = 'log'){
            const log = `url: ${url}, method: ${method} | ${desc} \r\n`
            fs.writeFile(`logger/${type}.txt`, new Date() + ' ' + log, { encoding: 'utf-8', flag: 'a+'}, () => {})
            console.error(`Log | type:${type} | `,log)
        }
    })
    await next()
}

async function extendCtxStore(ctx:Koa.Context, next) {
    ctx.Set = clsContext.set
    ctx.Get = clsContext.get
    await next()   
}

async function protectContext(ctx: Koa.Context, next) {
    try {
        await next()
    } catch(err: any) {
        ctx.body = 'Server Error'
        ctx.response.status = 500
        clsContext.get('logger').log(err.message ? err.message : err, 'error')
    }
}

function protectServer() {
    process.on('unhandledRejection', (reason: Error | any, promise) => {
        console.error(reason.message ? reason.message : reason)
    })
}

function initServer(app: Koa, ...middlewares: Koa.Middleware[]) {
    protectServer()
    app.use(extendCtxStore)
    app.use(protectContext)
    app.use(setContextInfo)
    app.use(setLogger)
    app.use(bodyParser())
    middlewares.forEach(middleware => {
        app.use(middleware)
    })
}

export {
    initServer
}