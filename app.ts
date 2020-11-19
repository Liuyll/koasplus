import Koas from './src/core/server'
import { GET, Controller, Inject, Service, Middleware} from './src'

@Controller('')
class Test {
    @Middleware((ctx,next) => {
        console.log('qwe')
        next()
    })
    // @GET('test')
    match(ctx,next, @Inject('Srv1') srv1) {
        console.log('fuck')
        ctx.body = "ok"
        console.log(srv1.value)
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
    constructor(@Inject('Srv1') srv1) {
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
