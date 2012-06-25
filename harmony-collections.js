void function(global, exports, undefined){
  "use strict";
  // Original WeakMap implementation by Gozala @ https://gist.github.com/1269991
  // Updated and bugfixed by Raynos @ https://gist.github.com/1638059
  // Expanded by Benvie @ https://github.com/Benvie/ES6-Harmony-Collections-Shim

  var toCode = Function.prototype.call.bind(Function.prototype.toString),
      hasOwn = Object.prototype.hasOwnProperty,
      keystore = Object.create.bind(null, null),
      UNDEFINED = {},
      hidden = { enumerable: false },
      cryoDesc = { writable: true, value: undefined };




  function isObject(o){
    return o != null && typeof o === 'object' || typeof o === 'function';
  }

  function isPrimitive(o){
    return o == null || typeof o !== 'object' && typeof o !== 'function';
  }


  function provide(name, init){
    if (!exports[name]) {
      var locker = new Locker(name);
      exports[name] = init(locker.wrapper(), locker.unwrapper());
    }
  }

  function cryostore(o){
    var descs = {};
    o = Object(o);

    (Array.isArray(o) ? o : Object.keys(o)).forEach(function(name){
      if (name in o)
        descs[name] = { value: o[name], writable: true };
      else
        descs[name] = cryoDesc;
    });

    return Object.preventExtensions(Object.create(null, descs));
  }

  var UID = function(){
    var keys = keystore();
    return function UID(){
      var key = '$'+(Math.random() / 1.1).toString(36).slice(2);
      return key in keys ? UID() : keys[key] = key;
    };
  }();



  if (Function.prototype.name == null) {
    // patch IE's lack of name property on functions
    void function(){
      Object.defineProperty(Function.prototype, 'name', {
        configurable: true,
        get: function getFunctionName(){
          if (this === Function.prototype)
            return 'Empty';

          var src = toCode(this);
          src = src.slice(9, src.indexOf('('));
          Object.defineProperty(this, 'name', { value: src });
          return src
        }
      });
    }();
  }



  var definer = function(){

    var nativeSrc = toCode(Object).replace(/\n/g,'\\n').replace('Object', '"+this.name+"');
    var code = 'return function toString(){ return "'+nativeSrc+'" }';

    var toString = { configurable: true,
                     writable: true,
                     value: new Function(code)() };

    function nativeToString(fn){
      if (!hasOwn.call(fn, 'toString') && fn.toString !== toString.value)
        Object.defineProperty(fn, 'toString', toString);
      return fn;
    }

    return {
      enumerable: false,
      configurable: true,
      writable: true,
      define: function define(object, fn){
        this.value = fn;
        Object.defineProperty(object, fn.name, this);
        nativeToString(fn);
        this.value = null;
      }
    };
  }();


  // #############
  // ### Class ###
  // #############

  function Class(description){
    this.proto = {};

    Object.keys(description).forEach(function(key){
      if (typeof description[key] === 'function')
        this.addMethod(key, description[key]);
    }, this);

    return this.ctor;
  }

  Class.prototype.addMethod = function addMethod(name, method){
    if (typeof name === 'function') {
      method = name;
      name = method.name;
    }
    definer.define(this.proto, method)
    if (name === 'constructor')
      this.setConstructor(method);
  };

  Class.prototype.setConstructor = function setConstructor(Ctor){
    Ctor.prototype = this.proto;
    this.ctor = Ctor;

    var brand = this.brand = '[object ' + Ctor.name + ']';
    this.addMethod(function toString(){ return brand });
  };

  var Locker = function(){

    // common per-object storage area made hidden by patching getOwnPropertyNames
    var perObjectStorage = function()
{      var ownNames = Object.getOwnPropertyNames;
      var globalUID = UID();

      definer.define(Object, function getOwnPropertyNames(obj){
        var props = ownNames(obj);
        if (hasOwn.call(obj, globalUID))
          props.splice(props.indexOf(globalUID), 1);
        return props;
      });

      // check for the random key on an object, create new storage if missing, return it
      return function perObjectStorage(obj){
        if (hasOwn.call(obj, globalUID)) {
          return obj[globalUID];
        } else {
          var store = keystore();
          if (Object.isExtensible(obj)) {
            Object.defineProperty(obj, globalUID, { value: store });
            return store;
          } else {
            throw new Error('Storage for non-extensible objects not implemented yet');
          }
        }
      }
    }();


    var lockerSrc = '"use strict"; return function(key){ if (key === hashkey) return lockbox; }';

    // ##############
    // ### Locker ###
    // ##############

    return new Class({
      constructor: function Locker(name){
        var privateUID = UID();
        var hashkey = keystore();

        this.name = name;
        this.unlocker = function unlocker(obj){
          var storage = perObjectStorage(obj);
          if (hasOwn.call(storage, privateUID)) {
            return storage[privateUID](hashkey);
          } else {
            // a lockbox is a sealed object with only one writable property named 'value'
            var lockbox = Object.create(null, { value: cryoDesc });

            Object.defineProperty(storage, privateUID, {
              configurable: true,
              value: new Function('hashkey','lockbox', lockerSrc)(hashkey, lockbox)
            });

            return Object.preventExtensions(lockbox);
          }
        };
      },
      get: function get(obj){
        return this.unlocker(obj).value;
      },
      set: function set(obj, value){
        return this.unlocker(obj).value = value;
      },
      wrapper: function wrapper(){
        var self = this;
        return function wrap(obj, value){
          self.unlocker(obj).value = value;
        }
      },
      unwrapper: function unwrapper(){
        var self = this;
        return function unwrap(obj){
          var value = self.unlocker(obj).value;
          if (!value)
            throw new TypeError(self.name + " is not generic.");
          else
            return value;
        }
      }
    });
  }();



  // ############
  // ### Item ###
  // ############

  var Item = new Class({
    constructor: function Item(key, value){
      this.key = key;
      this.value = value;
    },
    key: null,
    value: null,
    valueOf: function valueOf(){
      return this.value;
    }
  });


  // ###############
  // ### WeakMap ###
  // ###############

  provide('WeakMap', function(wrap, unwrap){

    function validate(key){
      if (isPrimitive(key))
        throw new TypeError("WeakMap keys must be objects");
    }

    /**
     * @class WeakMap
     * @description Collection using objects with unique identities as keys that disallows enumeration
     *  and allows for better garbage collection.
     */
    return new Class({
      constructor: function WeakMap(){
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
      get: function get(key){
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
      set: function set(key, value){
        validate(key);
        // store a token for explicit undefined so that "has" works correctly
        if (value === undefined)
          value = UNDEFINED;
        unwrap(this).set(key, value);
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




  // ###############
  // ### HashMap ###
  // ###############

  provide('HashMap', function(wrap, unwrap){
    var STRING = 'string',
        NUMBER = 'number',
        OTHER = 'other';

    var others = {
      'false': false,
      'true': true,
      'null': null,
      0: -0
    };

    function uncoerce(type, key){
      switch (type) {
        case STRING: return key;
        case NUMBER: return +key;
        case OTHER: return others[key];
      }
    }

    function isNegativeZero(n){
      return n === 0 && Infinity / n === -Infinity;
    }

    function validate(key){
      if (key == null)
        return OTHER;
      else {
        switch (typeof key) {
          case 'string': return STRING;
          case 'number': return isNegativeZero(key) ? OTHER : NUMBER;
          case 'boolean': return OTHER;
          case 'function':
          case 'object':
            if (key instanceof String)
              return STRING;
            else if (key instanceof Number)
              return isNegativeZero(key /= 1) ? OTHER : NUMBER;
            else if (key instanceof Boolean)
              return OTHER;
            else
              throw new TypeError("HashMap keys must be primitive");
        }
      }
    }

    /**
     * @class HashMap
     * @description Collection that only allows primitives to be keys.
     */
    return new Class({
      constructor: function HashMap(){
        if (!(this instanceof HashMap))
          return new HashMap;

        var types = keystore();
        types.string = keystore();
        types.number = keystore();
        types.other = keystore();
        wrap(this, types);
      },
      /**
       * @method       <get>
       * @description  Retrieve the value in the collection that matches key
       * @param        {Any} key
       * @return       {Any}
       */
      get: function get(key){
        return unwrap(this)[validate(key)][key];
      },
      /**
       * @method       <set>
       * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
       * @param        {Any} key
       * @param        {Any} val
       **/
      set: function set(key, value){
        unwrap(this)[validate(key)][key] = value;
      },
      /**
       * @method       <has>
       * @description  Check if key exists in the collection.
       * @param        {Any} key
       * @return       {Boolean} is in collection
       **/
      has: function has(key){
        return key in unwrap(this)[validate(key)];
      },
      /**
       * @method       <delete>
       * @description  Remove key and matching value if found
       * @param        {Any} key
       * @return       {Boolean} true if item was in collection
       */
      delete: function delete_(key){
        var hash = unwrap(this)[validate(key)];
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
        var hash = unwrap(this);
        var out = [];

        for (var type in hash)
          for (var key in hash[type])
            out.push(uncoerce(type, key));

        return out;
      },
      /**
       * @method       <values>
       * @description  Returns an array containing the values
       * @return       {Array}
       **/
      values: function values(){
        var hash = unwrap(this);
        var out = [];

        for (var type in hash)
          for (var key in hash[type])
            out.push(hash[type][key]);

        return out;
      },
      /**
       * @method       <items>
       * @description  Returns an array containing key:value pairs
       * @return       {Item[]}
       **
       **/
      items: function items(){
        var out = [];
        this.iterate(function(value, key){
          out.push(new Item(key, value));
        });
        return out;
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

        for (var type in hash)
          for (var key in hash[type])
            callback.call(context, hash[type][key], uncoerce(type, key), this);
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



  // ###########
  // ### Map ###
  // ###########

  provide('Map', function(wrap, unwrap){

    /**
     * @class Map
     * @description Collection that allows any kind of value to be a key.
     */
    return new Class({
      constructor: function Map(){
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
      get: function get(key){
        var map = unwrap(this);
        return map.values[map[+isObject(key)].get(key)];
      },
      /**
       * @method       <set>
       * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
       * @param        {Any} key
       * @param        {Any} val
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
       * @method       <items>
       * @description  Returns an array containing key:value pairs
       * @return       {Item[]}
       **
       **/
      items: function items(){
        var out = [];
        this.iterate(function(value, key){
          out.push(new Item(key, value));
        });
        return out;
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
      }
    });
  });



  // ###########
  // ### Set ###
  // ###########

  provide('Set', function(wrap, unwrap){

    /**
     * @class        |Set|
     * @description  Collection of values that enforces uniqueness.
     **/
    return new Class({
      constructor: function Set(){
        if (!(this instanceof Set))
          return new Set;

        wrap(this, new exports.Map);
      },
      /**
       * @method       <add>
       * @description  Insert value if not found, enforcing uniqueness.
       * @param        {Any} val
       */
      add: function add(key){
        unwrap(this).set(key, true);
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
}(new Function('return this')(), typeof exports === 'undefined' ? this : exports);
