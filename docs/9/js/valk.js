(function(){
class FixError extends Error { constructor(msg=`Assignment to fix variable.`) { super(msg); this.name='FixError' } }
class CounterError extends Error { constructor(msg=`Assignment to counter variable.`) { super(msg); this.name='CounterError' } }
const valk = {
    fix:(v)=>Fix.get(v),
    count:(...args)=>new Counter(...args),
    /*
    count:(v, options)=>{
        if (!(Number(n) === n && n % 1 === 0)) { v = 0 }
        if ('Object'!==options.constructor.name) { options = {step:(tick)=>tick++} }
    },
    */
    errors: {
        FixError: FixError,
    },
}
class Fix {
    static get(v) { return this._getProxy(...this._getProxyArgs(v)) }
    static _getProxyArgs(v) {
        if (Array.isArray(v)) { return [v, 'copyWithin,fill,pop,push,reverse,shift,sort,splice,unshift'.split(',')] }
        if (v instanceof Set) { return [v, 'add,clear,delete'.split(',')] }
        if (v instanceof Map) { return [v, 'clear,delete,set'.split(',')] }
        if ('Object'===v.constructor.name) { return [new Map(Object.entries(v)), 'clear,delete,set'.split(',')] }
        return [{v:v}, []]
    }
    static _getProxy(obj, fixErrFnNms=[]) { // fixErrFnNms:破壊的メソッド名リスト
        const nm = this.getTypeNameId(obj)
        return new Proxy(obj, {
            set(target, key, value, receiver) { throw new FixError() },
            get(target, key, receiver) {
                if ('typeName'===key) { return `Proxy(valk.Fix${nm})` }
                if (fixErrFnNms.some(n=>n===key)) { throw new FixError() }
                if (key in target) {
                    if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // ゲッター
                    else if ('function'===typeof target[key]) { return target[key].bind(target) } // メソッド参照
                    return target[key] // プロパティ値
                }
                else { throw new ReferenceError(`Property does not exist: ${key}`) }
            },
        })
    }
    static getTypeNameId(v) { return Array.isArray(v) || v instanceof Set || v instanceof Map ? v.constructor.name : 'Value' }
}

// const CompletedTypes = valk.enum('CompletedTypes', 'Error,Keep,Clear,Over'.split(','), 'Over')
// CompletedTypes.Error/Keep/Clear/Over
// CompletedTypes.Error/Keep/Clear/Over instanceof CompletedTypes 
class Enum {
    static _getProxy(obj, fixErrFnNms=[]) { // fixErrFnNms:破壊的メソッド名リスト
//        const nm = this.getTypeNameId(obj)
        return new Proxy(obj, {
            set(target, key, value, receiver) { throw new FixError() },
            get(target, key, receiver) {
                if ('typeName'===key) { return `Proxy(valk.Enum(SomeTypeName))` }
                if (fixErrFnNms.some(n=>n===key)) { throw new FixError() }
                if (key in target) {
                    if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // ゲッター
                    else if ('function'===typeof target[key]) { return target[key].bind(target) } // メソッド参照
                    return target[key] // プロパティ値
                }
                else { throw new ReferenceError(`Property does not exist: ${key}`) }
            },
        })
    }
    static getTypeNameId(v) { return Array.isArray(v) || v instanceof Set || v instanceof Map ? v.constructor.name : 'Value' }

}
class BaseCounter {}
BaseCounter.onCompletedTypes = {
    Error: 'Error',
    Keep: 'Keep',
    Clear: 'Clear',
    Over: 'Over',
}
/*
class CompletedTypes {
    constructor(v) { this._v = v }
    get Error() { this._v = 'Error'; return this; }
    get Keep() { this._v = 'Keep'; return this; }
    get Clear() { this._v = 'Clear'; return this; }
    get Over() { this._v = 'Over'; return this; }
}
class CompletedTypes {
    get Error() { return 'Error' }
    get Keep() { return 'Keep' }
    get Clear() { return 'Clear' }
    get Over() { return 'Over' }
}
valk.enum = {
    CompletedTypes: new CompletedTypes('Over'),
}


class CompletedType { constructor(v) { this._v = v } }
class CompletedType {
//    constructor(v) { this._ids = 'Error,Keep,Clear,Over'.split(','); Object.freeze(this._ids); this._v = v ?? 'Over'; }
//    get isError() { return 'Error'===this._v }
//    get isKeep() { return 'Keep'===this._v }
//    get isClear() { return 'Clear'===this._v }
//    get isOver() { return 'Over'===this._v }
//    compare(v) {
//        if (!(v instanceof CompletedType)) { throw new TypeError(`引数vは${this.constructor.name}型であるべきです。`) }
//        return this._v === v._v
//    }
    get ids() { return this._ids }
    get all() { this._ids.map(id=>new CompletedType(id)) }
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
const CompletedTypeCls = valk.enum('CompletedType', 'Error,Keep,Clear,Over'.split(','), 'Over') // 型名, 全値, 初期値
const cplType = new CompletedTypeCls()
cplType instanceof CompletedTypeCls
cplType.isError/isKeep/isClear/isOver
cplType.eq/compare(someValue)
cplType === CompletedTypeCls.Error
CompletedTypeCls._all.some(v=>v===cplType)

CompletedType.Error
CompletedType.Keep
CompletedType.Clear
CompletedType.Over

class CompletedTypeValue {
    constructor(list, initV) {
        this._list = [
            CompletedTypeValue('Error'),
            CompletedTypeValue('Keep'),
            CompletedTypeValue('Clear'),
            CompletedTypeValue('Over'),
        ]
        Object.freeze(this._list)
    }
}
class CompletedType {
    static 
}
Object.defineProperty(CompletedType, 'Error', {
    get () { }
})

cplType.

class CompletedTypes {
    constructor(v) {
        this._list = [
            new CompletedType('Error'),
            new CompletedType('Keep'),
            new CompletedType('Clear'),
            new CompletedType('Over'),
        ]
        Object.freeze(this._list)
    }
    get all() { return this._list }
    get Error() { return this._list[0] }
    get Keep() { return this._list[1] }
    get Clear() { return this._list[2] }
    get Over() { return this._list[3] }
}
new Proxy({}, {
    set(target, key, value, receiver) { throw new FixError() },
    get(target, key, receiver) {
        if ('Error,Keep,Clear,Over'.split(',').some(n=>n===key)) { return new CompletedType(key) }
    },
})
v instanceof CompletedType
v === CompletedTypes.Error
v.isError
*/
Object.freeze(BaseCounter.onCompletedTypes)
class Counter extends BaseCounter { // onStep, onComplet, onCompleted
    constructor(...args) {
        super()
        this._tick = 0;
        this._onCompletedType = this.constructor.onCompletedTypes.Over;
        //this._onCompletedType = valk.enum.CompletedTypes.Over;
        this._init(...args)
    }
    _init(...args) {
        //if (0===args.length) return this._initV(0)
        //if (0===args.length) return this._initR(0, Infinity)
        if (0===args.length || 1===args.length && Type.isInt(args[0]) && 0===args[0]) return this._initN()
        //if (1===args.length && Type.isInt(args[0])) return this._initV(...args)
        //if (1===args.length && Type.isInt(args[0])) return this._initR(
        //    0<=args[0] ? 0 : Math.abs(args[0]), 
        //    0<=args[0] ? args[0] : 0)
        if (1===args.length && Type.isInt(args[0])) return this._initV(...args)
        //if (1===args.length && Type.isObj(args[0])) return this._initO(args[0])
        //if (1===args.length && Type.isObj(args[0])) return this._initRO(0, Infinity, args[0])
        if (1===args.length && Type.isObj(args[0])) return this._initO(...args)
        if (2===args.length && [...args].every(v=>Type.isInt(v))) return this._initR(...args)
        //if (2===args.length && Type.isInt(args[0])) && Type.isObj(args[1])) return this._initVO(...args)
        //if (2===args.length && Type.isInt(args[0])) && Type.isObj(args[1])) return this._initRO(
        //    0<=args[0] ? 0 : Math.abs(args[0]), 
        //    0<=args[0] ? args[0] : 0, args[1])
        if (2===args.length && Type.isInt(args[0]) && Type.isObj(args[1])) return this._initVO(...args)
        if (3===args.length && [...args.slice(0,2)].every(v=>Type.isInt(v)) && Type.isObj(args[2])) return this._initRO(...args)
        throw new Error(`コンストラクタのシグネチャが一致しませんでした。次のパターンのみ有効です。[int], [obj], [int, int], [int, obj], [int, int, obj]: ${args}`)
    }
    _initN() { this._initR(0, Infinity) }
    _initV(v) { this._initR(0<=v ? 0 : Math.abs(v), 0<=v ? v : 0) }
    _initVO(v,o) { this._initRO(0<=v ? 0 : Math.abs(v), 0<=v ? v : 0, o) }
    _initO(o) { this._initRO(0, Infinity, o) }
    _initR(start, end) {
        this._initRO(start, end, {
            onStep: (start < end ? ((v,tick,op)=>v++) : ((v,tick,op)=>v--)), 
            onComplete: ((v,tick,op)=>{}),
        })
    }
    _initRO(start, end, options) {
        if (start===end) { throw new Error(`startとendは等値を許しません。カウントしたい値の範囲を指定してください。`) } 
        this._v = start;
        this._start = start;
        this._end = end;
        for (let key of 'type,onStep,onComplete'.split(',')) {
            if (Type.isFn(options[key])) { this[`_${key}`] = options[key] }
        }
        if (options.hasOwnProperty('type')) {
            const valids = [...Object.values(this.constructor.onCompletedTypes)]
            if (valids.some(v=>v===options.type)) {
                this._type = options.type
            } else { throw new TypeError(`options.typeは次の値のみ有効です。[${valids}]`) }
        }
        
        options.hasOwnProperty('type') && options.type instanceof CompletedTypes
        
        for (let key of 'type'.split(',')) {
            if (Type.isFn(options[key])) { this[`_${key}`] = options[key] }
        }
//            throw new Error(`countのoptionsは次のキーのみ有効です。type:valk.types.Counter.onCompleteTypes, onStep:(v,tick,op)=>{}, onComplete:(v,tick,op)=>{}: ${key}`)
    }
    get v() { return this._v }
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

/*
class Counter { // onStep, onComplet, onCompleted
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
*/
valk.types = {
    Counter: Counter,
}
window.valk = valk
})()
