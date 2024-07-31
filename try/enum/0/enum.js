class CompletedTypeValue { constructor(v) { this._v = v } }
class CompletedType {
    static IDS = 'Error,Keep,Clear,Over'.split(',')
    static ITEMS = CompletedType.IDS.map(id=>new CompletedTypeValue(id))
    constructor(v) {
        this._v = v
//        this._ids = 'Error,Keep,Clear,Over'.split(',')
        //this._items = this._ids.map(id=>new CompletedType(id)) // RangeError: Maximum call stack size exceeded
//        this._items = this._ids.map(id=>new CompletedTypeValue(id))
//        Object.freeze(this._ids)
        //if (!this._ids.some(id=>id===this._v)) { throw new TypeError(`引数vは次のいずれかのみ有効です。: ${this._ids}`) }
        if (!CompletedType.IDS.some(id=>id===this._v)) { throw new TypeError(`引数vは次のいずれかのみ有効です。: ${CompletedType.IDS}`) }
//        for (let name of this._ids) {
//            Object.defineProperty(this, name, { get () { return new CompletedType(name) } })
//            Object.defineProperty(this, `is${name}`, { get () { return this._ids.some(id=>id===this._v) } })
//        }
        //for (let i=0; i<this._ids.length; i++) {
        for (let i=0; i<CompletedType.IDS.length; i++) {
//            Object.defineProperty(CompletedType, CompletedType.IDS[i], { get () { return this._items[i] } }) // undefined
            Object.defineProperty(this, CompletedType.IDS[i], { get () { return this._items[i] } })
            Object.defineProperty(this, `is${CompletedType.IDS[i]}`, { get () { return CompletedType.IDS.some(id=>id===this._v) } })
//            Object.defineProperty(CompletedType, this._ids[i], { get () { return this._items[i] } }) // undefined
//            Object.defineProperty(this, this._ids[i], { get () { return this._items[i] } })
//            Object.defineProperty(this, `is${this._ids[i]}`, { get () { return this._ids.some(id=>id===this._v) } })



        }
        for (let name of 'eq,compare'.split(',')) {
            Object.defineProperty(this, name, { value: (v)=>{
                if (!(v instanceof CompletedType)) { throw new TypeError(`引数vは${this.constructor.name}型であるべきです。`) }
                return this._v === v._v
            } })
        }
    }
}

//for (let i=0; i<this._ids.length; i++) {
for (let i=0; i<CompletedType.IDS.length; i++) {
    Object.defineProperty(CompletedType, CompletedType.IDS[i], { get () { return CompletedType.ITEMS[i] } })
}
Object.freeze(CompletedType)
