(function(){
class Message {
    constructor(lang) {
        this._common = {
            ja: {
                return: {
                    'true':'真',
                    'false':'偽',
                },
                result: {
                    'pending': '保留',
                    'exception': '例外',
                    'fail': '失敗',
                    'success': '成功',
                    'details': {
                        zero: `テストを書いてください。<pre><code>const a = new Assertion()\na.t(true)\na.f(false)\na.e(Error, 'M', ()=>{throw new Error('M')}\na.fin()</code></pre>`,
                        notSuccess: '詳細はコンソールをご確認ください。コンソールはブラウザの開発者ツールにあります。',
                    }
                },
            },
            en: {
                return: {
                    'true':'true',
                    'false':'false',
                },
                result: {
                    'pending': 'pending',
                    'exception': 'exception',
                    'fail': 'fail',
                    'success': 'success',
                    'details': {
                        zero: `テストを書いてください。<pre><code>const a = new Assertion()\na.t(true)\na.f(false)\na.e(Error, 'M', ()=>{throw new Error('M')}\na.fin()</code></pre>`,
                        notSuccess: `Please check the console for details. The console is located in your browser's developer tools.`,
                    }
                }
            },
        }
        this._message = {
            ja: {
                normal: {
                    exception: {
                        return: 'テスト例外。引数は真偽値かそれを返す関数であるべきです。',
                        fnReturn: 'テスト例外。テストコードは最後に真偽値を返してください。',
                        throw:(e)=>`テスト例外。${e}であるべき所で例外発生しました。`,
                    },
                    fail: {
                        value:(e,a)=>`テスト失敗。${e}であるべき所が${a}です。`,
                        exception:(e)=>`テスト失敗。${e}であるべき所で例外発生しました。`,
                    },
                },
                exception: {
                    augument:{
                        summary:(num)=>`テスト例外。引数不正です。${2<=num ? '\n' : ''}`,
                        triple:`引数は次の3つ必要です:\n1. 期待する例外型\n2. 期待する例外メッセージ(String/RegExp)\n3. 例外発生する無名関数`,
                        first:`第一引数は期待する例外型でありErrorかそれを継承した型であるべきです。`,
                        second:`第二引数は期待する例外メッセージを示す文字列型Stringか正規表現RegExp型であるべきです。`,
                        third:`第三引数は例外を発生させる関数であるべきです。`,
                    },
                    runtime:{
                        fnReturn: 'テスト例外。テストコードは例外発生させてください。例外発生しない上にPromiseを返すのは間違いです。あるいはテストコードを非同期関数async()=>{await Promise; return Boolean;}の形にしてください。',
                        summary:(num)=>`テスト失敗: ${2<=num ? '\n' : ''}`,
                        type:(e,a)=>`型が違います。\n期待値: ${e}\n実際値: ${a}`,
                        msg:(e,a)=>`メッセージが違います。\n期待値: ${e}\n実際値: ${a}`,
                        noneException:`テスト失敗。例外発生すべき所で例外発生せず正常終了しました。`,
                    },
                },
                fin: {
                    exception: {
                        one: `非同期テストで例外発生しました。`,
                        all: `非同期テスト一括実行で例外発生しました。`,
                    },
                    result: {
                        sync: `同期テスト結果`,
                        async: `非同期テスト結果`,
                    },
                },
            },
            en: {
                normal: {
                    exception: {
                        return: 'Test exception. The argument should be a boolean value or a function that returns one.',
                        fnReturn: 'Test exception. Please return a boolean value at the end of your test code.',
                        throw:(e)=>`Test exception. An exception occurred where ${e} should be.`,
                    },
                    fail: {
                        value:(e,a)=>`Test failed. Where ${e} should be, it is ${a}.`,
                        exception:(e)=>`Test failed. An exception occurred where ${e} should be.`,
                    },
                },
                exception: {
                    augument:{
                        summary:(num)=>`Test exception. Invalid argument.${2<=num ? '\n' : ''}`,
                        triple:`The following three arguments are required:\n1. Expected exception type\n2. Expected exception message (String/RegExp)\n3. Anonymous function that raises the exception.`,
                        first:`The first argument is the expected exception type, which should be Error or a type that inherits from it.`,
                        second:`The second argument should be a string type String or regular expression RegExp type indicating the expected exception message.`,
                        third:`The third argument should be the function that raises the exception.`,
                    },
                    runtime:{
                        summary:(num)=>`Test failed: ${2<=num ? '\n' : ''}`,
                        type:(e,a)=>`Type is different.\nExpected: ${e}\nActual: ${a}`,
                        msg:(e,a)=>`Message is different.\nExpected: ${e}\nActual: ${a}`,
                        noneException:`Test failed. The program completed normally without generating an exception where it should have occurred.`,
                    },
                },
                fin: {
                    exception: {
                        one: `An exception occurred during an asynchronous test.`,
                        all: `An exception occurred during asynchronous test batch execution.`,
                    },
                    result: {
                        sync: `Synchronization test results`,
                        async: `Asynchronous test results`,
                    },
                },
            }
        }
        this._status = {
            ja: {
                pending:   {label: '保留', details: '非同期テストコード実行待ち'},
                exception: {label: '例外', details: 'テストコード実行時例外'},
                fail:      {label: '失敗', details: 'テストコード期待値不一致'},
                success:   {label: '成功', details: 'テストコード期待値一致'},
            },
            en: {
                pending:   {label: 'pending', details: 'Waiting for asynchronous test code execution'},
                exception: {label: 'exception', details: 'Exception when running test code'},
                fail:      {label: 'fail', details: 'Test code expectation value mismatch'},
                success:   {label: 'success', details: 'Test code expected value matching'},
            },
        }
        this.#initLang(lang)
        this._statusCss = {
            pending:   {color:{f:'#666666',b:'#CCCCCC'}, ...this._status[this._lang].pending},
            exception: {color:{f:'#0000AA',b:'#99CCFF'}, ...this._status[this._lang].exception},
            fail:      {color:{f:'#AA0000',b:'#FFABCE'}, ...this._status[this._lang].fail},
            success:   {color:{f:'#008800',b:'#AEFFBD'}, ...this._status[this._lang].success},
        }
    }
    get msg() { return this._message[(this._message.hasOwnProperty(this._lang) ? this._lang : 'ja')] }
    get cmn() { return this._common[(this._message.hasOwnProperty(this._lang) ? this._lang : 'ja')] }
    get stt() { return this._statusCss }
    #initLang(lang) {
        if (this.#hasDict(lang)) { this._lang = lang }
        else {
            const l = this.#getLang
            if (this.#hasDict(l)) { this._lang = l }
            else { this._lang = 'en' }
        }
    }
    get #validLang() { return this.has(this._lang) ? this._lang : 'en' }
    #hasDict(lang) { return ([...Object.keys(this._common)].includes(lang) && [...Object.keys(this._message)].includes(lang)) }
    get #getLang() { return (window.navigator.languages && window.navigator.languages[0]) ||
        window.navigator.language ||
        window.navigator.userLanguage ||
        window.navigator.browserLanguage;
    }
}
class AssertError extends Error {
    constructor(msg, status, cause) {
        super(msg, {cause,cause});
        this.name = 'AssertError';
        this.cause = cause;
        this.status = status;
    }
}
class TestError extends Error {
    constructor(msg, status, cause) {
        super(msg, {cause,cause});
        this.name = 'TestError';
        this.cause = cause;
        this.status = status;
    }
}
class BaseAssertion {
    constructor(M) { this._M = M; this._asyncs = []; }
    _console(status, msg, err, caller) { // status:pending/exception/fail/success、[s,m],[s,m,c],[s,m,e],[s,m,e,c]
        const stacks = (undefined===err || this.__isFn(err)) ? this._captureStacks(this._console) : this._getErrorStacks(err)
        if (['exception','fail'].some(s=>s===status)) {
            console.log(`%c${msg}\n${stacks.join('\n')}`, `background-color:${this._M.stt[status].color.b};color:${this._M.stt[status].color.f};`)
        } else {
            console.log(`${msg}\n${stacks.join('\n')}`)
        }
    }
    _captureStacks(caller) {
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, caller ?? this._captureStacks);
            const s = this.stack.split('\n')
            s.shift() // 先頭にある Error 削除
            return this.__delStacks(s)
        } else { return [] } 
    }
    _getErrorStacks(err) {
        const errs = this._recursionCause([err])
        return errs.map(e=>this.__delStacks(e.stack)).flat()
    }
    _recursionCause(errs) {
        const last = errs[errs.length-1]
        if (last.hasOwnProperty('cause') && last.cause) {
            errs.push(last.cause)
            return this._recursionCause(errs)
        } else { return errs }
    }
    __isBool(v) { return 'boolean'===typeof v }
    __isFn(v) { return 'function'===typeof v }
    __isStr(v) { return 'string'===typeof v || v instanceof String }
    __isAsyncFunction(v) { return v instanceof (async()=>{}).constructor }
    __isNullOrUndefined(v) {
        if (v === null) return true;
        if(v === undefined) return true;
        return false;
    }
    __isGenealogy(a, e) { // aがeの系譜（同一または子孫クラス）であれば真を返す
        if (a instanceof e || a.constructor.name === e.constructor.name) { return true }
        if (a.prototype) { return this.__isGenealogy(a.prototype, e) }
        return false
    }
    __getCaller(removeTxt) {
        const error = new Error();
        const stack = error.stack || '';
        const stacks = stack.split('\n');
        const callerIndex = stacks.findIndex(line => line.includes('__getCaller'));
        if (!removeTxt) {removeTxt='assertion.js:'} // このファイル名が含まれるスタックトレースは削除する
        return (stacks[callerIndex]) ? this.__delStacks(stacks.slice(callerIndex)).join('\n') : 'Unknown'
    }
    __delStacks(stacks) {
        const s = Array.isArray(stacks) ? stacks : (this.__isStr(stacks) ? stacks.split('\n') : null)
        if (null===s) { throw new AssertError(`内部エラー。__delStacksの引数は文字列かその配列であるべきです。`, 'exception') }
        return s.filter(line=>-1===line.indexOf('assertion.js:'))
    }
}
class BoolAssertion extends BaseAssertion {
    constructor(M,C,isFalseSuccess) {
        super(M)
        this._caller = this.assert
        this._count = C
        this._isFalseSuccess = isFalseSuccess
        this._asyncs = []
    }
    get count() { return this._count }
    assert(fn) {
        if (this.__isAsyncFunction(fn)) { this._count.pending++; this._asyncs.push([fn, this.__getCaller()]); }
        else if (this.__isFn(fn)) { this._nFn(fn) }
        else if (this.__isBool(fn)) { this._nB(fn) }
        else { this._count.exception++; this._console('fail', this._M.msg.normal.exception.return, this._caller) } // テスト例外。引数は真偽値かそれを返す関数であるべきです。
    }
    _getAsyncPromises() {
        const promises = []
        for (let i=0; i<this._asyncs.length; i++) {
            promises.push(new Promise((resolve,reject)=>{
                const fn = this._asyncs[i][0]
                const stack = this._asyncs[i][1]
                fn().then((bool)=>{
                    this.__nCheckAsync(resolve, reject, stack, bool)
                }).catch(err=>{
                    this._count.exception++; 
                    reject(new AssertError(
                        this._M.msg.normal.exception.throw(this._M.cmn.return[this._isFalseSuccess ? 'false' : 'true'])
                        + '\n' + stack
                        , 'exception'
                    ))
                })
            }))
        }
        return promises
    }
    _nFn(fn) {
        try {
            const bool = fn()
            this.__nCheck(bool)
        } catch(err) {
            this.__exceptMsg(err)
        }
    }
    _nB(fn) {
        if (this._isFalseSuccess ? fn : !fn) {
            this._count.fail++
            this._console('fail', this.__failMsg(), this._caller)
        }
        else { this._count.success++ }
    }
    __nCheckAsync(resolve, reject, stack, bool) {
        if (!this.__isBool(bool)) {
            this._count.exception++
            reject(new AssertError(this._M.msg.normal.exception.fnReturn + '\n' + stack, 'exception'))
        }
        else if (this._isFalseSuccess ? bool : !bool) {
            this._count.fail++
            reject(new AssertError(this.__failMsg() + '\n' + stack, 'fail'))
        }
        else {
            this._count.success++
            resolve(this._isFalseSuccess===bool) // テスト成功：真、失敗：偽
        }
    }
    __nCheck(bool) {
        // テスト例外。テストコードは最後に真偽値を返してください。
        if (!this.__isBool(bool)) {
            this._count.exception++
            return this._console('fail', this._M.msg.normal.exception.fnReturn, this._caller)
        }
        // テスト失敗：Eであるべき所がAです。
        else if (this._isFalseSuccess ? bool : !bool) {
            this._count.fail++
            return this._console('fail', this.__failMsg(), this._caller)
        }
        // テスト成功
        else {
            this._count.success++
            return true
        }
    }
    __failMsg() {
        const ea = [...Object.values(this._M.cmn.return)]
        if (this._isFalseSuccess) { ea.reverse() }
        return this._M.msg.normal.fail.value(...ea) // テスト失敗。${j[0]}であるべき所が${j[1]}です。
    }
    __exceptMsg(err) { // テスト例外。Bであるべき所で例外発生しました。
        this._count.exception++
        this._console('exception', this._M.msg.normal.exception.throw(this._M.cmn.return[this._isFalseSuccess ? 'false' : 'true']), err, this._caller)
    }
}
class TrueAssertion extends BoolAssertion {
    constructor(M,C){super(M,C,false)}
}
class FalseAssertion extends BoolAssertion {
    constructor(M,C){super(M,C,true)}
}
class ExceptionAssertion extends BaseAssertion {
    constructor(M,C) { super(M); this._count=C; }
    assert(type, msg, fn) {
        if (this._ePrmErr(type, msg, fn)) return
        return this._error(type, msg, fn)
    }
    get count() { return this._count }
    _ePrmErr(type, msg, fn) {
        let eMsgs = []
        // `引数は次の3つ必要です:\n1. 期待する例外型\n2. 期待する例外メッセージ(String/RegExp)\n3. 例外発生する無名関数`
        if ([type,msg,fn].some(v=>this.__isNullOrUndefined(v))) { eMsgs.push(this._M.msg.exception.augument.triple) }
        // `第一引数は期待する例外型でありErrorかそれを継承した型であるべきです。`
        if (!this.__isGenealogy(type, Error)) { eMsgs.push(this._M.msg.exception.augument.first) }
        // `第二引数は期待する例外メッセージを示す文字列型Stringか正規表現RegExp型であるべきです。`
        if (!this.__isStr(msg)) { eMsgs.push(this._M.msg.exception.augument.second) }
        // `第三引数は例外を発生させる関数であるべきです。`
        if (!(this.__isAsyncFunction(fn)) && 'function'!==typeof fn) {eMsgs.push(this._M.msg.exception.augument.third)}
        if (0<eMsgs.length) {
            this._console('fail', this._M.msg.exception.augument.summary(eMsgs.length) + eMsgs.join('\n'), this.e)
            return true
        }
    }
    _error(type, msg, fn) {
        if (this.__isAsyncFunction(fn)) { this._count.pending++; this._asyncs.push([type, msg, fn, this.__getCaller()]); }
        else if (this.__isFn(fn)) { this._eFn(type, msg, fn) }
    }
    _getAsyncPromises() {
        const promises = []
        for (let i=0; i<this._asyncs.length; i++) {
            promises.push(new Promise((resolve,reject)=>{
                const [type, msg, fn, stack] = this._asyncs[i]
                fn().then((bool)=>{
                    this._count.fail++; 
                    reject(new AssertError(this.__errorMsg()+'\n'+stack, 'fail'))
                }).catch(err=>{
                    const eMsgs = this.__eCheckMsgs(type, msg, err)
                    if (0===eMsgs.length) { this._count.success++; resolve(true) }
                    else {
                        this._count.fail++
                        reject(new AssertError(`${this._M.msg.exception.runtime.summary(eMsgs.length)}` + eMsgs.join('\n')+stack,'fail'))
                    }
                })
            }))
        }
        return promises
    }
    _eAsync(type, msg, fn) {
        fn().then((bool)=>{
            this._console('fail', this.__errorMsg(), this.e)
        }).catch(err=>{
            this.__eCheck(type, msg, err)
        })
    }
    _eFn(type, msg, fn) {
        try {
            const bool = fn()
            if (bool instanceof Promise) {
                this._count.exception++
                this._console('exception', this._M.msg.exception.runtime.fnReturn, this.e);}
            else {
                this._count.fail++
                this._console('fail', this.__errorMsg(), this.e)
            }
            return false
        } catch(err) {
            const eMsgs = this.__eCheckMsgs(type, msg, err)
            if (0===eMsgs.length) { this._count.success++; return true; }
            else {
                this._count.fail++;
                this._console('fail', `${this._M.msg.exception.runtime.summary(eMsgs.length)}`+eMsgs.join('\n'), err, this.e)
            }
        }
    }
    __eCheck(type, msg, err, stack) {
        const eMsgs = [this.__eCheckTypeMsg(type, err), this.__eCheckMsgMsg(msg, err)].filter(v=>v)
        if (0<eMsgs.length) { // テスト失敗: ...
            this._console('exception', `${this._M.msg.exception.runtime.summary(eMsgs.length)}${eMsgs.join('\n')}\n${stack}`, err, this.e)
            this._count.fail++
            return false
        } else { this._count.success++; return true; }

    }
    __eCheckMsgs(type, msg, err) { return [this.__eCheckTypeMsg(type, err), this.__eCheckMsgMsg(msg, err)].filter(v=>v) }
    __eCheckTypeMsg(type, err) {
//        if (err instanceof type) { return '' }
        if (err.constructor.name === type.name) { return '' }
        // `型が違います。\n期待値: ${type.name}\n実際値: ${err.constructor.name}`
        return this._M.msg.exception.runtime.type(type.name, err.constructor.name)
    }
    __eCheckMsgMsg(msg, err) {
        if (msg instanceof RegExp) {
            if (msg.test(msg)) { return '' }
            // `メッセージが違います。\n期待値: ${msg}\n実際値: ${err.message}`
            return this._M.msg.exception.runtime.msg(msg, err.message)
        }
        if ('string'===typeof msg || msg instanceof String) {
            if (msg===err.message) { return '' }
            // `メッセージが違います。\n期待値: ${msg}\n実際値: ${err.message}`
            return this._M.msg.exception.runtime.msg(msg, err.message)
        }
    }
    // テスト失敗。例外発生すべき所で例外発生せず正常終了しました。
    __errorMsg() { return this._M.msg.exception.runtime.noneException }
}
class Assertion {
    constructor(lang) {
        this._count = {pending:0, exception:0, fail:0, success:0}
        this._M = new Message(lang)
        this._t = new TrueAssertion(this._M, this._count)
        this._f = new FalseAssertion(this._M, this._count)
        this._e = new ExceptionAssertion(this._M, this._count)
        this._T = new AssertResultTable(this._M, this._count)
        this._T.addDom()
    }
    t(fn) { this._t.assert(fn) }
    f(fn) { this._f.assert(fn) }
    e(type, msg, fn) { this._e.assert(type, msg, fn) }
    get count() { return this._count }
    fin(onFinishedAsync, onFinishedSync) {
        this._runOnFinished(onFinishedSync, this._M.msg.fin.result.sync) // 同期テスト結果
        if (0 < this.count.pending) { // 非同期テスト実行＆完了後実行
            Promise.allSettled([
                ...this._t._getAsyncPromises(),
                ...this._f._getAsyncPromises(),
                ...this._e._getAsyncPromises(),],
            ).then((results)=>{
                for (let res of results) { // res.[status,value,reason]
                    if ('fulfilled'===res.status) { }
                    if ('rejected'===res.status) {
                        //this._t._consoleException(`非同期テストで例外発生しました。`, res.reason, this.fin)
                        this._t._console(res.reason.status, this._M.msg.fin.exception.one, res.reason, this.fin)
                    }
                }
                this._count.pending -= results.length
            })
            // 非同期テスト一括実行で例外発生しました。
            .catch(err=>this._t._console('exception', this._M.msg.fin.exception.all, err, this.fin))
            .finally(()=>{
                this._runOnFinished(onFinishedAsync, this._M.msg.fin.result.async)
                this._T.update()
            })
        }
        this._T.update()
    }
    _runOnFinished(onFinished, msg) {
        const fn = 'function'===typeof onFinished ? onFinished : (count)=>console.log(msg, count)
        fn(this.count)
    }
}
class AssertResultTable {
    constructor(M,C) {
        this._M = M
        this._C = C
        this._id = 'assert-result-table'
    }
    addDom() {
        if (document.querySelector(`#${this._id}`)) { return }
        document.body.append(this._makeTable(), this._makeDetails())
        this._addCss()
        this.update()
    }
    update() {
        if (!document.querySelector(`#${this._id}`)) { this.addDom() }
        [...Object.entries(this._C)].forEach(([k,v])=>{
            const tr = document.querySelector(`#${k}-tr`)
            tr.style.display = (0===v) ? 'none' : 'table-row'
            document.querySelector(`#${k}-count`).textContent=v
        })
        this._updateDetails()
    }
    _updateDetails() {
        const details = document.querySelector(`#${this._id}-details`)
        if ([...Object.values(this._C)].every(v=>0===v)) { details.innerHTML = this._M.cmn.result.details.zero; return; }
        details.textContent = (0<[...Object.entries(this._C)].filter(([k,v])=>'success'!==k&&0<v).length) ? this._M.cmn.result.details.notSuccess : ''
    }
    _makeTable() {
        const table = document.createElement('table')
        table.id = this._id
        table.append(...[...Object.entries(this._C)].map(([k,v])=>this._makeTr(k,v)))
        return table
    }
    _makeTr(k,v) {
        const tr = document.createElement('tr')
        const th = document.createElement('th')
        const td = document.createElement('td')
        tr.id = `${k}-tr`
        th.textContent = this._M.cmn.result[k]
        td.textContent = v
        td.id = `${k}-count`
        tr.append(th, td)
        return tr
    }
    _addCss() {
        const id = this._id + '-css'
        if (document.querySelector(`#${id}`)) { return }
        const style = document.createElement('style')
        style.id = id
        style.textContent = `
#${this._id} { border-collapse: collapse; }
#${this._id} #pending-tr { background-color:#CCCCCC; }
#${this._id} #exception-tr { background-color:#99CCFF; }
#${this._id} #fail-tr { background-color:#FFABCE; }
#${this._id} #success-tr { background-color:#AEFFBD; }
#${this._id} td:nth-child(2) { text-align: right; }
#${this._id} #pending-tr th { color:#666666; }
#${this._id} #exception-tr th { color:#0000AA; }
#${this._id} #fail-tr th { color:#AA0000; }
#${this._id} #success-tr th { color:#008800; }
#${this._id} td, #${this._id} th { padding: 0.5em;}
`
        document.body.appendChild(style)
    }
    _makeDetails() {
        const p = document.createElement('p')
        p.id = this._id + '-details'
        p.textContent = this._M.cmn.result.details.zero
        return p
    }
}
window.Assertion = Assertion
})()
