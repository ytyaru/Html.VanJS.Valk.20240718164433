;(function(){
class FixValue {
    val(v, handler={}) { return this.proxy({v:v}, handler) }
    obj(o) {
        if ('Object'!==o.constructor.name) { throw new TypeError(`引数はオブジェクトであるべきです。`) }
        return this._recursionObjGetProxy(o)
    }
    cls(c) {
        // `class {...}`でなくFunctionオブジェクトでコンストラクタ(クラス)を模した旧クラスの場合もある
        if (!(('function'===typeof c)) {throw new TypeError(`引数はクラスであるべきです。`)}
//      if (!(('function'===typeof c) && (!!c.toString().match(/^class /)))) {throw new TypeError(`引数はクラスであるべきです。`)}
        return this.proxy(c, {construct:(target, args)=>this.proxy(new target(...args))})
    }
    _getHandler(addHandler) { return {
        get:(target, key)=>{
            if (key in target) {
                if (this._hasGetter(target, key)) { return Reflect.get(target, key) }
                if ('function'===target[key]) { return target[key].bind(target) }
                return target[key]
            }
            throw new TypeError(`未定義プロパティへの参照禁止: ${key}`)
        },
        ...addHandler,
    } }
    _getSetHandle(definedPropSet) { return {
        set:(target, key, value, receiver)=>{
            if (key in target) {
                if (definedPropSet) { return definedPropSet(target, key, value, receiver) }
                else { throw new TypeError(`定義済プロパティへの代入禁止: ${key}`)  } }
            else { throw new TypeError(`未定義プロパティへの代入禁止: ${key}`) }
        },
    } }
    proxy(obj, handler={}) { return new Proxy(obj, this._getHandler(handler)) }

    this._getSetHandle()
    this._getSetHandle((target, key, value, receiver)=>{
        if (this._hasSetter(target, key)) { return Reflect.set(target, key, value) }
        else { return target[key] = value; }
    })
    this.proxy(obj, this._getHander(this._getSetHandle()))
    this.proxy(obj, this._getHander(this._getSetHandle((target, key, value, receiver)=>{
        if (this._hasSetter(target, key)) { return Reflect.set(target, key, value) }
        else { return target[key] = value; }
    }))
    new Proxy(obj, this._getHander(this._getSetHandle()))
    new Proxy(obj, this._getHander(this._getSetHandle((target, key, value, receiver)=>{
        if (this._hasSetter(target, key)) { return Reflect.set(target, key, value) }
        else { return target[key] = value; }
    }))


       
    this.proxy(obj, {
        set:(target, key, value)=>{
            if (key in target) {
                if (key in target) { throw new TypeError(`定義済プロパティへの代入禁止: ${key}`) }
            }
            throw new TypeError(`未定義プロパティへの代入禁止: ${key}`)
        },
    })
    this.proxy(obj, {
        set:(target, key, value)=>{
            if (key in target) {
                if (this._hasSetter(target, key)) { return Reflect.set(target, key, value) }
                else { target[key] = value; return }
            }
            throw new TypeError(`未定義プロパティへの代入禁止: ${key}`)
        },
    })
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

    proxy(obj, handler={}) {
        return new Proxy(obj, {
            set:(target, key, value)=>{
                if (key in target) { throw new TypeError(`定義済プロパティへの代入禁止: ${key}`) }
                else { throw new TypeError(`未定義プロパティへの代入禁止: ${key}`) }
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
window.FixValue = new FixValue()
})();
