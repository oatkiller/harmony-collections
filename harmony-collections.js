!function(exports, global){
  // Original by Gozala @ https://gist.github.com/1269991
  // Updated by Raynos @ https://gist.github.com/1638059
  // Modified and expanded to [Map, Hash, Set] by Benvie @ https://github.com/Benvie
  "use strict";

  var origGOPN = Object.getOwnPropertyNames;
  var hasOwn = Object.prototype.hasOwnProperty;

  function isObject(o){
    return Object(o) === o;
  }

  var defineMethods = function(){
    var desc = {
      configurable: true,
      writable: true,
      enumerable: false
    }

    return function(o,v){
      if (Array.isArray(v)) {
        v.forEach(function(v){
          desc.value = v;
          Object.defineProperty(o, v.name, desc);
        });
      } else {
        desc.value = v;
        Object.defineProperty(o, v.name, desc);
      }
      desc.value = null;
      return o;
    }
  }();

  var fakeNative = function(){
    var code = Object.toString().split('Object');
    var toString = new Function('return function toString(){ return "'+code[0]+'"+this.name+"'+code[1]+'" }')();

    function fakeNative(fn){
      return defineMethods(fn, toString);
    }

    fakeNative(toString);
    return fakeNative;
  }();

  defineMethods(Object, function getOwnPropertyNames(o){
    var props = origGOPN(o);
    if (hasOwn.call(o, 'valueOf') && o.valueOf.ns) {
      props.splice(props.indexOf('valueOf'), 1);
    }
    return props;
  });

  fakeNative(Object.getOwnPropertyNames);

  function glue(methods){
    var Ctor = methods.shift();
    defineMethods(Ctor.prototype, methods);
    methods.forEach(fakeNative);
    return fakeNative(Ctor);
  }

  function namespace(obj, key) {
    var store = Object.create(null);
    var origVO = obj.valueOf || Object.prototype.valueOf;
    var hasVO = hasOwn.call(obj, 'valueOf');

    defineMethods(obj, function valueOf(value){
      return value !== key ? origVO.apply(this, arguments) : store;
    });

    obj.valueOf.ns = hasVO;
    return store;
  }

  function Name(){
    var key = this;
    return function(obj){
      var store = obj.valueOf(key);
      return store !== obj ? store : namespace(obj, key);
    }
  }

  /* WeakMap, Map, and Hash all implement the following API with one difference:
    * WeakMap - Object keys only, provides for better garbage collection
    * Map - Allows anything to be a key
    * Hash - Allows only primitives to be keys

  /**
   * @method set
   * @description Add or update a pair in the map. Enforces uniqueness by overwriting.
   * @param  {Any} key
   * @param  {Any} val
   * @return {Any} returns value passed in
   */

  /**
   * @method get
   * @description Retrieve the value that matches key
   * @param  {Any} key
   * @return {Any}
   */

  /**
   * @method has
   * @description Check if key is in Map
   * @param  {Any} key
   * @return {Boolean}
   */

  /**
   * @method delete
   * @description Remove key and matching value if found
   * @param  {Any} key
   * @return {Boolean} true item was in collection
   */

  /**
   * TODO:
   *  keys
   *  values
   *  iterate
   */

  /**
   * @class WeakMap
   * @description Collection using objects with unique identities as keys that disallows enumeration and allows for better garbage collection.
   */
  var WeakMap = function(){
    var weakmaps = new Name;
    return glue([
      function WeakMap(){
        if (!(this instanceof WeakMap)) return new WeakMap;
        weakmaps(this).lookup = new Name;
      },
      function get(key){
        return weakmaps(this).lookup(key).value;
      },
      function set(key, value){
        return weakmaps(this).lookup(key).value = value;
      },
      function has(key){
        return hasOwn.call(weakmaps(this).lookup(key), 'value');
      },
      function delet\u0065(key){
        var store = weakmaps(this).lookup(key);
        if (hasOwn.call(store, 'value')) {
          delete store.value;
          return true;
        } else {
          return false;
        }
      }
    ]);
  }();


  /**
   * @class Map
   * @description Collection that only allows primitives to be keys.
   */
  var Hash = function(){
    var hashes = new WeakMap;
    return glue([
      function Hash(){
        if (!(this instanceof Hash)) return new Hash;
        hashes.set(this, Object.create(null));
      },
      function get(key){
        return hashes.get(this)[key];
      },
      function set(key, value){
        return hashes.get(this)[key] = value;
      },
      function has(key){
        return key in hashes.get(this);
      },
      function delet\u0065(key){
        var hash = hashes.get(this);
        var has = key in hash;
        if (key in hash) {
          delete hash[key]
          return true;
        } else {
          return false;
        }
      },
      /**
       * Retrieve all keys
       * @return {Array}
       */
      //function keys(){},
      /**
       * Retrieve all values
       * @return {Array}
       */
      //function values(){},
      /**
       * Loop through the collection raising callback for each
       * @param  {Function} callback  `callback(value, index)`
       * @param  {Object}   context    The `this` binding for callbacks, default null
       */
      //function iterate(callback, context){}
    ]);
  }()


  /**
   * @class Map
   * @description Collection that allows any kind of value to be a key.
   */
  var Map = function(){
    var maps = new WeakMap;
    return glue([
      function Map(){
        if (!(this instanceof Map)) return new Map;
        maps.set(this, [new Hash, new Name]);
      },
      function get(key){
        return maps.get(this)[isObject(key)].get(key);
      },
      function set(key, value){
        return maps.get(this)[isObject(key)].set(key, value);
      },
      function has(key){
        return maps.get(this)[isObject(key)].has(key);
      },
      function delet\u0065(key){
        return maps.get(this)[isObject(key)].delete(key);
      },
      /**
       * Retrieve all keys
       * @return {Array}
       */
      //function keys(){},
      /**
       * Retrieve all values
       * @return {Array}
       */
      //function values(){},
      /**
       * Loop through the collection raising callback for each
       * @param  {Function} callback  `callback(value, index)`
       * @param  {Object}   context    The `this` binding for callbacks, default null
       */
      //function iterate(callback, context){}
    ]);
  }();


  /**
   * @class Set
   * @description Collection of values that enforces uniqueness.
   */
  var Set = function(){
    var sets = new WeakMap;
    return glue([

      function Set(){
        if (!(this instanceof Set)) return new Set;
        sets.set(this, new Map);
      },

      /**
       * Insert value if not found, enforcing uniqueness.
       * @param  {Any} val
       */
      function add(key){
        return sets.get(this).set(key, true);
      },

      /**
       * Check if value is in Set
       * @param  {Any}      val
       * @return {Boolean}
       */
      function has(key){
        return sets.get(this).has(key);
      },

      /**
       * Remove value if found
       * @param  {Any}      val
       * @return {Boolean}  Always true
       */
      function delet\u0065(key){
        return sets.get(this).delete(key);
      },
      /**
       * Retrieve all values
       * @return {Array}
       */
      //function values(callback, context){},
      /**
       * Loop through the collection raising callback for each
       * @param  {Function} callback  `callback(value, index)`
       * @param  {Object}   context    The `this` binding for callbacks, default null
       */
      //function iterate(callback, context){}
    ]);
  }();

  'Hash' in exports || (exports.Hash = Hash);
  'Map' in exports || (exports.Map = Map);
  'Set' in exports || (exports.Set = Set);
  'WeakMap' in exports || (exports.WeakMap = WeakMap);
}(typeof module === 'undefined' ? this : module.exports, new Function('return this')());
