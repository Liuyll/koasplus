import { convertArray } from './../tools/index';
import { isArray } from './../tools';
import { IDependencyOrHandlerMetadata, IInjectOptions, classMetadata, HttpVerb } from './../../types';
import { Context, Middleware as IMiddleware } from 'koa'
import { addPayloadToMetadata, AppendType } from '../tools'
import Joi from 'joi'
import Errors from '../../../error'

export const methodMetadata = Symbol('methodMetadata')
export const requestSymbol = Symbol('request-dep-metadata')
interface IRouterDecorator {
    (path: string): MethodDecorator
}

interface IMiddlewareDecorator {
    (middleware: IMiddleware | IMiddleware[]): MethodDecorator
}


const Middleware:IMiddlewareDecorator = function(middlewares: IMiddleware | IMiddleware[]): MethodDecorator{
    if(!isArray(middlewares)) middlewares = [middlewares]
    return addMiddlewareInRoute(middlewares)
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

function addRouteDecorator(method: string): IRouterDecorator {
    return (path: string): MethodDecorator => RoutePathDecorator(method as any, path)
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
    addPayloadToMetadata(target, null ,'paramsDep', {[index]: option}, methodMetadata, propertyKey, 'object')
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
            const deps:[string, IInjectOptions][] = Object.entries(metadata.paramsDep)
            deps.forEach(([depIndex,depOption]) => {
                if(depOption.type === 'provide') {
                    if(!depOption.new || depOption.new === 'singleton') paramList[depIndex] = ctx._app.getDepStorage(depOption.name)
                    else if(depOption.new === 'new') paramList[depIndex] = ctx._app.makeDependency(depOption.name)
                    else if(depOption.new === 'request') {
                        let dep:Object
                        if((dep = (ctx as any)[requestSymbol])) return dep
                        return (ctx as any)[requestSymbol] = ctx._app.makeDependency(depOption.name)
                    }
                }
                else if(depOption.type === 'param') paramList[depIndex] = ctx.params[depOption.name]
                else if(depOption.type === 'body') {
                    const key = depOption.name
                    if(!key) paramList[depIndex] = ctx.request.body
                    else {
                        let verify:any = depOption.verify
                        if(verify) {
                            if(verify === 'nonnull') 
                                if(ctx.request.body[key] == undefined) Errors(2, [ctx.path, key, verify, `key:${key}'s value is null`])
                            else {
                                verify = Joi[depOption.verify]
                                if(!verify) Errors(1, [ctx.path, key, depOption.verify])
    
                                const allow = convertArray(depOption.allow)
                                const valid = convertArray(depOption.valid)
                                const match = depOption.match
                                if(!match) verify = verify().valid(...valid).allows(...allow)
                                else {
                                    if(!verify()[match]) Errors(7, [ctx.path, key, match])
                                    verify = verify()[match]()
                                }
                                const value = ctx.request.body[key]
                                let ret: string
                                if((ret = verify.validate(value).error)) Errors(2, [ctx.path, key, depOption.verify, ret])
                            }
                        } else if(depOption.transform) {
                            
                        }
                        paramList[depIndex] = ctx.request.body[key] 
                    }
                }
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
    addRouteDecorator,
    Middleware
}

export {
    addDepNamesToMethodMetadata,
    addDepTypesToMethodMetadata,
    addDepNamesToConstructorMetadata,
    addDepTypesToConstructorMetadata,
    getMethodParamTypes,
    addPayloadToMethodMetadata,
}