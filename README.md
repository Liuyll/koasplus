# overkoa

## overkoa是什么?
`overkoa`是一个DI/IOC框架, 它跟`nestjs`一样拥有充足的装饰器来自动管理你的类, 然而更加轻量.考虑清楚, 你是否需要`nodejs`去完成大量的后端工作,亦或者只是使用它作为`BFF`.如果只是需要作为`BFF`层,那么`overkoa`肯定比`nestjs`更适合你.

需要注意的是, 因为`overkoa`依赖`reflect-metadata`,所以必须使用`typescript`.

## 优势
比起`koa`繁杂的操作,`overkoa`能大幅度的提升你的工作效率.
```
@GET('test')
handler(ctx, next) {
    ctx.body = 'hello overkoa'
}
```
一个简单的路由就这样完成了,并且它支持很多`koa`以及`koa-router`实现起来非常复杂的繁复操作.

你可以做很多有趣的事情:
+ 在路由上添加中间件
+ 不需要`import`任何变量
+ 快捷获取`context`上的变量
+ ......

## decorator
`overkoa`提供了大量的装饰器以简化开发流程.

### Route
+ GET
+ POST
+ DELETE
+ PUT

有趣的是, `overkoa`只提供这几个常用的路由装饰器. 如果你需要更多的`method`类型,你可以自己定制