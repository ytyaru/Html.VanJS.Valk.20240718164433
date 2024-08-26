;(function(){
// Error
class FixError extends Error { constructor(msg=`Assignment to fix variable.`) { super(msg); this.name='FixError' } }
class EnumError extends Error { constructor(msg=`Enum generation failed.`) { super(msg); this.name='EnumError' } }
class CounterError extends Error { constructor(msg=`Assignment to counter variable.`) { super(msg); this.name='CounterError' } }
class SomeError extends Error { constructor(msg=`Only the specified value can be assigned.`) { super(msg); this.name='SomeError' } }
class ValidError extends Error { constructor(msg=`Invalid value.`) { super(msg); this.name='ValidError' } }
// Fix
class FixVal extends hook.types.val {
    static of(...args) { return new FixVal(...args) }
    constructor(v, options={}, insOpts={}) { super(v, options={}, {getDestroyMethod: false, setDefined:false, ...insOpts}) }
}
class FixObj extends hook.types.obj {
    static of(...args) { return new FixObj(...args) }
    constructor(v, options={}, insOpts={}) { super(v, options={}, {getDestroyMethod: false, setDefined:false, ...insOpts}) }
}
class FixMap extends hook.types.map {
    static of(...args) { return new FixMap(...args) }
    constructor(v, options={}, insOpts={}){super(Type.isObj(v) ? Object.entries(v) : v,options={},{getDestroyMethod: false, setDefined:false, ...insOpts})}
}
class FixAry extends hook.types.ary {
    static of(...args) { return new FixAry(...args) }
    constructor(v, options={}, insOpts={}) { super(v, options={}, {getDestroyMethod: false, setDefined:false, ...insOpts}) }
}
class FixSet extends hook.types.set {
    static of(...args) { return new FixSet(...args) }
    constructor(v, options={}, insOpts={}) { super(v, options={}, {getDestroyMethod: false, setDefined:false, ...insOpts}) }
}
// Enum
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
        const idStrs = ids.join(',')
        const getterSrc = ids.map(id=>this.#makeIs(id)).join('\n')
        const matchMtd = this.#makeMatch()
        this._type = new Function(`return class ${typeName} {
    constructor(v) {
        this._ids = '${idStrs}'.split(',');
        this._v = v;
    }
    ${getterSrc}
    ${matchMtd}
}`)()
    }
    #makeIs(id) { return `get is${id}() { return this._v==='${id}'; }` }
    #makeMatch() { return `match(...cbFns) {
    if (cbFns.length < this._ids.length) { throw new TypeError('引数cbFnsはidsより多くあるべきです: ' + this._ids.length + '個 順: ' + this._ids.toString()) }
    for (let i=0; i<this._ids.length; i++) {
        if (this._v===this._ids[i]) { return Type.fnV(cbFns[i]) }
    }
    throw new TypeError('不正な値です。: ' + this._v + ' 期待値候補: ' + this._ids.toString())
    return (this._ids.length < cbFns.length) ? Type.fnV(cbFns[this._ids.length]) : undefined
}`}
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
    constructor(v, candidates, writable=false) {
        this._v = v
        this._cands = hook.set(candidates, {}, {getDestroyMethod: writable, setDefined: writable})
        if (null===this._cands) { throw new TypeError(`Only Array or Set types are valid as candidates for the second argument.`) }
        if (!this._cands.has(this._v)) { throw new TypeError(`The initial value should match one of the candidates.`) }
        return hook.ins(this)
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
        if (this._min===this._max) { throw TypeError(`minとmaxは同値を許しません。異なる整数値にしてください。`) }
        return hook.ins(this)
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
        for (let i=0; i<thresholds.length; i++) {
            if (!Type.isRange(thresholds[i], this._min, this._max)) {throw new RangeError(`Out of range thresholds[${i}] ${thresholds[i]}: ${this._min}..${this._max}`)}
        }
        if (this._min!==thresholds[0]) {throw new TypeError(`Start the threshold at the minimum value.`)}
        for (let i=0; i<thresholds.length; i++) {
            let min = thresholds[i]
            let max = (thresholds.length-1<=i) ? this._max : thresholds[i+1] - 1
            if (Type.isRange(this._v, min, max)) { return Type.fnV(obj[`${thresholds[i]}`]) }
        }
    }
}

class SomeChanged {
    static of(v, candidates, options={}) { return new SomeChanged(v, candidates, options) }
    constructor(v, candidates, options={}) {
        this._v = v
        this._options = {
            ...{value: { onChanged:()=>{} },
                cands: { writable:false, onChanged:()=>{} } }, // ChangedSet, ChangedMap
            ...options,
        }
        this._cands = hook.set(candidates, {}, {
            getDestroyMethod: this._options.cands.writable, 
            setDefined: this._options.cands.writable})
        if (null===this._cands) { throw new TypeError(`Only Array or Set types are valid as candidates for the second argument.`) }
        if (!this._cands.has(this._v)) { throw new TypeError(`The initial value should match one of the candidates.`) }
        return hook.ins(this)
    }
    get v( ) { return this._v }
    set v(v) {
        if (this._cands.has(v)) {
            const o = this._v
            this._v = v
            if (o!==this._v) { this._options.value.onChanged(v, o) }
        }
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
class TypedVal extends hook.types.val {
    static of(v, onValidate, opts={}, insOpts={}) { return new TypedVal(v, onValidate, opts, insOpts) }
    constructor(v, onValidate, options={}, insOpts={}) {
        if (Type.isStr(onValidate)) {
            const typeNm = onValidate.capitalize()
            if (!(`is${typeNm}` in Type)) { throw new TypeError(`第二引数onValidateが文字列のときはTypeにあるis系メソッド名の型名であるべきです: ${typeNm}`) }
            if (!Type[`is${typeNm}`](v)) {throw new TypeError(`第一引数vの値が第二引数で指定した型と一致しません: ${v}, ${typeNm}`)}
            onValidate = (i,v,o)=>{
                if (Type[`is${typeNm}`](i)) { return true }
                else {throw new TypeError(`代入値が指定された型と一致しません: ${i}, ${typeNm}`)}
            }
        }
        if (Type.isFn(onValidate)) { options = {onValidate:onValidate, ...options} }
        super(v, options, insOpts)
    }
}
class TypedAry extends hook.types.HookableContainer(Array) { 
    static HookableMethodNames = 'concat,fill,push,splice,toSpliced'.split(',')
    static NotHookableMethodNames = 'copyWithin,pop,reverse,shift,sort,unshift,at,entries,every,filter,find,findIndex,findLast,findLastIndex,flat,flatMap,forEach,includes,indexOf,join,keys,lastIndexOf,map,reduce,reduceRight,slice,some,toLocaleString,toReversed,toSorted,toString,values,with'.split(',')
    static of(v, onValidate, opts={}, insOpts={}) { return new TypedAry(v, onValidate, opts, insOpts) }
    constructor(v, onValidate, opts={}, insOpts={}) {
        if (Type.isStr(onValidate)) {
            const typeNm = onValidate.capitalize()
            if (!(`is${typeNm}` in Type)) { throw new TypeError(`第二引数onValidateが文字列のときはTypeにあるis系メソッド名の型名であるべきです: ${typeNm}`) }
            if (!v.every(x=>Type[`is${typeNm}`](x))) {throw new TypeError(`第一引数vのうち一つ以上の値が第二引数で指定した型と一致しません: ${v}, ${typeNm}`)}
            onValidate = (target, name, args, o)=>{
                if (Type.isAry(args)) { args.every(v=>Type[`is${typeNm}`](v)) }
                else { return Type[`is${typeNm}`](args) }
                if ('concat'===name) {
                    if (Type.isAry(args)) {
                        for (let arg of args) {
                            if (Type.isAry(arg)) {
                                const r = arg.every(v=>Type[`is${typeNm}`](arg))
                                if (!r) { return false }
                            } else { if(!Type[`is${typeNm}`](arg)) { return false } }
                        }
                        return true
                    } else { return Type[`is${typeNm}`](args) }
                }
                else if ('fill'===name) {return Type[`is${typeNm}`](args[0])}
                else if ('push'===name) { return args.every(v=>Type[`is${typeNm}`](v)) }
                else if ('splice'===name) {return Type.isAry(args[2]) ? args[2].every(v=>Type[`is${typeNm}`](v)) : Type[`is${typeNm}`](args[2])}
                else if ('toSpliced'===name) {return args[2].every(v=>Type[`is${typeNm}`](v))}
                return true
            }
            opts.onInvalid = (target, key, value, n, o)=>{throw new TypeError(`引数の型が指定された型と一致しません: ${typeNm}`)}
        }
        if (Type.isFn(onValidate)) { opts = {onValidate:onValidate, ...opts} }
        super(v, opts, insOpts, TypedAry.HookableMethodNames, TypedAry.NotHookableMethodNames)
    }
}
class TypedSet extends hook.types.HookableContainer(Set) { 
    static of(v, onValidate, opts={}, insOpts={}) { return new TypedSet(v, onValidate, opts, insOpts) }
    constructor(v, onValidate, opts={}, insOpts={}) { // v:Set
        console.log(v, [...v], onValidate)
        if (!Type.isIns(v, Set)) { throw new TypeError(`第一引数vはSet型であるべきです: ${v}, ${typeof v}, ${Type.getName(v)}`) }
        if (Type.isStr(onValidate)) {
            const typeNm = onValidate.capitalize()
            if (!(`is${typeNm}` in Type)) { throw new TypeError(`第二引数onValidateが文字列のときはTypeにあるis系メソッド名の型名であるべきです: ${typeNm}`) }
            console.log([...v])
            if (![...v].every(x=>Type[`is${typeNm}`](x))) {throw new TypeError(`第一引数vのうち一つ以上の値が第二引数で指定した型と一致しません: ${[...v]}, ${typeNm}`)}
            onValidate = (target, name, args, o)=>{
//                if (Type.isAry(args)) { args.every(v=>Type[`is${typeNm}`](v)) }
//                else { return Type[`is${typeNm}`](args) }
                if ('add'===name) { return Type[`is${typeNm}`](...args) }
                return true
            }
            opts.onInvalid = (target, key, value, n, o)=>{throw new TypeError(`引数の型が指定された型と一致しません: ${typeNm}`)}
        }
        if (Type.isFn(onValidate)) { opts = {onValidate:onValidate, ...opts} }
        super(v, opts, insOpts, 'add,clear,delete,difference,entries,forEach,has,intersection,isDisjointFrom,isSubsetOf,isSupersetOf,keys,symmetricDifference,union,values'.split(','))
    }
}
class TypedMap extends hook.types.HookableContainer(Map) { 
    static of(v, opts={}, insOpts={}) { return new TypedMap(v, opts, insOpts) }
    static isInitValue(v) { return (Type.isAry(v) && 0<v.length && v.every(t=>Type.isAry(t) && 3===t.length && Type.isStr(t[0]) && Type.isStr(t[1]) && `is${t[1].capitalize()}` in Type)) } // v:[[key, typeName, value], ...]
    constructor(v, opts={}, insOpts={}) { // v:[[key, typeName, value], ...]
        console.log(v, opts, insOpts)
        if (!TypedMap.isInitValue(v)) {throw new TypeError(`第一引数vは[[key,typeName,value],...]であるべきです。`)}
        const mv = []
        for (let [nm, typ, val] of v) {
            const typeNm = typ.capitalize()
            if (!Type[`is${typeNm}`](val)) {throw new TypeError(`初期値の値が指定した型と一致しません: ${nm}:${val} actual:${Type.getName(val)}, expected:${typeNm}`)}
            mv.push([nm, val])
        }
        opts.onValidate = (target, name, args, o)=>{
            if ('set'===name) {
                const matches = v.filter(([nm,typ,val])=>nm===args[0])
                if (1===matches.length) {
                    const [nm,typ,val] = matches[0]
                    console.log(name, args, nm,typ,val, Type[`is${typ.capitalize()}`](args[1]))
                    return Type[`is${typ.capitalize()}`](args[1])
                }
            }
            return true
        }
        opts.onInvalid = (target, name, args, o)=>{throw new TypeError(`引数の型が指定された型と一致しません: actual:${Type.getName(args[1])} expected:${v.filter(a=>a[0]===args[0])[0][1].capitalize()}`)}
        super(mv, opts, insOpts, 'clear,delete,set,entries,forEach,get,has,keys,values,_initValue'.split(','))
        this._initValue = v
    }
    add(name, type, value) {
        const args = [name, type, value]
        if (this.#isTriple(args)) {
            this._initValue.push(args)
            this.set(name, value)
        }
    }
    #isTriple(args) {
        if (3!==args.length) { throw new TypeError(`引数は[key,typeName,value]であるべきです。`) }
        if (!Type.isStr(args[0])) {throw new TypeError(`引数[key,typeName,value]のkeyは文字列型であるべきです。`)}
        if (!Type.isStr(args[1])) {throw new TypeError(`引数[key,typeName,value]のtypeNameは文字列型であるべきです。`)}
        const typeNm = args[1].capitalize()
        if (!(`is${typeNm}` in Type)) {throw new TypeError(`引数[key,typeName,value]のvalueはtypeNameで指定した型であるべきです: ${Type.getName(args[2])} expected:${typeNm}`)}
        return true
    }
}
class TypedObj extends hook.types.obj { 
    static of(v, opts={}, insOpts={}) { return new TypedObj(v, opts, insOpts) }
//    static isInitValue(v) { return (Type.isAry(v) && 0<v.length && v.every(t=>Type.isAry(t) && 3===t.length && Type.isStr(t[0]) && Type.isStr(t[1]) && `is${t[1].capitalize()}` in Type)) } // v:[[key, typeName, value], ...]
    static isInitValue(v) { return Type.isObj(v) && Object.entries(v).every(([K,V])=>Type.isAry(V) && 2===V.length && `is${V[0].capitalize()}` in Type)} // v:{k:[type,value], ...}
    constructor(v, opts={}, insOpts={}) {
        console.log(v, opts, insOpts)
        if (!TypedObj.isInitValue(v)) {throw new TypeError(`第一引数vは{key:[typeName,value],...}であるべきです。`)}
        
        //const mv = []
        const o = {}
        //for (let [nm, typ, val] of v) {
        for (let [K, V] of Object.entries(v)) {
            const typeNm = V[0].capitalize()
            const value = V[1]
            if (!Type[`is${typeNm}`](value)) {throw new TypeError(`初期値の値が指定した型と一致しません: ${typeNm}:${value} actual:${Type.getName(value)}, expected:${typeNm}`)}
            o[K] = value
//            mv.push([nm, val])
        }
        opts.onValidate = (target, name, args, o)=>{
            if (name in target) { // 変更
                const [typeNm, value] = [v[name][0], v[name][1]]
                return Type[`is${typeNm.capitalize()}`](value)
            } else { // 新規追加
                if (this.#isDouble(args)) {
                    const [typeNm, value] = [args[name][0], args[name][1]]
                    target[key] = value
                    v[key] = args
                }
            }
            /*
            if ('set'===name) {
                const matches = v.filter(([nm,typ,val])=>nm===args[0])
                if (1===matches.length) {
                    const [nm,typ,val] = matches[0]
                    console.log(name, args, nm,typ,val, Type[`is${typ.capitalize()}`](args[1]))
                    return Type[`is${typ.capitalize()}`](args[1])
                }
            }
            */
            return true
        }
        opts.onInvalid = (target, name, args, o)=>{throw new TypeError(`引数の型が指定された型と一致しません: actual:${Type.getName(args[1])} expected:${v.filter(a=>a[0]===args[0])[0][1].capitalize()}`)}
        //super(mv, opts, insOpts, 'clear,delete,set,entries,forEach,get,has,keys,values,_initValue'.split(','))
        super(o, opts, insOpts, 'clear,delete,set,entries,forEach,get,has,keys,values,_initValue'.split(','))
//        this._initValue = v
    }
    /*
    add(name, type, value) {
        const args = [name, type, value]
        if (this.#isTriple(args)) {
            this._initValue.push(args)
            this.set(name, value)
        }
    }
    */
    #isDouble(args) {
        if (2!==args.length) { throw new TypeError(`引数は[typeName,value]であるべきです。`) }
        if (!Type.isStr(args[0])) {throw new TypeError(`引数[typeName,value]のtypeNameは文字列型であるべきです。`)}
        const typeNm = args[0].capitalize()
        if (!(`is${typeNm}` in Type)) {throw new TypeError(`引数[typeName,value]のvalueはtypeNameで指定した型であるべきです: actual:${Type.getName(args[0])} expected:${typeNm}`)}
        return true
    }
    #isTriple(args) {
        if (3!==args.length) { throw new TypeError(`引数は[key,typeName,value]であるべきです。`) }
        if (!Type.isStr(args[0])) {throw new TypeError(`引数[key,typeName,value]のkeyは文字列型であるべきです。`)}
        if (!Type.isStr(args[1])) {throw new TypeError(`引数[key,typeName,value]のtypeNameは文字列型であるべきです。`)}
        const typeNm = args[1].capitalize()
        if (!(`is${typeNm}` in Type)) {throw new TypeError(`引数[key,typeName,value]のvalueはtypeNameで指定した型であるべきです: ${Type.getName(args[2])} expected:${typeNm}`)}
        return true
    }
}
window.valk = Object.deepFreeze({
    fix:(v, options={}, insOpts={})=>ifel(v instanceof Array, ()=>FixAry.of(v,options,insOpts),
            v instanceof Set, ()=>FixSet.of(v,options,insOpts),
            v instanceof Map, ()=>FixMap.of(v,options,insOpts),
            Type.isObj(v), ()=>FixObj.of(v,options,insOpts),
            ()=>FixVal.of(v,options,insOpts)
    ),
    enum:(...args)=>Enum.make(...args),
    count:(...args)=>new Counter(...args),
    range:(...args)=>Range.of(...args),
    some:(...args)=>Some.of(...args),
    someChanged:(...args)=>SomeChanged.of(...args),
    //typed:(...args)=>TypedAry.of(...args),
    typed:(...args)=>ifel(
//        Type.isAry(args[0]) && 0===args[0].length, ()=>{throw new TypeError(`aaaaaaaaaaaa`)},
        TypedMap.isInitValue(args[0]), ()=>TypedMap.of(...args),
        Type.isObj(args[0]), ()=>TypedObj.of(...args),
        Type.isAry(args[0]), ()=>TypedAry.of(...args), 
        Type.isIns(args[0], Set), ()=>TypedSet.of(...args),
        ()=>TypedVal.of(...args)),
    valid:(...args)=>null,
    changed:(...args)=>null,
    enums: Enum.types,
    types: {
        FixVal: FixVal,
        FixObj: FixObj,
        FixAry: FixAry,
        FixSet: FixSet,
        FixMap: FixMap,
        Counter: Counter,
        TypedVal: TypedVal,
        TypedAry: TypedAry,
        TypedSet: TypedSet,
        TypedMap: TypedMap,
        TypedObj: TypedObj,
//        TypedObj: TypedObj,
    },
    errors: {
        FixError: FixError,
        EnumError: EnumError,
        CounterError: CounterError,
        SomeError: SomeError,
        ValidError: ValidError,
    },
})
})();
