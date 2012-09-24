# Harmony Collections Shim

Use the new __Map__, __Set__, and __WeakMap__ from the upcoming ES6 standard right now! This shim provides full functionality for these collections and delivers the benefits of using them.

## Compatability

Works with IE9+, Chrome, Firefox, Safari, untested in Opera. __IE8 support has been recently added but is experimental.__

## Install/Use

If using node, install via:

    npm install harmony-collections

In the browser, include __harmony-collection.js__ or __harmony-collections.min.js__ and Map, WeakMap, Set, and HashMap will be exposed on the window. (you can also define `window.exports` which will cause them to end up there).

## Overview

ES6 Collections provide a new core weapon to your JS arsenal: objects as keys. This allows you to do the following awesome things: store private data "on" public objects, private properties, secretly "tag" objects, namespace properties, access controlled properties, check object uniqueness in `O(1)` time complexity.

### WeakMap Garbage Collection Semantics

The benefit of using WeakMaps is enhanced garbage collection. In a WeakMap, the only reference created is key -> value, so it's possible for a key/value in a WeakMap to be garbage collected while the WeakMap they're in still exists! Compare this to an Array, where all items in the Array will not be garbage collected as long as the Array isn't. This forces either explicitly management of the object lifespans, or more commonly is simply a memory leak.

For example, data stored using jQuery.data can never be garbage collected unless explicitly nulled out, because it is stored in a container that strongly references it. Using a WeakMap, it's possible to associate data with an element and have the data destroyed when the element is without memory leaking the element, i.e. `weakmap.set(element, { myData: 'gc safe!' })`. jQuery.data (every library has similar functionality) prevent the element from memory leaking by using a numeric id, but this does nothing for the __data__ that is stored.

## Detailed Examples

### Map/WeakMap
Retire jQuery.data and similar, consider it replaced with prejudice.

```javascript
// reusable storage creator for making as many separate stores as needed
function createStorage(){
  var store = new WeakMap;
  return function(o){
    var v = store.get(o);
    if (!v) store.set(o, v = {});
    return v;
  };
}

// now we can create private/namespaced properties associated with objects
var _ = createStorage();

functioon Wrapper(element){
  var _element = _(element);
  if (_element.wrapper)
    return _element.wrapper;

  _element.wrapper = this;
  _(this).element = element;
}

Wrapper.prototype = {
  get classes(){
    return [].slice.call(_(this).element);
  },
  set classes(v){
    _(this).element.className = [].concat(v).join(' ');
  }
};
```

### Set
A Set is similar to an Array in what it stores, but different in how. A Set is unordered and its values are unique. Determining whether an item is in a Set is `O(1)` but `O(n)` for an Array. An example of where this is useful is in implementing `Array.prototype.unique`.

Both of the following will output the same result, however the Set version is `O(n)` and the one using indexOf is `O(n^2)`. For an array taking 30 seconds using the set, an __*hour*__ is required for indexOf.

```javascript
function uniqueUsingIndexOf(array){
  return array.filter(function(item, index){
    return array.lastIndexOf(item) > index;
  });
}

function uniqueUsingSet(array){
  var seen = new Set;
  return array.filter(function(item){
    if (!seen.has(item)) {
      seen.add(item);
      return true;
    }
  });
}
```


## API Reference

### WeakMap

__Non-primitives__ are valid keys. Objects, functions, DOM nodes, etc.

WeakMaps require the use of objects as keys; primitives are not valid keys. WeakMaps have no way to enumerate their keys or values. Because of this, the only way to retrieve a value from a WeakMap is to have access to both the WeakMap itself as well as the object used as the key.

* `WeakMap#set(key, value)` Key is any value including objects. Only non-primitives can be used as keys. Returns undefined.
* `WeakMap#get(key)` Returns the value that key corresponds to the key or undefined.
* `WeakMap#has(key)` Returns boolean.
* `WeakMap#delete(key)` Removes value from the collection if found. Returns true.


### HashMap

__Primitives__ are valid keys. Exact value is used, so `500` is different from `"500"`, `-0` is different from `0`, ``"false"` isn't `false`, etc. NaN does equal itself when used as a key (as opposed to everywhere else in JS).

Though not part of ES6, HashMap is also exported. This has the same API as a Map except it only accepts primitive keys. This is needed to implement Map so as a bonus it's exported as well.

* `HashMap#set(key, value)` Key must be primitive. Returns undefined.
* `HashMap#get(key)` Returns the value that key corresponds to or undefined.
* `HashMap#has(key)` Returns boolean.
* `HashMap#delete(key)` Removes value from the collection if found. Returns true.
* `HashMap#forEach(callback, context)` Loop through the collection raising callback for each.
* `HashMap#map(callback, context)` Loop through the collection adding the return value for each to an array and returns it.


### Map

__All possible values__ are valid keys, including -0, undefined, null, and NaN. Uses a HashMap and WeakMap together to cover primitives and non-primitives.

Maps are much the same as WeakMaps but they can be iterated and thus their contents can be inspected. Many use cases have no requirement for anonymity or special garbage collection, but can benefit from using objects as keys and also not having the storage contained in the Map itself.

* `Map#set(key, value)` Key is any value including objects. Returns undefined.
* `Map#get(key)` Returns the value that key corresponds to or undefined.
* `Map#has(key)` Returns boolean.
* `Map#delete(key)` Removes value from the collection if found. Returns true.
* `Map#forEach(callback, context)` Loop through the collection raising callback for each.
* `Map#map(callback, context)` Loop through the collection adding the return value for each to an array and returns it.


### Set

Sets are similar to arrays but enforce uniqueness of values and are unordered. Adding the same value twice will only result in one being added to the set.

* `Set#add(value)` Inserts a value of any type into the set if it's not already in the set.
* `Set#has(value)` Returns boolean.
* `Set#delete(value)` Removes value from the collection if found. Returns true.
* `Set#forEach(callback, context)` Loop through the collection raising callback for each.
* `Set#map(callback, context)` Loop through the collection adding the return value for each to an array and returns it.



## License

(The MIT License)
Copyright (c) 2012 Brandon Benvie <http://bbenvie.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
(the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included with all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH
THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
