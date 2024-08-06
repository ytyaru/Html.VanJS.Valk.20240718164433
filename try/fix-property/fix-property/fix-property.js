;(function(){
class FixProperty {
    val(v, handler={}) { return this.proxy({v:v}, handler) }
    obj(o) {
        if ('Object'!==o.constructor.name) { throw new TypeError(`引数はオブジェクトであるべきです。`) }
        return this._recursionObjGetProxy(o)
    }
    cls(c) {
        if (!(('function'===typeof c) && (!!c.toString().match(/^class /)))) {throw new TypeError(`引数はクラスであるべきです。`)}
        return this.proxy(c, {construct:(target, args)=>this.proxy(new target(...args))})
    }
    proxy(obj, handler={}) {
        return new Proxy(obj, {
            set:(target, key, value)=>{
                if (key in target) {
                    if (this._hasSetter(target, key)) { return Reflect.set(target, key, value) }
                    else { target[key] = value; return }
                }
                throw new TypeError(`未定義プロパティへの代入禁止: ${key}`)
            },
            get:(target, key)=>{
                if (key in target) {
                    if (this._hasGetter(target, key)) { return Reflect.get(target, key) }
                    if ('function'===target[key]) { return target[key].bind(target) }
                    return target[key]
                }
                throw new TypeError(`未定義プロパティへの参照禁止: ${key}`)
            },
            ...handler,
        })
    }
    _recursionObjGetProxy(obj) {
        for (let [k,v] of Object.entries(obj)) {
            if ('Object'===v.constructor.name) { obj[k] = this._recursionObjGetProxy(v) }
        }
        return this.proxy(obj)
    }
    _hasGetter(target, key) { return this._hasDescriptor('Get', target, key) }
    _hasSetter(target, key) { return this._hasDescriptor('Set', target, key) }
    _hasDescriptor(name, target, key) {
        const desc = Object.getOwnPropertyDescriptor(target.prototype ?? target, key)
        if (desc) { const ret = !!desc[name.toLowerCase()]; if (ret) { return ret } }
        return !!target[`__lookup${name}ter__`](key)
    }
}
window.FixProperty = new FixProperty()
})();
