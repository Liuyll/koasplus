const VerifyNotExist = (path: string,key:string,verifyMethod:string):string => 
`path:${path} handler occur error:
    key:${key} verifyMethod:${verifyMethod} is not exist.\n`

const VerifyFail = (path: string,key:string,verifyMethod:string, errors):string => 
`path:${path} handler occur error:
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
`path:${path} handler occur error:
    key:${key} validate match:${match} is not exist.\n`

export default function Errors(order: number, args ?: string[]): never {
    let message: string
    switch(order) {
        case 1:
            message = VerifyNotExist(args[0], args[1], args[2])
            break
        case 2:
            message = VerifyFail(args[0], args[1], args[2], args[3])
            break
        case 3:
            message = CircularDependency()
            break
        case 4:
            message = PropertyInjectCircularDependency()
            break
        case 5:
            message = PropertyInvalidLife()
            break
        case 6:
            message = ErrDependencyFlag()
            break
        case 7:
            message = InvalidValidateMatch(args[0], args[1], args[2])
            break
    }
    throw new Error(message)
} 