class FixError extends Error { constructor(msg=`Assignment to fix variable.`) { super(msg); this.name='FixError' } }
class CompletedType { constructor(v) { this._v = v } } // 固有値（型比較用：v instanceof CompletedType）
class CompletedTypeValues { // マスターテーブル
    static IDS = 'Error,Keep,Clear,Over'.split(',')
    static ITEMS = CompletedTypeValues.IDS.map(id=>new CompletedType(id))
    static OBJ = Object.assign(...CompletedTypeValues.IDS.map(v=>[v,v]).map(([k,v]) => ({[k]:v})))
    static has(v) { return CompletedTypeValues.IDS.includes(v) }
    static get(v) { return CompletedTypeValues.ITEMS[this.IDS.indexOf(v)] }
}
// 参照
console.log(CompletedTypeValues.OBJ)
const CompletedTypes = new Proxy(CompletedTypeValues.OBJ, {
    set(target, key, value, receiver) { throw new FixError() },
    get(target, key, receiver) {
        if ('typeName'===key) { return `Proxy(valk.enum(CompletedTypes))` }
        if (CompletedTypeValues.has(key)) { return CompletedTypeValues.get(key) }
        else { throw new ReferenceError(`Key does not exist.: ${key}`) }
    },
})

