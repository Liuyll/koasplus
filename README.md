# overkos
a node.js web frame which base DI/IOC container
## overkos是什么?
`overkos`是一个DI/IOC框架, 它跟`nestjs`一样拥有充足的装饰器来自动管理你的类, 然而更加轻量.考虑清楚, 你是否需要`nodejs`去完成大量的后端工作,亦或者只是使用它作为`BFF`.如果只是需要作为`BFF`层,那么`overkos`肯定比`nestjs`更适合你.

`overkos`的核心默认使用`koa`，但它本质上是提供了一个`DI/IOC`的容器，所以你可以为其他框架开发适配的接口。

需要注意的是, `over-kos`的很多功能都需要`decorator`的支持，所以你必须使用`typescript`进行开发。

## install
```
npm install overkos
```

此外，`overkos`提供了内置的脚手架用来创建与修改项目
```
npm install overkos-cli
overkos create <appname>
```
## 优势
比起`koa`繁杂的操作,`overkos`能大幅度的提升你的工作效率.
```
@GET('test')
handler(ctx, next) {
    ctx.body = 'hello overkos'
}
```
一个简单的路由就这样完成了,并且它支持很多使用`koa`或`express`实现起来非常复杂的繁复操作.

你可以做很多有趣的事情:
+ 在路由上添加中间件
+ 不需要`import`任何变量
+ 快捷获取`context`上的变量
+ ......

### cls
另外一个很有用的地方是, `overkos`内置了一个`cls`(`continuation local storage`)以让你在任何地方访问当前`context`的自定义储存内容.

## 约定
`overkos`采用了常见的`MVC`模式进行开发，它约定了几个目录。
与你的应用根路径`app.ts`相对应的相对路径:
+ `src/controller`
+ `src/service`
+ `src/dao`
+ `src/middleware`

`overkoa`会主动读取这几个目录下的装饰器，并自动注册。

## decorator
`overkos`提供了大量的装饰器以简化开发流程.

### Route
`overkos`
+ GET
+ POST
+ DELETE
+ PUT

有趣的是, `overkos`只提供这几个常用的路由装饰器. 如果你需要更多的`method`类型,你可以自己定制
```
const OPTION = addRouteDecorator('option')

@OPTION('/option')
handler() {}
```

### DI
`overkos`最有趣的地方就在于依赖注入

#### Controller
```
Controller(basepath:string)
```
`Controller`注册一个`class`为控制器，只有被`Controller`注册过的类方法，才能作为路由的`handler`

> 建议遵从`MVC`的开发模式，`Controller`调用不同的`Service`来提供服务，`Controller`本身不操控任何数据

#### Service
```
Service(name: string)
```
`Service`为每一个`Controller`提供下层服务，你的`Service`也可以依赖其他的`Service`

#### Dao
```
Dao(name: string)
```
`Dao`层一般来提供操作数据库或数据储存中心，它是`Service`工作的最底层核心。
#### Provide
```
Provide(name: string)
```
`Provide`默认为`DI/IOC`容器提供最普遍的依赖项，一个依赖可以是`Controller`，也可以是`Service`和`Dao`,当然也可以是其他用户提供的依赖。

#### Inject
```
Inject(name: string)
Inject(options: IInjectOptions)
```
`Inject`是`overkos`核心的装饰器，它自动注入用户所需要的依赖

##### 按类型注入
一个最基本的用法:
```
@Service()
class Srv1 {
    constructor()
}

@Service()
class Srv2 {
    constructor(@Inject() srv1: Srv1) {} 
}
```
此时`Srv1`将自动作为`Srv2`的构造依赖传入，不需要用户手动进行任何`new`操作。

> `Inject`默认是通过修饰的参数类型来进行推导的，所以希望你传入正确的类型，不要使用基础类型！

##### 按名称注入

当然，在有些情况下，你希望`Inject`是通过名称注入的。一般情况，这在一个被注入的类有了一个别名时非常有用
```
@Service('bala')
class Srv1 {
    constructor()
}

@Service()
class Srv2 {
    constructor(@Inject('bala') srv1) {} 
}
```
这种也是被支持的。
> 如果同时出现名称和类型，`overkos`会只使用名称来查找依赖

#### 生命周期
在`overkos`里，一个依赖被框架管理后，它可以被用户指定为以下几种周期：
+ `singleton`: 默认的生命周期，全局单例
+ `request`: 每个请求创建一次
+ `new`: 任何时候都被重新创建

