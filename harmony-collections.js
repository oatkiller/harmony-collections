/* (The MIT License)
 *
 * Copyright (c) 2012 Brandon Benvie <http://bbenvie.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
 * (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included with all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH
 * THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// Original WeakMap implementation by Gozala @ https://gist.github.com/1269991
// Updated and bugfixed by Raynos @ https://gist.github.com/1638059
// Expanded by Benvie @ https://github.com/Benvie/ES6-Harmony-Collections-Shim

void function(Object, FP, global, exports, UNDEFINED, undefined){
  "use strict";

  var hasOwnProperty = Object.prototype.hasOwnProperty,
      defineProperty = Object.defineProperty,
      create = Object.create;


  var define = function(o, k, v){
    if (typeof k === 'function') {
      v = k;
      k = v.name.replace(/_$/, '');
    }

    return defineProperty(o, k, { configurable: true, writable: true, value: v });
  }


  // patch IE's lack of name property on functions
  'name' in FP || defineProperty(FP, 'name', {
    configurable: true,
    get: function(){
      if (this === FP)
        return 'Empty';

      var src = FP.toString.call(this);
      src = src.slice(9, src.indexOf('('));
      defineProperty(this, 'name', { value: src });
      return src;
    }
  });



  // ##############
  // ### Locker ###
  // ##############

  var Locker = (function(){
    var getProperties = Object.getOwnPropertyNames,
        lockboxDesc = { value: { writable: true, value: undefined } },
        locker = '"use strict";return function(k){if(k===s)return l}',
        uids = create(null),

        createUID = function(){
          var key = Math.random().toString(36).slice(2);
          return key in uids ? createUID() : uids[key] = key;
        },

        globalID = createUID(),

        // check for the random key on an object, create new storage if missing, return it
        storage = function(obj){
          if (hasOwnProperty.call(obj, globalID))
            return obj[globalID];

          if (!Object.isExtensible(obj))
            throw new Error("Collections for non-extensible objects not implemented");

          var store = create(null);
          defineProperty(obj, globalID, { value: store });
          return store;
        };

    // common per-object storage area made hidden by patching getOwnPropertyNames'
    define(Object, function getOwnPropertyNames(obj){
      var props = getProperties(obj);
      if (hasOwnProperty.call(obj, globalID))
        props.splice(props.indexOf(globalID), 1);
      return props;
    });


    function Locker(){
      var puid = createUID(),
          secret = {};

      define(this, function unlock(obj){
        var store = storage(obj);
        if (hasOwnProperty.call(store, puid))
          return store[puid](secret);

        var lockbox = create(null, lockboxDesc);
        defineProperty(store, puid, {
          value: new Function('s', 'l', locker)(secret, lockbox)
        });
        return lockbox;
      });
    }

    define(Locker.prototype, function get(obj){
      return this.unlock(obj).value;
    });

    define(Locker.prototype, function set(obj, value){
      this.unlock(obj).value = value;
    });

    return Locker;
  }());


  var exporter = (function(){
    var src = (''+Object).replace(/\n/g,'\\n').split('Object');

    var toString = function toString(){
      return src[0] + this.name + src[1];
    };

    define(toString, toString);

    var prepare = function(def){
      var Ctor = def.shift();
      var name = '[object ' + Ctor.name + ']';
      def.push(function toString(){ return name });
      def.forEach(function(method){
        define(method, toString);
        define(Ctor.prototype, method);
      });
      define(Ctor, toString);
      return Ctor;
    }

    return function(name, init){
      if (name in exports) return;

      var locker = new Locker;

      exports[name] = prepare(init(
        function(collection, value){
          locker.unlock(collection).value = value;
        },
        function(collection){
          var storage = locker.unlock(collection).value;
          if (!storage)
            throw new TypeError(name + " is not generic.");
          return storage;
        }
      ));
    };
  }());


  // ###############
  // ### WeakMap ###
  // ###############

  exporter('WeakMap', function(wrap, unwrap){
    var validate = function(key){
      if (key == null || typeof key !== 'object' && typeof key !== 'function')
        throw new TypeError("WeakMap keys must be objects");
    }

    /**
     * @class WeakMap
     * @description Collection using objects with unique identities as keys that disallows enumeration
     *  and allows for better garbage collection.
     */
    return [
      function WeakMap(){
        if (!(this instanceof WeakMap))
          return new WeakMap;

        wrap(this, new Locker);
      },
      /**
       * @method       <get>
       * @description  Retrieve the value in the collection that matches key
       * @param        {Any} key
       * @return       {Any}
       */
      function get(key){
        validate(key);
        var value = unwrap(this).get(key);
        return value === UNDEFINED ? undefined : value;
      },
      /**
       * @method       <set>
       * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
       * @param        {Any} key
       * @param        {Any} val
       **/
      function set(key, value){
        validate(key);
        // store a token for explicit undefined so that "has" works correctly
        unwrap(this).set(key, value === undefined ? UNDEFINED : value);
      },
      /*
       * @method       <has>
       * @description  Check if key is in the collection
       * @param        {Any} key
       * @return       {Boolean}
       **/
      function has(key){
        validate(key);
        return unwrap(this).get(key) !== undefined;
      },
      /**
       * @method       <delete>
       * @description  Remove key and matching value if found
       * @param        {Any} key
       * @return       {Boolean} true if item was in collection
       */
      function delete_(key){
        validate(key);
        var weakmap = unwrap(this);

        if (weakmap.get(key) === undefined)
          return false;

        weakmap.set(key, undefined);
        return true;
      }
    ];
  });


  // ###############
  // ### HashMap ###
  // ###############

  exporter('HashMap', function(wrap, unwrap){
    var STRING = 0, NUMBER = 1, OTHER = 2;
    var others = { false: false, true: true, null: null, 0: -0 };

    var uncoerce = function(type, key){
      switch (type) {
        case STRING: return key;
        case NUMBER: return +key;
        case OTHER: return others[key];
      }
    }

    var validate = function(key){
      if (key == null) return OTHER;
      switch (typeof key) {
        case 'boolean': return OTHER;
        case 'string': return STRING;
        case 'number': return key === 0 && Infinity / key === -Infinity ? OTHER : NUMBER;
        default: throw new TypeError("HashMap keys must be primitive");
      }
    }

    /**
     * @class HashMap
     * @description Collection that only allows primitives to be keys.
     */
    return [
      function HashMap(){
        if (!(this instanceof HashMap))
          return new HashMap;

        wrap(this, [
          create(null),
          create(null),
          create(null)
        ]);
      },
      /**
       * @method       <get>
       * @description  Retrieve the value in the collection that matches key
       * @param        {Any} key
       * @return       {Any}
       */
      function get(key){
        return unwrap(this)[validate(key)][key];
      },
      /**
       * @method       <set>
       * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
       * @param        {Any} key
       * @param        {Any} val
       **/
      function set(key, value){
        unwrap(this)[validate(key)][key] = value;
      },
      /**
       * @method       <has>
       * @description  Check if key exists in the collection.
       * @param        {Any} key
       * @return       {Boolean} is in collection
       **/
      function has(key){
        return key in unwrap(this)[validate(key)];
      },
      /**
       * @method       <delete>
       * @description  Remove key and matching value if found
       * @param        {Any} key
       * @return       {Boolean} true if item was in collection
       */
      function delete_(key){
        var hash = unwrap(this)[validate(key)];

        if (key in hash) {
          delete hash[key];
          return true;
        }

        return false;
      },
      /**
       * @method       <map>
       * @description  Loop through the collection adding the return value for each to an array and returns it
       * @param        {Function} callback  `callback(value, key)`
       * @param        {Object}   context    The `this` binding for callbacks, default null
       * @return       {Array}  collected return values
       */
      function map(callback, context){
        var hash = unwrap(this),
            out = [];

        context = context == null ? global : context;

        for (var i=0; i < 3; i++)
          for (var key in hash[i])
            out.push(callback.call(context, hash[i][key], uncoerce(i, key), this));

        return out;
      },
      /**
       * @method       <forEach>
       * @description  Loop through the collection raising callback for each
       * @param        {Function} callback  `callback(value, key)`
       * @param        {Object}   context    The `this` binding for callbacks, default null
       */
      function forEach(callback, context){
        this.map(callback, context);
      }
    ];
  });



  // ###########
  // ### Map ###
  // ###########

  exporter('Map', function(wrap, unwrap){
    var type = function(o){
      return o != null && typeof o === 'object' || typeof o === 'function' ? 1 : 0;
    }
    /**
     * @class Map
     * @description Collection that allows any kind of value to be a key.
     */
    return [
      function Map(){
        if (!(this instanceof Map))
          return new Map;

        wrap(this, {
          0: new exports.HashMap,
          1: new exports.WeakMap,
          keys: [],
          values: []
        });
      },
      /**
       * @method       <get>
       * @description  Retrieve the value in the collection that matches key
       * @param        {Any} key
       * @return       {Any}
       */
      function get(key){
        var maps = unwrap(this);
        return maps.values[maps[type(key)].get(key)];
      },
      /**
       * @method       <set>
       * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
       * @param        {Any} key
       * @param        {Any} val
       **/
      function set(key, value){
        var maps = unwrap(this),
            map = maps[type(key)],
            index = map.get(key);

        if (index === undefined) {
          map.set(key, maps.keys.length);
          maps.keys.push(key);
          maps.values.push(value);
        } else {
          maps.keys[index] = key;
          maps.values[index] = value;
        }
      },
      /**
       * @method       <has>
       * @description  Check if key exists in the collection.
       * @param        {Any} key
       * @return       {Boolean} is in collection
       **/
      function has(key){
        return unwrap(this)[type(key)].has(key);
      },
      /**
       * @method       <delete>
       * @description  Remove key and matching value if found
       * @param        {Any} key
       * @return       {Boolean} true if item was in collection
       */
      function delete_(key){
        var maps = unwrap(this),
            map = maps[type(key)],
            index = map.get(key);

        if (index === undefined)
          return false;

        map.delete(key);
        maps.keys.splice(index, 1);
        maps.values.splice(index, 1);
        return true;
      },
      /**
       * @method       <map>
       * @description  Loop through the collection adding the return value for each to an array and returns it
       * @param        {Function} callback  `callback(value, key)`
       * @param        {Object}   context    The `this` binding for callbacks, default null
       * @return       {Array}  collected return values
       */
      function map(callback, context){
        var maps = unwrap(this),
            keys = maps.keys,
            values = maps.values,
            out = [];

        context = context == null ? global : context;

        for (var i=0, len=keys.length; i < len; i++)
          out.push(callback.call(context, values[i], keys[i]));

        return out;
      },
      /**
       * @method       <forEach>
       * @description  Loop through the collection raising callback for each
       * @param        {Function} callback  `callback(value, key)`
       * @param        {Object}   context    The `this` binding for callbacks, default null
       */
      function forEach(callback, context){
        this.map(callback, context);
      }
    ];
  });



  // ###########
  // ### Set ###
  // ###########

  exporter('Set', function(wrap, unwrap){
    /**
     * @class        |Set|
     * @description  Collection of values that enforces uniqueness.
     **/
    return [
      function Set(){
        if (!(this instanceof Set))
          return new Set;

        wrap(this, new exports.Map);
      },
      /**
       * @method       <add>
       * @description  Insert value if not found, enforcing uniqueness.
       * @param        {Any} val
       */
      function add(key){
        unwrap(this).set(key, key);
      },
      /**
       * @method       <has>
       * @description  Check if key exists in the collection.
       * @param        {Any} key
       * @return       {Boolean} is in collection
       **/
      function has(key){
        return unwrap(this).has(key);
      },
      /**
       * @method       <delete>
       * @description  Remove key and matching value if found
       * @param        {Any} key
       * @return       {Boolean} true if item was in collection
       */
      function delete_(key){
        return unwrap(this).delete(key);
      },
      /**
       * @method       <map>
       * @description  Loop through the collection adding the return value for each to an array and returns it.
                       Index is simply the counter for the current iteration.
       * @param        {Function} callback  `callback(value, index)`
       * @param        {Object}   context    The `this` binding for callbacks, default null
       * @return       {Array}  collected return values
       */
      function map(callback, context){
        var index = 0;
        return unwrap(this).map(function(key){
          return callback.call(this, key, index++);
        }, context);
      },
      /**
       * @method       <forEach>
       * @description  Loop through the collection raising callback for each. Index is simply the counter for the current iteration.
       * @param        {Function} callback  `callback(value, index)`
       * @param        {Object}   context    The `this` binding for callbacks, default null
       */
      function forEach(callback, context){
        var index = 0;
        unwrap(this).forEach(function(key){
          callback.call(this, key, index++);
        }, context);
      }
    ];
  });
}(Object, Function.prototype, Function('return this')(), typeof exports === 'undefined' ? this : exports, {});
