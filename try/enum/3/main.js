window.addEventListener('DOMContentLoaded', (event) => {
    const a = new Assertion()
    const bb = new BlackBox(a)
    console.log(CompletedTypes)
    console.log(CompletedTypes.Error)
//    console.log((new CompletedType('Error')).isError)
    a.t(CompletedTypes.Error instanceof CompletedType)
    a.fin()
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

