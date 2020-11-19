import { IParamsDep } from './method'

export interface IControllerMetadata {
    basepath ?: string
    prefix ?: string
    verb ?: string | string[]
}   

export type DependencyNames = string[]
export type DependencyTypes = Function[]

export interface IDependencyMetadata extends IConstructor{
    dependency ?: DependencyNames
    dependencyType ?: DependencyTypes
} 

export interface IServiceMetadata {
    names : string[]
}

export interface IConstructor {
    new (...params: any[]):any 
}

export interface IController extends IConstructor{}

export interface IService extends IController {}

export interface IDependency extends IController {}

export const classMetadata = Symbol('class-metadata-key')

export interface IClassMetadata {
    controller ?: IControllerMetadata
    service ?: IServiceMetadata
}