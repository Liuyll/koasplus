import { RouteHandler } from "./route";
export interface State {
    routes: RouteHandler[]
}

export type IDependencyOrHandlerMetadata = IHandlerMetadata & { routes ?: RouteHandler[]}

export interface IMethodMetadata {
    paramsDep ?: IParamsDep
    paramsDepType ?: IParamsDepType
}

export interface IHandlerMetadata extends IMethodMetadata {
    routes : RouteHandler[]
    middlewares ?: []
}

export interface IConstructorMetadata extends IMethodMetadata{
    dependency ?: IParamsDep
}

export type IInjectType = 'provide' | 'param' | 'body'
export interface IInjectOptions {
    name ?: string
    // true | request | singleton
    new ?: string
    type ?: IInjectType
    verify ?: string
    transform ?: string
    allow ?: any[] | any
    match ?: string
    valid ?: any[] | any
    matchParams ?: any[]
}

export interface IParamsDep {
    [index: number]: IInjectOptions
}

export interface IParamsDepType {
    [index: number]: Function
}

