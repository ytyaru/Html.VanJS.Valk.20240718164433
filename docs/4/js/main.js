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
    a.e(TypeError, 'Assignment to constant variable.', ()=>{
        const zero = valk.fix(0)
        zero = 1
    })
    a.e(valk.errors.FixError, 'Assignment to fix variable.', ()=>{
        const zero = valk.fix(0)
        zero.v = 1
    })
    a.t(()=>{
        const zero = valk.fix(0)
        return 0===zero.v
    })
    a.t(Array.isArray(valk.fix([1,2,3])))
    a.t(()=>{
        const fixAry = valk.fix([1,2,3])
        console.log(fixAry)
        console.log(fixAry.length)
        console.log(fixAry[0])
        console.log(fixAry[1])
        console.log(fixAry[2])
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


    a.t(valk.fix(new Set([1,2,3])) instanceof Set)
//    const s = valk.fix(new Set([1,2,3]))
//    s.has(1)
    a.t(()=>{
        const s = valk.fix(new Set([1,2,3]))
        console.assert(s instanceof Set)
        console.log(s)
        console.log(s.size)
//        console.log(s.has.bind(s)(1))
        console.log(s.has(1))
//        console.log(s.has(2))
//        console.log(s.has(3))
//        console.log(s.get(0))
//        console.log(s[0])
//        console.log(s[1])
//        console.log(s[2])
//        console.log(s.values())
//        const v = [...s.values()]
//        return 3===s.size && 1===v[0] && 2===v[1] && 3===v[2]
        return 3===s.size && [1,2,3].every(v=>s.has(v))
    })

    a.fin()
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

