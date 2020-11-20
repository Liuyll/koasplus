import { IInjectOptions } from './../../types/method';
import { 
    addDepNamesToConstructorMetadata, 
    addDepTypesToMethodMetadata,
    addDepNamesToMethodMetadata,
    addDepTypesToConstructorMetadata,
    getMethodParamTypes,
    addPayloadToMethodMetadata
} from '../method'

interface IParamDecorator {
    (...params: any[]): ParameterDecorator 
}

const Inject:IParamDecorator = function(_args: string | IInjectOptions):ParameterDecorator {
    let args: IInjectOptions
    if(typeof _args === 'string' || _args == undefined) args = {name: _args} as any as IInjectOptions
    else args = _args
    
    return (target:Object, propertyKey:string, index: number) => {
        let name = args.name
        // constructor
        // priority than @Service, be case to cover by @Service decorator
        if(!name) {
            const paramsTypes:Function[] = getMethodParamTypes(target)
            const type = paramsTypes[index]
            name = type.prototype.constructor.name
            const badCase = ['Object', 'Array', 'String', 'Number', 'Symbol', 'Function', 'BigInt']
            if(badCase.indexOf(name) != -1) throw new Error('Error: you must provide Inject name or type, but you did not provide anyone.')
            args.name = name
        }
        if(!propertyKey) {
            addDepNamesToConstructorMetadata(target, name)
            // TODO: types是否需要保留
            addDepTypesToConstructorMetadata(target)
        }
        else {
            args.type = 'provide'
            addDepNamesToMethodMetadata(target, propertyKey, String(index), args)
            addDepTypesToMethodMetadata(target, propertyKey, String(index))
        }
    }
}

const Params = (key: string):ParameterDecorator => {
    return (target:Object, propertyKey: string, index: number) => {
        const payload = {type: 'param', name: key}
        addDepNamesToMethodMetadata(target, propertyKey, String(index), payload as any)
    }
}


export {
    Inject,
    Params
}


