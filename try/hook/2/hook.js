;(function(){
class ValidError extends Error { constructor(msg=`Invalid value.`) { super(msg); this.name='ValidError' } }
const containerClasses = [Array, Set, Object, Map]
const destroyMethods = {
    Array: 'copyWithin,fill,pop,push,reverse,shift,sort,splice,unshift'.split(','),
    Set: 'add,clear,delete'.split(','),
    Map: 'clear,delete,set'.split(','),
}
class InsProxy { // class の instance を保護するのはObject.sealでは無理。getterまで弾かれる。のでProxyで代用する
    static of(target, options) { return new InsProxy(target, options) }
    constructor(target, permission) {
        this._permission = {
            getUndefined: false,
            setDefined: false,
            setUndefined: false,
            ...permission,
        }
//        return Object.seal(this) // getter まで弾いてしまう…
        return new Proxy(target, { // getter, setter を受け付ける
            get:(target, key)=>{
                if (key in target) {
                    if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // getter
                    else if ('function'===target[key]) { return target[key].bind(target) } // method, constructor
                    else { return target[key] } // field
                } else {
                    if (this._permission.getUndefined) { return target[key] }
                    else { throw new TypeError(`未定義プロパティへの参照禁止: ${key}`) }
                }
            },
            set:(target, key, value, receiver)=>{
                console.log(target, key, key in target, Type.hasSetter(target, key))
                if (key in target) {
                    if (this._permission.setDefined) {
                        if (Type.hasSetter(target, key)) { return Reflect.set(target, key, value) } // setter
                        else { target[key] = value } // field
                    } else { throw new TypeError(`定義済プロパティへの代入禁止: ${key}`) }
                } else {
                    if (this._permission.setUndefined) { target[key] = value }
                    else { throw new TypeError(`未定義プロパティへの代入禁止: ${key}`) } }
            },
        })
    }
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
        return InsProxy.of(this, {setDefined:true})
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
                console.log(target, key)
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
    static of(...args) { return new HookObj(...args) }
    constructor(...args) {
        super(...args)
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
    }
    _defineDestoryMethods() {
        const names = Object===superClass ? Object.keys(this) : destroyMethods[superClass.constructor.name]
        for (let name of names) {
            Object.defineProperty(this, name, {
                value:(...args)=>{
                    const o = this
                    let r;
                    if (this._options.onValidate(o, name, args)) {
//                        if (Object===superClass) { super[name]
                        r = super[name](...args)
                        this._options.onValid(o, this)
                    } else { this._options.onInvalid(o) }
                    if (this._isChanged(o)) { this._options.onChanged() }
                    else { this._options.onUnchanged() }
                    return r
                    /*
                    ifel(this._options.onValidate(o, name, args), 
                        ()=>{ const r = super[name](...args);
                            this._options.onValid(o, this); },
                        ()=>this._options.onInvalid(o))
                    ifel(this._isChanged(o)), ()=>this._options.onChanged(), ()=>this._options.onUnchanged())
                    return r
                    */
                },
            })
        }
    }
    _isChanged(o) {
        if (this instanceof Set) { return this.size === o.size && [...this].every(v=>o.has(v)) }
        if (this instanceof Map) { return this.size === o.size && [...this.keys()].every(k=>o.has(k) && o.get(k)===this.get(k)) }
        if (this instanceof Array) { return this.length === b.length && this.every((v,i) =>v===b[i]) }
        if ('Object'===this.constructor.name) { return Type.toStr(this)===Type.toStr(o) } 
        //return [...Object.entries(this)].every(([k,v])=>)
    }
}
class HookAry extends HookableContainer(Array) { constructor(...args) { super(...args) } }
class HookSet extends HookableContainer(Set) { constructor(...args) { super(...args) } }
class HookMap extends HookableContainer(Map) { constructor(...args) { super(...args) } }
/*
class HookAry extends Array {
    constructor(...args) {
        super(...args)
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
    }
    _defineDestoryMethods() {
        for (let name of destroyMethods.Array) {
            Object.defineProperty(this, name, {
                value:(...args)=>{
                    const o = this
                    if (this._options.onValidate(o, name, args)) {
                        const r = super[name](...args)
                        this._options.onValid(o, this)
                    }
                    else { this._options.onInvalid(o) }
                    if (this.compare(o)) { this._options.onChanged() }
                    else { this._options.onUnchanged() }
                    return r
                },
            })
        }
    }
    _isChanged(o) { return this.length === b.length && this.every((v,i) =>v===b[i]) }
}
class HookSet {

}
class HookObj {

}
class HookMap {

}
class HookVal {
    static of(...args) { return new Hook(...args) }
    constructor(options) {
        this._i = null; // 入力値（  invalitable value）
        this._v = null; // 最終値（    valitable value）
        this._o = null; // 前回値（old valitable value）
        this._options = {...{
            onBefore: ()=>{},
            onValidate: (i)=>true,
            onSet: (i,o)=>i,
            onSetDefault: (i,o)=>o,
            onValid: (i,v,o)=>{},
            onInvalid: (i,v,o)=>{},
            onChanged: (i,v,o)=>{},
            onUnchanged: (i,v,o)=>{},
            onAfter: ()=>{},
        }, ...options}
    }
    get i( ) { return this._i }
    get v( ) { return this._v }
    get o( ) { return this._o }
    set i(v) {
        this._i = v
        this._options.onBefore(this._i, this._v, this._o)
        const [onSet, onValid] = ifel(this._options.onValidate(this._i, this._v, this._o), 
            ()=>['onSet', 'onValid'],
            ()=>['onSetDefault', 'onInvalid'])
        this._o = this._v
        this._v = this._options[onSet](this._i, this._o)
        this._options[onValid](this._i, this._v, this._o)
        this._options[this.v === this.o ? 'onUnchanged' : 'onChanged'](this._i, this._v, this._o)
        this._options.onAfter(this._i, this._v, this._o)
    }
}
window.hook = Fix.obj({
    val: (...args)=>HookVal.of(...args),
    obj: (...args)=>HookObj.of(...args),
    ary: (...args)=>HookAry.of(...args),
    set: (...args)=>HookSet.of(...args),
    map: (...args)=>HookMap.of(...args),
}, 'val', false, 'val')
*/
window.hook = Object.deepFreeze({
    val: (...args)=>HookVal.of(...args),
    obj: (...args)=>HookObj.of(...args),
    ary: (...args)=>HookAry.of(...args),
    set: (...args)=>HookSet.of(...args),
    map: (...args)=>HookMap.of(...args),
    types: {
        obj: HookObj,
    },
    errors: {
        valid: ValidError,
    }
})
})();

