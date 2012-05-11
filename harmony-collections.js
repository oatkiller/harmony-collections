!function(exports, global){
  "use strict";
  // Original WeakMap implementation by Gozala @ https://gist.github.com/1269991
  // Updated and bugfixed by Raynos @ https://gist.github.com/1638059
  // Expanded by Benvie @ https://github.com/Benvie/ES6-Harmony-Collections-Shim

  function isObject(o){
    return Object(o) === o;
  }

  function isPrimitive(o){
    return Object(o) !== o;
  }

  var Fproto = Function.prototype;
  var callbind = Fproto.bind.bind(Fproto.call);
  var hasOwn = callbind(Object.prototype.hasOwnProperty);
  var keystore = Object.create.bind(null, null);

  var UID = function(){
    var keys = keystore();
    return function UID(){
      var key = '$'+(Math.random() / 1.1).toString(36).slice(2);
      return key in keys ? UID() : keys[key] = key;
    }
  }();


  if (!Fproto.name) {
    // patch IE's lack of name property on functions
    !function(){
      var toCode = callbind(Fproto.toString);
      Object.defineProperty(Fproto, 'name', {
        configureable: true,
        get: function(){
          if (this === Fproto)
            return 'Empty';
          var src = toCode(this);
          src = src.slice(9, src.indexOf('('));
          Object.defineProperty(this, 'name', { value: src });
          return src
        }
      });
    }();
  }

  var Locker = function(){

    // common per-object storage area made hidden by patching getOwnPropertyNames
    var perObjectStorage = function(){
      var getProps = Object.getOwnPropertyNames;
      var globalUID = UID();

      Object.defineProperty(Object, 'getOwnPropertyNames', {
        configurable: true,
        writable: true,
        value: function getOwnPropertyNames(obj){
          var props = getProps(obj);
          if (hasOwn(obj, globalUID))
            props.splice(props.indexOf(globalUID), 1);
          return props;
        }
      });

      // check for the random key on an object, create new storage if missing, return it
      return function perObjectStorage(obj){
        if (hasOwn(obj, globalUID))
          return obj[globalUID];
        else {
          var store = keystore();
          if (Object.isExtensible(obj))
            Object.defineProperty(obj, globalUID, { value: store });
          else
            throw new Error('Storage for non-extensible objects not implemented yet');
          return store;
        }
      }
    }();

    function Locker(name){
      var privateUID = UID();
      var hashkey = keystore();
      var src = '"use strict"; return function(k){ if (k === h) return l; else throw new Error("Unauthorized access to Locker"); }';

      this.name = name;
      this.unlocker = function unlocker(obj){
        var storage = perObjectStorage(obj);
        if (hasOwn(storage, privateUID))
          return storage[privateUID](hashkey);
        else {
          // a lockbox is a sealed object with only one writable property named 'value'
          var lockbox = Object.preventExtensions(Object.create(null, {
            value: { writable: true, value: undefined }
          }));
          Object.defineProperty(storage, privateUID, {
            configurable: true,
            value: new Function('h','l', src)(hashkey, lockbox)
          });
          return lockbox;
        }
      };
    }

    Locker.prototype = {
      get: function get(obj){
        return this.unlocker(obj).value;
      },
      set: function set(obj, value){
        return this.unlocker(obj).value = value;
      },
      unwrapper: function unwrapper(){
        var self = this;
        return function unwrap(o){
          var item = self.unlocker(o).value;
          if (!item)
            throw new TypeError(self.name + " is not generic.");
          else
            return item;
        }
      }
    };

    return Locker;
  }();

  !function(){
    function Pair(key, value){
      this.key = key;
      this.value = value;
    }

    Pair.prototype.valueOf = function valueOf(){
      return this.value;
    };

    function provide(name, init){
      if (!exports[name])
        exports[name] = init();
    }

    var assemble = function(){
      var code = 'return function toString(){ return "'+(Object+'').replace(/\n/g,'\\n').replace('Object', '"+this.name+"')+'" }',
          toString = { configurable: true,  writable: true,  value: new Function(code)()  },
          hidden = { enumerable: false };

      if (Function.__proto__) {
        var fnproto = Object.create(Function.prototype, { toString: toString });
        var setToString = function setProto(fn){
          fn.__proto__ = fnproto;
        };
      } else {
        var setToString = function setToString(fn){
          Object.defineProperty(fn, 'toString', toString);
        };
      }

      function nativeToString(fn){
        if (!hasOwn(fn, 'toString') && fn.toString !== toString.value)
          setToString(fn);
        return fn;
      }

      // assemble takes a prototype and prepares it for exporting as a class
      return function assemble(proto){
        var brand = '[object '+proto.constructor.name+']';

        proto.toString = function toString(){
          return brand;
        };

        Object.keys(proto).forEach(function(key){
          Object.defineProperty(proto, key, hidden);
          if (typeof proto[key] === 'function')
            nativeToString(proto[key]);
        });

        proto.constructor.prototype = proto;
        return proto.constructor;
      }
    }();



    provide('WeakMap', function(){
      var weakmaps = new Locker('WeakMap');
      var unwrap = weakmaps.unwrapper();

      function validate(key){
        if (isPrimitive(key))
          throw new TypeError("WeakMap keys must be objects");
      }

      /**
       * @class WeakMap
       * @description Collection using objects with unique identities as keys that disallows enumeration
       *  and allows for better garbage collection.
       */
      return assemble({
        constructor: function WeakMap(){
          if (!(this instanceof WeakMap))
            return new WeakMap;
          weakmaps.set(this, new Locker);
        },
        /**
         * @method       <get>
         * @description  Retrieve the value in the collection that matches key
         * @param        {Any} key
         * @return       {Any}
         */
        get: function get(key){
          validate(key);
          return unwrap(this).get(key);
        },
        /**
         * @method       <set>
         * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
         * @param        {Any} key
         * @param        {Any} val
         * @return       {Any} returns value passed in
         **/
        set: function set(key, value){
          validate(key);
          return unwrap(this).set(key, value);
        },
        /*
         * @method       <has>
         * @description  Check if key is in the collection
         * @param        {Any} key
         * @return       {Boolean}
         **/
        has: function has(key){
          validate(key);
          return unwrap(this).get(key) !== undefined;
        },
        /**
         * @method       <delete>
         * @description  Remove key and matching value if found
         * @param        {Any} key
         * @return       {Boolean} true if item was in collection
         */
        delete: function delete_(key){
          validate(key);
          var weakmap = unwrap(this);
          if (weakmap.get(key) !== undefined) {
            weakmap.set(key, undefined);
            return true;
          } else
            return false;
        }
      });
    });



    provide('Hashmap', function(){
      var hashmaps = new Locker('Hashmap');
      var unwrap = hashmaps.unwrapper();

      function validate(key){
        if (key) {
          var type = typeof key;
          if (type === 'object' || type === 'function') {
            if (typeof key.valueOf === 'function')
              key = key.valueOf();
            if (isObject(key))
              throw new TypeError("Hashmap keys must have a primitive value");
          }
        }
        return String(key);
      }

      /**
       * @class Hashmap
       * @description Collection that only allows primitives to be keys.
       */
      return assemble({
        constructor: function Hashmap(){
          if (!(this instanceof Hashmap))
            return new Hashmap;
          hashmaps.set(this, keystore());
        },
        /**
         * @method       <get>
         * @description  Retrieve the value in the collection that matches key
         * @param        {Any} key
         * @return       {Any}
         */
        get: function get(key){
          key = validate(key);
          return unwrap(this)[key];
        },
        /**
         * @method       <set>
         * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
         * @param        {Any} key
         * @param        {Any} val
         * @return       {Any} returns value passed in
         **/
        set: function set(key, value){
          key = validate(key);
          return unwrap(this)[key] = value;
        },
        /**
         * @method       <has>
         * @description  Check if key exists in the collection.
         * @param        {Any} key
         * @return       {Boolean} is in collection
         **/
        has: function has(key){
          key = validate(key);
          return key in unwrap(this);
        },
        /**
         * @method       <delete>
         * @description  Remove key and matching value if found
         * @param        {Any} key
         * @return       {Boolean} true if item was in collection
         */
        delete: function delete_(key){
          key = validate(key);
          var hash = unwrap(this);
          if (key in hash) {
            delete hash[key];
            return true;
          } else
            return false;
        },
        /**
         * @method       <keys>
         * @description  Returns an array containing the keys
         * @return       {Array}
         **/
        keys: function keys(){
          return Object.keys(unwrap(this));
        },
        /**
         * @method       <values>
         * @description  Returns an array containing the values
         * @return       {Array}
         **/
        values: function values(){
          var hash = unwrap(this);
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
        iterate: function iterate(callback, context){
          var hash = unwrap(this);
          context = isObject(context) ? context : global;
          for (var k in hash)
            callback.call(context, hash[k], k);
        },
        /**
         * @method       <toArray>
         * @description  Returns an array containing key:value pairs
         * @return       {Pair[]}
         **
         **/
        toArray: function toArray(){
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
        toObject: function toObject(){
          var out = {};
          this.iterate(function(value, key){
            out[key] = value;
          });
          return out;
        }
      });
    });



    provide('Map', function(){
      var maps = new Locker('Map');
      var unwrap = maps.unwrapper();

      /**
       * @class Map
       * @description Collection that allows any kind of value to be a key.
       */
      return assemble({
        constructor: function Map(){
          if (!(this instanceof Map))
            return new Map;

          maps.set(this, {
            0: new exports.Hashmap,
            1: new exports.WeakMap,
            keys: [],
            values: []
          });
          return this;
        },
        /**
         * @method       <get>
         * @description  Retrieve the value in the collection that matches key
         * @param        {Any} key
         * @return       {Any}
         */
        get: function get(key){
          var map = unwrap(this);
          return map.values[map[+isObject(key)].get(key)];
        },
        /**
         * @method       <set>
         * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
         * @param        {Any} key
         * @param        {Any} val
         * @return       {Any} returns value passed in
         **/
        set: function set(key, value){
          var map = unwrap(this),
              table = map[+isObject(key)],
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
        has: function has(key){
          return unwrap(this)[+isObject(key)].has(key);
        },
        /**
         * @method       <delete>
         * @description  Remove key and matching value if found
         * @param        {Any} key
         * @return       {Boolean} true if item was in collection
         */
        delete: function delete_(key){
          var map = unwrap(this),
              table = map[+isObject(key)],
              index = table.get(key);

          if (index === undefined)
            return false;
          else {
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
        keys: function keys(){
          return unwrap(this).keys.slice();
        },
        /**
         * @method       <values>
         * @description  Returns an array containing the values
         * @return       {Array}
         **/
        values: function values(){
          return unwrap(this).values.slice();
        },
        /**
         * @method       <iterate>
         * @description  Loop through the collection raising callback for each
         * @param        {Function} callback  `callback(value, key|index)`
         * @param        {Object}   context    The `this` binding for callbacks, default null
         */
        iterate: function iterate(callback, context){
          var map = unwrap(this),
              keys = map.keys,
              values = map.values;

          context = isObject(context) ? context : global;

          for (var i=0, len=keys.length; i < len; i++)
            callback.call(context, values[i], keys[i]);
        },
        /**
         * @method       <toArray>
         * @description  Returns an array containing key:value pairs
         * @return       {Pair[]}
         **
         **/
        toArray: function toArray(){
          var out = [];
          this.iterate(function(value, key){
            out.push(new Pair(key, value));
          });
          return out;
        }
      });
    });



    provide('Set', function(){
      var sets = new Locker('Set');
      var unwrap = sets.unwrapper();

      /**
       * @class        |Set|
       * @description  Collection of values that enforces uniqueness.
       **/
      return assemble({
        constructor: function Set(){
          if (!(this instanceof Set))
            return new Set;
          sets.set(this, new exports.Map);
        },
        /**
         * @method       <add>
         * @description  Insert value if not found, enforcing uniqueness.
         * @param        {Any} val
         */
        add: function add(key){
          return unwrap(this).set(key, true);
        },
        /**
         * @method       <has>
         * @description  Check if key exists in the collection.
         * @param        {Any} key
         * @return       {Boolean} is in collection
         **/
        has: function has(key){
          return unwrap(this).has(key);
        },
        /**
         * @method       <delete>
         * @description  Remove key and matching value if found
         * @param        {Any} key
         * @return       {Boolean} true if item was in collection
         */
        delete: function delete_(key){
          return unwrap(this).delete(key);
        },
        /**
         * @method       <values>
         * @description  Returns an array containing the values
         * @return       {Array}
         **/
        values: function values(callback, context){
          return unwrap(this).keys();
        },
        /**
         * @method       <iterate>
         * @description  Loop through the collection raising callback for each
         * @param        {Function} callback  `callback(value, key|index)`
         * @param        {Object}   context    The `this` binding for callbacks, default null
         */
        iterate: function iterate(callback, context){
          this.keys().forEach(callback, isObject(context) ? context : global);
        }
      });
    });
  }();
}(typeof module === 'undefined' ? this : module.exports, new Function('return this')())
