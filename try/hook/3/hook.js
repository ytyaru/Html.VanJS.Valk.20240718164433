;(function(){
;InsProxy; // 依存クラス
class ValidError extends Error { constructor(msg=`Invalid value.`) { super(msg); this.name='ValidError' } }
const containerClasses = [Array, Set, Object, Map]
const destroyMethods = {
    Array: 'copyWithin,fill,pop,push,reverse,shift,sort,splice,unshift'.split(','),
    Set: 'add,clear,delete'.split(','),
    Map: 'clear,delete,set'.split(','),
}
class HookVal {
    static of(...args) { return new HookVal(...args) }
    constructor(v, options) {
        this._i = null; // 入力値（  invalitable value）
        this._v = v;    // 最終値（    valitable value）
        this._o = null; // 前回値（old valitable value）
        this._options = {...{
            onBefore: ()=>{},
            onValidate: (i,v,o)=>true,
            onSet: (i,o)=>i,
            onSetDefault: (i,o)=>o,
            onValid: (i,v,o)=>{},
            onInvalid: (i,v,o)=>{},
            onChanged: (i,v,o)=>{},
            onUnchanged: (i,v,o)=>{},
            onAfter: ()=>{},
        }, ...options}
//        return Object.seal(this) // getter まで弾いてしまう…
//        return InsProxy.of(this, {setDefined:true})
        return InsProxy.of(this)
    }
    get i( ) { return this._i }
    get v( ) { return this._v }
    get o( ) { return this._o }
    set v(v) {
        this._i = v
        this._options.onBefore(this._i, this._v, this._o)
        const [onSet, onValid] = ifel(this._options.onValidate(this._i, this._v, this._o), 
            ()=>['onSet', 'onValid'],
            ()=>['onSetDefault', 'onInvalid'])
        this._o = this._v
        this._v = this._options[onSet](this._i, this._o)
        this._options[onValid](this._i, this._v, this._o)
        this._options[this._v === this._o ? 'onUnchanged' : 'onChanged'](this._i, this._v, this._o)
        this._options.onAfter(this._i, this._v, this._o)
    }
}
class HookObj {
    static of(...args) { return new HookObj(...args) }
    constructor(obj, options={}) {
        this._options = {...{
            onBefore: (target, key, value, receiver)=>{},
            onValidate: (target, key, value, receiver)=>true,
            onSet: (target, key, value, receiver, o)=>{
                if (Type.hasSetter(target, key)) { return Reflect.set(target, key, value) }
                else { return (target[key] = value); }
            },
            onSetDefault: (target, key, value, receiver, o)=>{},
            onValid: (target, key, value, receiver, o)=>{},
            onInvalid: (target, key, value, receiver, o)=>{throw new ValidError(`Invalid value.`)},
            onChanged: (target, key, value, receiver, o)=>{},
            onUnchanged: (target, key, value, receiver, o)=>{},
            onAfter: (target, key, value, receiver, o)=>{},
        }, ...options}
        //return new Proxy(this, {
        return new Proxy(obj, {
            set: (target, key, value, receiver)=>{
                this._options.onBefore(target, key, value, receiver)
                //const o = target[key]
                const o = this.get(target, key, receiver)
                let r;
                if (this._options.onValidate(target, key, value, receiver, o)) {
                    //if (Type.hasSetter(target, key)) { r = Reflect.set(target, key, value) }
                    //else { r = (target[key] = value); }
                    //r = (target[key] = this._options.onSet(target, key, value, receiver, o))
                    r = this._options.onSet(target, key, value, receiver, o)
                    this._options.onValid(o, target[key])
                } else {
                    //r = (target[key] = this._options.onSetDefault(target, key, value, receiver, o))
                    r = this._options.onSetDefault(target, key, value, receiver, o)
                    this._options.onInvalid(target, key, value, o)
                }
                const n = this.get(target, key, receiver)
                if (o===n) {this._options.onUnchanged(target, key, value, receiver, o)}
                else {this._options.onChanged(target, key, value, receiver, o)}
                //if (o!==target[key]) { this._options.onChanged(target, key, value, receiver, o) }
                //if (this._isChanged(target, key, value, o)) { this._options.onChanged(target, key, value, receiver, o) }
//                else { this._options.onUnchanged(target, key, value, receiver, o) }
                this._options.onAfter(target, key, value, receiver, o)
                return r
            },
            get:(target, key)=>{
                if (key in target) {
                    if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // getter
                    if (Type.isFn(target[key])) { return target[key].bind(target) } // method, constructor?
                    return target[key] // field
                }
                throw new TypeError(`未定義プロパティへの参照禁止: ${key}`)
            },
        })
        //return super.obj(obj, 'key', false, 'key', this._getHandler({...this._getSetHandler((target, key, value, receiver)=>{
        return Fix.obj(obj, 'key', false, 'key', this._getHandler({...this._getSetHandler((target, key, value, receiver)=>{
        //return new Proxy(obj, this._getHandler({...this._getSetHandler((target, key, value, receiver)=>{
            const o = target[key]
            let r;
            if (this._options.onValidate(key, value, o)) {
                if (Type.hasSetter(target, key)) { r = Reflect.set(target, key, value) }
                else { r = (target[key] = value); }
                this._options.onValid(o, target[key])
            } else { this._options.onInvalid(o) }
            if (this._isChanged(o)) { this._options.onChanged() }
            else { this._options.onUnchanged() }
            return r
        })}))
    }
    get(target, key, receiver) {
        if (key in target) {
            if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // getter
            if (Type.isFn(target[key])) { return target[key].bind(target) } // method, constructor?
            return target[key] // field
        }
    }
}
const HookableContainer = superClass => class extends superClass {
    //static of(...args) { return new HookObj(...args) }
//    static of(...args) { return new HookableContainer(...args) }
//    constructor(...args) {
//        super(...args)
    constructor(v, options={}) {
        super(...v)
        this._options = {...{
            onBefore: ()=>{},
            onValidate: (i)=>true,
//            onSet: (i,o)=>i,
//            onSetDefault: (i,o)=>o,
            onValid: (i,v,o)=>{},
            onInvalid: (i,v,o)=>{throw new ValidError(`Invalid value.`)},
            onChanged: (i,v,o)=>{},
            onUnchanged: (i,v,o)=>{},
            onAfter: ()=>{},
        }, ...options}
        console.log(this._options)
        this._defineDestoryMethods()
        return InsProxy.of(this)
    }
    _defineDestoryMethods() {
        const names = Object===superClass ? Object.keys(this) : destroyMethods[superClass.name]
        for (let name of names) {
            Object.defineProperty(this, name, {
                value:(...args)=>{
                    this._options.onBefore()
                    const o = this
                    let r;
                    ifel(this._options.onValidate(o, name, args), 
                        ()=>{ r = super[name](...args);
                            this._options.onValid(o, this); },
                        ()=>this._options.onInvalid(o, name, args))
                    ifel(this._isChanged(o), ()=>this._options.onChanged(), ()=>this._options.onUnchanged())
                    this._options.onAfter()
                    return r
                },
            })
        }
    }
    _isChanged(o) {
        console.log(this)
        console.log([...this])
        console.log(Type.toStr([...this]))
        console.log(this instanceof Array, Array.isArray(o), Type.toStr([...this])===Type.toStr([...o]))
        if (this instanceof Set) { return this.size === o.size && [...this].every(v=>o.has(v)) }
        if (this instanceof Map) { return this.size === o.size && [...this.keys()].every(k=>o.has(k) && o.get(k)===this.get(k)) }
        if (this instanceof Array) { return this.length === o.length && this.every((v,i) =>v===o[i]) }
        if ('Object'===this.constructor.name) { return Type.toStr(this)===Type.toStr(o) } 
        //return [...Object.entries(this)].every(([k,v])=>)
    }
}
class HookAry extends HookableContainer(Array) { constructor(...args) { super(...args) } }
class HookSet extends HookableContainer(Set) { constructor(...args) { super(...args) } }
class HookMap extends HookableContainer(Map) { constructor(...args) { super(...args) } }
window.hook = Object.deepFreeze({
    /*
    val: (...args)=>HookVal.of(...args),
    obj: (...args)=>HookObj.of(...args),
    ary: (...args)=>new HookAry(...args),
    set: (...args)=>new HookSet(...args),
    map: (...args)=>new HookMap(...args),
    */
//    val: (v, options={})=>HookVal.of(v, options),
//    obj: (v, options={})=>HookObj.of(v, options),
//    ary: (v, options={})=>new HookAry(v, options),
//    set: (v, options={})=>new HookSet(v, options),
//    map: (v, options={})=>new HookMap(v, options),
    types: Object.assign(...[HookVal, HookObj, HookAry, HookSet, HookMap].map(cls=>[cls.name.replace('Hook').toLowerCase(), Object.freeze(cls)]).map(([k,v])=>({[k]:v}))),
    errors: {
        valid: ValidError,
    }
})

})();

