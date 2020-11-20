import { handlePathToRoute } from './../tools/index';
import { classMetadata } from './../../types/class';
import { addPayloadToMetadata } from '../tools'

export function Controller(path: string):ClassDecorator {
    path = handlePathToRoute(path)
    return (target:Function) => addBaseControllerMetadata(target, path)
}

export function StaticProvider(target:Function) {
    addPayloadToClassMetadata(target, null, 'staticProvider', true)
}

export function Service(name?: string):ClassDecorator {
    return (target:Function) => addClassToServiceStorage(target, name)
}

export function addBaseControllerMetadata(target:Function, basepath: string) {
    addPayloadToClassMetadata(target, 'controller', 'basepath', basepath)
}

export function addControllerOptionMetadata(target:Function, options: object) {
    addPayloadToClassMetadata(target, 'controller', 'options', options)
}

const addPayloadToClassMetadata = (target:Function, innerKey:string, payloadKey: string, payload: any) => {
    addPayloadToMetadata(target, innerKey, payloadKey, payload, classMetadata)
}

function addClassToServiceStorage(target:Function, name:string) {
    const names = [target.prototype.constructor.name]
    if(name) names.push(name)
    addPayloadToClassMetadata(target, 'service', 'names', names)
    addPayloadToMetadata(target, null, 'dependency', null, classMetadata, null, 'array')
}
