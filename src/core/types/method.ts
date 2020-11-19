import { RouteHandler } from "./route";

export interface State {
    routes: RouteHandler[]
}

export interface IMethodMetadata {
    paramsDep ?: IParamsDep
}

export interface IHandlerMedatata extends IMethodMetadata {
    routes : RouteHandler[]
}

export interface IContructorMetadata extends IMethodMetadata{
    dependency ?: IParamsDep
}

export interface IParamsDep {
    [index: number]: Object
}
