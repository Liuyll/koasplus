import { isPlainObject, isArray } from './../decorator/tools';
import { methodMetadata } from './../decorator/method/common';
import { 
    classMetadata, 
    IControllerMetadata, 
    IController, 
    IClassMetadata, 
    IService, 
    IDependencyMetadata, 
    IProvider, 
    IDao, 
    ProviderType,
    IHandlerMetadata,
    ClassInstance,
} from './../types';
import Koa, { Middleware } from 'koa'
import { classPrototypeMetadata, IInjectedPropertyPayload } from '../decorator/param'
import Router from 'koa-router'
import glob from 'glob'
import 'reflect-metadata'
import { Provider } from '../decorator/class';
import Errors from '../../error'
import { initServer } from './initServer'

interface IRoutePayload {
    path: string,
    verb: string | string[],
    handler: Function
}
interface IDepStorage {
    [key:string]: Object
}
interface IDepGraph {
    [key:string]: string[]
}
interface IDepMapTable {
    [key:string]: string
}
interface IDepKVMap {
    [key:string]: IProvider
}
type AutoRegisterHandler = (provider:IProvider) => void

export default class Koas {
    private app: Koa
    private router: Router
    private routeTable = []
    private depStorage:IDepStorage = {}
    private depGraph: IDepGraph = {}
    // follow name -> master name 
    private depMapTable:IDepMapTable = {}
    // name -> type
    private depKVMap: IDepKVMap = {}

    constructor() {
        const app = new Koa()
        this.app = app
        this.app.context._app = this
        this.router = new Router()
        this.autoRegisterController(this.router)
        this.autoRegisterService()
        this.autoRegisterDao()
        
        initServer(app, this.getRouter())
    }

    start(port: number) {
        this.buildDependencyGraph()
        this.app.listen(port)
    }

    get _app() {
        return this.app
    }

    get _router() {
        return this.router
    }

    public debug(propertyKey: string) {
        return this[propertyKey]
    }

    public getDepStorage(key: string) {
        return this.depStorage[key]
    }

    private getRouter():Middleware {
        return this.router.routes() as any
    }

    public registerController(target: IController) {
        const router = this.router
        this.getAndAddControllerMetadataToRoute(target, router)
    }

    public registerService(target: IService) {
        this.addServiceToDepGraph(target)
    }

    public registerDao(target: IDao) {
        this.addDaoToDepGraph(target)
    }

    public registerStaticProvider(name:string | undefined, target: any) {
        // (target) | (null, target)
        if(typeof target === 'object' && target == null) {
            target = name
            name = null
        }
        if(target instanceof Function) {
            Provider(name, 'provider')(target)
            this.addProviderToDepGraph(target, 'provider')
        }
        else this.depStorage[name] = target
    }

    public getTypeFromName(name: string) {
        if(this.depKVMap[name]) return this.depKVMap[name]
        name = this.depMapTable[name]
        return this.depKVMap[name]
    }

    private autoRegisterController(router:Router) {
        const handler = (controller: IController):void => {
            const routes = this.getControllerMetadata(controller)
            this.addControllerMetadataToRoute(routes, router)
        }
        this.getAutoRegisterProvider('controller', handler)
    }

    private autoRegisterService() {
        this.getAutoRegisterProvider('service', this.registerService)
    }

    private autoRegisterDao() {
        this.getAutoRegisterProvider('dao', this.registerDao)
    }

    private getAutoRegisterProvider(type: ProviderType, handler: AutoRegisterHandler) {
        const unfiltedProviders =  glob.sync(`./src/${type}/**/*.ts`)
        unfiltedProviders.forEach(servicePath => {
            let unfiltedProvider = require(servicePath)
            unfiltedProvider = this.normAutoRegisterDependency(unfiltedProvider)
            const providers = unfiltedProvider.reduce((list:Function[], provider: IProvider) => {
                let metadata
                if((metadata = Reflect.getOwnMetadata(classMetadata, provider))) {
                    if(!metadata[type]) return
                    list.push(provider)
                }
                return list
            },[])
            providers.forEach((provider:IProvider) => handler(provider))
        })
    }

    private normAutoRegisterDependency(dep: Object) {
        if(!dep) return []
        if(isPlainObject(dep)) dep = [dep]
        else {
            const newDep = []
            for(let key in dep) newDep.push(dep[key])
            dep = newDep
        }
        return dep
    }

    private getAndAddControllerMetadataToRoute(controller:IController, router:Router) {
        const routes = this.getControllerMetadata(controller)
        this.addControllerMetadataToRoute(routes, router)
    }

    private addControllerMetadataToRoute(metadatas:IRoutePayload[],  router:Router) {
        metadatas.forEach((route:IRoutePayload) => {
            const { path, handler } = route
            if(route.verb) {
                let verbs = route.verb
                if(!isArray<string>(verbs)) verbs = [verbs]
                verbs.forEach(verb => {
                    verb = verb.toLowerCase();
                    (router as any)[verb](path, handler)
                })
            }
        })
    }

