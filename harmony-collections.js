!function(Name, exports, global){
  // Original by Gozala @ https://gist.github.com/1269991
  // Updated by Raynos @ https://gist.github.com/1638059
  // Expanded to full spec realization by Benvie @ https://github.com/Benvie/ES6-Harmony-Collections-Shim
  "use strict";

  if (!Function.prototype.name) {
    // IE
    var toCode = Function.call.bind(Function.prototype.toString);
    Object.defineProperty(Function.prototype, 'name', {
      get: function(){
        if (this === Function.prototype)
          return 'Empty';
        var src = toCode(this);
        src = src.slice(9, src.indexOf('('));
        Object.defineProperty(this, 'name', { value: src });
        return src
      }
    });
  }



  function isObject(o){
    return Object(o) === o;
  }

  function initializer(){
    function defineByName(o, fn){
      var vname = typeof fn.name === 'string' ? fn.name.replace(/_$/, '') : '';
      hiddenDesc.value = fn;
      Object.defineProperty(o, vname, hiddenDesc);
      fakeNativeCode(fn);
      hiddenDesc.value = null;
      return vname;
    }

    function defineMethods(o, v){
      if (Array.isArray(v)) {
        v.forEach(function(v){
          defineByName(o, v);
        });
      } else {
        defineByName(o, v);
      }
      return o;
    }

    var fakeNativeCode = Function.__proto__
        ? function fakeNativeCode(fn){
            if (fn !== toString)
              fn.__proto__ = toString;
            return fn;
          }
        : function fakeNativeCode(fn){
            if (fn.toString !== toString)
              defineMethods(fn, toString);
            return fn;
          };


    var code = 'return function toString(){ return "'+(Object+'').replace(/\n/g,'\\n').replace('Object', '"+this.name+"')+'" }',
        hiddenDesc = { configurable: true, writable: true, enumerable: false },
        toString = new Function(code)();

    defineMethods(toString, toString);

    return {
      makeRandomKey: function(){
        var randomKeys = Object.create(null),
            properties = Object.getOwnPropertyNames;

        defineMethods(Object, function getOwnPropertyNames(o){
          return properties(o).filter(function(key){
            return !(key[0] === '_' || key in randomKeys);
          });
        });

        return function makeRandomKey(){
          var key = '_'+(Math.random() / 1.1).toString(36).slice(2);
          randomKeys[key] = true;
          return key;
        };
      }(),
      assemble: function(Ctor, methods){
        var brand = '[object '+Ctor.name+']';
        methods.push(function toString(){ return brand });
        methods.forEach(fakeNativeCode);
        defineMethods(Ctor.prototype, methods);
        Ctor.prototype.constructor = Ctor;
        return fakeNativeCode(Ctor);
      },
      exporter: function(name, init){
        //if (!(name in global))
          exports[name] = init();
      }
    };
  }


  function Pair(key, value){
    this.key = key;
    this.value = value;
  }

  var prep = initializer(),
      hasOwn = Function.call.bind({}.hasOwnProperty),
      storage = new Name(prep.makeRandomKey());

  /**
   * @class WeakMap
   * @description Collection using objects with unique identities as keys that disallows enumeration
   *  and allows for better garbage collection.
   */
  prep.exporter('WeakMap', function(){
    return prep.assemble(
      function WeakMap(){
        if (!(this instanceof WeakMap)) return new WeakMap;
        storage(this).weakmap = new Name(prep.makeRandomKey());
      }, [
      /**
       * @method       <get>
       * @description  Retrieve the value in the collection that matches key
       * @param        {Any} key
       * @return       {Any}
       */
      function get(key){
        return storage(this).weakmap(key).value;
      },
      /**
       * @method       <set>
       * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
       * @param        {Any} key
       * @param        {Any} val
       * @return       {Any} returns value passed in
       **/
      function set(key, value){
        return storage(this).weakmap(key).value = value;
      },
      /*
       * @method       <has>
       * @description  Check if key is in the collection
       * @param        {Any} key
       * @return       {Boolean}
       **/
      function has(key){
        return hasOwn(storage(this).weakmap(key), 'value');
      },
      /**
       * @method       <delete>
       * @description  Remove key and matching value if found
       * @param        {Any} key
       * @return       {Boolean} true if item was in collection
       */
      function delete_(key){
        var store = storage(this).weakmap(key);
        if (hasOwn(store, 'value')) {
          delete store.value;
          return true;
        } else {
          return false;
        }
      }
    ]);
  });


  /**
   * @class Hash
   * @description Collection that only allows primitives to be keys.
   */
  prep.exporter('Hash', function(){
    return prep.assemble(
      function Hash(){
        if (!(this instanceof Hash)) return new Hash;
        storage(this).hash = Object.create(null);
      }, [
      /**
       * @method       <get>
       * @description  Retrieve the value in the collection that matches key
       * @param        {Any} key
       * @return       {Any}
       */
      function get(key){
        return storage(this).hash[key];
      },
      /**
       * @method       <set>
       * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
       * @param        {Any} key
       * @param        {Any} val
       * @return       {Any} returns value passed in
       **/
      function set(key, value){
        return storage(this).hash[key] = value;
      },
      /**
       * @method       <has>
       * @description  Check if key exists in the collection.
       * @param        {Any} key
       * @return       {Boolean} is in collection
       **/
      function has(key){
        return key in storage(this).hash;
      },
      /**
       * @method       <delete>
       * @description  Remove key and matching value if found
       * @param        {Any} key
       * @return       {Boolean} true if item was in collection
       */
      function delete_(key){
        var hash = storage(this).hash;
        var has = key in hash;
        if (key in hash) {
          delete hash[key]
          return true;
        } else {
          return false;
        }
      },
      /**
       * @method       <keys>
       * @description  Returns an array containing the keys
       * @return       {Array}
       **/
      function keys(){
        return Object.keys(storage(this).hash);
      },
      /**
       * @method       <values>
       * @description  Returns an array containing the values
       * @return       {Array}
       **/
      function values(){
        var hash = storage(this).hash;
        return Object.keys(hash).map(function(key){
          return hash[key];
        });
      },
      /**
       * @method       <iterate>
       * @description  Loop through the collection raising callback for each
       * @param        {Function} callback  `callback(value, key|index)`
       * @param        {Object}   context    The `this` binding for callbacks, default null
       */
      function iterate(callback, context){
        var hash = storage(this).hash;
        context = isObject(context) ? context : global;
        for (var k in hash) {
          callback.call(context, hash[k], k);
        }
      },
      /**
       * @method       <toArray>
       * @description  Returns an array containing key:value pairs
       * @return       {Pair[]}
       **
       **/
      function toArray(){
        var out = [];
        this.iterate(function(value, key){
          out.push(new Pair(key, value));
        });
        return out;
      },
      /**
       * @method       <toObject>
       * @description  Returns an plain object with the keys and values
       * @return       {Object}
       **/
      function toObject(){
        var out = {};
        this.iterate(function(value, key){
          out[key] = value;
        });
        return out;
      }
    ]);
  });


  /**
   * @class Map
   * @description Collection that allows any kind of value to be a key.
   */
  prep.exporter('Map', function(){
    return prep.assemble(
      function Map(){
        if (!(this instanceof Map)) return new Map;
        storage(this).map = {
          tables: [new Hash, new WeakMap],
          keys: [],
          values: []
        };
      }, [
      /**
       * @method       <get>
       * @description  Retrieve the value in the collection that matches key
       * @param        {Any} key
       * @return       {Any}
       */
      function get(key){
        var map = storage(this).map;
        return map.values[map.tables[+isObject(key)].get(key)];
      },
      /**
       * @method       <set>
       * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
       * @param        {Any} key
       * @param        {Any} val
       * @return       {Any} returns value passed in
       **/
      function set(key, value){
        var map = storage(this).map,
            table = map.tables[+isObject(key)],
            index = table.get(key);

        if (index === undefined) {
          table.set(key, map.keys.length);
          map.keys.push(key);
          map.values.push(value);
        } else {
          map.keys[index] = key;
          map.values[index] = value;
        }
        return value;
      },
      /**
       * @method       <has>
       * @description  Check if key exists in the collection.
       * @param        {Any} key
       * @return       {Boolean} is in collection
       **/
      function has(key){
        return storage(this).map.tables[+isObject(key)].has(key);
      },
      /**
       * @method       <delete>
       * @description  Remove key and matching value if found
       * @param        {Any} key
       * @return       {Boolean} true if item was in collection
       */
      function delete_(key){
        var map = storage(this).map,
            table = map.tables[+isObject(key)],
            index = table.get(key);

        if (index === undefined) {
          return false;
        } else {
          table.delete(key);
          map.keys.splice(index, 1);
          map.values.splice(index, 1);
          return true;
        }
      },
      /**
       * @method       <keys>
       * @description  Returns an array containing the keys
       * @return       {Array}
       **/
      function keys(){
        return storage(this).map.keys.slice();
      },
      /**
       * @method       <values>
       * @description  Returns an array containing the values
       * @return       {Array}
       **/
      function values(){
        return storage(this).map.values.slice();
      },
      /**
       * @method       <iterate>
       * @description  Loop through the collection raising callback for each
       * @param        {Function} callback  `callback(value, key|index)`
       * @param        {Object}   context    The `this` binding for callbacks, default null
       */
      function iterate(callback, context){
        var map = storage(this).map,
            keys = map.keys,
            values = map.values;

        context = isObject(context) ? context : global;

        for (var i=0, len=keys.length; i < len; i++) {
          callback.call(context, values[i], keys[i]);
        }
      },
      /**
       * @method       <toArray>
       * @description  Returns an array containing key:value pairs
       * @return       {Pair[]}
       **
       **/
      function toArray(){
        var out = [];
        this.iterate(function(value, key){
          out.push(new Pair(key, value));
        });
        return out;
      }
    ]);
  });

  /**
   * @class        |Set|
   * @description  Collection of values that enforces uniqueness.
   **/
  prep.exporter('Set', function(){
    return prep.assemble(
      function Set(){
        if (!(this instanceof Set)) return new Set;
        storage(this).set = new Map;
      }, [
      /**
       * @method       <add>
       * @description  Insert value if not found, enforcing uniqueness.
       * @param        {Any} val
       */
      function add(key){
        return storage(this).set.set(key, true);
      },
      /**
       * @method       <has>
       * @description  Check if key exists in the collection.
       * @param        {Any} key
       * @return       {Boolean} is in collection
       **/
      function has(key){
        return storage(this).set.has(key);
      },
      /**
       * @method       <delete>
       * @description  Remove key and matching value if found
       * @param        {Any} key
       * @return       {Boolean} true if item was in collection
       */
      function delete_(key){
        return storage(this).set.delete(key);
      },
      /**
       * @method       <values>
       * @description  Returns an array containing the values
       * @return       {Array}
       **/
      function values(callback, context){
        return storage(this).set.keys();
      },
      /**
       * @method       <iterate>
       * @description  Loop through the collection raising callback for each
       * @param        {Function} callback  `callback(value, key|index)`
       * @param        {Object}   context    The `this` binding for callbacks, default null
       */
      function iterate(callback, context){
        this.values().forEach(callback, isObject(context) ? context : global);
      }
    ]);
  });
}(function(hasOwn){
  // keeping these out of the main scope just to be sure there's no wayward references through sheer magic
  "use strict";

  function namespace(obj, key, name) {
    var store = Object.create(null);
    Object.defineProperty(obj, name, {
      value: new Function('key','store', '"use strict"; return function(value){ if (value === key) return store }')(key, store)
    });
    return store;
  }

  return function Name(name){
    var key = this instanceof Name ? this : Object.create(Name.prototype);
    return function(obj){
      return hasOwn(obj, name) ? obj[name](key) : namespace(obj, key, name);
    };
  };
}(Function.call.bind({}.hasOwnProperty)),
  typeof module === 'undefined' ? this : module.exports,
  new Function('return this')()
)
