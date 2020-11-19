import { IMethodMetadata, IHandlerMedatata } from './../../types/method';
import { Context } from 'koa'
import { classMetadata } from './../../types/class';
import { HttpVerb, RouteHandler } from '../../types'
import { addPayloadToMetadata } from '../tools'

export const methodMetadata = Symbol('methodMetadata')

interface RouterDecorator {
    (path: string): MethodDecorator
}

const Inject = function(name: string):ParameterDecorator {
    return (target:Object, propertyKey:string, index: number) => {
        // constructor, priority than @Service
        if(!propertyKey) addPayloadToMetadata(target, null, 'dependency', name, classMetadata, null, 'array')
        else addPayloadToMetadata(target, null, 'dependency', name, methodMetadata, propertyKey, 'array')
    }
}

const GET:RouterDecorator = function(path: string): MethodDecorator & PropertyDescriptor {
    return RoutePathDecorator(HttpVerb.GET, path)
}

function RoutePathDecorator(httpVerb: HttpVerb, basepath: string | RegExp): MethodDecorator & PropertyDecorator {
    return (target:Object, propertyKey: string | symbol): void => {
        if(basepath == undefined) basepath = ""
        else if(basepath instanceof RegExp) {}
        else addVerbToControllerMethod(target, propertyKey, basepath, httpVerb)
    }
}

function addVerbToControllerMethod(target: Object, handler: string | symbol, path: string, verb:HttpVerb) {
    let state:IHandlerMedatata | undefined = Reflect.getOwnMetadata(classMetadata, target, handler)
    if(!state) state = { routes: [] as any }
    
    const routeState: RouteHandler[] = [
        ...state.routes,
        { verb, path }
    ]

    state.routes = routeState
    // prototype
    Reflect.defineMetadata(classMetadata, state, target, handler)
}

function wrapController(target: Object, handler: string, desc: TypedPropertyDescriptor<Function>) {
    const oldHandler = desc.value
    return (ctx: Context, next: Function) => {
        const metadata:IMethodMetadata = Reflect.getMetadata(methodMetadata, target, handler)
        if(metadata.paramsDep) {
            const deps = Object.entries(metadata.paramsDep)
            const paramList = [ctx, next]
            deps.forEach(([depIndex,depName]) => {
                paramList[depIndex] = ctx._app.getDepStorage(depName)
            })
            oldHandler.apply(target, paramList)
        }
    }
}

const addPayloadToMethodMetadata = (target:Function, payloadKey: string, payload: any) => {
    addPayloadToMetadata(target, null, payloadKey, payload, methodMetadata)
}

export {
    GET,
    Inject
}