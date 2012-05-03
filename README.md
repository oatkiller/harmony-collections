# Harmony Collections Shim

Provides Map, Set, and WeakMap with the same usage as the new ES6 native versions. Values in Harmony Collections are not contained in the collection instance itself, like array items and object properties, but in a private store. It's not possible to get access to or inspect the store directly.

For WeakMaps this means there's no way to find what's inside it or how many items are contained, and the only way to get a reference to a value is if you have a direct reference to the key object that links to it.

WeakMap garbage collection functionality isn't quite to spec. Keys hold references to their values strongly which has the potential cause certain types of usage to disallow garbage collection of values in the group. However, even this is still better than any other gc scheme that can be implemented in JS.


# Collections Usage

Maps, WeakMaps, Hashes, and Sets can each be created using their constructor with or without `new`. Examples:

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

__All non-primitives__ are valid keys, including WeakMaps themselves.


# Map

Maps are much the same as WeakMaps but they can be iterated and thus their contents can be inspected. Many use cases have no requirement for anonymity or special garbage collection, but can benefit from using objects as keys and also not having the storage contained in the Map itself.

* __set__ `map.set(key, value)`. Key is any value including objects. Primitives are valid keys but uniqueness is matched by their value since primitives don't have identity. Objects are matched by identity. Returns the value passed in.
* __get__ `map.get(key)`. Returns the value that key corresponds to or undefined.
* __has__ `map.has(key)`. Returns boolean.
* __delete__ `map.delete(key)`. Removes value from the Map if found. Returns true.
* __keys__ `map.keys()`. Returns array of contained keys.
* __values__ `map.values()`. Return array of contained values.
* __iterate__ `map.iterate(callback, context)`. Loop through the Map executing callback with the signature `callback.call(context || global, value, key)`.
* __toArray__ `map.toArray()`. Return array of Pair objects of the form `{ key: KEY, value: VALUE }`.

__All possible values__ are valid keys, including undefined, null, and NaN.


# Hash

As an added bonus, Hash is also exported. This has the same API as a Map except it only accepts primitive keys.

* __set__ `hash.set(key, value)`. Key is any value including objects. Primitives are valid keys but uniqueness is matched by their value since primitives don't have identity. Objects are matched by identity. Returns the value passed in.
* __get__ `hash.get(key)`. Returns the value that key corresponds to or undefined.
* __has__ `hash.has(key)`. Returns boolean.
* __delete__ `hash.delete(key)`. Removes value from the Map if found. Returns true.
* __keys__ `hash.keys()`. Returns array of contained keys.
* __values__ `hash.values()`. Return array of contained values.
* __iterate__ `hash.iterate(callback, context)`. Loop through the Map executing callback with the signature `callback.call(context || global, value, key)`.
* __toArray__ `hash.values()`. Return array of Pair objects of the form `{ key: KEY, value: VALUE }`.
* __toObject__ `hash.toArray()`. Returns a plain object with the keys and values.

__Primitives__ are valid keys, specifically numbers and strings. All input values are coerced to strings so you can give it any value, but they will be converted to string keys.


# Set

Sets are similar to arrays but enforce uniqueness of values. Adding the same value twice will only result in one being added to the set.

* __add__ `set.add(value)`. Inserts a value of any type into the set if it's not already in the set.
* __has__ `set.has(value)`. Returns boolean.
* __delete__ `set.delete(value)`. Removes value from the Set if found. Returns true.
* __values__ `set.values()`. Return array of contained values.
* __iterate__ `set.iterate(callback, context)`. Loop through the Set executing callback with the signature `callback.call(context || global, value, index)`.