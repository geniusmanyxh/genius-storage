/**
 * @description 编写智能浏览器缓存公共类
 * @date 2022-06-17
 * @author 天界程序员
 */

/**
 * @description 根据使用者传入的存储类型以及对应的配置，返回对应存储类型的实例以及方法
 * @param {String} storageType 选择存储类型：local | session  | cookie
 * @param {Object} storageOptions 可选配置参数
 * @returns 返回一个可以操作的(LocalStorage | SessionStorage | Cookie)实例对象
 */
const GStorage = (storageType, storageOptions) => {
  /**
   * @description 封装cookie增删改查的类
   */
  class FormatCookie {
    constructor() {}

    // 合并对象
    assign(target) {
      for (let i = 1; i < arguments.length; i++) {
        let source = arguments[i]
        for (let key in source) {
          target[key] = source[key]
        }
      }
      return target
    }

    read(value) {
      if (value[0] === '"') {
        value = value.slice(1, -1)
      }
      return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
    }
    write(value) {
      return encodeURIComponent(value).replace(
        /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
        decodeURIComponent
      )
    }

    setItem(key, value, attributes) {
      if (typeof document === 'undefined') {
        return
      }

      let defaultAttributes = { path: '/' }

      attributes = this.assign({}, defaultAttributes, attributes)

      if (typeof attributes.expires === 'number') {
        // attributes.expires = new Date(Date.now() + attributes.expires * 864e5)
        attributes.expires = new Date(attributes.expires)
      }
      if (attributes.expires) {
        attributes.expires = attributes.expires.toUTCString()
      }

      key = encodeURIComponent(key)
        .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
        .replace(/[()]/g, escape)

      var stringifiedAttributes = ''
      for (var attributeName in attributes) {
        if (!attributes[attributeName]) {
          continue
        }

        stringifiedAttributes += '; ' + attributeName

        if (attributes[attributeName] === true) {
          continue
        }

        // Considers RFC 6265 section 5.2:
        // ...
        // 3.  If the remaining unparsed-attributes contains a %x3B (";")
        //     character:
        // Consume the characters of the unparsed-attributes up to,
        // not including, the first %x3B (";") character.
        // ...
        stringifiedAttributes += '=' + attributes[attributeName].split(';')[0]
      }

      return (document.cookie =
        key + '=' + this.write(value, key) + stringifiedAttributes)
    }

    getItem(key) {
      if (typeof document === 'undefined' || (arguments.length && !key)) {
        return
      }

      // To prevent the for loop in the first place assign an empty array
      // in case there are no cookies at all.
      var cookies = document.cookie ? document.cookie.split('; ') : []
      var jar = {}
      for (var i = 0; i < cookies.length; i++) {
        var parts = cookies[i].split('=')
        var value = parts.slice(1).join('=')

        try {
          var foundKey = decodeURIComponent(parts[0])
          jar[foundKey] = this.read(value, foundKey)

          if (key === foundKey) {
            break
          }
        } catch (e) {}
      }

      return key ? jar[key] : jar
    }

    removeItem(key, attributes) {
      this.setItem(
        key,
        '',
        this.assign({}, attributes, {
          expires: -1,
        })
      )
    }

    clear() {}
  }

  /**
   * @description 封装一个公共缓存类
   */
  class ComStorage {
    _prefix = '' // 前缀
    _suffix = '' // 后缀
    _linkSign = '.' // 前缀连接key连接后缀的特殊符号，如 ./@/%/等等
    _isReset = true // 默认是强制覆盖原有key对应的值
    _expireTime = -1 // 用于设置本地缓存过期时间,如果不全局设置，可以在setFun方法里面设置
    _typeTime = 'ms' // 用于设置过期时间的单位,默认时间单位是毫秒(ms),如果不全局设置，可以在setFun方法里面设置

    _instance = undefined // window.localStorage/window.sessionStorage/new FormatCookie()
    _instanceType = '' // local/session/cookie

    constructor(args) {
      TypeJudgment('string', args?.prefix) && (this._prefix = args?.prefix)
      TypeJudgment('string', args?.suffix) && (this._suffix = args?.suffix)
      TypeJudgment('string', args?.linkSign) &&
        (this._linkSign = args?.linkSign)
      TypeJudgment('boolean', args?.isReset) && (this._isReset = args?.isReset)
      TypeJudgment('number', args?.expireTime) &&
        (this._expireTime = args?.expireTime)
      TypeJudgment('string', args?.typeTime) &&
        (this._typeTime = args?.typeTime)

      TypeJudgment('string', args?.instanceType) &&
        (this._instanceType = args?.instanceType)

      if (this._instanceType === 'local') {
        this._instance = window.localStorage
      } else if (this._instanceType === 'session') {
        this._instance = window.sessionStorage
      } else if (this._instanceType === 'cookie') {
        this._instance = new FormatCookie()
      }
    }

    setFun(key, value, isReset, expireTime, typeTime) {
      // console.log('set fun')
      // 1、判断key是否合法, type:string and value is not ('' | null | undefined)
      if (key) {
        if (typeof key !== 'string') {
          ErrorTips(
            'err',
            'the type of key must be a string',
            'key值的类型必须是一个string(字符串类型)'
          )
        } else if (!key.trim()) {
          ErrorTips(
            'err',
            'the key cannot be an empty string',
            'key值不能是一个空字符串'
          )
        } else if (key.indexOf(' ') !== -1) {
          ErrorTips(
            'err',
            'the key cannot contain Spaces or tabs',
            'key值不能包含空格或者制表符tab'
          )
        } else if (!Number.isNaN(Number(key))) {
          ErrorTips('warn', '', 'key值最好不要全是数字')
        }
      } else {
        ErrorTips(
          'err',
          'the key cannot be an empty string or null or undefined',
          'key值不能是一个空字符串、null、undefined'
        )
      }

      // 2、判断value 是否合法, type: string | number | boolean | array | object ; cannot: undefined | null
      // 如果是null 或者 undefined 则给它赋值为空字符串
      // 如果值是合法的，则使用JSON.stringify()方法进行格式化
      if (value === undefined) {
        ErrorTips('warn', '', 'value值不能为undefined')
        value = ''
      } else if (value === null) {
        ErrorTips('warn', '', 'value值最好不是null 或者 undefined')
      }
      value = JSON.stringify(value)

      // console.log(666, value)
      // console.log(JSON.parse(value))

      // 3、监测是否传入了isReset属性
      if (isReset !== undefined) {
        if (typeof isReset !== 'boolean') {
          ErrorTips(
            'err',
            'the isReset parameter value must be a boolean',
            'isReset 参数值必须是一个boolean(布尔类型)'
          )
        }
      } else {
        // 如果没有传参数，则使用实例属性
        isReset = this._isReset
      }

      // 4、监测是否传入了expireTime 参数
      // 如果传入：判断是否合法
      // 如果没有传入则使用实例属性_expireTime
      if (expireTime) {
        if (typeof expireTime === 'number') {
          // 判断过期时间是否是小数，如果是则大于0，反之则等于0
          let isDouble = String(expireTime).indexOf('.') + 1
          // if (expireTime <= 0) {
          //   console.error('过期时间不能小于0,且不能为小数')
          //   throw Error(
          //     'The expiration time cannot be less than 0 and cannot be a decimal'
          //   )
          // } else
          if (isDouble > 0) {
            ErrorTips(
              'err',
              'The expiration time cannot be a decimal',
              '过期时间不能为小数'
            )
          }
        } else {
          ErrorTips(
            'err',
            'the expireTime parameter value must be a number',
            'expireTime 参数值必须是一个number(数值类型)'
          )
        }
      } else {
        // 如果没有传参数，则使用实例属性
        expireTime = this._expireTime
      }

      // 5、判断是否传入了typeTime参数
      // 如果传入了：则判断是否合法以及是有效的单位：毫秒(ms)/秒(s)/分(min)/时(h)/天(d)/月(m)/年(y)
      // 如果不传默认是ms
      if (typeTime !== undefined && typeTime !== null) {
        if (typeof typeTime === 'string') {
          let unit = typeTime.trim()

          if (unit === '') {
            ErrorTips(
              'err',
              'The expiration time unit cannot be an empty string',
              '过期时间单位不能是空字符串'
            )
          } else if (unit.indexOf(' ') !== -1) {
            ErrorTips(
              'err',
              'The unit of expiration time cannot contain Spaces or tabs',
              '过期时间单位不能包含空格或者制表符tab'
            )
          }

          let isTypeFlag =
            unit === 'ms'
              ? true
              : unit === 's'
              ? true
              : unit === 'min'
              ? true
              : unit === 'h'
              ? true
              : unit === 'd'
              ? true
              : unit === 'w'
              ? true
              : unit === 'm'
              ? true
              : unit === 'y'
              ? true
              : false
          if (!isTypeFlag) {
            ErrorTips(
              'err',
              'Input unit of time is not legitimate, legal units are: the milliseconds (ms) per second (s)/m (min)/(h) (m) (d)/day/month/year (y)',
              '输入的时间单位不合法,合法的单位有:毫秒(ms)/秒(s)/分(min)/时(h)/天(d)/月(m)/年(y)'
            )
          }
        } else {
          ErrorTips(
            'err',
            'The expiration time unit must be a string',
            '过期时间单位必须是字符串类型(string)'
          )
        }
      } else {
        // 如果没有传参数，则使用实例属性
        typeTime = this._typeTime
      }

      // console.log(key, value, isReset, expireTime, typeTime)

      // 6、配置过期时间
      // I expireTime参数优先级高于_expireTime属性：
      // 1.在全局配置了过期时间的情况下：
      // 如果参数传入expireTime === -1 则代表该次存储不设置过期时间
      // 如果参数传入expireTime !== -1 则代表该次存储的过期时间以这次参数为准
      // 2.在全局没有配置了过期时间的情况下：
      // 如果参数传入expireTime === -1 则代表该次存储不设置过期时间
      // 如果参数传入expireTime !== -1 则代表该次存储的过期时间以这次参数为准

      // II 如果传了过期时间，没有传单位，则默认单位ms

      // III 判断最终的过期时间是否大于0，如果是则转换为时间戳

      let expires_cookie = {} // 该对象主要用于设置cookie的过期时间
      if (expireTime > 0) {
        expireTime = formatExpireTime(expireTime, typeTime)
        expires_cookie.expires = expireTime
      }

      let getData = this.getFun(key)

      // 7、判断全局的前缀和后缀，如果两者都存在则都拼接在key上
      // 如果只判断出前缀合法，后缀不合法；则只拼接前缀
      // 如果只判断出后缀合法，前缀不合法；则只拼接后缀
      // 如果都不合法则不拼接，直接使用key
      if (this._prefix && this._suffix) {
        key = `${this._prefix}${this._linkSign}${key}${this._linkSign}${this._suffix}`
      } else if (this._prefix && !this._suffix) {
        key = `${this._prefix}${this._linkSign}${key}`
      } else if (!this._prefix && this._suffix) {
        key = `${key}${this._linkSign}${this._suffix}`
      }

      // 8、判断浏览器上是否已经存在该key标识对应的值
      // 如果存在：1、判断isReset===true ===> 覆盖；2、isReset===false ===> 不覆盖
      // 如果不存在：直接存入浏览器

      let data = {
        key,
        value,
        isReset,
        expireTime,
        typeTime,
      }

      if (getData) {
        if (isReset) {
          // console.log('重新覆盖了旧数据')
          this._instance &&
            this._instance.setItem(key, JSON.stringify(data), expires_cookie)
        } else {
          ErrorTips('warn', '', '此次操作没有覆盖旧数据')
        }
      } else {
        // console.log('写入了新数据')
        this._instance &&
          this._instance.setItem(key, JSON.stringify(data), expires_cookie)
      }
    }

    getFun(key) {
      // console.log('get fun')
      // 1、判断key是否合法, type:string and value is not ('' | null | undefined)
      if (key) {
        if (typeof key !== 'string') {
          ErrorTips(
            'err',
            'the type of key must be a string',
            'key值的类型必须是一个string(字符串类型)'
          )
        } else if (!key.trim()) {
          ErrorTips(
            'err',
            'the key cannot be an empty string',
            'key值不能是一个空字符串'
          )
        } else if (key.indexOf(' ') !== -1) {
          ErrorTips(
            'err',
            'the key cannot contain Spaces or tabs',
            'key值不能包含空格或者制表符tab'
          )
        } else if (!Number.isNaN(Number(key))) {
          ErrorTips('warn', '', 'key值最好不要全是数字')
        }
      } else {
        ErrorTips(
          'err',
          'the key cannot be an empty string or null or undefined',
          'key值不能是一个空字符串、null、undefined'
        )
      }

      // 2、判断全局的前缀和后缀，如果两者都存在则都拼接在key上
      // 如果只判断出前缀合法，后缀不合法；则只拼接前缀
      // 如果只判断出后缀合法，前缀不合法；则只拼接后缀
      // 如果都不合法则不拼接，直接使用key
      if (this._prefix && this._suffix) {
        key = `${this._prefix}${this._linkSign}${key}${this._linkSign}${this._suffix}`
      } else if (this._prefix && !this._suffix) {
        key = `${this._prefix}${this._linkSign}${key}`
      } else if (!this._prefix && this._suffix) {
        key = `${key}${this._linkSign}${this._suffix}`
      }

      // 3、使用实例方法获取对应key标识的值
      let getData = this._instance.getItem(key)

      // 4、使用JSON.parse() 方法将获取到的值进行转化
      if (getData) {
        try {
          getData = JSON.parse(getData)
        } catch (error) {
          console.error(error)
        }
      } else {
        // 如果没有获取到值,返回unddefined
        return undefined
      }

      // 5、判断存储的值的过期时间是否大于0
      if (getData.expireTime > 0) {
        // 此时说明该值是被设置了过期时间的
        let nowTime = Date.now()
        if (nowTime < getData.expireTime) {
          // 当前时间小于过期时间；说明该值还未过期，返回其值
          return getData.value
        } else {
          // 当前时间大于了过期时间；说明该值已经过期了；删除该key标识对应的值，并返回undefined
          ErrorTips(
            'warn',
            '',
            '该key:' +
              key +
              '标识对应的' +
              this._instanceType +
              '值已经过期了,请重新设置'
          )
          this._instance.removeItem(key)
          return undefined
        }
      } else {
        // 此时说明该值未被设置过期时间；直接返回其值
        return getData.value
      }
    }

    delFun(key) {
      // console.log('del fun')
      // 1、判断key是否合法, type:string and value is not ('' | null | undefined)
      if (key) {
        if (typeof key !== 'string') {
          ErrorTips(
            'err',
            'the type of key must be a string',
            'key值的类型必须是一个string(字符串类型)'
          )
        } else if (!key.trim()) {
          ErrorTips(
            'err',
            'the key cannot be an empty string',
            'key值不能是一个空字符串'
          )
        } else if (key.indexOf(' ') !== -1) {
          ErrorTips(
            'err',
            'the key cannot contain Spaces or tabs',
            'key值不能包含空格或者制表符tab'
          )
        } else if (!Number.isNaN(Number(key))) {
          ErrorTips('warn', '', 'key值最好不要全是数字')
        }
      } else {
        ErrorTips(
          'err',
          'the key cannot be an empty string or null or undefined',
          'key值不能是一个空字符串、null、undefined'
        )
      }

      // 2、判断全局的前缀和后缀，如果两者都存在则都拼接在key上
      // 如果只判断出前缀合法，后缀不合法；则只拼接前缀
      // 如果只判断出后缀合法，前缀不合法；则只拼接后缀
      // 如果都不合法则不拼接，直接使用key
      if (this._prefix && this._suffix) {
        key = `${this._prefix}${this._linkSign}${key}${this._linkSign}${this._suffix}`
      } else if (this._prefix && !this._suffix) {
        key = `${this._prefix}${this._linkSign}${key}`
      } else if (!this._prefix && this._suffix) {
        key = `${key}${this._linkSign}${this._suffix}`
      }

      this._instance.removeItem(key)
    }

    existFun(key) {
      // console.log('exist fun')
      // 1、判断key是否合法, type:string and value is not ('' | null | undefined)
      if (key) {
        if (typeof key !== 'string') {
          ErrorTips(
            'err',
            'the type of key must be a string',
            'key值的类型必须是一个string(字符串类型)'
          )
        } else if (!key.trim()) {
          ErrorTips(
            'err',
            'the key cannot be an empty string',
            'key值不能是一个空字符串'
          )
        } else if (key.indexOf(' ') !== -1) {
          ErrorTips(
            'err',
            'the key cannot contain Spaces or tabs',
            'key值不能包含空格或者制表符tab'
          )
        } else if (!Number.isNaN(Number(key))) {
          ErrorTips('warn', '', 'key值最好不要全是数字')
        }
      } else {
        ErrorTips(
          'err',
          'the key cannot be an empty string or null or undefined',
          'key值不能是一个空字符串、null、undefined'
        )
      }

      // 2、使用getFun获取该key标识的值
      let getData = this.getFun(key)
      if (getData) {
        return true
      } else {
        false
      }
    }

    allKey(options) {
      // console.log(options?.prefix, options?.suffix, options?.linkSign)
      // 获取当前浏览器该类型的缓存的所有key值，组装为一个数组
      let keyArr = [] // 存储返回结果的数组
      let getKeys = [] // 临时存储缓存keys的数组
      // 判断缓存类型
      if (this._instanceType === 'cookie') {
        let keys = Object.keys(this._instance.getItem())
        getKeys.push(...keys)
      } else {
        let keys = Object.keys(this._instance)
        getKeys.push(...keys)
      }

      // 过滤无效的keys
      if (getKeys.length > 0) {
        for (let i = 0; i < getKeys.length; i++) {
          let val = getKeys[i]
          // 判断缓存值的过期时间是否已经过期
          let isTrue = timeIsExpired(getStorageExpireTime(val, this._instance))
          if (isTrue) {
            // 如果过期，则继续遍历下一个
            continue
          } else {
            // 如果有效则添加到结果数组中
            keyArr.push(val)
          }
        }
      }

      // 判断是否输入了参数 以及key值数组长度是否大于0
      if (arguments.length > 0 && keyArr.length > 0) {
        // 判断参数是否是一个对象
        let paramType = TypeJudgment('object', options)

        if (!paramType) {
          ErrorTips(
            'warn',
            `The argument passed to the allKey method must be an object, for example: {prefix:' prefix ',suffix:' suffix ',linkSign:' linkSign '}`,
            `allKey 方法传入的参数必须是一个对象,例：{prefix:'前缀',suffix:'后缀',linkSign:'连接符号'}; 注意: 另外此时返回的是所有该类型的key值数组`
          )
          return keyArr
        } else {
          let { prefix, suffix, linkSign } = options
          // 判断是否都是undefined类型
          let prefixType = TypeJudgment('undefined', prefix)
          let suffixType = TypeJudgment('undefined', suffix)
          let signtype = TypeJudgment('undefined', linkSign)

          // 判断是否都是string类型
          let pString = TypeJudgment('string', prefix)
          let sString = TypeJudgment('string', suffix)
          let lString = TypeJudgment('string', linkSign)

          // 我们这里要先判断它们每个传入参数的类型是否是字符串，没有传入则不进行判断
          if (
            (!prefixType && !pString) ||
            (!suffixType && !sString) ||
            (!signtype && !lString)
          ) {
            ErrorTips(
              'err',
              'The prefix, suffix, and hyphen attributes must all be strings',
              '前缀、后缀、连接符号这三个属性都必须是字符串类型'
            )
          }

          // 我们这里先提前规定，如果没有传连接符号(linkSign)属性，我们就使用默认的连接符号this._linkSign
          signtype && (linkSign = this._linkSign)

          let resArr = [] // 存放符合条件的key值

          if (!prefixType && !suffixType && !signtype) {
            // 此时说明三个属性都是有值的
            // 将key值数组中的每一个值拿出来进行比较是否符合条件
            // 首先把值通过连接符号进行切割，判断长度，在判断其值
            keyArr.forEach((val) => {
              // 首先判断连接符号出现的次数是否大于等于2，如果大于等于2，则证明该key值的前缀和后缀都有
              let flag = judgeSignCounts(val, linkSign, 2)
              if (flag) {
                let getArr = mySplit(val, linkSign)

                // 判断前缀和后缀如果完全相等，则新增key值到结果集数组
                if (prefix === getArr[0] && suffix === getArr[1]) {
                  resArr.push(val)
                }
              }
            })
          } else if (!prefixType && !suffixType && signtype) {
            // 此时===> 传值：prefix、suffix  未传值：linkSign   —————— linkSign 使用 this._linkSign
            // 首先把值通过连接符号进行切割，判断长度，在判断其值
            keyArr.forEach((val) => {
              // 首先判断连接符号出现的次数是否大于等于2，如果大于等于2，则证明该key值的前缀和后缀都有
              let flag = judgeSignCounts(val, linkSign, 2)
              if (flag) {
                let getArr = mySplit(val, linkSign)

                // 判断前缀和后缀如果完全相等，则新增key值到结果集数组
                if (prefix === getArr[0] && suffix === getArr[1]) {
                  resArr.push(val)
                }
              }
            })
          } else if (!prefixType && suffixType && !signtype) {
            // 此时===> 传值：prefix、linkSign  未传值：suffix
            // 首先把值通过连接符号进行切割，判断长度，在判断其值
            keyArr.forEach((val) => {
              // 首先判断连接符号出现的次数是否大于等于1，如果大于等于1，则证明该key值的前缀有效
              let flag = judgeSignCounts(val, linkSign, 1)
              if (flag) {
                let getArr = mySplit(val, linkSign)

                // 判断前缀如果完全相等，则新增key值到结果集数组
                if (prefix === getArr[0]) {
                  resArr.push(val)
                }
              }
            })
          } else if (prefixType && !suffixType && !signtype) {
            // 此时===> 传值：suffix、linkSign  未传值：prefix
            // 首先把值通过连接符号进行切割，判断长度，在判断其值
            keyArr.forEach((val) => {
              // 首先判断连接符号出现的次数是否大于等于1，如果大于等于1，则证明该key值的后缀有效
              let flag = judgeSignCounts(val, linkSign, 1)
              if (flag) {
                let getArr = mySplit(val, linkSign)

                // 判断前缀如果完全相等，则新增key值到结果集数组
                if (suffix === getArr[1]) {
                  resArr.push(val)
                }
              }
            })
          } else if (!prefixType && suffixType && signtype) {
            // 此时===> 传值：prefix  未传值：suffix、linkSign  —————— linkSign 使用 this._linkSign
            // 首先把值通过连接符号进行切割，判断长度，在判断其值
            keyArr.forEach((val) => {
              // 首先判断连接符号出现的次数是否大于等于1，如果大于等于1，则证明该key值的前缀有效
              let flag = judgeSignCounts(val, linkSign, 1)
              if (flag) {
                let getArr = mySplit(val, linkSign)

                // 判断前缀如果完全相等，则新增key值到结果集数组
                if (prefix === getArr[0]) {
                  resArr.push(val)
                }
              }
            })
          } else if (prefixType && !suffixType && signtype) {
            // 此时===> 传值：suffix  未传值：prefix、linkSign  —————— linkSign 使用 this._linkSign
            // 首先把值通过连接符号进行切割，判断长度，在判断其值
            keyArr.forEach((val) => {
              // 首先判断连接符号出现的次数是否大于等于1，如果大于等于1，则证明该key值的后缀有效
              let flag = judgeSignCounts(val, linkSign, 1)
              if (flag) {
                let getArr = mySplit(val, linkSign)

                // 判断前缀如果完全相等，则新增key值到结果集数组
                if (suffix === getArr[1]) {
                  resArr.push(val)
                }
              }
            })
          } else if (prefixType && suffixType && !signtype) {
            // 此时===> 传值：linkSign  未传值：prefix、suffix
            // 首先把值通过连接符号进行切割，判断长度，在判断其值
            keyArr.forEach((val) => {
              // 首先判断连接符号出现的次数是否大于等于1，如果大于等于1，则证明该key值的连接符号有效
              let flag = judgeSignCounts(val, linkSign, 1)
              // 判断连接符号重复次数大于或者等于1，则新增key值到结果集数组
              if (flag) {
                resArr.push(val)
              }
            })
          }

          return resArr
        }
      }
      return keyArr
    }

    clearFun(options) {
      // 第一种情况：用户不传任何参数,默认删除所有该类型的缓存，慎重使用
      // 第二种情况：用户传入配置属性，使用allKey方法，获取所有与配置属性匹配的所有key值，然后使用delFun方法删除
      // 第一步：判断步骤和allKey差不多,所以我们这里使用this.allKey()获取对应的key值数组
      // 第三步：获取该类型所有的key值组装为一个数组；如果数组长度为0，则不做处理
      // 第四步：进行匹配key值的前缀和后缀进行removeItem操作

      // 首先定义一个用于返回结果数组的变量
      let resArr = []

      if (arguments.length > 0) {
        // 此时说明传入了参数，我们要进行参数类型判断，如果不是一个对象，则提醒他传入一个对象
        if (TypeJudgment('object', options)) {
          let optionsKeys = Object.keys(options)
          // console.log('optionsKeys', optionsKeys)
          if (
            optionsKeys.length > 0 &&
            (optionsKeys.includes('prefix') ||
              optionsKeys.includes('suffix') ||
              optionsKeys.includes('linkSign'))
          ) {
            resArr = [...this.allKey(options)]
          } else {
            ErrorTips(
              'warn',
              '',
              '我们在您的clearFun方法中获取的配置属性里面并没有监测到{prefix | suffix | linkSign}属性,因为该操作存在风险,我们不做任何删除操作,请您检查并修改后再次进行此操作'
            )
            return
          }
        } else {
          ErrorTips(
            'warn',
            '',
            'clearFun方法中的配置属性应该是一个对象类型(object);因为该操作存在风险,我们不做任何删除操作,建议你修改后再次操作,感谢您的的配合'
          )
          return
        }
      } else {
        // 此时没有传入配置参数,这时我们认为用户是想删除所有该类型的缓存数据,我们直接获取所有该类型的key值数组
        resArr = [...this.allKey()]
      }

      // console.log('================================================')
      // console.log(resArr)
      // console.log('===================================================')

      if (resArr.length > 0) {
        resArr.forEach((val) => {
          this._instance.removeItem(val)
        })
      }
    }
  }

  /**
   * @description 判断缓存值的过期时间是否已经过期,过期返回true，反之false
   * @param {Number} expireTime 过期时间参数（应该是一个时间戳）
   * @returns {boolean} true | false
   */
  function timeIsExpired(expireTime) {
    let resFlag = true
    // 1、判断过期时间是否是一个number类型？
    // ===> 如果是：在判断是否大于0，如果是进入下一步；反之return false
    // ===> 如果不是：return false （按理来说应该是一个number类型才对）
    if (TypeJudgment('number', expireTime) && expireTime > 0) {
      // 2、在与当前的时间戳进行比较，如果大于当前时间戳，则说明是有效的，反之则无效
      let current_time = Date.now()
      if (expireTime > current_time) {
        resFlag = false
      } else {
        resFlag = true
      }
    } else {
      resFlag = false
    }
    // console.log('timeIsExpired',resFlag)
    return resFlag
  }

  /**
   * @description 根据传进来的key值调用实例的getItem方法获取缓存对象里面的expireTime属性
   * @param {String} key
   * @returns 返回一个数值类型的过期时间(一般情况 === 时间戳 | -1)
   */
  function getStorageExpireTime(key, instance) {
    // 1、使用实例方法获取对应key标识的值
    let getData = instance.getItem(key)
    let expireTime = -1
    // console.log(key, getData)
    // 2、使用JSON.parse() 方法将获取到的值进行转化
    if (getData) {
      try {
        getData = JSON.parse(getData)
        let t = getData?.expireTime
        if (TypeJudgment('number', t) && !TypeJudgment('NaN', t)) {
          // 如果存在过期时间属性，且数据类型合法，则将属性值返回
          expireTime = t
        }
      } catch (error) {
        console.error(error)
      }
    } else {
      // 如果没有获取到值,我们默认这个值已经过期，被删除了；这时我们返回一个 已经过期的时间戳
      expireTime = Date.now() - 10000
      // console.log('getStorageExpireTime', expireTime)
    }
    // console.log('getStorageExpireTime',expireTime)
    return expireTime
  }

  /**
   * @description 计算指定符号或者字符，在一串字符串里面重复的次数
   * @param {String} str
   * @param {String} sign 特定的字符
   * @returns 返回一个数字number，代表这个字符重复的次数
   */
  function signRepeatTimes(str, sign) {
    if (str && sign) {
      return str.split(sign).length - 1
    } else {
      return 0
    }
  }

  /**
   * @description 判断一个字符在指定的字符串重复的次数，与指定的次数是否大于或者相等，如果相等则返回true,反之则是false
   * @param {String} str 指定的字符串
   * @param {String} sign 指定的字符或者符号
   * @param {Number} counts 猜测出现重复的次数
   * @returns {Boolean} true | false
   */
  function judgeSignCounts(str, sign, counts) {
    let num = -1
    if (str && sign) {
      num = signRepeatTimes(str, sign)
    }

    return num >= counts
  }

  /**
   * @description 切割指定字符串,切割成功返回长度为1 或者 2的数组，切割失败返回undefined
   * @param {String} value 被切割的字符串
   * @param {String} sign 切割符
   * @returns 返回一个长度为1 或者 2的数组或者undefined (Array[value1] | Array[value1,value2]  |  undefined)
   */
  function mySplit(value, sign) {
    if (value && sign) {
      if (value === sign) return undefined

      let arr = value.split(sign)
      let len = arr.length
      if (len > 1) {
        if (len === 2) {
          return [...arr]
        } else {
          return [arr[0], [...arr].splice(2, len - 2).join(sign)]
        }
      } else {
        return undefined
      }
    } else {
      return undefined
    }
  }

  /**
   * @description 将过期时间与时间单位进行换算，全部转化为ms，并加上当前的时间戳 Date.now()
   * @param {*} expireTime 过期时间
   * @param {*} typeTime 时间单位
   * @returns 返回一个时间戳
   */
  function formatExpireTime(expireTime, typeTime) {
    if (typeTime === 'ms') {
      // 毫秒  ms
      expireTime = expireTime
    } else if (typeTime === 's') {
      // 秒 s
      expireTime = expireTime * 1000
    } else if (typeTime === 'min') {
      // 分钟 min
      expireTime = expireTime * 60 * 1000
    } else if (typeTime === 'h') {
      // 小时 h
      expireTime = expireTime * 60 * 60 * 1000
    } else if (typeTime === 'd') {
      // 天 d
      expireTime = expireTime * 864e5
    } else if (typeTime === 'w') {
      // 周 w
      expireTime = expireTime * 7 * 864e5
    } else if (typeTime === 'm') {
      // 月 m
      expireTime = expireTime * 30 * 864e5
    } else if (typeTime === 'y') {
      // 年 y
      expireTime = expireTime * 365 * 864e5
    }

    return Date.now() + expireTime
  }

  /**
   * @description 用于抛出错误和警告的方法
   * @param {*} type warn | err
   * @param {*} errText 字符串
   * @param {*} consoleText 字符串
   * @returns undefined
   */
  function ErrorTips(type, errText, consoleText) {
    if (type && type === 'warn') {
      console.warn(consoleText)
      return
    } else if (type && type === 'err') {
      console.error(consoleText)
      throw Error(errText)
    }
  }

  /**
   * @description 判断类型是否匹配
   * @param {*} type "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "array" | "object" | "NaN" | "date" | "null"
   * @param {*} value any
   * @returns 返回一个boolean值：true ===> 类型匹配 || false ===> 类型不匹配
   */
  function TypeJudgment(type, value) {
    // "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"
    // "array" | "object" | "NaN" | "date" | "null"
    let _type = typeof type
    let _vType = typeof value
    let rtnFlag = false
    if (_type === 'string') {
      if (type !== 'object' && type !== 'number' && _vType === type) {
        rtnFlag = true
      } else if (type === 'number' && _vType === type) {
        if (Number.isNaN(value)) {
          rtnFlag = false
        } else {
          rtnFlag = true
        }
      } else {
        let _oType = Object.prototype.toString.call(value)
        if (type === 'null' && _oType === '[object Null]') {
          rtnFlag = true
        } else if (type === 'object' && _oType === '[object Object]') {
          rtnFlag = true
        } else if (type === 'array' && _oType === '[object Array]') {
          rtnFlag = true
        } else if (type === 'date' && _oType === '[object Date]') {
          rtnFlag = true
        } else if (type === 'NaN') {
          if (_oType === '[object Number]') {
            if (Number.isNaN(value)) {
              rtnFlag = true
            } else {
              rtnFlag = false
            }
          } else {
            rtnFlag = false
          }
        }
      }
    } else {
      ErrorTips(
        'err',
        'The type argument must be a string',
        '类型参数必须是一个字符串'
      )
    }

    // if (!rtnFlag) {
    //   // ErrorTips('warn', '', '数据类型不匹配，建议你做相应修改value的数据类型')
    //   console.info(
    //     '数据类型不匹配，建议你做相应修改value的数据类型,可忽略此提示'
    //   )
    // }

    return rtnFlag
  }

  /**
   * @description 根据使用者传入的类型返回对应的操作实例对象
   * @param {*} type local | session | cookie
   * @param {*} options 属性配置对象
   * @returns 返回一个实例对象
   */
  function TypeInstance(type, options) {
    if (type && typeof type === 'string' && type.trim()) {
      // options.instanceType = type
      let optObj = { ...options, instanceType: type }

      let _tflag =
        type === 'local'
          ? true
          : type === 'session'
          ? true
          : type === 'cookie'
          ? true
          : false
      if (_tflag) {
        return new ComStorage(optObj)
      } else {
        ErrorTips(
          'err',
          'No corresponding instance was found',
          '没有找到对应选项的实例'
        )
      }
    } else {
      ErrorTips(
        'err',
        'Instance type parameters cannot be null',
        '实例类型参数不能为空,必须输入: local/session/cookie 其中一个'
      )
    }
  }

  return TypeInstance(storageType, storageOptions)
}
