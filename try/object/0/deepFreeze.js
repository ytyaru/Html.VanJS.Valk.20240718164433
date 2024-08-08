// 子孫オブジェクトに対してもObject.freezeする
Object.deepFreeze = function(obj, isSealLeaf=false) { // isSealLeaf: 末端Objはfreezeでなくsealにする
    let hasChildren = false
    for (let [k,v] of Object.entries(obj)) {
        if ('Object'===v.constructor.name) { obj[k] = Object.deepFreeze(v); hasChildren = true; }
    }
    return Object[hasChildren || !isSealLeaf ? 'freeze' : 'seal'](obj)
}
Object.deepSeal = function(obj, isPreventExtensionsLeaf=false) { // isSealLeaf: 末端ObjはsealでなくpreventExtensionsにする
    let hasChildren = false
    for (let [k,v] of Object.entries(obj)) {
        if ('Object'===v.constructor.name) { obj[k] = Object.deepSeal(v); hasChildren = true; }
    }
    return Object[hasChildren || !isPreventExtensionsLeaf ? 'seal' : 'preventExtensionsLeaf '](obj)
}
Object.deepPreventExtensions = function(obj) { // isSealLeaf: 末端ObjはsealでなくpreventExtensionsにする
    let hasChildren = false
    for (let [k,v] of Object.entries(obj)) {
        if ('Object'===v.constructor.name) { obj[k] = Object.deepPreventExtensions(v); hasChildren = true; }
    }
    return Object.preventExtensions(obj)
}
