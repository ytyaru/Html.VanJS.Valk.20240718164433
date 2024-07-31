(function(){
class FixError extends Error { constructor(msg=`Assignment to fix variable.`) { super(msg); this.name='FixError' } }
class CounterError extends Error { constructor(msg=`Assignment to counter variable.`) { super(msg); this.name='CounterError' } }
const valk = {
    fix:(v)=>FixValue.get(v),
    count:(v, options)=>{
        if (!(Number(n) === n && n % 1 === 0)) { v = 0 }
        if ('Object'!==options.constructor.name) { options = {step:(tick)=>tick++} }
    },
    errors: {
        FixError: FixError,
    },
}
class FixValue {
    static get(v) {
        if (Array.isArray(v)) { return new FixedArray(v) }
        if (v instanceof Set) { return new FixedSet(v) }
        if (v instanceof Map || 'Object'===v.constructor.name) { return new FixedMap(v) }
        //if (v instanceof Map) { return new FixedMap(v) }
        //if ('Object'===v.constructor.name) { return new FixedMap(Object.entries(v)) }
        return this._getProxy({v:v})
    }
    static _getProxy(obj) {
        return new Proxy(obj, {
            set(target, key, value, receiver) { throw new FixError() },
            get(target, key, receiver) {
                if ('__type'===key) { return `Proxy(valk.FixedValue)` }
                if (key in target) { return Reflect.get(target, key) }
                else { throw new ReferenceError(`Property does not exist: ${key}`) }
            },
        })
    }
}
const ChangenableContainer = superClass => class extends superClass {
    constructor(...args) { super(...args); this._onChanged = ()=>{}; }
    get onChanged() { return this._onChanged }
    set onChanged(v) { if ('function'===typeof v) { this._onChanged = v } }
    _setupOnChanged(names) {
        for (let name of names) {
            Object.defineProperty(this, name, {
                value:(...args)=>{
                    super[name](...args)
                    this._onChanged(this)
                },
                writable: true,
                enumerable: true,
                configurable: true,
            })
        }
    }
}
class ChangedArray extends ChangenableContainer(Array) { // Arrayの破壊的メソッドを監視する
    constructor(...args) {
        super(...args)
        this._setupOnChanged('copyWithin,fill,pop,push,reverse,shift,sort,splice,unshift'.split(','))
    }
}
class FixedArray extends ChangedArray {
    constructor(...args) {
        super(...args)
        this._onChanged = ()=>{throw new FixError()}
        return this._getProxy(...args)
    }
    _getProxy(...args) {
        return new Proxy(...args, {
            set(target, key, value, receiver) { throw new FixError() },
            get(target, key, receiver) {
                if ('__type'===key) { return `Proxy(valk.FixedArray)` }
                return Reflect.get(target, key)
//                if (key in target) { return Reflect.get(target, key) }
//                else { throw new ReferenceError(`Property does not exist: ${key}`) }
                    // 例外が発生すべき所で発生せず
//                if (key in target) {
//                    if (Type.hasGetter(target, key)) { return Reflect.get(target, key) }
//                    else if ('function'===typeof target[key]) { return target[key].bind(target) }
//                }
//                else { throw new ReferenceError(`Property does not exist: ${key}`) }
            },
        })
    }
}
class ChangedSet extends ChangenableContainer(Set) {
    constructor(...args) {
        super(...args)
        this._setupOnChanged('add,clear,delete'.split(','))
    }
}
class FixedSet extends ChangedSet {
    constructor(...args) {
        super(...args)
        this._onChanged = ()=>{throw new FixError()}
        return this._getProxy(...args)
    }
    _getProxy(...args) {
        // 代入処理を一律エラーにするにはProxyを使うしかない。
        //const set = new Set(0===args.length ? [] : (args[0] instanceof Set ? [...args[0].values()] : (Array.isArray(args[0]) ? args[0] : [])))
        const v = new Set(0===args.length ? [] : (args[0] instanceof Set ? [...args[0].values()] : args[0]))
        return new Proxy(v, {
        //return new Proxy(...args, {
            set(target, key, value, receiver) { throw new FixError() },
            get(target, key, receiver) {
                if ('__type'===key) { return `Proxy(valk.FixedSet)` }
                if ('add,clear,delete'.split(',').some(n=>n===key)) { throw new FixError() }
                if (key in target) {
                    if (Type.hasGetter(target, key)) { return Reflect.get(target, key) }
                    else if ('function'===typeof target[key]) { return target[key].bind(target) }
                }
                else { throw new ReferenceError(`Property does not exist: ${key}`) }
            },
//            apply(target, thisArg, argumentsList) {
//                console.log(target, thisArg, argumentsList)
//                return target(...argumentsList)
//            },
        })
    }
}
class ChangedMap extends ChangenableContainer(Map) {
    constructor(...args) {
        super(...args)
        this._setupOnChanged('clear,delete,set'.split(','))
        //this._setupOnChanged('add,clear,delete,set'.split(','))
    }
}
class FixedMap {
//class FixedMap extends ChangedMap {
    constructor(...args) {
        //super(...args)
        /*
        if (1===args.length && 'Object'===args[0].constructor.name) { super([...Object.entries(args[0])]) }
        else if (1===args.length && args[0] instanceof Map) { super([...args[0].entries()]) }
        else { super(...args) }
//        if (1===args.length && ('Object'===args[0].constructor.name || args[0] instanceof Map)) { console.log('*********', );super(Array.from(Object.entries(args[0]))) } else { super(...args) }
//        (1===args.length && 'Object'===args[0].constructor.name) ? super(Array.from(Object.entries(args[0]))) : super(...args);
        this._onChanged = ()=>{throw new FixError()};
        return this._getProxy(...args)
        */
        return this._getProxy(...args)
    }
//    constructor(...args) { super(...args); this._onChanged = ()=>{throw new FixError()}; }
//    static get [Symbol.species]() { return Array; }
    _getProxy(...args) {
        //const map = new Map(0===args.length ? [] : (Type.isItr(args[0]) ? args[0] : ('Object'===args[0].constructor.name ? [...Object.entries(args[0])] : [])))
        const map = new Map(0===args.length ? [] : (Type.isItr(args[0]) ? args[0] : ('Object'===args[0].constructor.name ? [...Object.entries(args[0])] : args[0])))
//        Type.isItr()
//        if ('Object'===v.constructor.name) { return new FixedMap(Object.entries(v)) }
        // 代入処理を一律エラーにするにはProxyを使うしかない。
        return new Proxy(map, {
        //return new Proxy(...args, {
            set(target, key, value, receiver) { throw new FixError() },
            get(target, key, receiver) {
                if ('__type'===key) { return `Proxy(valk.FixedMap)` }
                if ('clear,delete,set'.split(',').some(n=>n===key)) { throw new FixError() }
                if (key in target) {
                    if (Type.hasGetter(target, key)) { return Reflect.get(target, key) }
                    else if ('function'===typeof target[key]) { return target[key].bind(target) }
                }
                else { throw new ReferenceError(`Property does not exist: ${key}`) }
            },
//            apply(target, thisArg, argumentsList) {
//                console.log(target, thisArg, argumentsList)
//                return target(...argumentsList)
//            },
        })
    }
}

/*
class ChangedWeakSet extends ChangenableContainer(WeakSet) {
    constructor(...args) {
        super(...args)
        this._setupOnChanged('add,delete'.split(','))
    }
}
class FixedWeakSet extends ChangedWeakSet {
    constructor(...args) { super(...args); this._onChanged = ()=>{throw new FixError()}; }
//    static get [Symbol.species]() { return Array; }
}
class ChangedWeakMap extends ChangenableContainer(WeakMap) {
    constructor(...args) {
        super(...args)
        this._setupOnChanged('add,delete,set'.split(','))
    }
}
class FixedWeakMap extends ChangedWeakMap {
    constructor(...args) { super(...args); this._onChanged = ()=>{throw new FixError()}; }
//    static get [Symbol.species]() { return Array; }
}
*/


/*
class ChangedContainer { // 破壊的メソッドを監視する
    constructor(...args) { this._onChanged = ()=>{}; this._setupOnChanged(); }
    get onChanged() { return this._onChanged }
    set onChanged(v) { if ('function'===typeof v) { this._onChanged = v } }
    _setupOnChanged(names) {
        Object.defineProperty(this, name, (...args)=>{
            super[name](...args)
            this._onChanged(this)
        })
    }

}
class ChangedArray extends Array { // 破壊的メソッドを監視する
    constructor(...args) { super(...args); this._onChanged = ()=>{}; this._setupOnChanged(); }
    get onChanged() { return this._onChanged }
    set onChanged(v) { if ('function'===typeof v) { this._onChanged = v } }
    _setupOnChanged() {
        const names = 'copyWithin,fill,pop,push,reverse,shift,sort,splice,unshift'.split(',')
        Object.defineProperty(this, name, (...args)=>{
            super[name](...args)
            this._onChanged(this)
        })
    }
//    copyWithin(...args) { super.copyWithin(...args); this._onChanged(this); }
//    fill(...args) { super.fill(...args); this._onChanged(this); }
}
*/
class Counter {
    constructor(v, options) {
    //constructor(v, step) {
        if (!(Number(n) === n && n % 1 === 0)) { v = 0 }
        if ('Object'!==options.constructor.name) { this._options = {step:(v, tick, op, ...args)=>v++, threshold:null, onCompleted:(v,tick,op)=>{}} }
        //if ('function'!==typeof step) { this._step = (tick)=>tick++; }
        this._tick = 0
        this.v = v
    }
    get v() { return this._v }
    set v(v) { throw new CounterError }
    count(...args) { this._v = this._options.step(this._v, this._tick, this._option, ...args); this._tick++; this._runCompleted(); return this._v; }
    _runCompleted() {
        if (Number.isNaN(this._options.threshold)) { return }
        if (this._options.threshold <= this._v) {
            if ('AsyncFunction'===this._options.onCompleted.constructor.name) { this._options.onCompleted(this._v, this._tick, this._option).then(()=>{}).catch(e=>{throw e}) }
            else if ('function'===this._options.onCompleted) { this._options.onCompleted(this._v, this._tick) }
        }
    }
}

valk.types = {
    FixedArray: FixedArray,
    FixedSet: FixedSet,
    FixedMap: FixedMap,
//    FixedWeakSet: FixedWeakSet,
//    FixedWeakMap: FixedWeakMap,
}
window.valk = valk
//window.FixError = FixError
})()
