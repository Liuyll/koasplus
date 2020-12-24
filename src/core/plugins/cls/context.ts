import asyncHooks from 'async_hooks'

interface IContextRepo {
    data: object
}

interface IContext {
    parentExecuteId: number,
    ctxId: number,
    childrenExecuteId: number[]
}

class ClsContext {
    private contextRepos: Map<number, IContextRepo> = new Map()
    private contextMap: Map<number, IContext> = new Map()
    constructor() {
        asyncHooks.createHook({
            init:(asyncId: number, type: string, triggerAsyncId: number) => {
                let ctxId = this.getContextId(triggerAsyncId) 
                if(!ctxId) ctxId = asyncId
                this.contextMap.set(asyncId, { parentExecuteId: triggerAsyncId, ctxId, childrenExecuteId: [] })
                let parentContext: IContext
                if((parentContext = this.contextMap.get(triggerAsyncId))) {
                    parentContext.childrenExecuteId.push(asyncId)
                }
            },
            destroy:(asyncId: number) => {
                let context:IContext
                if((context = this.contextMap.get(asyncId))) {
                    this.destroyContext(context.childrenExecuteId, asyncId)
                }
            }
        }).enable()
    }

    private destroyContext(childrenExecuteId: number[], selfId: number) {
        childrenExecuteId.forEach((childExecuteId) => {
            let childContext: IContext
            if((childContext = this.contextMap.get(childExecuteId))) {
                if(childContext.parentExecuteId === selfId) this.destroyContext(childContext.childrenExecuteId, childExecuteId)
            } 
            this.contextMap.delete(childExecuteId)
        })
        this.contextMap.delete(selfId)
    }
    private getContextId(executeId: number) {
        let parentContext: IContext = this.contextMap.get(executeId)
        if(parentContext) return parentContext.ctxId
        return null
    }

    set(key: string, data: any) {
        let executeId = asyncHooks.triggerAsyncId()
        let contextRepo: IContextRepo
        const ctxId = this.getContextId(executeId)
        if((contextRepo = this.contextRepos.get(ctxId))) {
            contextRepo.data[key] = data
        } else this.contextRepos.set(ctxId, {
            data: {
                [key]: data
            }
        })
    }

    get(key: string) {
        const executeId = asyncHooks.triggerAsyncId()
        const ctxId = this.getContextId(executeId)
        return this.contextRepos.get(ctxId)?.data?.[key]
    }
}

export {
    ClsContext
}