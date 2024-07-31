window.addEventListener('DOMContentLoaded', (event) => {
    const a = new Assertion()
    const bb = new BlackBox(a)
    console.log(CompletedType)
    console.log(CompletedType.Error)
//    console.log((new CompletedType('Error')).isError)
    a.t(CompletedType.Error instanceof CompletedTypeValue)
    a.fin()
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

