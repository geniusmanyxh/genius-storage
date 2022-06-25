/**
 * @description 根据使用者传入的存储类型以及对应的配置，返回对应存储类型的实例以及方法
 * @param {String} storageType 选择存储类型：local | session  | cookie
 * @param {Object} storageOptions 可选配置参数
 * @returns 返回一个可以操作的(LocalStorage | SessionStorage | Cookie)实例对象
 */
export declare function GStorage(
  storageType: 'local' | 'session' | 'cookie',
  storageOptions?: object
): ComStorage | undefined

declare class FormatCookie {
  constructor()

  assign(target: object): object
  read(value: any): string
  write(value: any): string
  setItem(key: string, value: any, attributes?: object | undefined): void
  getItem(key?: string): any
  removeItem(key: string, attributes?: object | undefined): void
  clear(): void
}

declare class ComStorage {
  _prefix: string // 前缀
  _suffix: string // 后缀
  _linkSign: string // 前缀连接key连接后缀的特殊符号，如 ./@/%/等等
  _isReset: boolean // 默认是强制覆盖原有key对应的值
  _expireTime: number // 用于设置本地缓存过期时间,如果不全局设置，可以在setFun方法里面设置
  _typeTime: string // 用于设置过期时间的单位,默认时间单位是毫秒(ms),如果不全局设置，可以在setFun方法里面设置

  _instance: Storage | FormatCookie | undefined // window.localStorage/window.sessionStorage/new FormatCookie()
  _instanceType: string // local/session/cookie

  constructor(args: object | undefined) // 构造函数

  /**
   * @description 存储缓存方法
   * @param key 唯一标识
   * @param value 需要存储的值
   * @param isReset 是否要重置旧数据
   * @param expireTime 设置有效时间
   * @param typeTime 时间单位(默认ms) 
   */
  setFun(
    key: string,
    value: any,
    isReset?: boolean | undefined,
    expireTime?: number | undefined,
    typeTime?: string | undefined
  ): void
 
  /**
   * @description 获取存储方法
   * @param key 唯一标识
   */
  getFun(key: string): any

  /**
   * @description 删除缓存的方法
   * @param key 唯一标识
   */
  delFun(key: string): void

  /**
   * @description 判断存储是否存在的方法
   * @param key 唯一标识
   */
  existFun(key: string): boolean

  /**
   * @description 根据条件筛选浏览器已经存在的所有在有效期内的key值,并组装为一个数组返回
   * @param condition 筛选条件
   */
  allKey(condition?: object): string[]

  /**
   * @description 根据条件删除符合条件的所有缓存数据
   * @param condition 筛选条件
   */
  clearFun(condition?: object): void
}

/**
 * @description 判断缓存值的过期时间是否已经过期,过期返回true，反之false
 * @param {Number} expireTime 过期时间参数（应该是一个时间戳）
 * @returns {boolean} true | false
 */
declare function timeIsExpired(expireTime: number | undefined): boolean

/**
 * @description 根据传进来的key值调用实例的getItem方法获取缓存对象里面的expireTime属性
 * @param {String} key
 * @param {ComStorage._instance} instance 缓存操作实例
 * @returns 返回一个数值类型的过期时间(一般情况 === 时间戳 | -1)
 */
declare function getStorageExpireTime(
  key: string,
  instance: ComStorage._instance
): number

/**
 * @description 计算指定符号或者字符，在一串字符串里面重复的次数
 * @param {String} str
 * @param {String} sign 特定的字符
 * @returns 返回一个数字number，代表这个字符重复的次数
 */
declare function signRepeatTimes(str: string, sign: string): number

/**
 * @description 判断一个字符在指定的字符串重复的次数，与指定的次数是否大于或者相等，如果相等则返回true,反之则是false
 * @param {String} str 指定的字符串
 * @param {String} sign 指定的字符或者符号
 * @param {Number} counts 猜测出现重复的次数
 * @returns {Boolean} true | false
 */
declare function judgeSignCounts(
  str: string,
  sign: string,
  counts: number
): boolean

/**
 * @description 切割指定字符串,切割成功返回长度为1 或者 2的数组，切割失败返回undefined
 * @param {String} value 被切割的字符串
 * @param {String} sign 切割符
 * @returns 返回一个长度为1 或者 2的数组或者undefined (Array[value1] | Array[value1,value2]  |  undefined)
 */
declare function mySplit(value: string, sign: string): string[] | undefined

/**
 * @description 将过期时间与时间单位进行换算，全部转化为ms，并加上当前的时间戳 Date.now()
 * @param {Number} expireTime 过期时间
 * @param {String} typeTime 时间单位
 * @returns {Number} 返回一个时间戳
 */
declare function formatExpireTime(expireTime: number, typeTime: string): number

/**
 * @description 用于抛出错误和警告的方法
 * @param {String} type warn | err
 * @param {Striing} errText 字符串
 * @param {String} consoleText 字符串
 * @returns undefined
 */
declare function ErrorTips(
  type: string,
  errText: string,
  consoleText: string
): void

/**
 * @description 判断类型是否匹配
 * @param {String} type "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "array" | "object" | "NaN" | "date" | "null"
 * @param {Any} value any
 * @returns 返回一个boolean值：true ===> 类型匹配 || false ===> 类型不匹配
 */
declare function TypeJudgment(type: string, value: any): boolean

/**
 * @description 根据使用者传入的类型返回对应的操作实例对象
 * @param {String} type local | session | cookie
 * @param {Object} options 属性配置对象
 * @returns 返回一个实例对象
 */
declare function TypeInstance(
  type: string,
  options?: object
): ComStorage | undefined
