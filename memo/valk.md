# valk

　valkは値の代入をコールバック関数で制御するJavaScriptライブラリです。

　名前の由来は「<ruby>値<rt>value</rt></ruby>の代入を<ruby>コールバック<rt>callback</rt></ruby>関数で制御する」です。

<style>
.value-only {font-weight:bold;color:red;}
.callback-only {font-weight:bold;color:blue;}
.common {font-weight:bold;color:green;}
.only {color:gray;}
</style>

名|位置
--|----
`valk`|<span class="value-only">v</span><span class="common">al</span><span class="callback-only">k</span>
`value`|<span class="value-only">v</span><span class="common">al</span><span class="only">ue</span>
`callback`|<span class="only">c</span><span class="common">al</span><span class="only">lbac</span><span class="callback-only">k</span>

# API

```javascript
valk.fix(v)
valk.count(v, {step:(tick)=>tick++}) //count.count(), count.v
valk.some(v, list, options:{onChangedList:()=>, onChangedValue:()=>, ...})
valk.range(v, min, max, options:{onChangedRange:()=>, onChangedValue:()=>, ...})
valk.typed(v, type, options:{})
valk.types.Fix/Some/Range/Typed/Changed/ChangedArray/ChangedMap/TypedArray(genericArray)/TypedMap/

     名前はどれがいいか
     var/variable/hook/hooked/change/changed/observed/obserVal/
valk.changed(v, ontions:{
  onBefore:()=>,
  onValidate:(i,o)=>true,
  onSet:(i,o)=>return i,
  onSetDefault:(i,o)=>return o,
  onValid:(i,v,o)=>,
  onInvalid:(i,v,o)=>,
  onChanged:(i,v,o)=>,
  onUnchanged:(i,v,o)=>,
  onAfter:()=>,
})
valk.changedArray(v, ontions:{
  onAdd:(v,isLast)=>,
  onIns:(v,isLast)=>,
  onDel:(v,isLast)=>,
  onChangedValues:(v)=>
  onSort:(v)=>,
})
// TypedArray: https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
valk.genericArray(v, ontions:{
valk.typedArray(v, ontions:{
  onValidate:(i)=>,
  onIns:(v,isLast)=>,
  onDel:(v,isLast)=>,
  onChangedValues:(v)=>
  onSort:(v)=>,
})
generic.valid.type.isNum/Int/Flt/Bln/Big/Str/Date/Cls(...)/Ins(...)/Array/Set/Map/Obj/Node/Elm/

valk.changedMap(v, ontions:{
  onAddKey:(k,v)=>,
  onDelKey:(k,v)=>,
  onModKey:(n,o)=>,
  onMarge:(i,v,o)=>,
  onPurge:(i,v,o)=>,
})
```

```javascript
class ChangedArray extends Array {
  // 破壊メソッド全てにコールバック関数を仕込む
  // copyWithin,fill,pop,push,shift,unshift,splice
  // reverse,sort
}
class ChangedMap extends Map {
  // 破壊メソッド全てにコールバック関数を仕込む
  // clear,delete,set
}
```

https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array
https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Map

# API

```javascript
valk.fix(v)
valk.range(v, min, max)
valk.some(v, candidates)
valk.valid(v, options)
```

API|概要
---|----
`valk.fix(v)`|固定値
`valk.some(v, candidates)`|指定した値のいずれかに該当する変数
`valk.range(v, min, max)`|指定した範囲内に収まる有限数
`valk.valid(v, options)`|値を代入するときコールバック関数を指定できるクラス

## `fix(v)`

　`fix(v)`は固定値を宣言します。

```javascript
const zero = valk.fix(0)
```

　値の参照は`v`プロパティで行います。

```javascript
console.assert(0===zero.v)
```

　`v`への代入はできません。例外発生します。

```javascript
zero.v = 1 // TypeError: Assignment to fix value.
```

　`zero`への代入もできません。例外発生します。これは`const`宣言によるものです。

