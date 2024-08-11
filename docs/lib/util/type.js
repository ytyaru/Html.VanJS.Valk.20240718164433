(function() {
class Type {
    constructor() {
        this._types = {
            AsyncFunction: (async()=>{}).constructor,
            GeneratorFunction: (function*(){yield undefined;}).constructor,
            AsyncGeneratorFunction: (async function*(){yield undefined;}).constructor,
        }
        this._names = new Map([
            ['Null', [[], (v)=>null===v]],
            ['Undefined', [['Und'], (v)=>undefined===v]],
            ['NullOrUndefined', [['NU'], (v)=>null===v || undefined===v]],
            ['Boolean', [['Bool', 'Bln', 'B'], (v)=>'boolean'===typeof v]],
            ['NaN', [[], (v)=>Number.isNaN(v)]],
            // https://github.com/lodash/lodash/blob/master/isNumber.js
            ['Number', [['Num', 'N'], (v)=>('number'===typeof v && !isNaN(v)) || (this.#isObjectLike(v) && this.#getTag(v)=='[object Number]')]],
            ['Integer', [['Int', 'I'], (v)=>this.isNumber(v) && 0===v%1]],
            ['PositiveInteger', [['PInt'], (v)=>this.isInteger(v) && 0<=v]],
            ['NegativeInteger', [['NInt'], (v)=>this.isInteger(v) && v<0]],
            ['BigInt', [['Big'], (v)=>'bigint'===typeof v]],
            ['Float', [['Flt','F'], (v)=>this.isNumber(v) && (v % 1 !== 0 || 0===v)]],
            ['String', [['Str', 'S'], (v)=>'string'===typeof v || v instanceof String]],
            ['Symbol', [['Sym'], (v)=>'symbol'===typeof v]],
            ['Primitive', [['Prim'], (v)=>v !== Object(v)]],
            // null,undefinedを抜いたprimitive
            ['ValidPrimitive', [['VPrim', 'VP'], (v)=>this.isNullOrUndefined(v) ? false : this.isPrim(v)]],

            ['Class', [['Cls','Constructor'], (v)=>(('function'===typeof v) && (!!v.toString().match(/^class /)))]],
            ['Instance', [['Ins'], (v, c)=>{
                if (this.isPrimitive(v)) return false
                if (this.isFunction(v)) return false
                if (this.isCls(v)) return false // Class
                if (this.isErrCls(v)) return false // Error Class
                if (this.isObj(v)) return false   // Object
                return ((undefined===c) ? true : (v instanceof c)); // cがあるときはそのクラスのインスタンスであるか確認する
            }]],
            ['ErrorClass', [['ErrCls'], (v)=>Error===v||Error.isPrototypeOf(v)]], // Error.isPrototypeOf(TypeError)
            ['ErrorInstance', [['ErrIns','Error','Err'], (v)=>v instanceof Error]], // new TypeError() instanceof Error
            ['Function', [['Func', 'Fn'], (v)=>'function'===typeof v && !v.toString().match(/^class /) && !this.isErrCls(v)]],
            ['SyncFunction', [['SyncFn', 'SFn'], (v)=>this.isFn(v) && !this.isAFn(v) && !this.isGFn(v) && !this.isAGFn(v)]],
            ['AsyncFunction', [['AsyncFunc', 'AsyncFn', 'AFn'], (v)=>v instanceof this._types.AsyncFunction]],
            ['GeneratorFunction', [['GenFn', 'GFn'], (v)=>v instanceof this._types.GeneratorFunction || v instanceof this._types.AsyncGeneratorFunction]],
            ['SyncGeneratorFunction', [['SyncGenFn', 'SGFn'], (v)=>v instanceof this._types.GeneratorFunction && !(v instanceof this._types.AsyncGeneratorFunction)]],
            ['AsyncGeneratorFunction', [['AsyncGenFn', 'AGFn'], (v)=>v instanceof this._types.AsyncGeneratorFunction]],
            ['Promise', [[], (v)=>v instanceof Promise]],
            ['Iterator', [['Iter', 'Itr', 'It'], (v)=>{
                if (this.isNullOrUndefined(v)) { return false }
                return 'function'===typeof v[Symbol.iterator]
            }]],
            ['Empty', [['Blank'], (v, noErr)=>{
                if (this.isItr(v)) {
                    if ('length,size'.split(',').some(n=>v[n]===0)) { return true }
                    return false
                } else { if(noErr) {return false} else { throw new TypeError(`Not iterator.`) } }
            }]],
            ['NullOrUndefinedOrEmpty', [['NUE'], (v)=>this.isNU(v) || this.isEmpty(v, true)]],
            ['Array', [['Ary', 'A'], (v)=>Array.isArray(v)]],
            ['Map', [[], (v)=>v instanceof Map]],
            ['Set', [[], (v)=>v instanceof Set]],
            ['WeakMap', [[], (v)=>v instanceof WeakMap]],
            ['WeakSet', [[], (v)=>v instanceof WeakSet]],
            // https://github.com/lodash/lodash/blob/master/isPlainObject.js
            ['Object', [['Obj', 'O'], (v)=>{
                if (!this.#isObjectLike(v) || this.#getTag(v) != '[object Object]') { return false }
                if (Object.getPrototypeOf(v) === null) { return true }
                let proto = v
                while (Object.getPrototypeOf(proto) !== null) { proto = Object.getPrototypeOf(proto) }
                return Object.getPrototypeOf(v) === proto
            }]],
            // https://stackoverflow.com/questions/643782/how-to-check-whether-an-object-is-a-date
            ['Date', [['Dt','D'], (v)=>this.isPrimitive(v) ? false : Boolean(v && v.getMonth && typeof v.getMonth === 'function' && Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v))]],
            ['RegExp', [[], (v)=>v instanceof RegExp]],
            ['URL', [[], (v)=>v instanceof URL]],
            ['Element', [['Elm', 'El', 'E'], (v)=>{
                try { return v instanceof HTMLElement; }
                catch(e){
                    return (typeof v==='object') &&
                        (v.nodeType===1) && (typeof v.style === 'object') &&
                        (typeof v.ownerDocument==='object');
                }
            }]],
        ])
        for (let [k,v] of this._names.entries()) {
            //console.log(k,v)
            const fnName = `is${k}`
            const [abbrs, fn] = v
            if ('function'!==typeof fn) { throw new Error(`${fnName}が未定義です。`)}
            this.#defineMain(fnName, fn) // 正式
            for (let name of abbrs) { this.#defineAbbr(`is${name}`, fn) } // 略名
            // 複数形
            //const fns = (args)=>Array.isArray(args) && args.every(x=>getter(x))
            const fns = (args)=>Array.isArray(args) && args.every(x=>fn(x))
            this.#defineMain(`${fnName}s`, fns) // 複数形
            for (let name of abbrs) { this.#defineAbbr(`is${name}s`, fns) } // 略名
        }
    }
    #isObjectLike(v) { return typeof v === 'object' && v !== null }

    // Symbol型のときエラー：TypeError: Cannot convert a Symbol value to a string
    //#getTag(v) { return (v == null) ? (v === undefined ? '[object Undefined]' : '[object Null]') : toString.call(v) }
    #getTag(v) { return (v == null) ? (v === undefined ? '[object Undefined]' : '[object Null]') : v.toString() }

    #defineMain(name, getter) {
        Object.defineProperty(this, name, {
            value: (...args)=>getter(...args),
            writable: false,
            enumerable: true,
            configurable: false,
        })
    }
    #defineAbbr(name, getter) {
        Object.defineProperty(this, name, {
            value: (...args)=>getter(...args),
            writable: false,
            enumerable: false,
            configurable: false,
        })
    }
    // 使いそうだけど型というには微妙なAPIたち↓
    isNUSome(...vs) { return vs.some(v=>this.isNU(v)) }
    isNUEvery(...vs) { return vs.every(v=>this.isNU(v)) }
    isRange(v, min, max) { return min <= v && v <= max }

    // 実行可能なら引数なしで実行する。不能ならそのまま返す
    fnV(v) {
        if (this.isGFn(v) || this.isAFn(v)) { throw new TypeError(`ジェネレータ関数や非同期関数は受け付けません。`) }
        return this.isFn(v) ? v() : v
    }
    getName(v) {
        if (undefined===v) { return 'Undefined' }
        if (null===v) { return 'Null' }
        if (this.isBool(v)) { return 'Boolean' }
        if (this.isInt(v)) { return 'Integer' }
        if (this.isFloat(v)) { return 'Float' }
        if (this.isBigInt(v)) { return 'BigInt' }
        if (this.isSym(v)) { return 'Symbol' }
        if (this.isErrCls(v)) { return `(ErrorClass ${v.name})` }
        if (this.isErrIns(v)) { return `(ErrorInstance ${v.constructor.name})` }
        if (this.isCls(v)) { return v.name ? `(Class ${v.name})` : `(NoNameClass)` }
        if (this.isIns(v)) { return v.constructor.name ? `(Instance ${v.constructor.name})` : `(NoNameClassInstance)` }
        if (this.isAFn(v) || this.isGFn(v) || this.isAGFn(v)) { return v.constructor.name }
        if (this.isObj(v)) { return 'Object' }
        try { if (Type.isStr(v.typeName)) { return v.typeName } } catch (e) {} // Proxy
        // 上記のいずれかに当てはまることを期待している
        const name = typeof v
        return name[0].toUpperCase() + name.slice(1)
    }
    toStr(x) {
        if (!this.isObj(x) && !this.isAry(x)) { x = {x:x} }
        return JSON.stringify(x, (k,v)=>ifel(
        (this.isBool(v) || this.isInt(v) || this.isFloat(v)), v,
        this.isErrCls(v), ()=>v.constructor.name,
        this.isErrIns(v), ()=>`${v.name}(${v.message})`,
        this.isIns(v, Array), ()=>'['+v.map(V=>this.toStr(V)).join(',')+']',
        this.isIns(v, Map), ()=>[...v.entries()].map(([K,V])=>`k:`+this.toStr(V)).join(','),
        this.isIns(v, Set), ()=>[...v.values()].map(V=>this.toStr(V)),
        this.isFn(v), ()=>v.toString(),
        this.isCls(v), ()=>v.toString(),
        v))
    }
    eq(a, b) { return this.toStr(a)===this.toStr(b) }
    to(type, ...values) { // boxing  value:型変換したい値, type:型名(typeof)
        switch(type.toLowerCase()) {
            case 'undefined': return undefined
            case 'null': return null
            case 'object': return {}
            case 'array': return []
            case 'boolean': return ((values[0]) ? (['true','1'].some(v=>v===values[0].toString().toLowerCase())) : false)
            case 'number': return Number(values[0])
            case 'integer': return parseInt(values[0])
            case 'float': return parseFloat(values[0])
            case 'string': return String(values[0])
            case 'bigint': return BigInt(values[0])
            case 'symbol': return Symbol(values[0])
            case 'function': return new Function(values[0])
            case 'class': return Function(`return class ${values[0]} {};`)() // values[0]: Class名（new ClassName()） 未定義エラーになる…
            case 'instance': {
                console.log(values,...values);
                if (0===values.length) { throw new Error(`コンストラクタが必要です。`) }
                const c = values[0]
                const args = values.slice(1)
                return Reflect.construct(c, args);
            } // Class, [auguments]
            default: throw new Error('typeは次のいずれかのみ有効です:undefined,null,object,array,boolean,number,integer,float,string,bigint,symbol,function,class')
        }
    }
    hasMethod(obj,key) { return this.isFn(this._getDesc(obj,key).value) }
    hasGetter(obj,key) { return this.isFn(obj.__lookupGetter__(key)) || this._hasG(obj,key) }
    hasSetter(obj,key) { return this.isFn(obj.__lookupSetter__(key)) || this._hasS(obj,key) }
    _hasG(obj,key) { return this._hasGS(obj,key) }
    _hasS(obj,key) { return this._hasGS(obj,key,true) }
    _hasGS(obj,key,isS) { try { return this.isFn(this._getDesc(obj,key)[(isS ? 's' : 'g')+'et']) } catch(e) {return false} }
    _getDesc(obj,key) { return Object.getOwnPropertyDescriptor(obj, key) }
    getGetter(obj,key) { return obj.__lookupGetter__(key) ?? Object.getOwnPropertyDescriptor(obj, key).get }
    getSetter(obj,key) { return obj.__lookupSetter__(key) ?? Object.getOwnPropertyDescriptor(obj, key).set }
    getOwner(name, target) {
        if (this.isNU(target)) { return null }
        else if ('function'===typeof target[name]) { return target }
        else if (target.hasOwnProperty(name)) { return target }
        else { this.getOwner(name, Object.getPrototypeOf(target)) }
    }
}
window.Type = new Type()
String.prototype.capitalize = function(str) { return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase() }
})()
// 糖衣構文 if else-if else (...) {return} を再現する
function ifel(...args) {
    if (args.length<2) { throw TypeError(`引数は2つ以上必要です。[condFn1, retFn1, condFn2, retFn2, ..., defFn]`) }
    const setNum = Math.floor(args.length/2);
    for (let i=0; i<setNum*2; i+=2) {
        const cond = !!Type.fnV(args[i])
        if (cond) { return Type.fnV(args[i+1]) }
    }
    if (setNum*2<args.length) { return Type.fnV(args[setNum*2]) }
}
