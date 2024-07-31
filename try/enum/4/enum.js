class FixError extends Error { constructor(msg=`Assignment to fix variable.`) { super(msg); this.name='FixError' } }
class CompletedType { constructor(v) { this._v = v } } // 固有値（型比較用：v instanceof CompletedType）
/*
const Enum  {
    //static IDS = 'Error,Keep,Clear,Over'.split(',')
    static IDS = []
    static ITEMS = CompletedTypeEnum.IDS.map(id=>new CompletedType(id))
    static OBJ = Object.assign(...CompletedTypeEnum.IDS.map(v=>[v,v]).map(([k,v]) => ({[k]:v})))
    static has(v) { return this.IDS.includes(v) }
    static get(v) { return this.ITEMS[this.IDS.indexOf(v)] }
}
*/
class Enum {
    constructor(type, ids) {
        this._ids = ids
        this._items = this._ids.map(id=>new type(id))
        this._obj = Object.assign(...this._ids.map(v=>[v,v]).map(([k,v])=>({[k]:v})))
    }
    get obj() { return this._obj }
    has(v) { return this._ids.includes(v) }
    get(v) { return this._items[this._ids.indexOf(v)] }
}
const CompletedTypeEnum = new Enum(CompletedType, 'Error,Keep,Clear,Over'.split(','))

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
console.log(CompletedTypeEnum.obj)
const CompletedTypes = new Proxy(CompletedTypeEnum.obj, {
    set(target, key, value, receiver) { throw new FixError() },
    get(target, key, receiver) {
        if ('typeName'===key) { return `Proxy(valk.enum(CompletedTypes))` }
        if (CompletedTypeEnum.has(key)) { return CompletedTypeEnum.get(key) }
        else { throw new ReferenceError(`Key does not exist.: ${key}`) }
    },
})

