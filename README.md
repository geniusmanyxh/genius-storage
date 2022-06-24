# genius-storage使用文档
A user-friendly browser cache tool

[我的个人博客地址](https://www.geniusman.top/)

[CSDN文章地址](http://t.csdn.cn/ODOVj)
[GitHub源码及文档地址](https://github.com/geniusmanyxh/genius-storage)

`genius-storage` 是一个扩展性较好、易上手、统一操作浏览器的 `localStorage` 、`sessionStorage` 、`cookie` 的JavaScript工具库。

 

------



## 一、安装

- 1、到GitHub源码地址下载`static` 目录下的`GStorage.js`文件,  通过 `script` 标签引入

```javascript
// https://github.com/geniusmanyxh/genius-storage
<script src="GStorage.js" > </script>
<script>
    const gCookie = GStorage('cookie',{prefix:'key_prefix', suffix:'key_suffix'})
	gCookie.setFun('gcookie_key',1)
	gCookie.getFun('gcookie_key')
</script>

```



- 2、提供一个在线地址供大家测试时使用，但是这个方法不建议长期使用，因为我的云服务器过期了，这个就用不了啦！

```js
<script src="https://api.geniusman.top/cdn/genius-storage/GStorage.js" > </script>
<script>
    const gCookie = GStorage('cookie',{prefix:'key_prefix', suffix:'key_suffix'})
	gCookie.setFun('gcookie_key',1)
	gCookie.getFun('gcookie_key')
</script>

```



- 3、通过 npm 安装

```js
npm install genius-storage
```

项目使用

```js
import { GStorage } from "genius-storage";

const gLocal = GStorage('local')

gLocal.setFun('key',{value:1})
gLocal.getFun('key')

```



------



## 二、具体使用

### 1.可以创建的类型有3种

- 1、创建 `localStorage` 的操作实例

```js
// 参数1: 必须是字符串类型——string, value: 'local' | 'session' | 'cookie'
// 参数2: 可选的配置参数, 如果要传，则必须是一个对象类型——Object， value: {prefix:'',suffix:''...}
const gLocal = GStorage('local',options)

```



- 2、创建 `sessionStorage` 的操作实例

```js
// 参数1: 必须是字符串类型——string, value: 'local' | 'session' | 'cookie'
// 参数2: 可选的配置参数, 如果要传，则必须是一个对象类型——Object， value: {prefix:'',suffix:''...}
const gSession = GStorage('session',options)

```



- 3、创建 `cookie` 的操作实例

```js
// 参数1: 必须是字符串类型——string, value: 'local' | 'session' | 'cookie'
// 参数2: 可选的配置参数, 如果要传，则必须是一个对象类型——Object， value: {prefix:'',suffix:''...}
const gCookie = GStorage('cookie',options)

```



------



### 2、通用的配置属性 `options`

- 1、`options` 类型是一个对象

```js
let options = {
    prefix: 'prefix', // key标识的前缀; defaultValue: ''
    suffix: 'suffix', // key标识的后缀; defaultValue: ''
    linkSign: '.', // key标识的连接符号; defaultValue: '.'  ———— 前缀连接key连接后缀的特殊符号，如 ./@/%/等等
    
   isReset: true, // 默认是强制覆盖原有key对应的值; defaultValue: true         ———— 如果不全局配置中设置，可以在setFun方法里面单独设置是否可以强制覆盖缓存旧数据
    
   expireTime: -1, // 判断只要是0 或者 负数就不设置过期时间; defaultValue: -1   ———— 如果不全局配置中设置，可以在setFun方法里面单独设置过期时间
    
   typeTime: 'ms', // 缓存过期时间的换算单位,默认是毫秒(ms); defaultValue: 'ms' ———— 如果不全局配置中设置，可以在setFun方法里面单独设置其他时间换算单位
}

```



- 2、配置属性都是可选参数，你可以传0个或者多个属性；甚至不传该参数，那么它将自动使用自身的默认值

```js
// 1、不传配置参数，也可以创建实例对象
const gCookie = GStorage('cookie')

// 2、0个参数，也就是一个空对象
const gCookie = GStorage('cookie',{})

// 3、1个参数或者多个参数
const gCookie = GStorage('cookie',{prefix:'java'})
const gCookie = GStorage('cookie',{prefix:'java',suffix:'script',linkSign:'@'})

```



- 3、可以在创建实例后，在对其配置属性进行修改（但是非常不建议该操作，具体使用看情况）

```js
// 所有实例属性
_instance: Storage {length: 0} ===> 实例 (这个不能改，改错了就完犊子了)
_instanceType: "local"         ===> 实例类型 (这个也不能改，改错了就也可能完犊子)
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

_expireTime: -1 			   ===> 过期时间 (可以改，但是类型必须是——number)
_isReset: true                 ===> 是否可以重置数据标识 (可以改，但是类型必须是——number)
_linkSign: "."				   ===> 前后缀连接符号 (可以改，但是类型必须是——string)
_prefix: "" 				   ===> 前缀符号 (可以改，但是类型必须是——string)
_suffix: ""					   ===> 后缀符号 (可以改，但是类型必须是——string)
_typeTime: "ms"				   ===> 过期时间单位 (可以改，但是类型必须是——string)

```

修改方式：【实例】【.】【属性】【=】【值】

```js
const gCookie = GStorage('cookie',{prefix:'java'})
gCookie._prefix = "node"
```



- 4、配置属性—— `typeTime` 具体有哪些单位，默认单位：毫秒(ms)

```js
// 该属性主要作用是为了换算最后的过期时间；最终的过期时间其实是一个时间戳===> Date.now() + expireTime
毫秒(ms) —— 默认单位
秒(s) —— 【expireTime = expireTime * 1000】
分(min) —— 【expireTime = expireTime * 60 * 1000】
时(h) —— 【expireTime = expireTime * 60 * 60 * 1000】
天(d) —— 【expireTime = expireTime * 864e5】
周(w) —— 【expireTime =  expireTime * 7 * 864e5】
月(m) —— 【expireTime = expireTime * 30 * 864e5】
年(y) —— 【expireTime = expireTime * 365 * 864e5】

所以typeTime的单位可以是 = 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'm' | 'y'

// 最终的过期时间 ===> Date.now() + expireTime

```

**所以`typeTime`的单位可以是 = 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'm' | 'y' ；**

这里的一个月我规定为30天，一年为365天；并没有去动态计算当前时间到下个月或者明年的这一天，时间段内具体有多少天，这个我认为太复杂了，大家可以给我提点建议。



------



### 3、目前可以使用的方法有哪些

目前实例统一可以调用的方法有：`setFun`  、`getFUn` 、`existFun` 、`delFun` 、`allKey` 、 `clearFun` 6个方法

-  setFun (key, value, isReset?, expireTime?, typeTime?)

```js
// 参数类型
key: string  ===> 必传参数
value: any   ===> 必传参数，如果是undefined，会被赋值为空字符串
isReset: boolean ===> 可选参数，默认为true，代表遇到相同key标识的值时，可以直接覆盖旧数据，false则不覆盖
expireTime: nummber ===> 可选参数，默认-1，代表不设置过期时间，只有当【expireTime > 0】 时才会设置过期时间
typeTime: string ===> 可选参数，默认ms，代表过期时间的基本单位，可以设置其他单位来进行时间换算
```

使用示例：

```js
const gLocal = GStorage('local',options)
gLocal.setFun('key',{value:'666'}) // 代表设置了一个有效期为永久的值
gLocal.setFun('key',{value:'666'},false) // 代表设置了一个有效期为永久的值,且不会被覆盖
gLocal.setFun('key',{value:'666'},false,3000) // 代表设置了一个有效期为3000ms(3秒)的值,且不会被覆盖
gLocal.setFun('key',{value:'666'},true,3, 'm') // 代表设置了一个有效期为3个月的值,但是会被覆盖的值

```



- getFun (key)

```js
// 参数类型
key: string  ===> 必传参数

return value:any | undefined
// 1、如果查询到了值，没有过有效期，则返回其值
// 2、如果查询到了值, 过了有效期，则返回undefined ，并删除其值
// 3、如果没有查询到值，返回undefined
```

使用示例：

```js
const gLocal = GStorage('local',options)
gLocal.setFun('key1',{value:'666'}) // 代表设置了一个有效期为永久的值
gLocal.setFun('key2',{value:'666'},false,3000) // 代表设置了一个有效期为3000ms(3秒)的值,且不会被覆盖

//=============================================================
setTimeout(() => {
    gLocal.getFun('key1') // ==============> {value: '666'}
    gLocal.getFun('key2') // ==============> undefined 
},4000)
```



- existFun (key)

```js
// 参数类型
key: string  ===> 必传参数

return true | false
// 1、如果查询到了值，没有过有效期，则返回true
// 2、如果查询到了值, 过了有效期，则返回false，并删除其值
// 3、如果没有查询到值，返回false
```

使用示例：

```js
const gLocal = GStorage('local',options)
gLocal.setFun('key1',{value:'666'}) // 代表设置了一个有效期为永久的值
gLocal.setFun('key2',{value:'666'},false,3000) // 代表设置了一个有效期为3000ms(3秒)的值,且不会被覆盖

//=============================================================
setTimeout(() => {
    gLocal.existFun('key1') // ==============> true
    gLocal.existFun('key2') // ==============> false 
},4000)

```



- delFun (key)

```js
// 参数类型
key: string  ===> 必传参数

// 1、如果查询到了值，就删除
// 2、如果没有查询到值，也不会报错

```

使用示例：

```js
const gLocal = GStorage('local',options)
gLocal.setFun('key1',{value:'666'}) // 代表设置了一个有效期为永久的值
gLocal.setFun('key2',{value:'666'},false,3000) // 代表设置了一个有效期为3000ms(3秒)的值,且不会被覆盖

//=============================================================
setTimeout(() => {
    gLocal.delFun('key1') // ==============> 已删除
    gLocal.delFun('key2') // ==============> 已删除
    gLocal.delFun('key3') // ==============> 未执行删除操作，但不会报错
},4000)

```



- allKey (conditions?)

```js
// 参数类型
conditions: object  ===> 可选参数

// 参数属性
conditions: {
	prefix:'前缀',
    suffix:'后缀',
    linkSign:'连接符号'
}
return string[]

// 1、如果不传 conditions 参数，则返回已经存储了的所有值的key，并把它们放在一个数组里面返回
// 2、如果传了 conditions 参数，则回去将所有的key值在筛选一遍，并把它们放在一个数组里面返回
// 3、参数属性是可以传0个或者多个

```

使用示例：

```js
const gLocal = GStorage('local')
gLocal.setFun('key1',{value:'666'}) // 代表设置了一个有效期为永久的值

gLocal._prefix = 'java'
gLocal.setFun('key2',{value:'666'}) // 代表设置了一个有效期为永久的值

gLocal._suffix = 'script'
gLocal.setFun('key3',{value:'666'}) // 代表设置了一个有效期为永久的值

gLocal._linkSign = '#'
gLocal.setFun('key4',{value:'666'}) // 代表设置了一个有效期为永久的值

// 此时，所有的key值数组为：['key1','java.key2','java.key3.script','java#key4#script']
//=============================================================
gLocal.allKey() // ===> return ['key1','java.key2','java.key3.script','java#key4#script']

gLocal.allKey({prefix:'java'}) // ===> return ['java#key4#script']

gLocal.allKey({prefix:'java',linkSign:'.'}) // ===> return ['java.key2','java.key3.script']

gLocal.allKey({prefix:'java',linkSign:'.',suffix:'script'}) // ===> return ['java.key3.script']

```



- clearFun (conditions?)

```js
// 参数类型
conditions: object  ===> 可选参数

// 参数属性
conditions: {
	prefix:'前缀',
    suffix:'后缀',
    linkSign:'连接符号'
}

// 1、如果不传 conditions 参数，则默认会删除所有该类型的所有缓存
// 2、如果传了 conditions 参数，则会根据条件去删除，所有匹配条件的缓存
	// 2.1 如果是一个空对象{}，不好意思我会给你黄色警告，其背后做任何删除操作
	//提示内容为：【我们在您的clearFun方法中获取的配置属性里面并没有监测到{prefix | suffix | linkSign}属性,因为该操作存在风险,我们不做任何删除操作,请您检查并修改后再次进行此操作】

	// 2.2 如果只传了prefix属性，则我们会去删除指定条件为【前缀===prefix && 连接符号===linkSign(默认值)】

	// 2.3 如果只传了suffix属性，则条件为 【后缀===suffix && 连接符号===linkSign(默认值)】

	// 2.4 如果只传了linkSign属性，则条件为【缓存唯一标识只要包含了该连接符号的都删除】

	// 2.5 如果传了prefix、linkSign，则条件为【前缀===prefix && 连接符号===linkSign】	
	
	// 2.6 如果传了suffix、linkSign，则条件为【后缀===suffix && 连接符号===linkSign】

	// 2.7 如果传了prefix、suffix，则条件为【前缀===prefix && 后缀===suffix && 连接符号===linkSign(默认值)】

	// 2.8 如果传了prefix、suffix、linkSign，则条件为【前缀===prefix && 后缀===suffix && 连接符号===linkSign】

```



## 三、一些注意事项

- 过期时间对于`sessionStorage` 类的缓存来说，作用不大，因为浏览器关闭就会原地去世。
- **过期时间对于`cookie` 类的缓存来说, 如果不设置过期时间(此时属于会话缓存,浏览器关闭就去世), 只有设置了过期时间才是本地缓存(只有手动删除或者过期时间到了自动失效)**
- 配置参数属性、或者传参时，需要数据类型与规定一致，不然可能导致我给你一个黄色警告或者红牌警告。
- 这里着重说明一下参数`key` 的一些规范

**1、key值的类型必须是一个string(字符串类型)  ||  如果犯规 ===> 红色错误警告**

**2、key值不能是一个空字符串   ||  如果犯规  ===> 红色错误警告**

**3、key值不能包含空格或者制表符tab    ||  如果犯规  ===> 黄色警告**

**4、key值不能是一个空字符串、null、undefined  ||  如果犯规  ===> 黄色警告**



...后续完善中！