```javascript
const zero = valk.fix(0)
zero = 1 // TypeError: Assignment to constant value.
```


　固定値が次の型である場合も同様です。

* Primitive（数値、文字列、真偽値、`null`、`undefined`）

　ただし固定値が参照型である場合は同様にできません。

* Object
* Function
* Class
* Instance
* Array
* Map
* Set

```javascript
const ok = valk.fix('OK')
ok.v = 'NG' // TypeError: Assignment to fix value.
```
```javascript
const odd = valk.fix([1,3,5,7,9])
odd.v               // [1,3,5,7,9]
odd.v = [0,2,4,6,8] // 例外（TypeError: Assignment to fix value.）
odd.v.pop()         // 例外（破壊メソッド使用禁止）
odd.w               // 例外（vプロパティ以外参照禁止）
delete odd.v        // 例外（削除禁止）
Object.defineProperty(odd, v, {value:null}) // 例外（ディスクリプタ定義禁止）
```

　上記のようにするにはChangedArrayを作ります。Arrayを継承し、破壊メソッドに対してコールバック関数を仕込みます。さらにそれを継承したFixedArrayクラスを作り、破壊メソッド呼出時に例外発生させることで実現します。

　これと同じことを添え字が文字列の場合でも行います。

```javascript
const odd = valk.fix({k:'v'})
odd.v               // {k:'v'}
odd.v = [0,2,4,6,8] // 例外（TypeError: Assignment to fix value.）
delete odd.v.k      // 例外（delete 禁止）
odd.v.newKey        // 例外（普通のobjectは存在しないキーを参照すると作成してしまうが、例外発生させる（Proxyを使う））
odd.v.newKey = 'V'  // 例外（普通のobjectは存在しないキーを参照すると作成してしまうが、例外発生させる（Proxyを使う））
odd.v.k = 'X'       // 例外（代入禁止。内部ではobjectでなくMapクラスを使う。これをChangedMap, FixedMapにする（Array同様））
odd.v.k             // 成功（'v'を返す。内部ではMap.get('k')の値を返す。Proxyを使う?）
odd.v.get('k')      // 例外（内部的には存在するが例外発生させる。Proxyを使う）
Object.defineProperty(odd, v, {value:null}) // 例外（ディスクリプタ定義禁止）
```

　文脈によって固定値を表す語が違います。valkは最も短い`fix`を採用しました。

語|意味
--|----
`const`(`constant`)|不変、一定
`read-only`|読取専用
`final`|最後
`immutable`|変更不可
`fix`|`fix`|固定

# ユースケース


# JS標準APIで実装しようとしたら大変

## fix

　`valk.fix`は固定値を生成します。

```javascript
const zero = valk.fix(0)
zero = 1   // TypeError: Assignment to constant variable.
zero.v = 1 // TypeError: Assignment to fix value.
console.assert(0===zero)
console.assert(0===zero.v)
```

　このとき変数`zero`を`const`宣言したから`zero = 1`で例外が出ました。もし`let`宣言したら代入できてしまいます。

```javascript
let zero = valk.fix(0)
zero = 1   // 代入できてしまう！
console.assert(0===zero)
```

　これはJavaScriptの仕様であり限界です。他言語のように演算子オーバーロードがあれば代入を禁止することもできました。ですがJavaScriptの言語仕様上、できません。

　インスタンス`zero`の参照で値`0`を返す実装も場合によっては可能です。ただし値が[プリミティブ][]の場合のみです。`valueOf()`のオーバーライドによってプリミティブ値を返せます。しかし値が非プリミティブ値なら`toString()`の結果が返されてしまいます。

[プリミティブ]:https://developer.mozilla.org/ja/docs/Glossary/Primitive

　[プリミティブ][]は文字列、数値、論理値、シンボル、`null`、`undefined`のみです。ようするに非オブジェクトでメソッドを持たないデータです。

