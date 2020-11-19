type AppendType = 'cover' | 'array' | 'object'

export function addPayloadToMetadata(target:Function | Object, key:string, payloadKey: string, payload: any, metadataKey: string | symbol, propertyKey ?: string | symbol, appendType: AppendType = 'cover') {
    let oldMetadata = propertyKey ? Reflect.getOwnMetadata(metadataKey, target, propertyKey) : Reflect.getOwnMetadata(metadataKey, target)
    if(!oldMetadata) oldMetadata = {}
    const metadata = { ...oldMetadata }    
    if(!key) {
        if(appendType === 'cover') metadata[payloadKey] = payload
        if(appendType === 'array') metadata[payloadKey] = [...iterable(metadata[payloadKey], 'array'), payload]
        if(appendType === 'object') metadata[payloadKey] = {...metadata[payloadKey], ...payload}
    }
    else {
        if(appendType === 'cover') metadata[key] = { [payloadKey]: payload }
        if(appendType === 'array') {
            const oldPayload = metadata[key] && metadata[key][payloadKey]
            metadata[key] = { [payloadKey]: [...iterable(oldPayload,'array'), payload]}
        }
        if(appendType === 'object') {
            const oldPayload = metadata[key] && metadata[key][payloadKey]
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
