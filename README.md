# overkos

## overkoa是什么?
`overkos`是一个DI/IOC框架, 它跟`nestjs`一样拥有充足的装饰器来自动管理你的类, 然而更加轻量.考虑清楚, 你是否需要`nodejs`去完成大量的后端工作,亦或者只是使用它作为`BFF`.如果只是需要作为`BFF`层,那么`overkos`肯定比`nestjs`更适合你.

`overkos`的核心默认使用`koa`，但它本质上是提供了一个`DI/IOC`的容器，所以你可以为其他框架开发适配的接口。

需要注意的是, `over-kos`的很多功能都需要`decorator`的支持，所以你必须使用`typescript`进行开发。

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

#### Service

#### Provide
