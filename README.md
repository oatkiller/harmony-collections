# Harmony Collections Shim

Provides Map, Set, and WeakMap with the same usage as the new ES6 native versions. Values in Harmony
Collections are not contained in the collection instance itself, like array items and object properties,
but in a private store. It's not possible to get access to or inspect the store directly.

For WeakMaps this means there's no way to find what's inside it or how many items are contained, and the
only way to get a reference to a value is if you have a direct reference to the key object that links to it.

WeakMap won't give the same garbage collector magic as the native one but it can be used with the same code.

# Map and WeakMap

Maps and WeakMaps allow you to match any key to a value. The keys can be Objects themselves.
Keys are unique and settings the same key multiple times will overwrite the value.

* __set__ `map.set(key, value)`. Key is any value including objects. Primitives like strings can only be matched by their content. Objects are matched by identity. Returns the value passed in.

* __get__ `map.get(key)`. Returns the value that key corresponds to or undefined.

* __has__ `map.has(key)`. Returns boolean.

* __delete__ `map.delete(key)`. Returns true.


# Set

Sets are similar to arrays but enforce uniqueness of values. Setting the same value twice will only
result in one being added to the set.

* __add__ `set.add(value)`. Inserts a value of any type into the set if it's not already in the set.
* __has__ `set.has(value)`. Returns boolean.
* __delete__ `set.delete(value)`. Removes value from the set if found. Returns true.


# Todo

* A reasonable approximation of iteration if possible, though matching the ES6 API likely won't be
possible due to new language semantics.
* Enforce WeakMap semantics on non-primitive keys.