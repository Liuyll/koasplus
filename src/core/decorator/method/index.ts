import { isArray } from './../tools';
import { IDependencyOrHandlerMetadata, IInjectOptions } from './../../types/method';
import { Context, Middleware as IMiddleware } from 'koa'
import { classMetadata } from './../../types/class';
import { HttpVerb } from '../../types'
import { addPayloadToMetadata, AppendType } from '../tools'

export const methodMetadata = Symbol('methodMetadata')

interface IRouterDecorator {
    (path: string): MethodDecorator
}

interface IParamDecorator {
    (...params: any[]): ParameterDecorator 
}

interface IMiddlewareDecorator {
    (middleware: IMiddleware | IMiddleware[]): MethodDecorator
}


const Middleware:IMiddlewareDecorator = function(middlewares: IMiddleware | IMiddleware[]): MethodDecorator{
    if(!isArray(middlewares)) middlewares = [middlewares]
    return addMiddlewareInRoute(middlewares)
}

const Inject:IParamDecorator = function(args: string | IInjectOptions):ParameterDecorator {
    if(typeof args === 'string' || args == undefined) args = {name: args} as any as IInjectOptions

    let name = args.name
    return (target:Object, propertyKey:string, index: number) => {
        // constructor
        // priority than @Service, be case to cover by @Service decorator
        if(!name) {
            const paramsTypes:Function[] = getMethodParamTypes(target)
            const type = paramsTypes[index]
            name = type.prototype.constructor.name
            const badCase = ['Object', 'Array', 'String', 'Number', 'Symbol', 'Function', 'BigInt']
            if(badCase.indexOf(name) != -1) throw new Error('Error: you must provide Inject name or type, but you did not provide anyone.')
        }
        if(!propertyKey) {
            addDepNamesToConstructorMetadata(target, name)
            // TODO: types是否需要保留
            addDepTypesToConstructorMetadata(target)
        }
        else {
            addDepNamesToMethodMetadata(target, propertyKey, String(index), args as IInjectOptions)
            addDepTypesToMethodMetadata(target, propertyKey, String(index))
        }
    }
}

const GET:IRouterDecorator = function(path: string): MethodDecorator {
    return RoutePathDecorator(HttpVerb.GET, path)
}

const POST:IRouterDecorator = function(path: string): MethodDecorator {
    return RoutePathDecorator(HttpVerb.POST, path)
}

const PUT:IRouterDecorator = function(path: string): MethodDecorator {
    return RoutePathDecorator(HttpVerb.PUT, path)
}

const DELETE:IRouterDecorator = function(path: string): MethodDecorator {
    return RoutePathDecorator(HttpVerb.DELETE, path)
}

function addMiddlewareInRoute(middlewares: IMiddleware[]) {
    return (target: Object, handler: string) => {
        middlewares.forEach(middleware => addPayloadToMethodMetadata(target, handler, null, 'middlewares', middleware, 'array'))   
    }
}

function RoutePathDecorator(httpVerb: HttpVerb, basepath: string | RegExp): MethodDecorator {
    return (target:Object, propertyKey: string, desc: PropertyDescriptor): void => {
        if(basepath == undefined) basepath = ""
        else if(basepath instanceof RegExp) {}
        else addVerbToControllerMethod(target, propertyKey, basepath, httpVerb)
        wrapControllerInContainer(target, propertyKey, desc)
    }
}

function addDepNamesToMethodMetadata(target:Object, propertyKey:string, index:string, option: IInjectOptions) {
    addPayloadToMetadata(target, null , 'paramsDep', {[index]: option}, methodMetadata, propertyKey, 'object')
}

function addDepTypesToMethodMetadata(target:Object, propertyKey:string, index:string) {
    const paramsTypes = getMethodParamTypes(target, propertyKey)
    addPayloadToMetadata(target, null , 'paramsDepType', {[index]: paramsTypes[index]}, methodMetadata, propertyKey, 'object')
}

function addDepNamesToConstructorMetadata(target:Object, name: string) {
    addPayloadToMetadata(target, null , 'dependency', name, classMetadata , null, 'array')
}

function addDepTypesToConstructorMetadata(target:Object) {
    const paramsTypes = getMethodParamTypes(target)
    addPayloadToMetadata(target, null, 'dependencyType', paramsTypes, classMetadata)
}

function addVerbToControllerMethod(target: Object, handler: string | symbol, path: string, verb:HttpVerb) {
    const routeState = {verb, path}
    // prototype
    addPayloadToMethodMetadata(target, handler, null, 'routes', routeState, 'array')
}

function wrapControllerInContainer(target: Object, handler: string, desc: TypedPropertyDescriptor<Function>) {
    const oldHandler = desc.value
    desc.value = (ctx: Context, next: Function) => {
        const metadata:IDependencyOrHandlerMetadata = getPayloadFromMethodMetadata(target, handler)
        const paramList = [ctx, next]
        if(metadata.paramsDep) {
            const deps = Object.entries(metadata.paramsDep)
            deps.forEach(([depIndex,depOption]) => {
                paramList[depIndex] = ctx._app.getDepStorage(depOption.name)
            })      
        }
        const _handler = () => oldHandler.apply(target, paramList)
        if(metadata.middlewares) {
            compose(metadata.middlewares)(ctx, _handler)()
        }
        else _handler()
    }
}

const addPayloadToMethodMetadata = (target:Object, propertyKey: string | symbol, innerKey: string, payloadKey: string, payload: any, type?: AppendType) => {
    addPayloadToMetadata(target, innerKey, payloadKey, payload, methodMetadata, propertyKey, type)
}

const getPayloadFromMethodMetadata = (target:Object, propertyKey: string | symbol) => {
    return Reflect.getMetadata(methodMetadata, target, propertyKey)
} 

const getMethodParamTypes = (target:Object | Function, propertyKey ?: string) => {
    const paramMetadataKey = 'design:paramtypes'
    if(propertyKey) return Reflect.getMetadata(paramMetadataKey, target, propertyKey)
    return Reflect.getOwnMetadata(paramMetadataKey, target)
}

const compose = (middlewares: Function[]) => 
    (ctx:Context, next:Function) => middlewares.reduceRight((next,middleware) => () => middleware(ctx, next), next)

export {
    GET,
    POST,
    PUT,
    DELETE,
    Inject,
    Middleware
}