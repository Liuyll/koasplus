import { string } from 'joi'
import { Body } from '.'
import { isArray } from '../tools'

interface IValidateOptions {
    verify ?: string
    allow ?: string | string[]
    valid ?: string | string[]
    match ?: string
}

const Verify = (key: string, method: string | IValidateOptions | Array<any>): ParameterDecorator => {
    let options: IValidateOptions
    if(isArray(method)) options = {
        verify: 'any',
        valid: method
    }
    if(method instanceof string) options = {verify: method as string}
    else options = method as IValidateOptions

    return Body(key, options)
}

const NonNullable = (key: string):ParameterDecorator => {
    return Body(key, {verify: 'nonnull'})
} 

const Email = (key ?: string):ParameterDecorator => {
    return Body(key, {verify: 'string', match: 'email' })
} 


export {
    Verify,
    NonNullable,
    Email
}