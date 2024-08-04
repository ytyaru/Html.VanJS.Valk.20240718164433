(function(){
class FixError extends Error { constructor(msg=`Assignment to fix variable.`) { super(msg); this.name='FixError' } }
class EnumError extends Error { constructor(msg=`Enum generation failed.`) { super(msg); this.name='EnumError' } }
class CounterError extends Error { constructor(msg=`Assignment to counter variable.`) { super(msg); this.name='CounterError' } }
class SomeError extends Error { constructor(msg=`Only the specified value can be assigned.`) { super(msg); this.name='SomeError' } }
const valk = {
    fix:(v)=>Fix.get(v),
    enum:(...args)=>Enum.make(...args),
    count:(...args)=>new Counter(...args),
    range:(...args)=>Range.of(...args),
    some:(...args)=>Some.of(...args),
    typed:(...args)=>null,
    valid:(...args)=>null,
    changed:(...args)=>null,
    errors: {
        FixError: FixError,
        EnumError: EnumError,
        CounterError: CounterError,
        SomeError: SomeError,
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
            Object.defineProperty(this, `is${id}`, {
                get () { return this===this.values[this.keys.indexOf(id)] },
                enumerable:true,
            })
        }
    }
    #createType(typeName, ids) {
        console.log(typeName, ids)
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
    _initO(o) { this._initRO(0, Infinity, {type:Enum.types.CounterCompleted.Over, ...o}) }
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
        if (end < start) { this._options.onStep = (v,tick,op)=>--v; }
        console.log(options, options.type)
        for (let key of 'onStep,onComplete'.split(',')) {
            if (Type.isFn(options[key])) { this._options[key] = options[key] }
        }
        if (options.hasOwnProperty('type')) {
            if (valk.enums.CounterCompleted.hasValue(options.type)) {this._onCompletedType = options.type}
            else {throw new TypeError(`options.typeは次の値のみ有効です。: valk.enums.CounterCompleted ${valk.enums.CounterCompleted.keys.join('/')}`)}
        }
    }
    get v() { return this._v }
    get _isCompleted() {
        if ( this._isAsc && this._end <= this._v) { return true }
        if (!this._isAsc && this._v <= this._end) { return true }
        return false
    }
    get isCompleted() { return this._isCompletedOnce }
    count() {
        if (this._isCompleted && valk.enums.CounterCompleted.Keep===this._onCompletedType) {return}
        else { if (!(this._isCompletedOnce && this._onCompletedType.isEvery)) {this._v = this._options.onStep(this._v, this._tick, this._options)} }
        if (this._isCompleted) {
            switch (this._onCompletedType) {// this._options.type
                case valk.enums.CounterCompleted.Error: throw new CounterError(`すでにCompletedです。`)
                case valk.enums.CounterCompleted.Over: if (this._isCompletedOnce) {return}
            }
            this._options.onComplete(this._v, this._tick, this._options)
            this._isCompletedOnce = true
            if (this._onCompletedType===valk.enums.CounterCompleted.Clear) { this._v = this._start }
        }
        return this._v
    }
}
class Some {
    static of(v, candidates, writable=false) { return new Some(v, candidates, writable) }
    //constructor(v, candidates) {
    constructor(v, candidates, writable=false) {
        this._v = v
        console.log(writable)
        if (writable) {
            this._cands = (candidates instanceof Set) ? candidates : ((Array.isArray(candidates) ? new Set(candidates ) : null))
        } else {
            this._cands = ifel(
                ()=>candidates instanceof Set, ()=>valk.fix(candidates),
                ()=>Array.isArray(candidates), ()=>valk.fix(new Set(candidates)),
                null)
//            this._cands = ('Proxy(valk.FixSet)'===candidates.typeName) ? candidates : ((Array.isArray(candidates) ? valk.fix(new Set(candidates)) : null))
        }
        if (null===this._cands) { throw new TypeError(`Only Array or Set types are valid as candidates for the second argument.`) }
        if (!this._cands.has(this._v)) { throw new TypeError(`The initial value should match one of the candidates.`) }
        return new Proxy(this, {
            set(target, key, value, receiver) {
                if (key in target) {
                    if (Type.hasSetter(target, key)) { return Reflect.set(target, key, value) }
                    if (key in target) { target[key] = value }
                    else { throw new Error(`Assignment prohibited: ${key}`) }
                } else { throw new ReferenceError(`Property does not exist: ${key}`) }
            },
            get(target, key, receiver) {
                if ('typeName'===key) { return `Proxy(valk.Some)` }
                if (key in target) {
                    if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // ゲッター
                    else if ('function'===typeof target[key]) { return target[key].bind(target) } // メソッド参照
                    return target[key] // プロパティ値
                }
                else { throw new ReferenceError(`Property does not exist: ${key}`) }
            },
        })
    }
    get v( ) { return this._v }
    set v(v) {
        if (this._cands.has(v)) { this._v = v }
        else { throw new SomeError() }
    }
    get candidates() { return this._cands }
    match(...args) {
        const cbFns = [...args]
        if (cbFns < this._cands.size) { throw new TypeError(`match()の可変長引数の数は候補と同じかそれ以上であるべきです。: actula:${cbFns.length} expected: ${this._cands.size} (${[...this._cands.values()]})`) }
        for (let i=0; i<this._cands.size; i++) {
            const idx = [...this._cands].indexOf(this._v)
            if (-1 !== idx) { return (Type.isSFn(cbFns[idx])) ? cbFns[idx](this._v, idx) : cbFns[idx] }
        }
        // もし候補数より多くの関数があるなら最初の一つだけ実行する（ないなら未定義を返す）
        if (this._cands.size < cbFns.length) { return (Type.isSFn(cbFns[idx])) 
            ? cbFns[this._cands.size]() 
            : cbFns[this._cands.size] }
        return undefined
    }
}

