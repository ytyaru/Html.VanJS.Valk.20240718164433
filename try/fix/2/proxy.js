class HookProxy extends Proxy {
    static getOptions() { return {
        construct: (target, args)=>Reflect.construct(target, args),
        apply: (target, thisArg, args)=>Reflect.apply(target, thisArg, args),

        getPrototypeOf: (target)=>Reflect.getPrototypeOf(target),
        setPrototypeOf: (target, prototype)=>Reflect.setPrototypeOf(target, prototype),
        isExtensible: (target)=>Reflect.isExtensible(target),
        preventExtensions: (target)=>Object.preventExtensions(target),
        get: {
            onBefore:(target, key, receiver)=>{},
            onDefined: (target, key, receiver)=>{
                if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // getter
                //if (this._hasGetter(target, key)) { return Reflect.get(target, key) } // setter
                //else if ('function'===target[key]) { return target[key].bind(target) } // method (classは除外したい)
                else if (Type.isFn(target[key])) { return target[key].bind(target) } // method (classは除外したい)
                else { return target[key] } // field
            },
            onUndefined: (target, key, receiver)=>{ throw new TypeError(`未定義プロパティへの参照禁止: ${key}`) },
            onAfter:(target, key, receiver)=>{},
        },
        set: {
            onBefore:(target, key, receiver)=>{},
            onDefined: (target, key, value, receiver)=>{
                if (this._hasSetter(target, key)) { return Reflect.set(target, key, value) }
                else { return target[key] = value; }
            },
            onUndefined: (target, key, receiver)=>{ throw new TypeError(`未定義プロパティへの代入禁止: ${key}`) },
            onAfter:(target, key, receiver)=>{},
        },
        deleteProperty: (target, key)=>Reflect.deleteProperty(target, key),
    } }
    constructor(target, options) {
        this._options = {
            get: {
                onBefore:(target, key, receiver)=>{},
                onDefined: (target, key, receiver)=>{
                    if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // getter
                    //if (this._hasGetter(target, key)) { return Reflect.get(target, key) } // setter
                    //else if ('function'===target[key]) { return target[key].bind(target) } // method (classは除外したい)
                    else if (Type.isFn(target[key])) { return target[key].bind(target) } // method (classは除外したい)
                    else { return target[key] } // field
                },
                onUndefined: (target, key, receiver)=>{ throw new TypeError(`未定義プロパティへの参照禁止: ${key}`) },
                onAfter:(target, key, receiver)=>{},
            },
            set: {
                onBefore:(target, key, receiver)=>{},
                onDefined: (target, key, value, receiver)=>{
                    if (this._hasSetter(target, key)) { return Reflect.set(target, key, value) }
                    else { return target[key] = value; }
                },
                onUndefined: (target, key, receiver)=>{ throw new TypeError(`未定義プロパティへの代入禁止: ${key}`) },
                onAfter:(target, key, receiver)=>{},
            },
            construct: (target, args)=>Reflect.construct(target, args),

            ...options,
        }
    }
    _getHandler(addHandler) { return {
        get:(target, key, receiver)=>{
            this._options.onBeforeGet(target, key, receiver)
            if (key in target) { this._options.onDefinedGet(target, key, receiver) }
            else { this._options.onUndefinedGet(target, key, receiver) }
            this._options.onAfterGet(target, key, receiver)
            if (key in target) {
                if (this._hasGetter(target, key)) { return Reflect.get(target, key) }
                if ('function'===target[key]) { return target[key].bind(target) }
                return target[key]
            }
            throw new TypeError(`未定義プロパティへの参照禁止: ${key}`)
        },
        ...addHandler,
    } }
    _setHandler(definedPropSet) { return {
        set:(target, key, value, receiver)=>{
            if (key in target) {
                if (definedPropSet) { return definedPropSet(target, key, value, receiver) }
                else { throw new TypeError(`定義済プロパティへの代入禁止: ${key}`)  } }
            else { throw new TypeError(`未定義プロパティへの代入禁止: ${key}`) }
        },
    } }
            if (this._hasSetter(target, key)) { return Reflect.set(target, key, value) }
            else { return target[key] = value; }
    _hasGetter(target, key) { return this._hasDescriptor('Get', target, key) }
    _hasSetter(target, key) { return this._hasDescriptor('Set', target, key) }
    _hasDescriptor(name, target, key) {
        const desc = Object.getOwnPropertyDescriptor(target.prototype ?? target, key)
        if (desc) { const ret = !!desc[name.toLowerCase()]; if (ret) { return ret } }
        return !!target[`__lookup${name}ter__`](key)
    }

}
