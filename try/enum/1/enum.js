class CompletedTypeValue { constructor(v) { this._v = v } }
class CompletedType {
    static IDS = 'Error,Keep,Clear,Over'.split(',')
    static ITEMS = CompletedType.IDS.map(id=>new CompletedTypeValue(id))
}
for (let i=0; i<CompletedType.IDS.length; i++) {
    Object.defineProperty(CompletedType, CompletedType.IDS[i], { get () { return CompletedType.ITEMS[i] } })
}
Object.freeze(CompletedType)
