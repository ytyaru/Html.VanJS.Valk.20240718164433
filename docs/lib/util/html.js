(function() {
class Html {
    constructor() {
        this.parser = new DOMParser()
        this.serializer = new XMLSerializer()
    }
    // get
    get Url() { return location.href }
    get Doc() { return document.documentElement }
    get Root() { return document.querySelector(':root') }
    get Body() { return document.body }
    get Main() { return document.querySelector('main:not([hidden])') }
    get Header() { return document.querySelector('header') }
    get Footer() { return document.querySelector('footer') }
    next(el) { return el.nextElementSibling }
    prev(el) { return el.previousElementSibling }
    parent(el) { return el.parentElement; }
    children(el) { return el.children }
    child(el,i=0) {
        if (0 < el.children.length) {
            if(Type.isPosInt(i)) { return el.children[i] }
            else if(Type.isNegInt(i)) { return el.children[el.children.length-i] }
        }
        return null
    }
    broser(el, i=1) {
        if (0===i) { return el }
        const prop = (0<i) ? 'nextElementSibling' : 'previousElementSibling'
        for (let c=0; c<Math.abs(i); c++) { el = el[prop]; if (null===el) { return el } }
        return el
    }
    older(el, i=1) { return this.broser(el, (i<0) ? i : i*-1) }
    yanger(el, i=1) {return this.broser(el, (i<0) ? i*-1 : i) }
    get(query) { return document.querySelector(query) }
    gets(query) { return [...document.querySelectorAll(query)] }
    // insert
    prepend(addEl, el) { el.parentElement.insertBefore(addEl, el) }
    append(addEl, el) { el.parentElement.insertBefore(addEl, el.nextElementSibling) }
    insert(addEl, el, i) { el.parentElement.insertBefore(addEl, this.broser(el, i)) }
    insertChild(addEl, el, i) { el.insertBefore(addEl, (0<=i) ? el.children[i] : el.children[el.children.length+i]) }
    // create
    create(tagName, attrs, text) {
        const el = document.createElement(tagName)
        if (attrs) { for (let key of Object.keys(attrs)) { el[key] = attrs[key] } }
        if (text) {  el.textContent = text }
        return el
    }
    generate(tagName, attrs, text) { return this.toString(this.create(tagName, attrs, text)) }
    toString(el) { return this.serializer.serializeToString(el).replace(/ xmlns="[^"]+"/, '') }
    toDom(str) { return this.parser.parseFromString(str, 'text/html') }
    toHtml(str) { return this.toDom(str).children[0] }
    toElements(str) { return [...this.toHtml(str).querySelector('body').children] }
    toElement(str) { return this.toElements(str)[0] }
    // attr
    attr(el, key, value) { return (value) ? el.setAttribute(key, value) : el.getAttribute(key) }
    attrInt(el, key, value) { return parseInt(this.attr(el, key, value)) }
    attrFloat(el, key, value) { return parseFloat(this.attr(el, key, value)) }
    attrs(el) {
        const attrs = {}
        for (let key of el.getAttributeNames()) { attrs[key] = el.getAttribute(key) }
        return attrs
    }
}
window.Html = new Html()
})()
