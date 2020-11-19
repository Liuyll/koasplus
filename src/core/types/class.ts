import { IParamsDep } from './method'

export interface IControllerMetadata {
    basepath ?: string
    prefix ?: string
    verb ?: string | string[]
}   

export interface IDependencyMetadata extends IConsturctor{
    dependency: string[]
} 

export interface IServiceMetadata {
    names : string[]
}

export interface IConsturctor {
    new (...params: any[]):any 
}
export interface IController extends IConsturctor{}

export interface IService extends IController {}

export interface IDependency extends IController {}

export const classMetadata = Symbol('class-matadata-key')

export interface IClassMetadata {
    controller ?: IControllerMetadata
    service ?: IServiceMetadata
}