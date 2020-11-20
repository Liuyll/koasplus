import Koas from './src/core/server'
import { GET, Controller, Inject, Service, Middleware, Params} from './src'

@Controller('')
class Test {
    @Middleware((ctx,next) => {
        console.log('middleware')
        next()
    })
    @GET('test/:id')
    match(ctx,next, @Inject({name: 'Srv1', new: true}) dep, @Params('id') id) {
        ctx.body = `id:${id},depValue:${dep.value}`
        next()
    }
}

@Service()
class Srv1 {
    constructor() {
        console.log('Srv1 build')
    }
    value = 10
}

@Service()
class Srv2 {
    constructor(@Inject() srv1:Srv1) {
        console.log('Srv2 build ', 'srv1.value = ', srv1.value)
    }

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
koas.start(8080)
console.log('success')
