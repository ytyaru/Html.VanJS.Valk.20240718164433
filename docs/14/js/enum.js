class CompletedTypes {
    constructor(v) {
        this._v = v
        this._ids = 'Error,Keep,Clear,Over'.split(',')
        this._items = this._ids.map(id=>new CompletedType(id))
        Object.freeze(this._ids)
        if (!this._ids.some(id=>id===this._v)) { throw new TypeError(`引数vは次のいずれかのみ有効です。: ${this._ids}`) }
//        for (let name of this._ids) {
//            Object.defineProperty(this, name, { get () { return new CompletedType(name) } })
//            Object.defineProperty(this, `is${name}`, { get () { return this._ids.some(id=>id===this._v) } })
//        }
        for (let i=0; i<this._ids.length; i++) {
            Object.defineProperty(CompletedType, this._ids[i], { get () { return this._items[i] } })
            Object.defineProperty(this, this._ids[i], { get () { return this._items[i] } })
            Object.defineProperty(this, `is${this._ids[i]}`, { get () { return this._ids.some(id=>id===this._v) } })
        }
        for (let name of 'eq,compare'.split(',')) {
            Object.defineProperty(this, name, { value: (v)=>{
                if (!(v instanceof CompletedType)) { throw new TypeError(`引数vは${this.constructor.name}型であるべきです。`) }
                return this._v === v._v
            } })
        }
    }

}
