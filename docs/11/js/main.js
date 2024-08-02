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
    const bb = new BlackBox(a)

    // FixValue
    a.t(()=>{
        const zero = valk.fix(0)
        return `Proxy(valk.FixValue)`===zero.typeName
    })
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
        console.log(zero.v)
        return 0===zero.v // 存在するプロパティ v を参照した
    })
    console.log(valk.fix(0).typeName)
    a.t('Proxy(valk.FixValue)'===valk.fix(0).typeName)

    // FixArray
    a.t(Array.isArray(valk.fix([1,2,3])))
    a.t(()=>{
        const fixAry = valk.fix([1,2,3])
        return 'Proxy(valk.FixArray)'===fixAry.typeName
    })
    a.t(()=>{
        //const fixAry = new valk.types.FixArray([1,2,3])
        const fixAry = valk.fix([1,2,3])
        return 'Proxy(valk.FixArray)'===fixAry.typeName
    })
    // static メソッドは継承しない？（Proxyによって阻まれる？）
    a.t(()=>{
    //a.e(TypeError, 'Cannot create proxy with a non-object as target or handler', ()=>{
        //const fixAry = valk.types.FixArray.of([1,2,3]) // Array.of
        const fixAry = valk.fix(Array.of(1,2,3)) // Array.of
        return 'Proxy(valk.FixArray)'===fixAry.typeName
    })
    a.t(()=>{
    //a.e(TypeError, 'Cannot create proxy with a non-object as target or handler', ()=>{
        //const fixAry = valk.types.FixArray.from([1,2,3]) // Array.from
        const fixAry = valk.fix(Array.from([1,2,3])) // Array.from
        return 'Proxy(valk.FixArray)'===fixAry.typeName
    })
    a.e(TypeError, 'Array.fromAsync is not a function', async()=>{ // テスト環境で Array.fromAsync は未実装
        //const fixAry = await valk.types.FixArray.fromAsync([1,2,3]) // Array.fromAsync
        const fixAry = valk.fix(await Array.fromAsync([1,2,3])) // Array.fromAsync
    })
    // なぜ isArray だけ継承される？
    a.e(ReferenceError, 'Property does not exist: isArray', ()=>{
    //a.t(()=>{
    //a.e(TypeError, 'Cannot create proxy with a non-object as target or handler', ()=>{
        //return valk.types.FixArray.isArray([1,2,3]) // Array.from
        return valk.fix([1,2,3]).isArray([1,2,3]) // Array.from
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        //const fixAry = new valk.types.FixArray([1,2,3])
        const fixAry = valk.fix([1,2,3])
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

    // FixSet
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

    // FixMap
    a.t(valk.fix(new Map([['k', 1], ['l', 2]])) instanceof Map)
    a.t(valk.fix({k:1, l:2}) instanceof Map)
    a.t('Proxy(valk.FixMap)'===valk.fix(new Map([['k', 1], ['l', 2]])).typeName)
    a.t('Proxy(valk.FixMap)'===valk.fix({k:1, l:2}).typeName)
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

    // enum
    a.t(1===Object.keys(valk.enums).length)
    console.log(valk.enums)
    console.log(valk.enums.CounterCompleted)
    console.log(valk.enums.CounterCompleted.Error)
    console.log(valk.enums.CounterCompleted.Error._v)
    a.t(valk.enums.CounterCompleted.Error._v==='Error')
    a.t(valk.enums.CounterCompleted.Keep._v==='Keep')
    a.t(valk.enums.CounterCompleted.Over._v==='Over')
    a.t(valk.enums.CounterCompleted.Every._v==='Every')
    a.t(valk.enums.CounterCompleted.Clear._v==='Clear')
    a.t(valk.enums.CounterCompleted.isTypeOf(valk.enums.CounterCompleted.Error))
    a.t(valk.enums.CounterCompleted.isTypeOf(valk.enums.CounterCompleted.Keep))
    a.t(valk.enums.CounterCompleted.isTypeOf(valk.enums.CounterCompleted.Over))
    a.t(valk.enums.CounterCompleted.isTypeOf(valk.enums.CounterCompleted.Every))
    a.t(valk.enums.CounterCompleted.isTypeOf(valk.enums.CounterCompleted.Clear))
    a.f(valk.enums.CounterCompleted.isTypeOf('Error'))
    a.t(valk.enums.CounterCompleted.isTypeOf(new valk.enums.CounterCompleted.type('Error')))
    a.f(valk.enums.CounterCompleted.has(new valk.enums.CounterCompleted.type('Error')))
    a.t(valk.enums.CounterCompleted.has('Error'))
    a.f(valk.enums.CounterCompleted.hasValue('Error'))
    a.t(valk.enums.CounterCompleted.hasValue(valk.enums.CounterCompleted.Error))
    a.t(valk.enums.CounterCompleted.Error instanceof valk.enums.CounterCompleted.type)
    a.e(ReferenceError, `Key does not exist.: X`, ()=>valk.enums.CounterCompleted.isTypeOf(valk.enums.CounterCompleted.X))
    a.f(valk.enums.CounterCompleted.isTypeOf('Error'))
//    

    // counter
    a.t(valk.count() instanceof valk.types.Counter)
    bb.test(valk.count(), [
        (t)=>{console.log(t);return true},
        (t)=>0===t.v,
        (t)=>0===t._v,
        (t)=>0===t._start,
        (t)=>Infinity===t._end,
        (t)=>valk.enums.CounterCompleted.Over===t._onCompletedType,
        (t)=>{t.count();return 1===t.v;},
        (t)=>1===t.v&&!t.isCompleted,
    ])
    bb.test(valk.count(0), [
        (t)=>0===t.v,
        (t)=>0===t._v,
        (t)=>0===t._start,
        (t)=>Infinity===t._end,
        (t)=>!t._isCompletedOnce,
        (t)=>valk.enums.CounterCompleted.Over===t._onCompletedType,
        (t)=>{t.count();return 1===t.v;},
        (t)=>1===t.v && !t.isCompleted && !t._isCompletedOnce,
    ])
    bb.test(valk.count(1), [
        (t)=>{console.log(t);return true},
        (t)=>0===t.v,
        (t)=>0===t._v,
        (t)=>0===t._start,
        (t)=>1===t._end,
        (t)=>!t._isCompletedOnce,
        (t)=>valk.enums.CounterCompleted.Clear===t._onCompletedType,
        (t)=>{t.count();console.log(t);return 0===t.v;},
        (t)=>0===t.v && !t.isCompleted && t._isCompletedOnce,
    ])
    bb.test(valk.count(-1), [
        (t)=>1===t.v,
        (t)=>1===t._v,
        (t)=>1===t._start,
        (t)=>0===t._end,
        (t)=>!t._isCompletedOnce,
        (t)=>valk.enums.CounterCompleted.Clear===t._onCompletedType,
        (t)=>{t.count();return 1===t.v;},
        (t)=>1===t.v && !t.isCompleted && t._isCompletedOnce,
    ])
    bb.test(valk.count({type:valk.enums.CounterCompleted.Error}), [
        (t)=>{console.log(t);return true},
        (t)=>0===t.v,
        (t)=>0===t._v,
        (t)=>0===t._start,
        (t)=>Infinity===t._end,
        (t)=>valk.enums.CounterCompleted.Error===t._onCompletedType,
        (t)=>{t.count();return 1===t.v;},
    ])
    bb.test(valk.count(0, {type:valk.enums.CounterCompleted.Error}), [
        (t)=>{console.log(t);return true},
        (t)=>0===t.v,
        (t)=>0===t._v,
        (t)=>0===t._start,
        (t)=>Infinity===t._end,
        (t)=>valk.enums.CounterCompleted.Error===t._onCompletedType,
        (t)=>{t.count();return 1===t.v;},
    ])
    bb.test(valk.count(1, {type:valk.enums.CounterCompleted.Error}), [
        (t)=>{console.log(t);return true},
        (t)=>0===t.v,
        (t)=>0===t._v,
        (t)=>0===t._start,
        (t)=>1===t._end,
        (t)=>valk.enums.CounterCompleted.Error===t._onCompletedType,
//        new CounterError(`すでにCompletedです。`), (t)=>t.count(),
    ])
    a.e(valk.errors.CounterError, `すでにCompletedです。`, ()=>{
        const c = valk.count(1, {type:valk.enums.CounterCompleted.Error})
        c.count()
        c.count()
    })
    bb.test(valk.count(-1, {type:valk.enums.CounterCompleted.Error}), [
        (t)=>{console.log(t);return true},
        (t)=>1===t.v,
        (t)=>1===t._v,
        (t)=>1===t._start,
        (t)=>0===t._end,
        (t)=>valk.enums.CounterCompleted.Error===t._onCompletedType,
    ])
    a.e(valk.errors.CounterError, `すでにCompletedです。`, ()=>{
        const c = valk.count(-1, {type:valk.enums.CounterCompleted.Error})
        c.count()
        c.count()
    })
    bb.test(valk.count(5, 9), [
        (t)=>{console.log(t);return true},
        (t)=>5===t.v,
        (t)=>5===t._v,
        (t)=>5===t._start,
        (t)=>9===t._end,
        (t)=>valk.enums.CounterCompleted.Clear===t._onCompletedType,
        (t)=>{t.count();return 6===t.v;},
        (t)=>{t.count();return 7===t.v;},
        (t)=>{t.count();return 8===t.v;},
        (t)=>{t.count();return 5===t.v;},
    ])
    bb.test(valk.count(9, 5), [
        (t)=>{console.log(t);return true},
        (t)=>9===t.v,
        (t)=>9===t._v,
        (t)=>9===t._start,
        (t)=>5===t._end,
        (t)=>valk.enums.CounterCompleted.Clear===t._onCompletedType,
        (t)=>{t.count();return 8===t.v;},
        (t)=>{t.count();return 7===t.v;},
        (t)=>{t.count();return 6===t.v;},
        (t)=>{t.count();return 9===t.v;},
    ])
    bb.test(valk.count(5, 9, {type:valk.enums.CounterCompleted.Error}), [
        (t)=>{console.log(t);return true},
        (t)=>5===t.v,
        (t)=>5===t._v,
        (t)=>5===t._start,
        (t)=>9===t._end,
        (t)=>valk.enums.CounterCompleted.Error===t._onCompletedType,
        (t)=>{t.count();return 6===t.v;},
        (t)=>{t.count();return 7===t.v;},
        (t)=>{t.count();return 8===t.v;},
        (t)=>{a.e(valk.errors.CounterError, `すでにCompletedです。`, ()=>{t.count()});return true;},
    ])
    a.fin()
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