这些配置可以在传入的`IInjectOptions`里进行配置
```
@Inject({
    name: 'baba',
    new: 'new' | 'singleton' | 'request',
})
```

#### 注入属性
实际上, `Inject`不仅能注入参数，还能直接注入类的属性。
```
class Test {
    @Inject()
    args: Srv1
}
```
需要注意的是，注入的属性不能直接在构造函数里使用。
```
class Test {
    @Inject()
    args: Srv1

    constructor() {
        console.log(this.args.value) // Error
    }
}
```

如果你要在构造函数里使用属性，请直接通过构造函数参数来定义属性
```
class Test {
    constructor(@Inject() args:Srv1) {
        console.log(this.args.value) // true
    }
}
```

#### 不支持request生命周期
注意，为`property`注入时，不支持`request`生命周期。


### 参数注入
为方便开发,`overkos`提供了`Controller`里`handler`参数的一系列装饰器

#### Body
```
Body(key ?: string)
```
`Body`装饰器获取`request`里`payload`的数据。

当不传入参数时，会获取整个`payload`.

> 无需考虑`application/type`，如果你使用的是`koa`的话，框架会自动帮你引入`koa-parsebody`中间件做处理。
#### Params
```
Params(key: string)
```
如果你使用的是匹配路由:`path/:id`，那么可以通过`Params`获取到参数的实际值。
```
@GET('test/:id')
handler(ctx, next, @Params('id') id) 
```

### 参数验证
只是获取`Body`里的数据依然还是需要后续处理，框架通过装饰器提供了一些验证方法
> 注意，参数验证只处理`Body`里的数据
#### NonNullable
```
NonNullable(key:string)
```
`NonNullable`跟`Body`修饰器基本一致，但它保证了获取的值不为`null`，否则会返回一个`500`错误。(当然，你可以通过框架提供的中间件定制抛出错误)

#### Email
```
Email(key:string)
```
`Email`保证参数必须是邮箱格式。

#### Verify
`Verify`是框架提供的定制验证装饰器的方法，`overkos`的验证库采用的是`joi`。

```
interface IValidateOptions {
    verify ?: string
    allow ?: string | string[]
    valid ?: string | string[]
    match ?: string
    matchParams ?: any[]
}

Verify = (key: string, method: string | IValidateOptions | Array<any> | RegExp, extra ?: any)
```

参数:
+ arg1: `body` key值
+ arg2: 
    + string: 验证方法, 可以参考`joi`的几种验证类型。
    + array: 有效的几个值，可以为不同类型

一个简单的例子，创建一个匹配正则表达式的装饰器
```
const PatternPhone = (key: string) => 
    Verify(key, /^1[0-9]{10}/)
```

### 参数装换
`overkos`不仅提供参数的验证，还提供了快捷的转换功能。
一个简单的转换例子
```
@GET('test')
handler(ctx, next, @Int('id') id) => {
    console.log(typeof id === 'number')
} 
```

#### Int
将字符串值转化为Int，若无法转换或为空值则抛出一个错误
```
Int(key: string, allowNull:boolean = false) 
```
如果你接受一个空值，可以传入第二个参数为`true`值。
> 请注意，一个空值无法进行任何转换，它只会返回`undefined`

#### Bool
将`"false"` | `"0"` 值转化为`false`, 其他值转换为`true`
```
Bool(key: string, allowNull:boolean = true) 
```
> 需要注意的是，`undefined`和`null`都不会被进行任何转化，它会返回原值。如果你禁止`undefined`和`null`的传入，设置第二个参数为`false`

#### Trim
将字符串左右两边的空格去掉
```
Trim(key: string, allowNull:boolean = false) 
```


### CLS
`cls`让你在任何地方都可以访问到当前`request`的内容.

#### clsContext
`clsContext`是框架初始化的`cls`实例,
你可以这样获得`clsContext`:
```
class Service {
    @Inject('clsContext')
    clsContext
}
```
如果有些地方不方便以类封装, 框架也直接导出了它:
```
import { clsContext } from 'overkoa' 
```

框架内置了几个数据让你方便访问`oa`的原生`ctx`.

+ req
+ res
+ query
+ body
+ href
+ url
+ method

#### get
你可以通过`get`方法取得`cls`储存的数据
```
clsContext.get(key)
```

#### set
你可以通过`set`方法储存数据至当前`context`
```
clsContext.set(key, data)
```
需要注意,`key`不要与框架提供的默认数据`key`值冲突.



