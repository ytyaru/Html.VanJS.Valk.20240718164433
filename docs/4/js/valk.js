(function(){
class FixError extends Error { constructor(msg=`Assignment to fix variable.`) { super(msg); this.name='FixError' } }
class CounterError extends Error { constructor(msg=`Assignment to counter variable.`) { super(msg); this.name='CounterError' } }
const valk = {
    fix:(v)=>FixValue.get(v),
    /*
    fix:(v)=>{
        const obj = FixValue.get(v)
        const pxy = new Proxy(obj, {
            set(target, key, value, receiver) { throw new FixError() },
            //get(target, key, receiver) { return Reflect.get(obj, key) },
            get(target, key, receiver) {
                if ('__type'===key) { return `Proxy(valk.FixValue)` }
                console.log(target, obj, key, receiver)
                return Reflect.get(target, key)
//                return Reflect.get(obj, key)
                //return Reflect.get(obj, key)
                //return Reflect.get(obj, key, receiver)
                //return Reflect.get(obj, key, obj)
            },
        })
//        pxy.__type = `Proxy(valk.fix())`
        return pxy
    },
    */
    /*
    fix:(v)=>{
        const obj = FixValue.get(v)
        const pxy = new Proxy(obj, {
            set(target, key, value, receiver) { throw new FixError() },
            //get(target, key, receiver) { return Reflect.get(obj, key) },
            get(target, key, receiver) {
                if ('__type'===key) { return `Proxy(valk.FixValue)` }
                console.log(obj, key, receiver)
                return Reflect.get(obj, key)
                //return Reflect.get(obj, key)
                //return Reflect.get(obj, key, receiver)
                //return Reflect.get(obj, key, obj)
            },
        })
//        pxy.__type = `Proxy(valk.fix())`
        return pxy
    },
    */
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
//        if (Array.isArray(v)) { return FixedArray.of(...v) }
        if (Array.isArray(v)) { return this._getFixedArray(v) }
        if (v instanceof Set) { return new FixedSet(v) }
        if (v instanceof Map) { return new FixedMap(v) }
        if ('Object'===v.constructor.name) { return new FixedMap(v) }
        return this._getProxy({v:v})
//        if ('Object'===v.constructor.name) { return new FixedMap(Array.from(Object.entries(v))) }
//        if (v instanceof WeakSet) { return new FixedWeakSet(v) }
//        if (v instanceof WeakMap) { return new FixedWeakMap(v) }
//        return {v:v}
    }
    static _getFixedArray(v) {
//        return FixedArray.of(...v)
        return new Proxy(FixedArray.of(...v), {
            set(target, key, value, receiver) { throw new FixError() },
            //get(target, key, receiver) { return Reflect.get(target, key) },
            get(target, key, receiver) {
                if ('__type'===key) { return `Proxy(valk.FixArray)` }
                console.log(target, key, receiver)
                return Reflect.get(target, key)
            },
        })
        /*
        */
    }
    static _getProxy(obj) {
        return new Proxy(obj, {
            set(target, key, value, receiver) { throw new FixError() },
            //get(target, key, receiver) { return Reflect.get(obj, key) },
            get(target, key, receiver) {
                if ('__type'===key) { return `Proxy(valk.FixValue)` }
                return Reflect.get(obj, key)
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
    constructor(...args) { super(...args); this._onChanged = ()=>{throw new FixError()}; }
//    static get [Symbol.species]() { return Array; }
}
class ChangedSet extends ChangenableContainer(Set) {
    constructor(...args) {
        super(...args)
        this._setupOnChanged('add,clear,delete'.split(','))
    }
}
class FixedSet extends ChangedSet {
    constructor(...args) { super(...args); this._onChanged = ()=>{throw new FixError()}; }
//    static get [Symbol.species]() { return Array; }
}
class ChangedMap extends ChangenableContainer(Map) {
    constructor(...args) {
        super(...args)
        this._setupOnChanged('clear,delete,set'.split(','))
        //this._setupOnChanged('add,clear,delete,set'.split(','))
    }
}
class FixedMap extends ChangedMap {
    constructor(...args) {
        if (1===args.length && 'Object'===args[0].constructor.name) { super([...Object.entries(args[0])]) }
        else if (1===args.length && args[0] instanceof Map) { super([...args[0].entries()]) }
        else { super(...args) }
//        if (1===args.length && ('Object'===args[0].constructor.name || args[0] instanceof Map)) { console.log('*********', );super(Array.from(Object.entries(args[0]))) } else { super(...args) }
//        (1===args.length && 'Object'===args[0].constructor.name) ? super(Array.from(Object.entries(args[0]))) : super(...args);
        this._onChanged = ()=>{throw new FixError()};
    }
//    constructor(...args) { super(...args); this._onChanged = ()=>{throw new FixError()}; }
//    static get [Symbol.species]() { return Array; }
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
