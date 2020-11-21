import { handlePathToRoute } from './../tools/index';
import { classMetadata } from './../../types';
import { addPayloadToMetadata } from '../tools'

function Controller(path: string):ClassDecorator {
    path = handlePathToRoute(path)
    return (target:Function) => addBaseControllerMetadata(target, path)
}

function Service(name?: string):ClassDecorator {
    return Provider(name, 'service')
}

function Dao(name ?: string):ClassDecorator {
    return Provider(name, 'dao')
}

function Provider(name ?: string, type = 'provider'):ClassDecorator {
    return (target:Function) => addClassToProviderStorage(target, name, type)
}

function StaticProvider(target:Function) {
    addPayloadToClassMetadata(target, null, 'staticProvider', true)
}

function addBaseControllerMetadata(target:Function, basepath: string) {
    addPayloadToClassMetadata(target, 'controller', 'basepath', basepath)
}

function addControllerOptionMetadata(target:Function, options: object) {
    addPayloadToClassMetadata(target, 'controller', 'options', options)
}

const addPayloadToClassMetadata = (target:Function, innerKey:string, payloadKey: string, payload: any) => {
    addPayloadToMetadata(target, innerKey, payloadKey, payload, classMetadata)
}

function addClassToProviderStorage(target:Function, name:string, type: string) {
    const names = [target.prototype.constructor.name]
    if(name) names.push(name)
    addPayloadToClassMetadata(target, type, 'names', names)
    addPayloadToMetadata(target, null, 'dependency', null, classMetadata, null, 'array')
}

export {
    Controller,
    Dao,
    Service,
    StaticProvider,
    addBaseControllerMetadata,
    addControllerOptionMetadata,
    Provider,
}