(function(exports, global){
  "use strict";
  var proto = Object.create(Object.prototype, { toString: __(toString) });

  var Map = exports.Map = (function(){

    var keysets = [];
    var valsets = [];
    var maps = [];
    var last = {};

    /**
     * Collection allowing any value to be a key: objects, primitives, undefined.
     */
    function Map(){
      var map = Object.create(Map.prototype);
      maps.push(map);
      keysets.push([]);
      valsets.push([]);
      return map;
    }

    Map.prototype = Object.create(proto, {
      constructor: __(Map),

      /**
       * Add or update a pair in the map. Enforces uniqueness by overwriting.
       * @param  {Any} key
       * @param  {Any} val
       * @return {Any} returns value passed in
       */
      set: __(function set(key, val){
        var map = search(this, key);
        if (map.index < 0) map.index = map.keys.length;
        map.keys[map.index] = key;
        last.keyi = map.index;
        return map.vals[map.index] = val;
      }),

      /**
       * Retrieve the value that matches key
       * @param  {Any} key
       * @return {Any}
       */
      get: __(function get(key){
        var map = search(this, key);
        return ~map.index ? map.vals[map.index] : undefined;
      }),

      /**
       * Check if key is in Map
       * @param  {Any} key
       * @return {Boolean}
       */
      has: __(function has(key){
        return !!~search(this, key).index;
      }),

      /**
       * Remove key and matching value if found
       * @param  {Any} key
       * @return {Boolean} Always true
       */
      delete: __(function del(key){
        var map = search(this, key);
        if (!~map.index) return true;
        map.keys.splice(map.index, 1);
        map.vals.splice(map.index, 1);
        last.keyi = null;
        return true;
      }),

      /**
       * Retrieve all keys
       * @return {Array}
       */
      keys: __(function keys(){
        return [].concat(search(this).keys);
      }),

      /**
       * Retrieve all values
       * @return {Array}
       */
      values: __(function values(){
        return [].concat(search(this).vals);
      }),

      /**
       * Loop through the Map raising callback for each
       * @param  {Function} callback  `callback(key, value, index)`
       * @param  {Object}   context    The `this` binding for callbacks, default null
       */
      iterate: __(function iterate(callback, context){
        var map = search(this);
        for (var i=0, len=map.keys.length; i < len; i++) {
          callback.call(context || null, map.keys[i], map.vals[i], i);
        }
      })
    });


    function search(map, key){
      var mapi = map === last.map ? last.mapi : find(maps, map);
      if (~mapi) {
        if (typeof key !== 'undefined') {
          var keyi = find(keysets[mapi], key);
          last.key = key;
          if (~keyi) {
            last.keyi = keyi;
          }
        }
        last.map = map;
        last.mapi = mapi;
        return {
          keys: keysets[mapi],
          vals: valsets[mapi],
          index: keyi
        };
      }
      IncompatibleError(Map);
    }

    function find(keys, key){
      var i = keys.length;
      while (i--) {
        if (egal(key, keys[i])) {
          return i;
        }
      }
      return -1;
    }

    return Map;
  })();

  var WeakMap = exports.WeakMap = (function(){

    var weakmaps = new Map;
    var last = {};

    /**
     * Collection using objects with unique identities as keys that disallows enumeration.
     */
    function WeakMap(){
      var weakmap = Object.create(WeakMap.prototype);
      weakmaps.set(weakmap, Map());
      return weakmap;
    }

    WeakMap.prototype = Object.create(proto, {
      constructor: __(WeakMap),

      /**
       * Add or update a pair in the map. Enforces uniqueness by overwriting.
       * @param  {Object} Requires non-primitive
       * @param  {Any} val
       * @return {Any} returns value passed in
       */
      set: __(function set(key, val){
        if (Object(key) !== key) {
          throw new TypeError('Primitives are not valid WeakMap keys.');
        }
        return search(this).set(key, val);
      }),

      /**
       * Retrieve the value that matches key
       * @param  {Object} key
       * @return {Any}
       */
      get: __(function get(key){
        return search(this).get(key);
      }),

      /**
       * Check if key is in Map
       * @param  {Object} key
       * @return {Boolean}
       */
      has: __(function has(key){
        return search(this).has(key);
      }),

      /**
       * Remove key and matching value if found
       * @param  {Object} key
       * @return {Boolean} Always true
       */
      delete: __(function del(key){
        return search(this).delete(key);
      })
    });

    function search(weakmap){
      if (last.weakmap === weakmap) return last.map;
      var map = weakmaps.get(weakmap);
      if (map) {
        last.weakmap = weakmap;
        return last.map = map;
      }
      IncompatibleError(WeakMap);
    }

    return WeakMap;
  })();

  var Set = exports.Set = (function(){

    var sets = new Map;
    var last = {};

    /**
     * Collection of values that enforces uniqueness.
     */
    function Set(){
      var set = Object.create(Set.prototype);
      sets.set(set, Map());
      return set;
    }

    Set.prototype = Object.create(proto, {
      constructor: __(Set),

      /**
       * Insert value if not found, enforcing uniqueness.
       * @param  {Any} val
       */
      add: __(function add(val){
        search(this).set(val, true);
      }),

      /**
       * Check if value is in Set
       * @param  {Any}      val
       * @return {Boolean}
       */
      has: __(function has(val){
        return search(this).has(val);
      }),

      /**
       * Remove value if found
       * @param  {Any}      val
       * @return {Boolean}  Always true
       */
      delete: __(function del(val){
        return search(this).delete(val);
      }),

      /**
       * Retrieve all values
       * @return {Array}
       */
      values: __(function values(callback, context){
        return search(this).keys();
      }),

      /**
       * Loop through the Set raising callback for each
       * @param  {Function} callback  `callback(value, index)`
       * @param  {Object}   context    The `this` binding for callbacks, default null
       */
      iterate: __(function iterate(callback, context){
        var keys = search(this).keys();
        for (var i=0, len=keys.length; i < len; i++) {
          callback.call(context || null, keys[i], i);
        }
      })
    });

    function search(set){
      if (last.set === set) return last.map;
      var map = sets.get(set);
      if (map) {
        last.set = set;
        return last.map = map;
      }
      IncompatibleError(Set);
    }

    return Set;
  })();

  function __(val, hidden){
    if (typeof val === 'function') {
      Object.defineProperty(val, 'toString', {
        configurable: true,
        writable: true,
        value: toString
      });
    }
    return { value: val };
  }

  var source = (Function+'').split('Function');

  function toString(){
    if (typeof this === 'function') {
      return source[0]+this.name+source[1];
    } else {
      return '[object '+Object.getPrototypeOf(this).constructor.name+']';
    }
  }

  function IncompatibleError(type){
    var err = new TypeError;
    err.message = type.name+' function called on an incompatible object.';
    var stack = err.stack.split('\n');
    stack.splice(1, 3);
    err.stack = stack.join('\n');
    throw err;
  }

  /**
   * Check a function's name and names of proprties on its prototype. Map and Set are common
   * names so checking that they exist isn't adequate. This is ignored if not in browser/using exports.
   * @param  {String}   name       Name of the constructor
   * @param  {String[]} functions  Names of expected prototype properties
   * @return {Boolean}
   */
  function matches(name, props){
    if (name in global && global[name].name === name && global[name].prototype) {
      return props.every(function(prop){
        return prop in global[name].prototype;
      });
    }
  }

  /**
   * Strict equals with a couple differences: egal(-0, 0) is false, egal(NaN, NaN) is true
   * @param  {Any} a
   * @param  {Any} b
   * @return {Boolean}
   */
  function egal(a, b){
    return a === b ? a !== 0 || 1 / a === 1 / b : a !== a && b !== b;
  }
  /**
   * Add Map, WeakMap, and Set to the global object if a native version isn't found.
   */
  function attachIfMissing(){
    if (!matches('Map', ['get', 'set', 'has', 'delete'])) {
      global.Map = Map;
    }
    if (!matches('WeakMap', ['get', 'set', 'has', 'delete']) ||
      // also patch over the WeakMap implementation in node 0.6.x which suffers from
      // a bug that makes WeakMaps nearly useless for any practical purpose anyway
        (process && process.versions && process.versions.v8 &&
         parseFloat(process.versions.v8) < 3.7)) {
      global.WeakMap = WeakMap;
    }
    if (!matches('Set', ['add', 'has', 'delete'])) {
      global.Set = Set;
    }
  }

  exports.attachIfMissing = attachIfMissing;

  if (typeof window !== 'undefined') {
    attachIfMissing();
  }

})(typeof exports !== 'undefined' ? exports : {},
   typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this)