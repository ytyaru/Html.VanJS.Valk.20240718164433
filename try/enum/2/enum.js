class FixError extends Error { constructor(msg=`Assignment to fix variable.`) { super(msg); this.name='FixError' } }
class CompletedTypeValue { constructor(v) { this._v = v } }
class CompletedTypes {
    static IDS = 'Error,Keep,Clear,Over'.split(',')
    static ITEMS = CompletedTypes.IDS.map(id=>new CompletedTypeValue(id))
    static has(v) { return CompletedTypes.IDS.includes(v) }
    static get(v) { return CompletedTypes.ITEMS[this.IDS.indexOf(v)] }
}
console.log(Object.assign(...'Error,Keep,Clear,Over'.split(',').map(v=>[v,v]).map(([k,v]) => ({[k]:v}))))
const CompletedType = new Proxy(Object.assign(...'Error,Keep,Clear,Over'.split(',').map(v=>[v,v]).map(([k,v]) => ({[k]:v}))), {
    set(target, key, value, receiver) { throw new FixError() },
    get(target, key, receiver) {
        if ('typeName'===key) { return `Proxy(valk.enum(CompletedType))` }
//        if (fixErrFnNms.some(n=>n===key)) { throw new FixError() }
        if (CompletedTypes.has(key)) { return CompletedTypes.get(key) }
        /*
        if (key in target) {
            if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // ゲッター
            else if ('function'===typeof target[key]) { return target[key].bind(target) } // メソッド参照
            return target[key] // プロパティ値
        }
        */
        else { throw new ReferenceError(`Property does not exist: ${key}`) }
    },
})

//for (let i=0; i<CompletedType.IDS.length; i++) {
//    Object.defineProperty(CompletedType, CompletedType.IDS[i], { get () { return CompletedType.ITEMS[i] } })
//}
//Object.freeze(CompletedType)
