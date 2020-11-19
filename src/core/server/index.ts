import { isPlainObject, isArray } from './../decorator/tools';
import { methodMetadata } from './../decorator/method';
import { IHandlerMetadata } from './../types/method';
import { classMetadata, IControllerMetadata, IController, IClassMetadata, IDependency, IService, IDependencyMetadata } from './../types';
import Koa, { Middleware } from 'koa'
import Router from './router/router'
import glob from 'glob'
import 'reflect-metadata'

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
    [key:string]: IDependency
}

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
        this.getAutoRegisteredService()
        app.use(this.getRouter())
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
        const router = this.router
        this.autoRegsiterController(router)
        return router.routes() as any
    }

    public registerController(target: IController) {
        const router = this.router
        this.getAndAddControllerMetadataToRoute(target, router)
    }

    public registerService(target: IService) {
        this.addServiceToDepGraph(target)
    }

    public getTypeFromName(name: string) {
        if(this.depKVMap[name]) return this.depKVMap[name]
        name = this.depMapTable[name]
        return this.depKVMap[name]
    }

    private autoRegsiterController(router:Router) {
        const controllerList = glob.sync("./src/controller/**/*.ts")
        controllerList.forEach(controllerPath => {
            let controllers = require(controllerPath)
            controllers = this.normAutoRegisterDependency(controllers)
            const realController = controllers.reduce((list:Function[],controller:IController) => {
                let metadata
                if((metadata = Reflect.getOwnMetadata(classMetadata, controller))) {
                    if(!metadata.controller) return
                    list.push(controller)
                }
                return list
            },[])
            realController.forEach((controller:IController) => {
                const routes = this.getControllerMetadata(controller)
                this.addControllerMetadataToRoute(routes, router)
            })
        })
    }

    private normAutoRegisterDependency(dep: Object) {
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
        if(!sort) throw new Error("Error: must be register dependency first beforehand.")
        sort.forEach(srv => {
            const Srv = this.depKVMap[srv]
            const deps = this.depGraph[srv]
            const Deps = deps.reduce((sumDeps, dep) => {
                sumDeps.push(this.depStorage[dep])
                return sumDeps
            },[])
            this.depStorage[srv] = new Srv(...Deps)
        })
    }
    
    private addServiceToDepGraph(target: IService) {
        let metadata:IClassMetadata
        if((metadata = Reflect.getOwnMetadata(classMetadata, target))) {
            const { service } = metadata
            if(!service) return
            const { names } = service
            const masterName = names[0]
            names.forEach(name => {     
                this.depMapTable[name] = masterName
            })
            
            this.collectDepBuildRequisiteDep(target)
            this.depKVMap[masterName] = target
        }
    }

    private getAutoRegisteredService() {
        const unFiltedServicesList = glob.sync('./service/**/.ts')
        unFiltedServicesList.forEach(unFiltedServicePath => {
            let unFiltedServices = require(unFiltedServicePath)
            unFiltedServices = this.normAutoRegisterDependency(unFiltedServices)
            unFiltedServices.forEach(unFiltedService => {
                this.addServiceToDepGraph(unFiltedService)
            })
        })
    }

    private collectDepBuildRequisiteDep(dependency: IDependency) {
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