　固定値にしたい値は必ずしもプリミティブとは限りません。オブジェクトを固定値にしたいこともあるでしょう。よって、`valueOf`により`v`参照を省略するような記述は使えません。正確に言えば、値がプリミティブの時は使えますが、オブジェクトの時は使えません。値の型によって変わるのはインタフェース設計として不適切です。統一するために`valueOf`の利用はしません。値は常に`v`で参照します。

```javascript
const zero = valk.fix(0)
zero = 1   // TypeError: Assignment to constant variable.
zero.v = 1 // TypeError: Assignment to fix value.
console.assert(zero instanceof valk.types.Fix)
console.assert(0===zero.v)
```
```javascript
class C {}
const c = valk.fix(new C)
c = 1   // TypeError: Assignment to constant variable.
c.v = 1 // TypeError: Assignment to fix value.
console.assert(c instanceof valk.types.Fix)
console.assert(0===c.v)
```

```javascript
class C {}
class D {
  constructor() {
    this.c = valk.fix(new C)
  }
}
const d = new D
d = 1     // TypeError: Assignment to constant variable.
d.c = 1   // 代入できてしまう！
d.c.v = 1 // TypeError: Assignment to fix value.
```

```javascript
class C {}
class D {
  constructor() {
    this._c = valk.fix(new C)
  }
  get c() { return this._c }
}
const d = new D
d = 1     // TypeError: Assignment to constant variable.
d.c = 1   // 代入されず、例外発生せず、無視される
d._c = 1  // 代入できてしまう！
d.c.v = 1 // TypeError: Assignment to fix value.
```

　結局、演算子オーバーロードができない言語仕様のため思い通りにできず。



```javascript
    static setReadOnlyProp(obj, name, value=null, writable=false, enumerable=true, configurable=false) {
        const target = (obj) ? obj : {}
        Object.defineProperty(target, name, {
            value: value,
            writable: writable,         // value を書き換え可能か
            enumerable: enumerable,     // Object.assign, Spread構文[...], for in, Object.key, で列挙されるか
            configurable: configurable, // オブジェクトから削除可能か。value,writable以外(enumerable,configurable)を変更可能か
        });
        return obj
    }
```

　`valk.fix()`


　`zero`で値を返すことはできました。


　もし関数内なら`const`宣言すれば良いです。

```javascript
const NUM = 10
const NAME = 'A'
```

　ただし`const`宣言はクラス変数に対して使用できません。

```javascript
class C {
    const C_NUM = 0 // SyntaxError: Unexpected identifier
}
```
```javascript
class C {
    constructor() {
        const this.I_NUM = 0 // SyntaxError: Unexpected token 'this'
    }
}
```
```javascript
class C {
    constructor() { this._v = 0 }
    const get P_NUM() { return this.v } // SyntaxError: Unexpected token 'get'
}
```

　以下のように固定値を`Fix`クラスとして定義すれば可能です。

```javascript
class Fix {
    constructor(v) { this._v = v }
    get v() { return this._v }
    valueOf() { return this._v }
}
```

　ポイントは二つです。

* セッターがないので代入不可となり固定値となります
* `valueOf`のオーバーライドにより計算式で利用した時にインスタンス`this`でなく値`this._v`を返します

　次のように固定値を宣言します。`zero`という変数名に値`0`をセットします。

```javascript
const zero = new Fix(0)
```

　テストしてみましょう。値の代入をすると例外が発生して代入できません。固定値になりました。成功です。

```javascript
zero = 1 // TypeError: Assignment to constant variable.
zero++   // TypeError: Assignment to constant variable.（固定値なので変更不可）
```

　`Fix`インスタンス`zero`は計算式で参照されたとき、値を返します。

```javascript
console.assert(zero instanceof Fix)
console.assert(zero === zero)
console.assert(zero !== 0)
console.assert(zero == 0)
console.assert(1 === zero + 1)
```

