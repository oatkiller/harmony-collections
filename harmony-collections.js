!function(Name, exports, global){
  // Original by Gozala @ https://gist.github.com/1269991
  // Updated by Raynos @ https://gist.github.com/1638059
  // Modified and expanded to [Map, Hash, Set] by Benvie @ https://github.com/Benvie
  "use strict";

  function isObject(o){
    return Object(o) === o;
  }

  var hasOwn = Object.prototype.hasOwnProperty;

  var glue = function(){
    var GOPN = Object.getOwnPropertyNames;
    var desc = {
      configurable: true,
      writable: true,
      enumerable: false
    };
    var code = Object.toString().split('Object');
    var toString = new Function('return function toString(){ return "'+code[0]+'"+this.name+"'+code[1]+'" }')();

    function defineMethods(o,v){
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

    function fakeNative(fn){
      return defineMethods(fn, toString);
    }

    fakeNative(toString);

    defineMethods(Object, function getOwnPropertyNames(o){
      var props = GOPN(o);
      if (hasOwn.call(o, 'valueOf') && o.valueOf.ns) {
        props.splice(props.indexOf('valueOf'), 1);
      }
      return props;
    });

    fakeNative(Object.getOwnPropertyNames);

    return function(methods){
      var Ctor = methods.shift();
      defineMethods(Ctor.prototype, methods);
      methods.forEach(fakeNative);
      return fakeNative(Ctor);
    };
  }();

  function Pair(key, value){
    this.key = key;
    this.value = value;
  }

  /**
   * @classes      [ WeakMap, Map, Hash, Set ]
   **
   * @method       <has>
   * @description  Check if key is in the collection
   * @param        {Any} key
   * @return       {Boolean}
   **
   * @method       <delete>
   * @description  Remove key and matching value if found
   * @param        {Any} key
   * @return       {Boolean} true if item was in collection
   */

  /**
   * @classes      [ WeakMap, Map, Hash ]
   **
   * @method       <set>
   * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
   * @param        {Any} key
   * @param        {Any} val
   * @return       {Any} returns value passed in
   **
   * @method       <get>
   * @description  Retrieve the value in the collection that matches key
   * @param        {Any} key
   * @return       {Any}
   */

  /**
   * @classes      [ Set ]
   * @method       <add>
   * @description  Insert value if not found, enforcing uniqueness.
   * @param        {Any} val
   */

  /**
   * @classes      [ Map, Hash, Set ]
   **
   * @method       <values>
   * @description  Returns an array containing the values
   * @return       {Array}
   **
   * @method       <iterate>
   * @description  Loop through the collection raising callback for each
   * @param        {Function} callback  `callback(value, key|index)`
   * @param        {Object}   context    The `this` binding for callbacks, default null
   */

  /**
   * @classes      [ Map, Hash ]
   **
   * @method       <keys>
   * @description  Returns an array containing the keys
   * @return       {Array}
   **
   * @method       <toArray>
   * @description  Returns an array containing key:value pairs
   * @return       {Pair[]}
   **
   **/

  /**
   * @classes      [ Hash ]
   **
   * @method       <toObject>
   * @description  Returns an plain object with the keys and values
   * @return       {Object}
   **
   **/




  /**
   * @class WeakMap
   * @description Collection using objects with unique identities as keys that disallows enumeration and allows for better garbage collection.
   */
  //var WeakMap = exports.WeakMap = 'WeakMap' in global ? global.WeakMap : function(weakmaps){
  var WeakMap = exports.WeakMap = function(weakmaps){
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
  }(new Name);


  /**
   * @class Hash
   * @description Collection that only allows primitives to be keys.
   */
  var Hash = exports.Hash = 'Hash' in global ? global.Hash : function(hashes){
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
      function keys(){
        return Object.keys(hashes.get(this));
      },
      function values(){
        var hash = hashes.get(this);
        return Object.keys(hash).map(function(key){
          return hash[key];
        });
      },
      function iterate(callback, context){
        var hash = hashes.get(this);
        context = isObject(context) ? context : global;
        for (var k in hash) {
          callback.call(context, hash[k], k);
        }
      },
      function toArray(){
        var out = [];
        this.iterate(function(value, key){
          out.push(new Pair(key, value));
        });
        return out;
      },
      function toObject(){
        var out = {};
        this.iterate(function(value, key){
          out[key] = value;
        });
        return out;
      }
    ]);
  }(new WeakMap);


  /**
   * @class Map
   * @description Collection that allows any kind of value to be a key.
   */
  var Map = exports.Map = 'Map' in global ? global.Map : function(maps){
    var MapArray = glue([
      function MapArray(){
        this.tables = [new Hash, new WeakMap];
        this.keys = [];
        this.values = [];
      },
      function get(key){
        return this.keys[this.tables[+isObject(key)].get(key)];
      },
      function set(key, value){
        var table = this.tables[+isObject(key)];
        var index = table.get(key);
        if (index === undefined) {
          table.set(key, this.keys.length);
          this.keys.push(key);
          this.values.push(value);
        } else {
          this.keys[index] = key;
          this.values[index] = value;
        }
        return value;
      },
      function has(key){
        return this.tables[+isObject(key)].has(key);
      },
      function delet\u0065(key){
        var index = this.tables[+isObject(key)].get(key);
        if (index === undefined) {
          return false;
        } else {
          this.tables[+isObject(key)].delete(key);
          this.keys.splice(index, 1);
          this.values.splice(index, 1);
          return true;
        }
      }
    ]);

    return glue([
      function Map(){
        if (!(this instanceof Map)) return new Map;
        maps.set(this, new MapArray);
      },
      function get(key){
        return maps.get(this).get(key);
      },
      function set(key, value){
        return maps.get(this).set(key, value);
      },
      function has(key){
        return maps.get(this).has(key);
      },
      function delet\u0065(key){
        return maps.get(this).delete(key);
      },
      function keys(){
        return maps.get(this).keys.slice();
      },
      function values(){
        return maps.get(this).values.slice();
      },
      function iterate(callback, context){
        var map = maps.get(this);
        var keys = map.keys;
        var values = map.values;
        context = isObject(context) ? context : global;

        for (var i=0, len=keys.length; i < len; i++) {
          callback.call(context, values[i], keys[i]);
        }
      },
      function toArray(){
        var out = [];
        this.iterate(function(value, key){
          out.push(new Pair(key, value));
        });
        return out;
      }
    ]);
  }(new WeakMap);


  /**
   * @class        |Set|
   * @description  Collection of values that enforces uniqueness.
   **/
  var Set = exports.Set = 'Set' in global ? global.Set : function(sets){
    return glue([
      function Set(){
        if (!(this instanceof Set)) return new Set;
        sets.set(this, new Map);
      },

      function add(key){
        return sets.get(this).set(key, true);
      },

      function has(key){
        return sets.get(this).has(key);
      },

      function delet\u0065(key){
        return sets.get(this).delete(key);
      },

      function values(callback, context){
        return sets.get(this).keys();
      },

      function iterate(callback, context){
        this.values().forEach(callback, isObject(context) ? context : global);
      }
    ]);
  }(new WeakMap);
}(function(){
  // keeping these out of the main scope just to be sure there's no wayward references through sheer magic
  "use strict";
  function namespace(obj, key) {
    var store = Object.create(null);
    var origVO = obj.valueOf || Object.prototype.valueOf;

    Object.defineProperty(obj, 'valueOf', {
      configurable: true,
      writable: true,
      value: function valueOf(value){
        return value !== key ? origVO.apply(this, arguments) : store;
      }
    });

    obj.valueOf.ns = true;
    return store;
  }

  return function Name(){
    var key = this;
    return function(obj){
      var store = obj.valueOf(key);
      return store !== obj ? store : namespace(obj, key);
    }
  }
}(),
  typeof module === 'undefined' ? this : module.exports,
  new Function('return this')()
);