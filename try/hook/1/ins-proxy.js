class InsProxy { // class の instance を保護するのはObject.sealでは無理。getterまで弾かれる。のでProxyで代用する
    static of(target, options) { return new InsProxy(target, options) }
    constructor(target, permission) {
        this._permission = {
            getUndefined: false,
            setDefined: false,
            setUndefined: false,
            ...permission,
        }
//        return Object.seal(this) // getter まで弾いてしまう…
        return new Proxy(target, { // getter, setter を受け付ける
            get:(target, key)=>{
                if (key in target) {
                    if (Type.hasGetter(target, key)) { return Reflect.get(target, key) } // getter
                    else if ('function'===target[key]) { return target[key].bind(target) } // method, constructor
                    else { return target[key] } // field
                } else {
                    if (this._permission.getUndefined) { return target[key] }
                    else { throw new TypeError(`未定義プロパティへの参照禁止: ${key}`) }
                }
            },
            set:(target, key, value, receiver)=>{
                console.log(target, key, key in target, Type.hasSetter(target, key))
                if (key in target) {
                    if (this._permission.setDefined) {
                        if (Type.hasSetter(target, key)) { return Reflect.set(target, key, value) } // setter
                        else { target[key] = value } // field
                    } else { throw new TypeError(`定義済プロパティへの代入禁止: ${key}`) }
                } else {
                    if (this._permission.setUndefined) { target[key] = value }
                    else { throw new TypeError(`未定義プロパティへの代入禁止: ${key}`) } }
            },
        })
    }
}
