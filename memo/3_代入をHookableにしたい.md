# JavaScriptの代入をHookableにしたい

　

<!-- more -->

　値の代入処理に介入する方法としてクラスの`setter`がある。

```javascript
class C {
    constructor() { this._v = null }
    set v(v) { this._v = v + 1 }
    get v() { return this._v }
}
const c = new C()
c.v = 1
console.assert(2===c.v)
```

　値が変更されたとき何らかの処理をしたい。このとき`onChanged`コールバック関数で指定された処理を実行したい。

```javascript
class C {
    constructor(v, onChanged) {
        this._v = v
        this._onChanged = 'function'===typeof onChanged ? onChanged : (v,o)=>console.log('値が変更された！')
    }
    get v() { return this._v }
    set v(v) {
        const o = this._v
        this._v = v
        if (o !== v) { this._onChanged(v,o) }
    }
}
let changedNum = 0
const c = new C(null, (v,o)=>++changedNum)
c.v = 0
console.assert(0===c.v)
console.assert(1===changedNum)
```




　次のような要件がある。

* 値が変更されたとき何らかの処理をする
* 値のチェック処理に成功したら代入する

　代入処理の途中で「何らかの処理を実行する」という要件はたくさんある。これを一般化したい。つまりコールバック関数を指定することで代入処理へ自由に介入できるようにしたい。

　これらはコールバック関数によって任意の処理をセットしたい。

　また、これ以外にも要件はある。網羅


`onBefore`|代入処理の最初に
`onAfter`

```javascript
class C {}
```
```javascript
set v(v) { this._v = v }
```
```javascript
set v(v) {
    const o = this._v
    this._v = v
    if (o!==this._v) { this._onChanged(v, o) }
}
```
```javascript
constructor() {
    this._i = null; // 入力値(  invalidable value)
    this._v = null; // 最終値(    validable value)
    this._o = null; // 前回値(old validable value)
}
set v(v) {
    this._i = v
    this._onBefore(this._i, this._v, this._o)
    this._o = this._v
    if (this._onValidate(this._i)) {
        this._v = this._onSet(this._i, this._o)
        this._onValid(this._i, this._v, this._o)
    } else {
        this._v = this._onSetDefault(this._i, this._o)
        this._onInvalid(this._i, this._v, this._o)
    }
    if (this._o === this._v) { this._onUnchanged(this._i, this._v, this._o) }
    else { this._onChanged(this._i, this._v, this._o) }
    this._onAfter(this._i, this._v, this._o)
}
```









[JSで値変更を検知したい-4（まとめ編）]:https://qiita.com/ymgd-a/items/7e547fa78d2446cc8240

`Object`
`Array`
`Set`
`Map`

[`Object`]:
[`Array`]:
[`Set`]:
[`Map`]:

```javascript
set v(v) { this._v = v }
```
```javascript
set v(v) {
    const o = this._v
    this._v = v
    if (o!==this._v) { this._onChanged(v, o) }
}
```
```javascript
constructor() {
    this._i = null; // 入力値(  invalidable value)
    this._v = null; // 最終値(    validable value)
    this._o = null; // 前回値(old validable value)
}
set v(v) {
    this._i = v
    this._onBefore(this._i, this._v, this._o)
    this._o = this._v
    if (this._onValidate(this._i)) {
        this._v = this._onSet(this._i, this._o)
        this._onValid(this._i, this._v, this._o)
    } else {
        this._v = this._onSetDefault(this._i, this._o)
        this._onInvalid(this._i, this._v, this._o)
    }
    if (this._o === this._v) { this._onUnchanged(this._i, this._v, this._o) }
    else { this._onChanged(this._i, this._v, this._o) }
    this._onAfter(this._i, this._v, this._o)
}
```
