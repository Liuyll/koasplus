import { methodMetadata, requestSymbol } from './common'
import { convertArray } from './../tools/index'
import { 
    IDependencyOrHandlerMetadata, 
    IInjectOptions, 
    ClassInstance,
} from './../../types'
import { Context} from 'koa'
import Joi from 'joi'
import Errors from '../../../error'
import validator from 'validator'
import { clsContext } from '../../plugins/cls'


function wrapControllerInContainer(target:  ClassInstance, handler: string, desc: TypedPropertyDescriptor<Function>) {
    const oldHandler = desc.value
    desc.value = (ctx: Context, next: Function) => {
        const metadata:IDependencyOrHandlerMetadata = getPayloadFromMethodMetadata(target, handler)
        const paramList = [ctx, next]
        if(metadata.paramsDep) {
            const deps:[string, IInjectOptions][] = Object.entries(metadata.paramsDep)
            deps.forEach(([depIndex,depOption]) => {
                if(depOption.type === 'provide') {
                    if(!depOption.new || depOption.new === 'singleton') paramList[depIndex] = ctx._app.getDepStorage(depOption.name)
                    else if(depOption.new === 'new') paramList[depIndex] = ctx._app.makeDependency(depOption.name)
                    else if(depOption.new === 'request') {
                        let dep:Object
                        if((dep = (ctx as any)[requestSymbol])) return dep
                        return (ctx as any)[requestSymbol] = ctx._app.makeDependency(depOption.name)
                    }
                }
                else if(depOption.type === 'param') paramList[depIndex] = ctx.params[depOption.name]
                else if(depOption.type === 'body') {
                    const requestType = clsContext.get("method")
                    const key = depOption.name
                    if(!key) paramList[depIndex] = ctx.request.body
                    else {
                        let verify:any = depOption.verify
                        let value:any = ctx.request.body[key]
                        if(verify) {
                            if(verify === 'nonnull') {
                                if(getDataFromRequest(requestType, key, ctx) == undefined) Errors(2, [ctx.path, key, verify, `key:${key}'s value is null`])
                            }
                            else {
                                verify = Joi[depOption.verify]
                                if(!verify) Errors(1, [ctx.path, key, depOption.verify])
    
                                const allow = convertArray(depOption.allow)
                                const valid = convertArray(depOption.valid)
                                const match = depOption.match
                                if(!match) verify = verify().valid(...valid).allows(...allow)
                                else {
                                    if(!verify()[match]) Errors(7, [ctx.path, key, match])
                                    const params = depOption.matchParams
                                    if(params) verify = verify()[match](...params)
                                    else verify = verify()[match]()
                                }
                                let ret: string
                                if((ret = verify.validate(value).error)) Errors(2, [ctx.path, key, depOption.verify, ret])
                            }
                        } 
                        if(depOption.transform) {
                            if(value) {
                                let transform:Function
                                if(!(transform = validator[depOption.transform])) Errors(8, [ctx.path, key, depOption.transform])
                                value = transform(value)
                            } 
                        }
                        paramList[depIndex] = value
                    }
                }
            })      
        }
        const _handler = () => oldHandler.apply(target, paramList)
        if(metadata.middlewares) {
            compose(metadata.middlewares)(ctx, _handler)()
        }
        else _handler()
    }
}

const getDataFromRequest = (type, key:string, ctx) => 
    type === 'GET' ? ctx.query[key] : ctx.request.body[key]

const getPayloadFromMethodMetadata = (target: ClassInstance, propertyKey: string | symbol) => {
    return Reflect.getMetadata(methodMetadata, target, propertyKey)
} 

const compose = (middlewares: Function[]) => 
    (ctx:Context, next:Function) => middlewares.reduceRight((next,middleware) => () => middleware(ctx, next), next)

export {
    wrapControllerInContainer
}