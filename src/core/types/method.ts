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

export interface IInjectOptions {
    name: string
    new: boolean
}

export interface IParamsDep {
    [index: number]: IInjectOptions
}

export interface IParamsDepType {
    [index: number]: Function
}