　プロパティ`v`を使わずに値を参照できていますね。これが`valueOf`の効果です。`==`や`zero + 1`の式でインスタンスでなく値を返しています。ふつう`zero`は`Fix`クラスのインスタンスを返しますが、それを`valueOf`のオーバーライドによって`this._v`を返すよう実装しました。これにて計算式で参照された`Fix`インスタンス`zero`は、コンストラクタで設定された値`this._v`を返すようになります。

　もちろんプロパティ`v`を使って値を参照することも可能です。

```javascript
console.assert(zero.v === 0)
```

　プロパティ`v`でも値を代入することはできません。

```javascript
zero.v = 1
```

　ただし、`zero = 1`のときと違って例外が発生せず、単に無視されるだけです。

```javascript
zero = 1   // TypeError: Assignment to constant variable.
zero.v = 1 // 代入されず、無視される（例外発生せず）
```

　`zero`は`const`で宣言されました。`const zero = new Fix(0)`のように。それに対して`v`はゲッターです。セッターは容易していないため代入されません。しかし例外が発生せず、代入の記述を許します。これは紛らわしいですね。


```javascript
class Fix {
    constructor(v) { this._v = v }
    get v() { return this._v }
    valueOf() { return this._v }
}
```


　どちらも同じく固定値に対する代入であり、禁止行為です。なので同じように例外を発生して欲しいです。

```javascript
function Fix(i) {
	const 
    Object.defineProperty(o, pName, {
        value: value,
        writable: writable,         // value を書き換え可能か
        enumerable: enumerable,     // Object.assign, Spread構文[...], for in, Object.key, で列挙されるか
        configurable: configurable, // オブジェクトから削除可能か。value,writable以外(enumerable,configurable)を変更可能か
    });

}
```


　`==`や`zero + 1`でインスタンスでなく


```javascript
class Fix {
    constructor() { this._v = 0 }
    get P_NUM() { return this._v }
    valueOf() { return this._v }
}
class C {
	NUM = Fix(0)
	static S_NUM = Fix(0)
	constructor() {
		this.I_NUM = Fix(0)
		this._p = Fix(0)
	}
	get P( ) { return this._p }
	set P(v) { this._p = v }
}
```


```javascript
class C {
    constructor() { this._v = 0 }
    const get P_NUM() { return this.v }
}
```



　主にクラス変数で使用します。

```javascript
class C {
  NUM = valk.fix(10)
  constructor() {
    this.NAME = valk.fix('A')
  }
}
```

　固定値の実装は次の方法です。

```javascript
Object.defineProperty(obj, 'v', {
    value: value,
    writable: false,
    enumerable: true,
    configurable: false,
});

```




```javascript
valk.fix(v)
valk.valid(v, options)
valk.some(v, candidates)
valk.range(v, min, max)
```

## some

## range

## valid

```javascript
valk.fix(v)
valk.valid(v, options)
valk.some(v, candidates)
valk.range(v, min, max)
```










## valk.count()

```javascript
valk.count()       // 0から無限にカウントアップ
valk.count(100)    // 0から100までカウントアップ
valk.count(-100)   // 100から0までカウントダウン
valk.count(0, 100) // 0から100までカウントアップ
valk.count(100, 0) // 100から0までカウントダウン
valk.count({onStep:(v)=>v++})    // 0から無限にカウントアップ。1ずつ加算
valk.count({onStep:(v)=>v--})    // 0から無限にカウントダウン。1ずつ減算
valk.count({onStep:(v)=>v+2})    // 0から無限にカウントアップ。2ずつ加算
valk.count({onComplete:(v)=>{}})    // 完了処理。完了したら実行する。
valk.count({type:valk.count.onCompletedTypes.Error/Keep/Clear/Over})
```

