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
    //constructor(v, options={}, insOpts={}) { super(v, options={}, {setDefined:false, ...insOpts}) }
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
window.valk = Object.deepFreeze({
    fix:(v, options={}, insOpts={})=>ifel(v instanceof Array, ()=>FixAry.of(v,options,insOpts),
            v instanceof Set, ()=>FixSet.of(v,options,insOpts),
            v instanceof Map, ()=>FixMap.of(v,options,insOpts),
            Type.isObj(v), ()=>FixObj.of(v,options,insOpts),
            ()=>FixVal.of(v,options,insOpts)
    ),
    types: {
        FixVal: FixVal,
        FixObj: FixObj,
        FixAry: FixAry,
        FixSet: FixSet,
        FixMap: FixMap,
    }
})