    private getControllerMetadata(controller:IController):IRoutePayload[] {
        const routes:IRoutePayload[] = []
        const baseMetadata:IControllerMetadata = Reflect.getOwnMetadata(classMetadata, controller).controller
        const { basepath,verb: baseVerb } = baseMetadata
        const handlers = Object.getOwnPropertyNames(controller.prototype)
        handlers.forEach(handler => {
            let metadata: IHandlerMetadata
            if((metadata = Reflect.getMetadata(methodMetadata,controller.prototype,handler))) {
                metadata.routes?.forEach(route => {
                    let { verb, path } = route
                    if(!verb) verb = baseVerb as any
                    routes.push({
                        path: joinRoutePath(basepath, path),
                        verb,
                        handler: controller.prototype[handler]
                    })
                    this.routeTable.push({
                        path: joinRoutePath(basepath, path),
                        verb,
                        handler: controller.prototype[handler]
                    })
                })
                
            }
        })
        return routes
    }

    private buildDependencyGraph() {
        const inDegreeMap = {}
        const depedMap = {}

        const depEntries = Object.entries(this.depGraph)
        depEntries.forEach(([name,deps]) => {
            inDegreeMap[name] = deps.length
            deps.forEach(dep => {
                if(!depedMap[dep]) depedMap[dep] = []
                depedMap[dep].push(name)
            })
        })

        const toposort = () => {
            const unhandleNode:string[] = []
            const inDegreeKey = Object.keys(inDegreeMap)
            const sort:string[] = []
            
            inDegreeKey.forEach(key => {
                if(!inDegreeMap[key]) unhandleNode.push(key)
            })

            while(unhandleNode.length) {
                const node = unhandleNode.pop()
                const deps = depedMap[node]
                deps && deps.forEach(dep => {
                    inDegreeMap[dep] -= 1
                    if(!inDegreeMap[dep]) {
                        unhandleNode.push(dep)
                    }
                })
                sort.push(node)
            }

            if(sort.length != inDegreeKey.length) return false
            return sort
        }
        
        const sort = toposort()
        if(!sort) Errors(3)
        sort.forEach(srv => {
            this.depStorage[srv] = this.makeDependency(srv, false)
        })
        Object.values(this.depStorage).forEach(dep => this.injectClassProperties(dep))
    }
    
    public makeDependency(srv: string, injectProperty:boolean = true, makeChain:Set<string> = new Set()) {
        const Srv = this.depKVMap[srv]
        const deps = this.depGraph[srv]
        const Deps = deps.reduce((sumDeps, dep) => {
            sumDeps.push(this.depStorage[dep])
            return sumDeps
        },[])
        const dependencyInstance = new Srv(...Deps)
        if(injectProperty) this.injectClassProperties(dependencyInstance, makeChain)
        return dependencyInstance
    }

    public injectClassProperties(target: ClassInstance, makeChain:Set<string> = new Set()) {
        const needInjectProperties:IInjectedPropertyPayload = Reflect.getMetadata(classPrototypeMetadata, target)?.injectedProperty
        if(!needInjectProperties) return
        Object.entries(needInjectProperties).forEach(([property, options]) => {
            const typename = options.name
            if(!options.new) target[property] = this.depStorage[typename]
            else if(options.new === 'new') {
                if(makeChain.has(typename)) Errors(4)
                makeChain.add(typename)
                if(typename === 'clsContext') target[property] = require('../plugins/cls').clsContext
                else target[property] = this.makeDependency(options.name, true, makeChain)
            } else if(options.new === 'request') Errors(5)
        })
    }

    private addServiceToDepGraph(target: IService) {
        this.addProviderToDepGraph(target, 'service')
    }

    private addDaoToDepGraph(target: IDao) {
        this.addProviderToDepGraph(target, 'dao')
    }

    private addProviderToDepGraph(target: IProvider, type: string) {
        let metadata:IClassMetadata
        if((metadata = Reflect.getOwnMetadata(classMetadata, target))) {
            const info = metadata[type]
            if(!info) return
            const { names } = info
            const masterName = names[0]
            names.forEach(name => {    
                if(name === masterName) return 
                this.depMapTable[name] = masterName
            })
            
            this.collectDepBuildRequisiteDep(target)
            this.depKVMap[masterName] = target
        }
    }

    private collectDepBuildRequisiteDep(dependency: IProvider) {
        const metadata: IDependencyMetadata = Reflect.getOwnMetadata(classMetadata, dependency)
        if(!metadata) return
        let { dependency: paramsDep } = metadata
        if(paramsDep) {
            paramsDep = paramsDep.filter(v => v)
            const name = dependency.prototype.constructor.name
            this.depGraph[name] = []
            const deps =  Object.values(paramsDep)
            deps.forEach(dep => {
                this.depGraph[name].push(dep)
            })
        }
    }
}


const joinRoutePath = (basepath: string, path: string) => {
    if(path.startsWith('/')) path = path.slice(1)
    if(basepath == '/') basepath = ''
    return basepath + '/' + path
}