class Range {
    static of(...args) { return new Range(...args) }
//    static of(v, candidates) { return new Some(v, candidates) }
    //constructor(v, candidates) {
    constructor(...args) {
        if (![...args].every(v=>Type.isInt(v))) { throw TypeError(`引数はすべて整数型にしてください。`) }
        if (2===args.length) {
            this._min = Math.min(args[0], args[1])
            this._max = Math.max(args[0], args[1])
            this._v = Type.isRange(0, this._min, this._max) ? 0 : this._min
        }
        else if (3===args.length) {
            this._v = args[0]
            this._min = Math.min(args[1], args[2])
            this._max = Math.max(args[1], args[2])
        }
        else { throw TypeError(`引数の数は2〜3つのみ有効です。[min, max], [iniVal, min, max]`) }
        console.log(this._v,this._min,this._max, Type.isInt(this._v), Type.isInt(this._min), Type.isInt(this._max))
//        if (![this._v,this._min,this._max].every(v=>Type.isInt(v))) { throw TypeError(`v,min,maxは整数型にしてください。`) }
        if (this._min===this._max) { throw TypeError(`minとmaxは同値を許しません。異なる整数値にしてください。`) }
//        this._v = v
//        this._cands = (candidates instanceof Set) ? candidates : ((Array.isArray(candidates) ? new Set(candidates ) : null))
//        if (null===this._cands) { throw new TypeError(`Only Array or Set types are valid as candidates for the second argument.`) }
//        if (!this._cands.has(this._v)) { throw new TypeError(`The initial value should match one of the candidates.`) }
        return new Proxy(this, {
            set(target, key, value, receiver) {
                if (key in target) {
                    if (Type.hasSetter(target, key)) { return Reflect.set(target, key, value) }
                    if (key in target) { target[key] = value }
                    else { throw new Error(`Assignment prohibited: ${key}`) }
                } else { throw new ReferenceError(`Property does not exist: ${key}`) }
            },
            get(target, key, receiver) {
                if ('typeName'===key) { return `Proxy(valk.Range)` }
                if (key in target) {
                    if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // ゲッター
                    else if ('function'===typeof target[key]) { return target[key].bind(target) } // メソッド参照
                    return target[key] // プロパティ値
                }
                else { throw new ReferenceError(`Property does not exist: ${key}`) }
            },
        })
    }
    get min() { return this._min }
    get max() { return this._max }
    get v( ) { return this._v }
    set v(v) {
        if (Type.isRange(v, this._min, this._max)) { this._v = v }
        else { throw new RangeError(`Out of range ${v}: ${this._min}..${this._max}`) }
    }
    within(obj) { // {'<':()=>'(下限外)', 0:()=>'赤', 30:()=>'可', 70:()=>'良', 90:()=>'優', '>':()=>'(上限外)', null:()=>'外'}
        const thresholds = [...Object.keys(obj)].map(v=>Number(v)).filter(v=>Type.isInt(v)).sort((a,b)=>a-b)
        const defFns = [...Object.keys(obj)].filter(v=>!Type.isInt(Number(v)))
        //if (!Type.isRange(this._v, this._min, this._max)) {throw new RangeError(`Out of range ${v}: ${this._min}...${this._max}`)}
        console.log(thresholds, defFns, thresholds.sort((a,b)=>a-b))
        for (let i=0; i<thresholds.length; i++) {
            if (!Type.isRange(thresholds[i], this._min, this._max)) {throw new RangeError(`Out of range thresholds[${i}] ${thresholds[i]}: ${this._min}..${this._max}`)}
        }
        if (this._min!==thresholds[0]) {throw new TypeError(`Start the threshold at the minimum value.`)}
//        let min = this._min
//        let max = thresholds[0] - 1


//        let min = 0;
//        let max = 0;
//        let min = thresholds[0]
//        let max = thresholds[1] - 1
//        if (Type.isRange(this._v, min, max)) { return Type.fnV(obj[`${min}`]) }
        //for (let th of thresholds) {
        //for (let i=1; i<thresholds.length; i++) {
        for (let i=0; i<thresholds.length; i++) {
            let min = thresholds[i]
            let max = (thresholds.length-1<=i) ? this._max : thresholds[i+1] - 1

            //console.log(min, max, obj[`${0===i ? max : max+1}`])
            //console.log(this._v, min, max, obj[`${max+1}`])
            console.log(this._v, min, max, obj[`${thresholds[i]}`])
//            if (Type.isRange(this._v, min, max)) { return Type.isFn(obj[max]) ? obj[max]() : obj[max] }
            //if (Type.isRange(this._v, min, max)) { return Type.fnV(obj[`${max}`]) }
            //if (Type.isRange(this._v, min, max)) { return Type.fnV(obj[`${thresholds[i+1]}`]) }
            //if (Type.isRange(this._v, min, max)) { return Type.fnV(obj[`${0===i ? max : max+1}`]) }
            //if (Type.isRange(this._v, min, max)) { return Type.fnV(obj[`${max+1}`]) }
            if (Type.isRange(this._v, min, max)) { return Type.fnV(obj[`${thresholds[i]}`]) }
            /*
            if (i<thresholds.length-1) {
                min = thresholds[i]
                max = thresholds[i+1] - 1
            }
            */
        }
//        if (0===defFns.length) { return undefined }
//        if ('<' in obj && this._v < this._min) { return Type.fnV(obj['<']) }
//        if ('>' in obj && this._max < this._v) { return Type.fnV(obj['>']) }
//        if (null in obj && Type.isRange(this._v, this._min, this._max)) { return Type.fnV(obj[null]) }
//        if (0 < defFns.length) { return Type.fnV(defFns[0]) }
//        if (0<defFns.length) { return Type.isFn(defFns[0]) ? defFns[0]() : defFns[0] }
    }
//    get candidates() { return this._cands }
    match(...args) {
        const cbFns = [...args]
        if (cbFns < this._cands.size) { throw new TypeError(`match()の可変長引数の数は候補と同じかそれ以上であるべきです。: actula:${cbFns.length} expected: ${this._cands.size} (${[...this._cands.values()]})`) }
        for (let i=0; i<this._cands.size; i++) {
            const idx = [...this._cands].indexOf(this._v)
            if (-1 !== idx) { return (Type.isSFn(cbFns[idx])) ? cbFns[idx](this._v, idx) : cbFns[idx] }
        }
        // もし候補数より多くの関数があるなら最初の一つだけ実行する（ないなら未定義を返す）
        if (this._cands.size < cbFns.length) { return (Type.isSFn(cbFns[idx])) 
            ? cbFns[this._cands.size]() 
            : cbFns[this._cands.size] }
        return undefined
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
