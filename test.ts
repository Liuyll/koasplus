import 'reflect-metadata'
import glob from 'glob'


function get(target, key) {
    // console.log(target,key,target == A, target.test, this)
    Reflect.defineMetadata("test",{},target)
}
class A {

    @get
    test() {
        console.log('test')
    }
}

console.log(Reflect.getMetadata("test", A.prototype))
