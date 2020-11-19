import 'reflect-metadata'
import glob from 'glob'

function get(target, key) {
    // console.log(target,key,target == A, target.test, this)
    Reflect.defineMetadata("test",{},target)
}

function Dep(target) {
    console.log(target)
    const t = Reflect.getOwnMetadata("design:paramtypes", target)
    console.log(t)
}

@Dep
class A {
    constructor(a: string) {}

    @get
    test() {
        console.log('test')
    }
}

// console.log(Reflect.getMetadata("test", A.prototype))

const compose = (middlewares: Function[], ctx, next:Function) => {
    const fn = middlewares.reduceRight((next,middleware) => () => middleware(ctx, next), next)
    return fn
}

const a = (ctx, next) => {
    console.log('A')
    next()
}

const b = (ctx, next) => {
    console.log('B')
    next()
}

const c = (ctx, next) => {
    console.log('C')
    next()
}

// compose([a,b,c],null,() => console.log('end'))()