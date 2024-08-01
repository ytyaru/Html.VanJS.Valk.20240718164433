class FixError extends Error { constructor(msg=`Assignment to fix variable.`) { super(msg); this.name='FixError' } }
class EnumError extends Error { constructor(msg=`Enum generation failed.`) { super(msg); this.name='EnumError' } }
class Enum {
    static types = {}
    static make(typeName, ids) {
        const v = new Enum(typeName, ids)
        Enum.types[typeName] = new Proxy(v, {
            set(target, key, value, receiver) { throw new FixError() },
            get(target, key, receiver) {
                if ('typeName'===key) { return `Proxy(valk.enum(${typeName}))` }
                if (v.has(key)) { return v.get(key) }
                if (key in target) {
                    if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // ゲッター
                    else if ('function'===typeof target[key]) { return target[key].bind(target) } // メソッド参照
                    return target[key] // プロパティ値
                }
                else { throw new ReferenceError(`Key does not exist.: ${key}`) }
            },
            getPrototypeOf(target) { return v.type }, // some instanceof Enum.types.typeName
        })
    }
    constructor(typeName, ids) {
        if (!Type.isStr(typeName)) { throw new EnumError(`typeNameは文字列のみ有効です。`) }
        ids = this.#split(ids)
        if (!Type.isStrs(ids)) { throw new EnumError(`idsは文字列配列またはカンマ、スペース、改行区切りの文字列のみ有効です。`) }
        this._type = new Function(`return class ${typeName} {constructor(v){this._v=v}}`)()
        window[typeName] = this._type
        this._keys = ids
        this._values = this._keys.map(id=>new this._type(id))
        this._obj = Object.assign(...this._keys.map(v=>[v,v]).map(([k,v])=>({[k]:v})))
    }
    get keys() { return this._keys }
    get values() { return this._values }
    get obj() { return this._obj }
    get type() { return this._type }
    has(v) { return this.hasKey(v) || this.hasValue(v) }
    hasKey(k) { return this._keys.includes(k) }
    hasValue(v) { return this._values.includes(v) }
    isTypeOf(v) { return v instanceof this._type }
    get(v) { return this._values[this._keys.indexOf(v)] }
    #split(ids) {
        if (Type.isStr(ids)) {
            for (let delim of [',',' ','\n']) {
                if (ids.includes(delim)) { return ids.split(delim) }
            }
        }
        return ids
    }
}
//const CompletedTypeEnum = new Enum(CompletedType, 'Error,Keep,Clear,Over'.split(','))
//const CompletedTypeEnum = new Enum('CompletedType', 'Error,Keep,Clear,Over')
//Enum.make('CompletedType', 'Error,Keep,Clear,Over')
//Enum.make('Completed', 'Error,Keep,Clear,Over')
Enum.make('Completed', 'Error,Keep,Over,Every,Clear') // Once(Error, Keep(ignore cout), Over), Multi(Clear(ReStart), Every)

//class CompletedTypeEnum{}
//Object.defineProperty(CompletedTypeEnum, 'IDS', {value:'Error,Keep,Clear,Over'.split(','), writable:false})

/*
//class CompletedTypeEnum extends { // マスターテーブル
class CompletedTypeEnum { // マスターテーブル
    static IDS = 'Error,Keep,Clear,Over'.split(',')
    static ITEMS = CompletedTypeEnum.IDS.map(id=>new CompletedType(id))
    static OBJ = Object.assign(...CompletedTypeEnum.IDS.map(v=>[v,v]).map(([k,v]) => ({[k]:v})))
    static has(v) { return CompletedTypeEnum.IDS.includes(v) }
    static get(v) { return CompletedTypeEnum.ITEMS[this.IDS.indexOf(v)] }
}
*/
// 参照
/*
console.log(CompletedTypeEnum.obj)
const CompletedTypes = new Proxy(CompletedTypeEnum.obj, {
    set(target, key, value, receiver) { throw new FixError() },
    get(target, key, receiver) {
        if ('typeName'===key) { return `Proxy(valk.enum(CompletedTypes))` }
        if (CompletedTypeEnum.has(key)) { return CompletedTypeEnum.get(key) }
        else { throw new ReferenceError(`Key does not exist.: ${key}`) }
    },
})
//window[CompletedTypeEnum.type.constructor.name] = CompletedTypeEnum.type 
*/
