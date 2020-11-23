import { Body } from '.'
import { isArray } from '../tools'

interface IValidateOptions {
    verify ?: string
    allow ?: string | string[]
    valid ?: string | string[]
    match ?: string
    matchParams ?: any[]
}

const Verify = (key: string, method: string | IValidateOptions | Array<any> | RegExp, extra ?: any): ParameterDecorator => {
    let options: IValidateOptions
    if(isArray(method)) options = {
        verify: 'any',
        valid: method
    }
    else if(method instanceof RegExp) {
        if(!extra) extra = []
        options = {
            verify: 'string',
            match: 'pattern',
            matchParams: [method, ...extra]
        }
    }
    if(method instanceof String) options = {verify: method as string}
    else options = method as IValidateOptions

    return Body(key, options)
}

const NonNullable = (key: string):ParameterDecorator => {
    return Body(key, {verify: 'nonnull'})
} 

const Email = (key ?: string):ParameterDecorator => {
    return Body(key, {verify: 'string', match: 'email' })
} 

const Int = (key: string, allowNull:boolean = false):ParameterDecorator => {
    const verify = allowNull ? null : 'nonnull'
    return Body(key, {verify, transform: 'toInt' })
}

const Bool = (key: string, allowNull:boolean = true):ParameterDecorator => {
    const verify = allowNull ? null : 'nonnull'
    return Body(key, {verify, transform: 'toBoolean' })
}

const Trim = (key: string, allowNull:boolean = false):ParameterDecorator => {
    const verify = allowNull ? null : 'nonnull'
    return Body(key, {verify, transform: 'trim' })
}

export {
    Verify,
    NonNullable,
    Email,
    Int,
    Bool,
    Trim
}