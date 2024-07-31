window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOMContentLoaded!!');
    const {h1, p} = van.tags
    const author = 'ytyaru'
    van.add(document.querySelector('main'), 
        h1(van.tags.a({href:`https://github.com/${author}/Html.VanJS.Valk.20240718164433/`}, 'Valk')),
        p('値の代入をコールバック関数で制御するJavaScriptライブラリ。'),
//        p('A JavaScript library that controls value assignment using callback functions.'),
    )
    van.add(document.querySelector('footer'),  new Footer('ytyaru', '../').make())

    const a = new Assertion()

    // FixedValue
    a.e(TypeError, 'Assignment to constant variable.', ()=>{
        const zero = valk.fix(0)
        zero = 1
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const zero = valk.fix(0)
        zero.x = 1 // 存在しないプロパティ x に代入しようとした
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const zero = valk.fix(0)
        zero.v = 1 // 存在するプロパティ v に代入しようとした
    })
    a.e(ReferenceError, `Property does not exist: x`, ()=>{
        const zero = valk.fix(0)
        return 0===zero.x // 存在しないプロパティ v を参照した
    })
    a.t(()=>{
        const zero = valk.fix(0)
        return 0===zero.v // 存在するプロパティ v を参照した
    })
    console.log(valk.fix(0).__type)
    a.t('Proxy(valk.FixedValue)'===valk.fix(0).__type)

    // FixedArray
    a.t(Array.isArray(valk.fix([1,2,3])))
    a.t(()=>{
        const fixAry = valk.fix([1,2,3])
        return 'Proxy(valk.FixedArray)'===fixAry.__type
    })
    a.t(()=>{
        const fixAry = new valk.types.FixedArray([1,2,3])
        return 'Proxy(valk.FixedArray)'===fixAry.__type
    })
    // static メソッドは継承しない？（Proxyによって阻まれる？）
    a.e(TypeError, 'Cannot create proxy with a non-object as target or handler', ()=>{
        const fixAry = valk.types.FixedArray.of([1,2,3]) // Array.of
    })
    a.e(TypeError, 'Cannot create proxy with a non-object as target or handler', ()=>{
        const fixAry = valk.types.FixedArray.from([1,2,3]) // Array.from
    })
    a.e(TypeError, 'valk.types.FixedArray.fromAsync is not a function', async()=>{ // テスト環境で Array.fromAsync は未実装
        const fixAry = await valk.types.FixedArray.fromAsync([1,2,3]) // Array.fromAsync
    })
    // なぜ isArray だけ継承される？
    a.t(()=>{
    //a.e(TypeError, 'Cannot create proxy with a non-object as target or handler', ()=>{
        return valk.types.FixedArray.isArray([1,2,3]) // Array.from
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const fixAry = new valk.types.FixedArray([1,2,3])
        fixAry[0] = 9
    })
    a.t(()=>{
        const fixAry = valk.fix([1,2,3])
        return 3===fixAry.length && 1===fixAry[0] && 2===fixAry[1] && 3===fixAry[2]
    })
    a.e(TypeError, 'Assignment to constant variable.', ()=>{
        const fixAry = valk.fix([1,2,3])
        console.log(fixAry)
        fixAry = [4,5,6]
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const fixAry = valk.fix([1,2,3])
        console.log(fixAry)
        fixAry[0] = 9
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const fixAry = valk.fix([1,2,3])
        console.log(fixAry)
        fixAry.pop()
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const fixAry = valk.fix([1,2,3])
        console.log(fixAry)
        fixAry[0] = 9
    })
    for (let name of 'copyWithin,fill,pop,push,reverse,shift,sort,splice,unshift'.split(',')) {
        a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
            const fixAry = valk.fix([1,2,3])
            fixAry[name]()
        })
    }
    a.t(()=>{
        const fix = valk.fix([1])
        const a = fix.concat([2])
        console.log(a)
        return 2===a.length && 1===a[0] && 2===a[1]
    })
    a.t(()=>{
        const fix = valk.fix([1,2,3,4,5,6,7,8,9])
        const a = fix.filter(v=>0===v%2)
        return 4===a.length && [2,4,6,8].every((v,i)=>v===a[i])
    })

    // FixedSet
    a.t(valk.fix(new Set([1,2,3])) instanceof Set)
    a.e(ReferenceError, `Property does not exist: 0`, ()=>{
        const s = valk.fix(new Set([1,2,3]))
        s[0]
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const s = valk.fix(new Set([1,2,3]))
        s[0] = 9
    })
    a.t(()=>{
        const s = valk.fix(new Set([1,2,3]))
        console.log(s.size)
        return 3===s.size
    })
    a.t(()=>{
        const s = valk.fix(new Set([1]))
        return s.has(1)
    })
    a.t(()=>{
        const s = valk.fix(new Set([1,2,3]))
        console.assert(s instanceof Set)
        return 3===s.size && [1,2,3].every(v=>s.has(v))
    })
    a.t(()=>{
        const s = valk.fix(new Set([1,2,3]))
        const a = [...s.values()]
        return 3===a.length && 1===a[0] && 2===a[1] && 3===a[2]
    })
    a.t(()=>{
        const r = []
        const expected = [1,2,3]
        const s = valk.fix(new Set(expected))
        let i = 0
        for (let v of s.values()) {
            r.push(v===expected[i])
            i++
        }
        return r.every(v=>v)
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const s = valk.fix(new Set())
        s.add(1)
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const s = valk.fix(new Set([0]))
        s.clear(1)
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const s = valk.fix(new Set([0]))
        s.delete(2)
    })
    for (let name of 'add,clear,delete'.split(',')) {
        a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
            const fixSet = valk.fix(new Set([1,2,3]))
            fixSet[name]()
        })
    }

    // FixedMap
    a.t(valk.fix(new Map([['k', 1], ['l', 2]])) instanceof Map)
    a.t(valk.fix({k:1, l:2}) instanceof Map)
    a.t('Proxy(valk.FixedMap)'===valk.fix(new Map([['k', 1], ['l', 2]])).__type)
    a.t('Proxy(valk.FixedMap)'===valk.fix({k:1, l:2}).__type)
    console.log(valk.fix({k:1, l:2}).constructor)
    console.log(valk.fix({k:1, l:2}).constructor.name)
    a.e(ReferenceError, `Property does not exist: k`, ()=>{
        const m = valk.fix({k:1})
        m['k']
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const s = valk.fix({k:1})
        s['k'] = 9
    })
    a.t(()=>{
        const m = valk.fix({k:1})
        return 1===m.size
    })
    a.t(()=>{
        const m = valk.fix({k:1})
        return m.has('k')
    })
    a.t(()=>{
        const m = valk.fix({k:1})
        return 1===m.get('k')
    })
    a.t(()=>{
        const m = valk.fix({k:1, l:2})
        console.assert(m instanceof Map)
        console.log(m)
        return 2===m.size && [['k',1],['l',2]].every(([k,v])=>m.has(k) && v===m.get(k))
    })
    a.t(()=>{
        const m = valk.fix({k:1, l:2})
        const ks = [...m.keys()]
        const vs = [...m.values()]
        const es= [...m.entries()]
        return [ks,vs,es].every(a=>2===a.length) 
            && 'k'===ks[0] && 'l'===ks[1] 
            && 1===vs[0] && 2===vs[1]
            && 'k'===es[0][0] && 1===es[0][1] 
            && 'l'===es[1][0] && 2===es[1][1]
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const s = valk.fix({k:1})
        s.set('l',2)
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const s = valk.fix({k:1})
        s.clear()
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const s = valk.fix({k:1})
        s.delete('k')
    })
    for (let name of 'clear,delete,set'.split(',')) {
        a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
            const fixMap = valk.fix({k:1})
            fixMap[name]()
        })
    }


    a.fin()
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

