# Harmony Collections Shim

Provides Map, Set, and WeakMap with the same usage as the new ES6 native versions. Values in Harmony Collections are not contained in the collection instance itself, like array items and object properties, but in a private store. It's not possible to get access to or inspect the store directly.

For WeakMaps this means there's no way to find what's inside it or how many items are contained, and the only way to get a reference to a value is if you have a direct reference to the key object that links to it.

WeakMap won't give the same garbage collector magic as the native one but it can be used with the same code.


# Usage

Maps, WeakMaps, and Sets can each be created using their constructor with or without `new`. Examples:

    var aWeakmap = new WeakMap;
    var aMap = Map();
    var aSet = new Set();

Items in a collection do not appear in any manner through traditional inspection. The only way to interact with the data contained in a collection is by using the functions below.


# WeakMap

WeakMaps allow you to match any key to a value. The keys can be objects themselves. Keys are unique and setting the same key multiple times will overwrite the value. There is no way to know all the items in a WeakMap by introspecting it. There's no way to iterate through it's values or know how many there are. The only way to retieve a value is to have the exact object used for the key.

* __set__ `weakmap.set(key, value)`. Key is any value including objects. Only non-primitives can be used as keys.
* __get__ `weakmap.get(key)`. Returns the value that key corresponds to the key or undefined.
* __has__ `weakmap.has(key)`. Returns boolean.
* __delete__ `weakmap.delete(key)`. Removes value from the WeakMap if found. Returns true.



# Map

Maps are much the same as WeakMaps but they can be iterated and thus their contents can be inspected.

* __set__ `map.set(key, value)`. Key is any value including objects. Primitives are valid keys but uniqueness is matched by their value since primitives don't have identity. Objects are matched by identity. Returns the value passed in.
* __get__ `map.get(key)`. Returns the value that key corresponds to or undefined.
* __has__ `map.has(key)`. Returns boolean.
* __delete__ `map.delete(key)`. Removes value from the Map if found. Returns true.
* __keys__ `map.keys()`. Returns array of contained keys.
* __values__ `map.values()`. Return array of contained values.
* __iterate__ `map.iterate(callback, context)`. Loop through the Map executing callback with the signature `callback.call(context || null, key, value, index)`.


# Set

Sets are similar to arrays but enforce uniqueness of values. Adding the same value twice will only result in one being added to the set.

* __add__ `set.add(value)`. Inserts a value of any type into the set if it's not already in the set.
* __has__ `set.has(value)`. Returns boolean.
* __delete__ `set.delete(value)`. Removes value from the Set if found. Returns true.
* __values__ `set.values()`. Return array of contained values.
* __iterate__ `set.iterate(callback, context)`. Loop through the Set executing callback with the signature `callback.call(context || null, value, index)`.


# Todo

* Check up on iteration semantics for ES6 as they stand now.