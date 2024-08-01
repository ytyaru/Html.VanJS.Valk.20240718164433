window.addEventListener('DOMContentLoaded', (event) => {
    const a = new Assertion()
    const bb = new BlackBox(a)
    console.log(Enum.types)
    console.log(Enum.types.Completed)
    console.log(Enum.types.Completed.Error)
    console.log(Enum.types.Completed.has(Enum.types.Completed.Error))
    a.t(Enum.types.Completed.isTypeOf(Enum.types.Completed.Error)) // val instanceof Type の代わりに Enum.types.Some.isTypeOf(v)
    a.t(Enum.types.Completed.has(Enum.types.Completed.Error))
//    a.t(Enum.types.Completed.Error instanceof Enum.type.Completed) // こうしたいが不可能（Proxyはinstanceof不能
    a.t(Enum.types.Completed.Error===Enum.types.Completed.Error)
//    a.f(new Enum.types.Completed('Error')===Enum.types.Completed.Error) // 
    a.t(new Enum.types.Completed.type('Error')!==Enum.types.Completed.Error) // 
    a.t(new Enum.types.Completed.type('Error')!=Enum.types.Completed.Error) // 
    console.log(Enum.types.Completed.Error)
    console.log(new Enum.types.Completed.type('Error')) // Enum.types.Completed.Errorと同値だが別のインスタンスであるため不一致
    

    a.t('Proxy(valk.enum(Completed))'===Enum.types.Completed.typeName)
//    console.log(Enum.type.Completed)
//    console.log((new CompletedType('Error')).isError)
//    a.t(Enum.types.Completed.Error instanceof Enum.type.Completed)
//    a.t(Enum.Completed.Error instanceof Enum.type.Completed)
//    a.t(Completed.Error instanceof Enum.type.Completed)
//    a.t(valk.enum.CountCompleted.Error instanceof valk.enum.type.CountCompleted)
//    a.t(valk.enum.CountCompleted.Error instanceof valk.enum.CountCompleted) // こうしたいが不可能（Proxyはinstanceof不能）
    a.fin()
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

