const VerifyNotExist = (path: string,key:string,verifyMethod:string):string => 
`path:${path}'s handler occur error:
    key:${key} verifyMethod:${verifyMethod} is not Exist.\n`

const VerifyFail = (path: string,key:string,verifyMethod:string, errors):string => 
`path:${path}'s handler occur error:
    key:${key} isn't pass verifyMethod:${verifyMethod}.
    reason: ${errors}\n`

const CircularDependency = ():string => 
`must be register dependency first beforehand.
    please check  whether exist circular dependency or did't register dependency.\n`

const PropertyInjectCircularDependency = ():string => 
`property inject occur circular inject.
    please check whether use 'new' life circle cause circular inject, like a -> b, b -> a\n`

const PropertyInvalidLife = ():string => 
`can't use request life in property inject\n`

const ErrDependencyFlag = ():string => 
`you must provide Injected dep's name or type, but you did not provide anyone.`

const InvalidValidateMatch = (path:string, key:string,match: string):string => 
`path:${path}'s handler occur error:
    key:${key} validate match:${match} is not passwd.\n`

const InvalidTransform = (path:string, key:string,transform: string):string => 
`path:${path}'s handler occur error:
    key:${key} transform method:${transform} is not exist.\n`

function Errors(order: number, args ?: string[]): never {
    throw new OverkosError(order, args)
} 

function makeErrorMessage(order: number, args ?: string[]):[string, string] {
    let message: string, errorName: string
    switch(order) {
        case 1:
            message = VerifyNotExist(args[0], args[1], args[2])
            errorName = 'VerifyNotExist'
            break
        case 2:
            message = VerifyFail(args[0], args[1], args[2], args[3])
            errorName = 'VerifyFail'
            break
        case 3:
            message = CircularDependency()
            errorName = 'CircularDependency'
            break
        case 4:
            message = PropertyInjectCircularDependency()
            errorName = 'PropertyInjectCircularDependency'
            break
        case 5:
            message = PropertyInvalidLife()
            errorName = 'PropertyInvalidLife'
            break
        case 6:
            message = ErrDependencyFlag()
            errorName = 'ErrDependencyFlag'
            break
        case 7:
            message = InvalidValidateMatch(args[0], args[1], args[2])
            errorName = 'InvalidValidateMatch'
            break
        case 8:
            message = InvalidTransform(args[0], args[1], args[2])
            errorName = 'InvalidValidateMatch'
            break
    }
    errorName += 'Error'
    return [message, errorName]
}
class OverkosError extends Error {
    constructor(order: number, args ?: string[]) {
        const [message, name] = makeErrorMessage(order, args)
        super(message)
        this.name = name
        Error.captureStackTrace(this, OverkosError.constructor)
    }
}

export default Errors