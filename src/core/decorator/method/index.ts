import { ClassConstructor } from './../../types/class';
import { convertArray } from './../tools/index';
import { 
    IDependencyOrHandlerMetadata, 
    IInjectOptions, 
    classMetadata, 
    HttpVerb, 
    ClassInstance,
} from './../../types';
import { Context, Middleware as IMiddleware } from 'koa'
import { addPayloadToMetadata, AppendType, isArray } from '../tools'
import { methodMetadata } from './common'

import { wrapControllerInContainer } from './patchMethod'
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

function addDepNamesToMethodMetadata(target: ClassInstance, propertyKey:string, index:string, option: IInjectOptions) {
    addPayloadToMetadata(target, null ,'paramsDep', {[index]: option}, methodMetadata, propertyKey, 'object')
}

function addDepTypesToMethodMetadata(target: ClassInstance, propertyKey:string, index:string) {
    const paramsTypes = getMethodParamTypes(target, propertyKey)
    addPayloadToMetadata(target, null , 'paramsDepType', {[index]: paramsTypes[index]}, methodMetadata, propertyKey, 'object')
}

function addDepNamesToConstructorMetadata(target: ClassConstructor, name: string) {
    addPayloadToMetadata(target, null , 'dependency', name, classMetadata , null, 'array')
}

function addDepTypesToConstructorMetadata(target: ClassInstance) {
    const paramsTypes = getMethodParamTypes(target)
    addPayloadToMetadata(target, null, 'dependencyType', paramsTypes, classMetadata)
}

function addVerbToControllerMethod(target:  ClassInstance, handler: string | symbol, path: string, verb:HttpVerb) {
    const routeState = {verb, path}
    // prototype
    addPayloadToMethodMetadata(target, handler, null, 'routes', routeState, 'array')
}

const addPayloadToMethodMetadata = (target: ClassInstance, propertyKey: string | symbol, innerKey: string, payloadKey: string, payload: any, type?: AppendType) => {
    addPayloadToMetadata(target, innerKey, payloadKey, payload, methodMetadata, propertyKey, type)
}

const getPayloadFromMethodMetadata = (target: ClassInstance, propertyKey: string | symbol) => {
    return Reflect.getMetadata(methodMetadata, target, propertyKey)
} 

const getMethodParamTypes = (target:Object | Function, propertyKey ?: string) => {
    const paramMetadataKey = 'design:paramtypes'
    if(propertyKey) return Reflect.getMetadata(paramMetadataKey, target, propertyKey)
    return Reflect.getOwnMetadata(paramMetadataKey, target)
}

const getDataFromRequest = (type, key:string, ctx) => 
    type === 'GET' ? ctx.query[key] : ctx.request.body[key]

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