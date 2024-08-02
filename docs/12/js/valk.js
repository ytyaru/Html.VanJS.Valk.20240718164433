(function(){
class FixError extends Error { constructor(msg=`Assignment to fix variable.`) { super(msg); this.name='FixError' } }
class EnumError extends Error { constructor(msg=`Enum generation failed.`) { super(msg); this.name='EnumError' } }
class CounterError extends Error { constructor(msg=`Assignment to counter variable.`) { super(msg); this.name='CounterError' } }
const valk = {
    fix:(v)=>Fix.get(v),
    enum:(...args)=>Enum.make(...args),
    count:(...args)=>new Counter(...args),
    errors: {
        FixError: FixError,
        EnumError: EnumError,
        CounterError: CounterError,
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
class Enum {
    static types = {}
    static make(typeName, ids) {
        const v = new Enum(typeName, ids)
        Enum.types[typeName] = new Proxy(v, {
            set(target, key, value, receiver) { throw new FixError() },
            get(target, key, receiver) {
                if ('typeName'===key) { return `Proxy(valk.enum(${typeName}))` }
                if (v.has(key)) { return v.get(key) }
                if (key in target) {
                    if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // ゲッター
                    else if ('function'===typeof target[key]) { return target[key].bind(target) } // メソッド参照
                    return target[key] // プロパティ値
                }
                else { throw new ReferenceError(`Key does not exist.: ${key}`) }
            },
            getPrototypeOf(target) { return v.type }, // some instanceof Enum.types.typeName
        })
        return Enum.types[typeName]
    }
    constructor(typeName, ids) {
        if (!Type.isStr(typeName)) { throw new EnumError(`typeNameは文字列のみ有効です。`) }
        ids = this.#split(ids)
        if (!Type.isStrs(ids)) { throw new EnumError(`idsは文字列配列またはカンマ、スペース、改行区切りの文字列のみ有効です。`) }
        //this._type = new Function(`return class ${typeName} {constructor(v){this._v=v}}`)()
        //this._type = new Function(`return class ${typeName} {constructor(v){this._v=v} get v(){return this._v}}`)()
        this.#createType(typeName, ids)
        window[typeName] = this._type
        this._keys = ids
        this._values = this._keys.map(id=>new this._type(id))
        this._obj = Object.assign(...this._keys.map(v=>[v,v]).map(([k,v])=>({[k]:v})))
        this.#defineIs(ids)
    }
    get keys() { return this._keys }
    get values() { return this._values }
    get obj() { return this._obj }
    get type() { return this._type }
    has(v) { return this.hasKey(v) || this.hasValue(v) }
    hasKey(k) { return this._keys.includes(k) }
    hasValue(v) { return this._values.includes(v) }
    isTypeOf(v) { return v instanceof this._type }
    get(v) { return this._values[this._keys.indexOf(v)] }
    #split(ids) {
        if (Type.isStr(ids)) {
            for (let delim of [',',' ','\n']) {
                if (ids.includes(delim)) { return ids.split(delim) }
            }
        }
        return ids
    }
    #defineIs(ids) {
        for (let id of ids) {
            console.log('*******************:', id)
            Object.defineProperty(this, `is${id}`, {
                get () { return this===this.values[this.keys.indexOf(id)] },
                enumerable:true,
            })
        }
    }
    #createType(typeName, ids) {
        console.log(typeName, ids)
//        const idStrs = ids.join(',')
        const getterSrc = ids.map(id=>this.#makeIs(id)).join('\n')
        this._type = new Function(`return class ${typeName} {
    constructor(v) {
        this._v=v;
    }
    ${getterSrc}
}`)()
    }
    #makeIs(id) { return `get is${id}() { return this._v==='${id}'; }` }
}
Enum.make('CounterCompleted', 'Error,Keep,Over,Every,Clear') // Once(Error, Keep(ignore cout), Over), Multi(Every, Clear(ReStart))
class Counter {
    constructor(...args) {
        this._tick = 0;
        this._options = {onStep:(v,tick,op)=>++v, onComplete:(v,tick,op)=>{}}
        this._isCompletedOnce = false
        this._init(...args)
    }
    _init(...args) {
        if (0===args.length || 1===args.length && Type.isInt(args[0]) && 0===args[0]) return this._initN()
        if (1===args.length && Type.isInt(args[0])) return this._initV(...args)
        if (1===args.length && Type.isObj(args[0])) return this._initO(...args)
        if (2===args.length && [...args].every(v=>Type.isInt(v))) return this._initR(...args)
        if (2===args.length && Type.isInt(args[0]) && Type.isObj(args[1])) return (0===args[0]) 
            ? this._initO(...[...args].slice(1)) 
            : this._initVO(...args)
        if (3===args.length && [...args.slice(0,2)].every(v=>Type.isInt(v)) && Type.isObj(args[2])) return this._initRO(...args)
        throw new Error(`コンストラクタのシグネチャが一致しませんでした。次のパターンのみ有効です。[int], [obj], [int, int], [int, obj], [int, int, obj]: ${args}`)
    }
    _initN() { this._initR(0, Infinity); this._onCompletedType = Enum.types.CounterCompleted.Over; }
    _initV(v) { this._initR(0<=v ? 0 : Math.abs(v), 0<=v ? v : 0) }
    _initVO(v,o) { this._initRO(0<=v ? 0 : Math.abs(v), 0<=v ? v : 0, o) }
    _initO(o) { this._initRO(0, Infinity, o) }
    _initR(start, end) {
        this._initRO(start, end, {
            onStep: (start < end ? ((v,tick,op)=>++v) : ((v,tick,op)=>--v)), 
            onComplete: ((v,tick,op)=>{}),
        })
    }
    _initRO(start, end, options) {
        if (start===end) { throw new Error(`startとendは等値を許しません。カウントしたい値の範囲を指定してください。`) } 
        this._v = start;
        this._start = start;
        this._end = end;
        this._isAsc = this._start < this._end
        this._onCompletedType = Enum.types.CounterCompleted.Clear;
//        this._options = options;
        if (end < start) { this._options.onStep = (v,tick,op)=>--v; }
        console.log(options, options.type)
        for (let key of 'onStep,onComplete'.split(',')) {
//            if (Type.isFn(options[key])) { this[`_${key}`] = options[key] }
            if (Type.isFn(options[key])) { this._options[key] = options[key] }
        }
        if (options.hasOwnProperty('type')) {
            if (valk.enums.CounterCompleted.hasValue(options.type)) {this._onCompletedType = options.type}
            else {throw new TypeError(`options.typeは次の値のみ有効です。: valk.enums.CounterCompleted ${valk.enums.CounterCompleted.keys.join('/')}`)}
        }
//        console.log(this._onCompletedType, valk.enums.CounterCompleted.hasValue(valk.enums.CounterCompleted.Error), valk.enums.CounterCompleted.hasValue(options.type))
    }
    get v() { return this._v }
    //get isCompleted() { return this._isCompleted }
    get isCompleted() {
        if ( this._isAsc && this._end <= this._v) { return true }
        if (!this._isAsc && this._v <= this._end) { return true }
        return false
    }
    count() {
        //if (this._end===this._v) { }
        //this._v = this._onStep(this._v, this._tick, this._options)
        //this._v = this._options.onStep(this._v, this._tick, this._options)
        //console.log(this._v)
        //this._isCompleted = this._end <= this._v
        if (this.isCompleted && valk.enums.CounterCompleted.Keep===this._onCompletedType) {return}
        else { this._v = this._options.onStep(this._v, this._tick, this._options) }
        if (this.isCompleted) {
            console.log(valk.enums)
            console.log(valk.enums.CounterCompleted)
            switch (this._onCompletedType) {// this._options.type
                case valk.enums.CounterCompleted.Error: throw new CounterError(`すでにCompletedです。`)
                case valk.enums.CounterCompleted.Over: if (this._isCompletedOnce) {return}
            }
            this._options.onComplete(this._v, this._tick, this._options)
            this._isCompletedOnce = true
            console.log(this._options.type, this._onCompletedType, valk.enums.CounterCompleted.Clear, this._onCompletedType===valk.enums.CounterCompleted.Clear)
            console.log(this._v, this._start, this._isAsc)
            //if (this._options.type===valk.enums.CounterCompleted.Clear) { this._v = this._start }
            if (this._onCompletedType===valk.enums.CounterCompleted.Clear) { this._v = this._start }
            console.log(this._v, this._start, this._isAsc)
            /*
            if (this._options.type.isError) { throw new CounterError(`すでにCompletedです。`) }
            if (this._options.type.isOver && this._isCompletedOnce) { return }
            this._options.onComplete(this._v, this._tick, this._options)
            this._isCompletedOnce = true
            if (this._options.type.isClear) { this._v = this._start }
            */
        }
        return this._v
    }
    _completedRoute() {
        /*
        const o = this._v
        this._v = this._options.onStep(this._v, this._tick, this._options)
        if (this.isComplete) {
            if (this._options.type.isError) { throw new CounterError(`すでにCompletedです。`) }
            else if (this._options.type.isKeep) {this._options.onCompleted(this._v, this._tick, this._options);this._v=o;return}
            //else if (this._options.type.isOver) {this._v = this._options.onStep(this._v, this._tick, this._options)}
            else if (this._options.type.isOver) {}
            else if (this._options.type.isEvery) {return this._options.onCompleted(this._v, this._tick, this._options);}
            else if (this._options.type.isClear) {this._v = this._start}
            //else {}
        }
        */
        //if (this.isCompleted && (this._options.type.isKeep || this._options.type.isEvery)) {}
        if (this.isCompleted && this._options.type.isKeep) {return}
        else { this._v = this._options.onStep(this._v, this._tick, this._options) }
        if (this.isCompleted) {
            if (this._options.type.isError) { throw new CounterError(`すでにCompletedです。`) }
            if (this._options.type.isOver && this._isCompletedOnce) { return }
            this._options.onComplete(this._v, this._tick, this._options)
            this._isCompletedOnce = true
            if (this._options.type.isClear) { this._v = this._start }
        }
    }
    _count() {
        switch (this._options.type) {
            case valk.enums.CounterCompleted.Error: throw new CounterError(`すでにCompletedです。`)
            case valk.enums.CounterCompleted.Keep: return false
            case valk.enums.CounterCompleted.Over: return true
            case valk.enums.CounterCompleted.Every: return 
            case valk.enums.CounterCompleted.Clear: return 

        }
    }
    _isComplete() {
        if ( this._isAsc && this._end <= this._v) { return true }
        if (!this._isAsc && this._v <= this._end) { return true }
        return false
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
valk.enums = Enum.types
valk.types = {
    Counter: Counter,
}
window.valk = valk
})()
