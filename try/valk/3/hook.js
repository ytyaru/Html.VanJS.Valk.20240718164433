;(function(){
class FixError extends Error { constructor(msg=`Assignment to fix variable.`) { super(msg); this.name='FixError' } }
class ValidError extends Error { constructor(msg=`Invalid value.`) { super(msg); this.name='ValidError' } }
const containerClasses = [Array, Set, Object, Map]
const destroyMethods = {
    Array: 'copyWithin,fill,pop,push,reverse,shift,sort,splice,unshift'.split(','),
    Set: 'add,clear,delete'.split(','),
    Map: 'clear,delete,set'.split(','),
}
const notDestroyMethods = {
    Array: 'at,concat,entries,every,filter,find,findIndex,findLast,findLastIndex,flat,flatMap,forEach,includes,indexOf,join,keys,lastIndexOf,map,reduce,reduceRight,slice,some,toLocaleString,toReversed,toSorted,toSpliced,toString,values,with'.split(','),
    Set: 'difference,entries,forEach,has,intersection,isDisjointFrom,isSubsetOf,isSupersetOf,keys,symmetricDifference,union,values'.split(','),
    Map: 'entries,forEach,get,has,keys,values'.split(','),
}
class InsProxy { // class の instance を保護するのはObject.sealでは無理。getterまで弾かれる。のでProxyで代用する
    static of(target, options={}) { return new InsProxy(target, options) }
    static defaultPermission()  { return {
        getDestroyMethod: true, // 破壊的メソッドの取得（呼出）
        getUndefined: false,
        setDefined: true,
        setUndefined: false,
    }}
    constructor(target, options={}) {
        this._options = {
            ...InsProxy.defaultPermission(),
            // callbackFn
            onGetDefined:(target, key, receiver)=>{
                // 破壊的メソッドの取得（呼出）禁止
                const con = this._getContainer(target)
                if (con && !this._options.getDestroyMethod 
                    && destroyMethods[con.name].some(n=>n===key)) {throw new FixError()} 
                else if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // getter
                else if ('function'===target[key]) { return target[key].bind(target) } // method, constructor
                else if (key === Symbol.iterator) { return target[Symbol.iterator].bind(target) } // for of
                else { return target[key] } // field
            },
            onGetUndefined:(target, key, receiver)=>{
                if (this._options.getUndefined) { return target[key] }
                else { throw new TypeError(`未定義プロパティへの参照禁止: ${key}`) }
            },
            onSetDefined:(target, key, value, receiver)=>{
                if (this._options.setDefined) {
                    if (Type.hasSetter(target, key)) { return Reflect.set(target, key, value) } // setter
                    else { target[key] = value } // field
                } else { throw new TypeError(`定義済プロパティへの代入禁止: ${key}`) }
                return true
            },
            onSetUndefined:(target, key, value, receiver)=>{
                if (this._options.setUndefined) { target[key] = value }
                else { throw new TypeError(`未定義プロパティへの代入禁止: ${key}`) }
                return true
            },
            ...options,
        }
        return new Proxy(target, { // getter, setter を受け付ける
            get:(target, key, receiver)=>this._options['onGet' + ((key in target) ? 'Defined' : 'Undefined')](target, key, receiver),
            set:(target, key, value, receiver)=>this._options['onSet' + ((key in target) ? 'Defined' : 'Undefined')](target, key, value, receiver),
        })
    }
    _getContainer(target) {
        const ts = [Array,Set,Map].filter(T=>target instanceof T) 
        if (0===ts.length) { return null }
        return ts[0]
    }
}
class HookVal {
    static of(...args) { return new HookVal(...args) }
    constructor(v, options={}, insOpts={}) {
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
        return InsProxy.of(this, insOpts)
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
    constructor(obj, options={}, insOpts={}) {
        this._options = {...{
            onBefore: (target, key, value, receiver)=>{},
            onValidate: (target, key, value, receiver)=>true,
            onSet: (target, key, value, receiver, o)=>{
                if (Type.hasSetter(target, key)) { return Reflect.set(target, key, value) }
                else { return (target[key] = value); }
            },
            onSetDefault: (target, key, value, receiver, o)=>{},
            onValid: (target, key, value, receiver, n, o)=>{},
            onInvalid: (target, key, value, receiver, n, o)=>{throw new ValidError(`Invalid value.`)},
            onChanged: (target, key, value, receiver, n, o)=>{},
            onUnchanged: (target, key, value, receiver, n, o)=>{},
            onAfter: (target, key, value, receiver, n, o)=>{},
        }, ...options}
        const target = {
            onGetUndefined:(target, key, receiver)=>{
                if (key === Symbol.iterator) { return Object.entries(this) } // for of
                if (this._options.getUndefined) { return target[key] }
                else { throw new TypeError(`未定義プロパティへの参照禁止: ${key}`) }
            },
            onSetDefined: (target, key, value, receiver)=>this.set(target, key, value, receiver)
        }
        this._insOpts = {...InsProxy.defaultPermission(), ...insOpts}
        if (insOpts.setUndefined) {target.onSetUndefined = (target, key, value, receiver)=>this.set(target, key, value, receiver)}
        obj[Symbol.iterator] = ()=>new ObjItr(obj)
        return InsProxy.of(obj, {...target, ...insOpts})
    }
    get(target, key, receiver) {
        if (key in target) {
            if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // getter
            else if (Type.isFn(target[key])) { return target[key].bind(target) } // method, constructor?
            else if (key === Symbol.iterator) { return target[Symbol.iterator].bind(target) } // for of
            return target[key] // field
        } else {throw new TypeError(`未定義プロパティへの参照禁止: ${key}`)}
    }
    set(target, key, value, receiver) {
        if (key in target) {if (!this._insOpts.setDefined) {throw new TypeError(`定義済プロパティへの代入禁止: ${key}`)}}
        else {if (!this._insOpts.setUndefined) {throw new TypeError(`未定義プロパティへの代入禁止: ${key}`)}}
        this._options.onBefore(target, key, value, receiver)
        const o = this.get(target, key, receiver)
        let r;
        const [onSet, onValid] = ifel(this._options.onValidate(target, key, value, receiver, o),
            ()=>['onSet', 'onValid'],
            ()=>['onSetDefault', 'onInvalid'],
        )
        r = this._options[onSet](target, key, value, receiver, o)
        const n = this.get(target, key, receiver)
        this._options[onValid](target, key, value, receiver, n, o)
        this._options[o===n ? 'onUnchanged' : 'onChanged'](target, key, value, receiver, n, o)
        this._options.onAfter(target, key, value, receiver, o)
        return true
    }
}
class ObjItr {
    constructor(o) {
        this._o = o
        this._v = Object.entries(o)
        this._i = 0
    }
    next() {
        if (this._i === this._v.length) return {done: true};
        return {value: this._v[this._i++], done: false}
    }
}
const HookableContainer = superClass => class extends superClass {
    constructor(v, options={}, insOpts={}, hookableMethodNames=[], notHookableMethodNames=[]) {
        if (Set===superClass) { super(v) }
        else if (Map===superClass) {
            if (Type.isObj(v)) { super(Object.entries(v)) }
            else { super(v) }
        }
        else if (Array.isArray(v)) { super(...v) }
        else { super(v) } // 想定外
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
        console.log('onValidate:', this._options.onValidate, options)
        this._hookableMethodNames = hookableMethodNames
        this._notHookableMethodNames = notHookableMethodNames
        this._defineDestoryMethods()
        this._defineNotDestoryMethods()
        return InsProxy.of(this, insOpts)
    }
    _defineDestoryMethods() {
        const names = (Type.isAry(this._hookableMethodNames) && 0<this._hookableMethodNames.length) ? this._hookableMethodNames : (Object===superClass ? Object.keys(this) : destroyMethods[superClass.name]);
        //const names = Object===superClass ? Object.keys(this) : destroyMethods[superClass.name]
        console.log('names:', names)
        for (let name of names) {
            Object.defineProperty(this, name, {
                value:(...args)=>{
                    console.log('HookableContainer:', name, args)
                    this._options.onBefore()
                    const o = Type.toStr(this) // ディープコピー（全文字列化）
                    let r;
                    ifel(this._options.onValidate(this, name, args, o), 
                        ()=>{ r = super[name](...args);
                            this._options.onValid(this, name, args, o); },
                        ()=>this._options.onInvalid(this, name, args, o))
                    const n = Type.toStr(this) // ディープコピー（全文字列化）
                    this._options[o===n ? 'onUnchanged' : 'onChanged'](this, name, args, o)
                    this._options.onAfter()
                    return r
                },
                configurable:true,
                enumerable:true,
                writable:true,
            })
        }
    }
    _defineNotDestoryMethods() {
        const names = (Type.isAry(this._notHookableMethodNames) && 0<this._notHookableMethodNames.length) ? this._notHookableMethodNames: (Object===superClass ? Object.keys(this) : notDestroyMethods[superClass.name])
        //const names = Object===superClass ? Object.keys(this) : notDestroyMethods[superClass.name]
        console.log('names:', names)
        for (let name of names) {
            Object.defineProperty(this, name, {
                value:(...args)=>super[name](...args),
                configurable:true,
                enumerable:true,
                writable:true,
            })
        }
    }
    _isChanged(o) {
        console.log(this, o)
        console.log([...this])
        console.log(Type.toStr([...this]))
        console.log(this instanceof Array, Array.isArray(o), Type.toStr([...this])===Type.toStr([...o]))
        if (this instanceof Set) { return this.size === o.size && [...this].every(v=>o.has(v)) }
        if (this instanceof Map) { return this.size === o.size && [...this.keys()].every(k=>o.has(k) && o.get(k)===this.get(k)) }
        if (this instanceof Array) { return this.length === o.length && this.every((v,i) =>v===o[i]) }
        if ('Object'===this.constructor.name) { return Type.toStr(this)===Type.toStr(o) } 
    }
}
class HookAry extends HookableContainer(Array) { constructor(v, opts={}, insOpts={}) { super(v, opts, insOpts) } }
class HookSet extends HookableContainer(Set) { constructor(v, opts={}, insOpts={}) { super(v, opts, insOpts) } }
class HookMap extends HookableContainer(Map) { constructor(v, opts={}, insOpts={}) { super(v, opts, insOpts) } }
const types = Object.assign(...[HookVal, HookObj, HookAry, HookSet, HookMap].map(cls=>[cls.name.replace('Hook','').toLowerCase(), Object.freeze(cls)]).map(([k,v])=>({[k]:v})))
types.HookableContainer = HookableContainer 
window.hook = Object.deepFreeze({
    ins: (target, options={})=>InsProxy.of(target, options),
    val: (v, options={}, insOpts={})=>HookVal.of(v, options, insOpts),
    obj: (v, options={}, insOpts={})=>HookObj.of(v, options, insOpts),
    ary: (v, options={}, insOpts={})=>new HookAry(v, options, insOpts),
    set: (v, options={}, insOpts={})=>new HookSet(v, options, insOpts),
    map: (v, options={}, insOpts={})=>new HookMap(v, options, insOpts),
    types: types,
    //types: Object.assign(...[HookVal, HookObj, HookAry, HookSet, HookMap].map(cls=>[cls.name.replace('Hook','').toLowerCase(), Object.freeze(cls)]).map(([k,v])=>({[k]:v}))),
    errors: {
        fix: FixError,
        valid: ValidError,
    }
})
})();

