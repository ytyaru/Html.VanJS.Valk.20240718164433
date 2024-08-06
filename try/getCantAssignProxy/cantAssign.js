// クラスとそのインスタンスが未定義プロパティに対して参照・代入しようとするとエラーになるようなクラスのProxyを返す。
;(function(){
    function hasDescripter(name, target, key) {
        const desc = Object.getOwnPropertyDescriptor(target.prototype ?? target, key)
        if (desc) { const ret = !!desc[name.toLowerCase()]; if (ret) { return ret } }
        return !!target[`__lookup${name}ter__`](key)
    }
    function hasGetter(target, key) { return hasDescripter('Get', target, key) }
    function hasSetter(target, key) { return hasDescripter('Set', target, key) }
    function cantAssign(obj, handler={}) {
        return new Proxy(obj, {
            set(target, key, value) {
                if (key in target) {
                    if (hasSetter(target, key)) { return Reflect.set(target, key, value) }
                    else { target[key] = value; return }
                }
                throw new TypeError(`未定義プロパティへの代入禁止: ${key}`)
            },
            get(target, key) {
                if (key in target) {
                    if (hasGetter(target, key)) { return Reflect.get(target, key) }
                    if ('function'===target[key]) { return target[key].bind(target) }
                    return target[key]
                }
                throw new TypeError(`未定義プロパティへの参照禁止: ${key}`)
            },
            ...handler,
        })
    }
    window.cantAssign = cantAssign
})();
