(function(){
class FixError extends Error { constructor(msg=`Assignment to fix variable.`) { super(msg); this.name='FixError' } }
const valk = {
    fix:(v)=>{
        const obj = FixValue.get(v)
        const pxy = new Proxy(obj, {
            set(target, key, value, receiver) { throw new FixError() },
            get(target, key, receiver) { return Reflect.get(obj, key) },
        })
        return pxy
    },
    errors: {
        FixError: FixError,
    },
}
 
class FixValue {
    static get(v) {
        if (Array.isArray(v)) { return FixedArray.of(...v) }
        if (v instanceof Set) { return new FixedSet(v) }
        if (v instanceof Map) { return new FixedMap(v) }
        if (v instanceof WeakSet) { return new FixedWeakSet(v) }
        if (v instanceof WeakMap) { return new FixedWeakMap(v) }
        if ('Object'===v.constructor.name) { return new FixedMap(v) }
        return {v:v}
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
class ChangedArray extends ChangenableContainer(Array) { // Arrayの破壊的メソッドを監視する
    constructor(...args) {
        super(...args)
        this._setupOnChanged('copyWithin,fill,pop,push,reverse,shift,sort,splice,unshift'.split(','))
    }
}
class FixedArray extends ChangedArray {
    constructor(...args) { super(...args); this._onChanged = ()=>{throw new FixError()}; }
}
class ChangedSet extends ChangenableContainer(Set) {
    constructor(...args) {
        super(...args)
        this._setupOnChanged('add,clear,delete'.split(','))
    }
}
class FixedSet extends ChangedSet {
    constructor(...args) { super(...args); this._onChanged = ()=>{throw new FixError()}; }
}
class ChangedMap extends ChangenableContainer(Map) {
    constructor(...args) {
        super(...args)
        this._setupOnChanged('add,clear,delete,set'.split(','))
    }
}
class FixedMap extends ChangedMap {
    constructor(...args) { super(...args); this._onChanged = ()=>{throw new FixError()}; }
}


/*
class ChangedContainer { // 破壊的メソッドを監視する
    constructor(...args) { this._onChanged = ()=>{}; this._setupOnChanged(); }
    get onChanged() { return this._onChanged }
    set onChanged(v) { if ('function'===typeof v) { this._onChanged = v } }
    _setupOnChanged(names) {
        Object.defineProperty(this, name, (...args)=>{
            super[name](...args)
            this._onChanged(this)
        })
    }

}
class ChangedArray extends Array { // 破壊的メソッドを監視する
    constructor(...args) { super(...args); this._onChanged = ()=>{}; this._setupOnChanged(); }
    get onChanged() { return this._onChanged }
    set onChanged(v) { if ('function'===typeof v) { this._onChanged = v } }
    _setupOnChanged() {
        const names = 'copyWithin,fill,pop,push,reverse,shift,sort,splice,unshift'.split(',')
        Object.defineProperty(this, name, (...args)=>{
            super[name](...args)
            this._onChanged(this)
        })
    }
//    copyWithin(...args) { super.copyWithin(...args); this._onChanged(this); }
//    fill(...args) { super.fill(...args); this._onChanged(this); }
}
*/
window.valk = valk
window.FixError = FixError
})()
