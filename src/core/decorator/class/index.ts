import { classMetadata } from './../../types/class';
import { addPayloadToMetadata } from '../tools'

export function Controller(path: string):ClassDecorator {
    return (target:Function) => addBaseControllerMetadata(target, path)
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

const addPayloadToClassMetadata = (target:Function, key:string, payloadKey: string, payload: any) => {
    addPayloadToMetadata(target, key, payloadKey, payload, classMetadata)
}

function addClassToServiceStorage(target:Function, name:string) {
    const names = [target.prototype.constructor.name]
    if(name) names.push(name)
    addPayloadToClassMetadata(target, 'service', 'names', names)
    addPayloadToMetadata(target, null, 'dependency', null, classMetadata, null, 'array')
}
