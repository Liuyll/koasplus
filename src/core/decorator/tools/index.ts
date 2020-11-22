export type AppendType = 'cover' | 'array' | 'object'

export function addPayloadToMetadata(target:Function | Object, innerKey:string, payloadKey: string, payload: any, metadataKey: string | symbol, propertyKey ?: string | symbol, appendType: AppendType = 'cover') {
    let oldMetadata = propertyKey ? Reflect.getOwnMetadata(metadataKey, target, propertyKey) : Reflect.getOwnMetadata(metadataKey, target)
    if(!oldMetadata) oldMetadata = {}
    const metadata = { ...oldMetadata }    
    if(!innerKey) {
        if(appendType === 'cover') metadata[payloadKey] = payload
        if(appendType === 'array') metadata[payloadKey] = [...iterable(metadata[payloadKey], 'array'), payload]
        if(appendType === 'object') metadata[payloadKey] = {...metadata[payloadKey], ...payload}
    }
    else {
        if(appendType === 'cover') metadata[innerKey] = { [payloadKey]: payload }
        if(appendType === 'array') {
            const oldPayload = metadata[innerKey] && metadata[innerKey][payloadKey]
            metadata[innerKey] = { [payloadKey]: [...iterable(oldPayload,'array'), payload]}
        }
        if(appendType === 'object') {
            const oldPayload = metadata[innerKey] && metadata[innerKey][payloadKey]
            metadata[payloadKey] = {...oldPayload, ...payload }
        }
    }
    if(propertyKey) Reflect.defineMetadata(metadataKey, metadata, target, propertyKey)
    else Reflect.defineMetadata(metadataKey, metadata, target)
}

const iterable = (target:Object, type: Exclude<AppendType, 'cover'>):any=> {
    if(type === 'object') return target || {}
    if(type === 'array') return target || []
}

export const isPlainObject = (object: unknown):boolean => {
    return Object.prototype.toString.call(object) === "[object Object]"
}
export const isArray = <T=any>(object: unknown): object is Array<T> => {
    return Array.isArray(object) && Object.prototype.toString.call(object) === "[object Array]"
}

export const handlePathToRoute = (path: string | RegExp | undefined) => {
    if(!path) path = ""
    // \^api\ -> \/api\
    else if(path instanceof RegExp) {
        path = path.toString()
        if(path.startsWith('^')) path = path[0] + path.slice(1)
    } 
    return path
}

export const convertArray = (object: any) => {
    if(!object) return []
    else if(!isArray(object)) return [object]
    return object
} 