class InsProxy { // class の instance を保護するのはObject.sealでは無理。getterまで弾かれる。のでProxyで代用する
    static of(target, options={}) { return new InsProxy(target, options) }
    constructor(target, options={}) {
        this._options = {
            // permission
            getUndefined: false,
            setDefined: true,
            setUndefined: false,
            // callbackFn
            onGetDefined:(target, key, receiver)=>{
//                console.log('onGetDefined:', key, target)
                if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // getter
                else if ('function'===target[key]) { return target[key].bind(target) } // method, constructor
                else if (key === Symbol.iterator) { return target[Symbol.iterator].bind(target) } // for of
                else { return target[key] } // field
            },
            onGetUndefined:(target, key, receiver)=>{
//                console.log('onGetUndefined:', key, target)
//                if ('prototype'===key) { return Object.getPrototypeOf(target) }
                if (this._options.getUndefined) { return target[key] }
                else { throw new TypeError(`未定義プロパティへの参照禁止: ${key}`) }
            },
            onSetDefined:(target, key, value, receiver)=>{
                if (this._options.setDefined) {
//                    console.log(target, receiver, key, value)
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
}
