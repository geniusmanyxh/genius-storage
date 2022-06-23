/**
 * @description 根据使用者传入的存储类型以及对应的配置，返回对应存储类型的实例以及方法
 * @param {String} storageType 选择存储类型：local | session  | cookie
 * @param {Object} storageOptions 可选配置参数
 * @returns 返回一个可以操作的(LocalStorage | SessionStorage | Cookie)实例对象
 */
// export declare function GStorage(
//   type: 'local' | 'session' | 'cookie',
//   options?: object
// ): ComStorage | undefined

declare module 'genius-storage'
