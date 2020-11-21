import Koas from './src/core/server'
import { GET, Controller, Inject, Service, Middleware, Params } from './src'

@Service()
class Srv4 {
    public value = 10
}

class Srv5 {
    public value = 20
}
@Controller('')
class Test {
    // @Inject()
    // public a: Srv4

    @Middleware((ctx,next) => {
        console.log('middleware')
        next()
    })
    @GET('test/:id')
    match(ctx,next, @Inject({name: 'Srv1'}) dep, @Params('id') id) {
        ctx.body = `id:${id},depValue:${dep.value},propertyVal:${dep.print()}`
        next()
    }
}

@Service()
class Srv1 {
    @Inject()
    public a: Srv4

    constructor(@Inject('Srv5') st) {
        console.log('Srv1 build,st:',st.value)
    }

    print() {
        return this.a.value
    }
    value = 10
}

@Service()
class Srv2 {
    constructor(@Inject() srv1:Srv1) {
        console.log('Srv2 build ', 'srv1.value = ', srv1.value)
    }

    public value = 10

    // test(@Inject('Srv1') srv1) {}
}

@Service()
class Srv3 {
    constructor(@Inject('Srv2') srv2) {
        console.log('Srv3 build')
    }
}


const koas = new Koas()

koas.registerController(Test)
koas.registerService(Srv1)
koas.registerService(Srv2)
koas.registerService(Srv3)
koas.registerService(Srv4)
koas.registerStaticProvider(null, Srv5)
koas.start(8080)
console.log('success')
