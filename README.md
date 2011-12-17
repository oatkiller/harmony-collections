# Harmony Collections Shim

Provides Map, Set, and WeakMap with the same usage as the new ES6 native versions. Values in Harmony Collections are not contained in the collection instance itself, like array items and object properties, but in a private store. It's not possible to get access to or inspect the store directly.

For WeakMaps this means there's no way to find what's inside it or how many items are contained, and the only way to get a reference to a value is if you have a direct reference to the key object that links to it.

WeakMap won't give the same garbage collector magic as the native one but it can be used with the same code.


# Shim Usage

The function `attachIfMissing` is exported along with Map, WeakMap, and Set which will inspect the global object for the existence of Map, WeakMap, and Set in turn and add ones that are missing. Each one is checked separately because WeakMap's existence predates the other two so there's no guarantee which may already exist. If the global object is the window then `attach` is automatically executed.


# Collections Usage

Maps, WeakMaps, and Sets can each be created using their constructor with or without `new`. Examples:

    var aWeakMap = new WeakMap;
    var aMap = Map();
    var aSet = new Set();

Items in a collection do not appear in any manner through traditional inspection. The only way to interact with the data contained in a collection is by using the functions below.

    var aWeakMap = new WeakMap;
    aWeakMap.set(this, { secrets: 'Dark Secrets' });
    console.log(Object.getOwnPropertyNames(aWeakMap)); // []
    for (var k in aWeakMap) { console.log(k); }         // nothing
    console.log(aWeakMap.get(this));                    // { secrets: 'Dark Secrets' }


# WeakMap

WeakMaps require the use of objects as keys; primitives are not valid keys. Keys are per WeakMap are unique and setting the same key will overwrite the old value. WeakMaps provide for no method of iteration or listing the keys or values contained inside. Because WeakMaps expose no method of listing keys or values, and keys are required to be full-fledged objects with unique identities, the only way to extract a value from it is by having a direct reference to the object used as the key.

* __set__ `weakmap.set(key, value)`. Key is any value including objects. Only non-primitives can be used as keys.
* __get__ `weakmap.get(key)`. Returns the value that key corresponds to the key or undefined.
* __has__ `weakmap.has(key)`. Returns boolean.
* __delete__ `weakmap.delete(key)`. Removes value from the WeakMap if found. Returns true.

WeakMaps allow for some interesting use cases like anonymous communication channels where neither side can identify the other, and no one else can eavesdrop. By using using a target object as its own key to retrieve a hidden seceret value no information about the origin can be obtained.

*All non-primitives* are valid keys, including WeakMaps themselves.


# Map

Maps are much the same as WeakMaps but they can be iterated and thus their contents can be inspected. Many use cases have no requirement for anonymity or special garbage collection, but can benefit from using objects as keys and also not having the storage contained in the Map itself.

* __set__ `map.set(key, value)`. Key is any value including objects. Primitives are valid keys but uniqueness is matched by their value since primitives don't have identity. Objects are matched by identity. Returns the value passed in.
* __get__ `map.get(key)`. Returns the value that key corresponds to or undefined.
* __has__ `map.has(key)`. Returns boolean.
* __delete__ `map.delete(key)`. Removes value from the Map if found. Returns true.
* __keys__ `map.keys()`. Returns array of contained keys.
* __values__ `map.values()`. Return array of contained values.
* __iterate__ `map.iterate(callback, context)`. Loop through the Map executing callback with the signature `callback.call(context || null, key, value, index)`.

*All possible values* are valid keys, including undefined, null, and NaN.


# Set

Sets are similar to arrays but enforce uniqueness of values. Adding the same value twice will only result in one being added to the set.

* __add__ `set.add(value)`. Inserts a value of any type into the set if it's not already in the set.
* __has__ `set.has(value)`. Returns boolean.
* __delete__ `set.delete(value)`. Removes value from the Set if found. Returns true.
* __values__ `set.values()`. Return array of contained values.
* __iterate__ `set.iterate(callback, context)`. Loop through the Set executing callback with the signature `callback.call(context || null, value, index)`.


# TODO

* Check up on iteration semantics for ES6 as they stand now.