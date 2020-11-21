export type ProviderType = 'dao' | 'service' | 'provider' | 'controller'

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

export interface IProviderMetadata {
    names : string[]
}
export interface IServiceMetadata extends IProviderMetadata {}
export interface IDaoMetadata extends IProviderMetadata {}
export interface IConstructor {
    new (...params: any[]):any 
}

export interface IProvider extends IConstructor {}
export interface IDao extends IProvider {}
export interface IController extends IProvider{}
export interface IService extends IProvider {}
export interface IDependency extends IController {}
export const classMetadata = Symbol('class-metadata-key')

export interface IClassMetadata {
    controller ?: IControllerMetadata
    service ?: IServiceMetadata
    dao ?: IDaoMetadata
    provider ?: IProviderMetadata
}