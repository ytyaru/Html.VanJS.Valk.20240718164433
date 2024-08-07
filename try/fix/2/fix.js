;(function(){
// key:未定義プロパティへの参照・代入を禁ずる（例外発生）
// val:上記に加え、定義済プロパティへの代入を禁ずる（例外発生）
class Fix {
    val(obj, handler={}) { return new Proxy(obj, this._getHandler({...this._getSetHandler(), ...handler})) }
    key(obj, handler={}) { return new Proxy(obj, this._getHandler({...this._getSetHandler((target, key, value, receiver)=>{
            if (this._hasSetter(target, key)) { return Reflect.set(target, key, value) }
            else { return target[key] = value; }
        }), ...handler}))
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
    _getSetHandler(definedPropSet) { return {
        set:(target, key, value, receiver)=>{
            if (key in target) {
                if (definedPropSet) { return definedPropSet(target, key, value, receiver) }
                else { throw new TypeError(`定義済プロパティへの代入禁止: ${key}`)  } }
            else { throw new TypeError(`未定義プロパティへの代入禁止: ${key}`) }
        },
    } }
    _hasGetter(target, key) { return this._hasDescriptor('Get', target, key) }
    _hasSetter(target, key) { return this._hasDescriptor('Set', target, key) }
    _hasDescriptor(name, target, key) {
        const desc = Object.getOwnPropertyDescriptor(target.prototype ?? target, key)
        if (desc) { const ret = !!desc[name.toLowerCase()]; if (ret) { return ret } }
        return !!target[`__lookup${name}ter__`](key)
    }
}
class FixVal extends Fix {
    val(v, level='val', handler={}) {
        const l = 'key,val'.split(',').some(l=>l===level) ? level : 'val'
        return super[level]({v:v}, handler)
    }
}
class FixObj extends Fix {
    obj(o, level='val', withoutChildren=false, leafLevel='key', handler={}) { // level: 'val' or 'key'
        if ('Object'!==o.constructor.name) { throw new TypeError(`第一引数はオブジェクトであるべきです。`) }
        if (![level, leafLevel].every(L=>'key,val'.split(',').some(l=>l===L))) { throw new TypeError(`第二,四引数は'key','val'のいずれかであるべきです。\n'key'は未定義プロパティへの参照・代入禁止です。\n'val'はそれに加えて定義済プロパティへの代入禁止です。`) }
        this._level = level;
        this._leafLevel = leafLevel;
        this._hander = handler
        if (withoutChildren) { return super[level](obj, handler) }
        else { return this._recursion(o) }
    }
    _recursion(obj) {
        let hasChildren = false
        for (let [k,v] of Object.entries(obj)) {
            if ('Object'===v.constructor.name) { obj[k] = this._recursion(v); hasChildren = true;}
        }
        return super[hasChildren ? this._level : this._leafLevel](obj, this._hander)
        //return super[hasChildren ? this._leafLevel : this._level](obj)
        //return super[level](obj)
    }
}
class FixCls extends Fix {
    cls(c, classLevel='val', instanceLevel='key') {
        // `class {...}`でなくFunctionオブジェクトでコンストラクタ(クラス)を模した旧クラスの場合もある
        if ('function'!==typeof c) {throw new TypeError(`引数はクラスであるべきです。`)}
//      if (!(('function'===typeof c) && (!!c.toString().match(/^class /)))) {throw new TypeError(`引数はクラスであるべきです。`)}
        return super[classLevel](c, {construct:(target, args)=>super[instanceLevel](new target(...args))})
    }
}
//const val = new FixVal()
//const obj = new FixObj()
//const cls = new FixCls()
const [val, obj, cls] = [new FixVal(), new FixObj(), new FixCls()]
//window.Fix = {
//    val: (...args)=>val.val(...args),
//    obj: (...args)=>obj.obj(...args),
//    cls: (...args)=>cls.cls(...args),
//}
window.Fix = obj.obj({
    val: (...args)=>val.val(...args),
    obj: (...args)=>obj.obj(...args),
    cls: (...args)=>cls.cls(...args),
    types: {
        val: FixVal,
        obj: FixObj,
        cls: FixCls,
    }
})

})();