* 整数値が一つのみ（0を基準として正数・負数によりカウントアップかダウンを決める）
* 正数が二つ（基準値を0でない値にしたいときに使用する。初期値、最終値の順に指定する。その大小によってアップorダウンを決める）
* `onStep`: `count()`時に実行する。普通`(v)=>v++`か`(v)=>v--`のいずれか。それ以外の場合は`onStep`を実装することで自由に決定できる
* `onComplete`: 完了時に実行する。戻り値が真ならカウント値をクリアする。isCompletedが真なら`count()`時に例外発生する。

```javascript
const c = valk.count(3)
c.count()
c.count()
c.count()
c.count() // 例外発生: すでにカウント上限に達しました。

c.isCompleted ? c.count() : undefined
```

　完了後の処理をどうするか。完了後のコールバック関数を呼び出すのは確定としても、次の4パターンが考えられる。

* `count()`を呼び出すと例外発生する（既に完了済みエラー）
* `count()`を呼び出すと無視する（カウント変化せず例外も出さないが呼び出しは許可する）
* `count()`を呼び出すと加算する（完了直後にカウント値が初期化されている）
* `count()`を呼び出すと加算する（上限値をオーバーして尚カウントし続ける）

完了後パターン|概要
--------------|----
`onCompletedError`|`count()`を呼び出すと例外発生する（既に完了済みエラー）
`onCompletedKeep`|`count()`を呼び出すと無視する（カウント変化せず例外も出さないが呼び出しは許可する）
`onCompletedClear`|`count()`を呼び出すと加算する（完了直後にカウント値が初期化されている）
`onCompletedOver`|`count()`を呼び出すと加算する（上限値をオーバーして尚カウントし続ける。デフォルト）
`onCompletedEvery`|`count()`を呼び出すと加算する（上限値をオーバーして尚カウントし続ける。デフォルト）

　`complete()`コールバック関数は初回完了直後に実行される。ただ、一度完了した後にどうするか。いくつかのパターンがある。

完了後パターン|`count()`|`complete()`|ユースケース
--------------|---------|------------|------------
`onCompletedError`|例外発生|例外発生|一度完了したら二度とカウントさせない（エラー発生する）
`onCompletedKeep`|無視|無視|一度完了したら機能停止（エラー発生しない）
`onCompletedOver`|カウントする|無視|一度完了したら二度と`complete()`しないが、カウントは可能（上限値無視）
`onCompletedEvery`|無視|実行する|一度完了したら以降カウントする度に`complete()`する（カウントは無視）
`onCompletedClear`|カウントする|カウントを初期化する|完了する度にカウントを初期化する（無限ループ）



```javascript
const c = valk.count({type:valk.count.onCompletedTypes.Error/Keep/Clear/Over})
c.v // カウント値
c.tick // count()呼出回数
c.isCompleted // 完了是非
c.count() // カウントアップorダウン（next()と同義だがイテレータにはしないためcountという名前にする）
c.gen()   // ジェネレータ関数（yieldで返すのでfor文で受け止めること。たとえ`onCompletedOver`でも終了する（無限ループ回避））
```

```javascript
const c = valk.count() // 永久にカウントアップする Over 永遠に onCompleted しない
c.count()
```
```javascript
const c = valk.count(10) // 0から10までカウントアップする Clear 10になると onCompleted してカウント初期化する
c.count()
```
```javascript
const c = valk.count(-10) // 10から0までカウントアップする Clear 0になると onCompleted してカウント初期化する
c.count()
```

```javascript
// 腹筋10回3セット
const set = valk.count(3, {type:valk.count.onCompletedTypes.Every, onComplete:(v)=>console.log(`${v} set Completed !!`)});
const time = valk.count(10, {type:valk.count.onCompletedTypes.Clear, 
    onCount:(v)=>{
        if (set.isCompleted) { return set.onComplete(v); }
        return v++;
    },
    onCounted:(v)=>{ console.log(`${v}/${this.end} time ${set.v}/${set.end} set`); },
    onComplete:(v)=>{
        console.log(`${v} time Completed !!`);
        set.count();
}});
[...Array(10*3)].map(v=>time.count())
const all = set.v * time.end
```

