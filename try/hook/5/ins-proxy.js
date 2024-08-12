class InsProxy { // class の instance を保護するのはObject.sealでは無理。getterまで弾かれる。のでProxyで代用する
    static of(target, options) { return new InsProxy(target, options) }
    constructor(target, options={}) {
        this._options = {
            // permission
            getUndefined: false,
            setDefined: true,
            setUndefined: false,
            // callbackFn
                /*
            onGetDefined:(target, key, receiver)=>{
                if (Type.hasGetter(target, key)) {
                    try { return Reflect.get(target, key, receiver) }
                    catch(err) {
                        // Proxy経由でclassのprivateフィールド(#)を参照すると以下エラーになる
                        // TypeError: Cannot read private member #v from an object whose class did not declare it
                        // https://stackoverflow.com/questions/72805454/typeerror-cannot-read-private-member-from-an-object-whose-class-did-not-declare
                        console.error(err)
                        const getter = Type.getGetter(target, key)
                        console.log(getter)
                        return getter()
                        //return (params)=>target[key](params)
//                        return target[key]()
                    }

                } // getter
                else if ('function'===target[key]) { return target[key].bind(target) } // method, constructor
                else { return target[key] } // field
                else {
                    try { return target[key] }
                    catch(err) {
                        // Proxy経由でclassのprivateフィールド(#)を参照すると以下エラーになる
                        // TypeError: Cannot read private member #v from an object whose class did not declare it
                        // https://stackoverflow.com/questions/72805454/typeerror-cannot-read-private-member-from-an-object-whose-class-did-not-declare
                        console.error(err)
                        return (params)=>target[key](params)
                    }
                } // field
            },
                */
            /*
            onGetDefined:(target, key, receiver)=>{
                if (Type.hasGetter(target, key)) { return Reflect.get(target, key, receiver) } // getter
                else if ('function'===target[key]) { return target[key].bind(target) } // method, constructor
                //else { return target[key] } // field
                else {
                    try { return target[key] }
                    catch(err) {
                        // Proxy経由でclassのprivateフィールド(#)を参照すると以下エラーになる
                        // TypeError: Cannot read private member #v from an object whose class did not declare it
                        // https://stackoverflow.com/questions/72805454/typeerror-cannot-read-private-member-from-an-object-whose-class-did-not-declare
                        console.error(err)
                        return (params)=>target[key](params)
                    }
                } // field
            },
            onGetDefined:(target, key, receiver)=>{
                if (Type.hasGetter(target, key)) { return Reflect.get(target, key, receiver) } // getter
                else if ('function'===target[key]) { return target[key].bind(target) } // method, constructor
                else { return target[key] } // field
            },
            */
            onGetDefined:(target, key, receiver)=>{
//                console.log('onGetDefined:', key, target)
                if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // getter
                else if ('function'===target[key]) { return target[key].bind(target) } // method, constructor
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

//            ownKeys:()=>this.keys(),
//            getOwnPropertyDescriptor:(target, key)=>({ enumerable:true, configurable:true, value:target[key] }),
        })
        /*
    //constructor(target, permission={}, options={}) {
        this._permission = {
            getUndefined: false,
            setDefined: true,
            setUndefined: false,
            ...permission,
        }
        this._options = {
            getDefined:(target, key, receiver)=>{
                if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // getter
                else if ('function'===target[key]) { return target[key].bind(target) } // method, constructor
                else { return target[key] } // field
            },
            getUndefined:(target, key, receiver)=>{
                if (this._permission.getUndefined) { return target[key] }
                else { throw new TypeError(`未定義プロパティへの参照禁止: ${key}`) }
            },
            setDefined:(target, key, value, receiver)=>{
                if (this._permission.setDefined) {
                    if (Type.hasSetter(target, key)) { return Reflect.set(target, key, value) } // setter
                    else { target[key] = value } // field
                } else { throw new TypeError(`定義済プロパティへの代入禁止: ${key}`) }
            },
            setUndefined:(target, key, value, receiver)=>{
                if (this._permission.setUndefined) { target[key] = value }
                else { throw new TypeError(`未定義プロパティへの代入禁止: ${key}`) }
            },
            ...options,
        }
//        return Object.seal(this) // getter まで弾いてしまう…
        return new Proxy(target, { // getter, setter を受け付ける
            get:(target, key, receiver)=>this._options['get' + ((key in target) ? 'Defined' : 'Undefined')](target, key, receiver),
            set:(target, key, value, receiver)=>{
                this._options['set' + ((key in target) ? 'Defined' : 'Undefined')](target, key, value, receiver)
                return true
            }
        })
        */
    }
}
