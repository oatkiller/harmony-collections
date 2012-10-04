/* (The MIT License)
 *
 * Copyright (c) 2012 Brandon Benvie <http://bbenvie.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the 'Software'), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included with all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY  CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// Original WeakMap implementation by Gozala @ https://gist.github.com/1269991
// Updated and bugfixed by Raynos @ https://gist.github.com/1638059
// Expanded by Benvie @ https://github.com/Benvie/harmony-collections

void function(string_, object_, function_, prototype_, toString_, Array, Object, Function, FP, global, exports, undefined_, undefined){

  var getProperties = Object.getOwnPropertyNames,
      es5 = typeof getProperties === function_ && !(prototype_ in getProperties);

  var callbind = FP.bind
    ? FP.bind.bind(FP.call)
    : (function(call){
        return function(fn){
          return function(){
            return call.apply(fn, arguments);
          };
        };
      }(FP.call));

  var functionToString = callbind(FP[toString_]),
      objectToString = callbind({}[toString_]),
      numberToString = callbind(.0.toString),
      call = callbind(FP.call),
      apply = callbind(FP.apply),
      hasOwn = callbind({}.hasOwnProperty),
      push = callbind([].push),
      splice = callbind([].splice);

  var name = function(f){
    if (typeof f !== function_)
      return '';
    else if ('name' in f)
      return f.name;

    return functionToString(f).match(/^\n?function\s?(\w*)?_?\(/)[1];
  };

  var create = es5
    ? Object.create
    : function(proto, descs){
        var Ctor = function(){}
        Ctor[prototype_] = Object(proto);
        var out = new Ctor;

        if (descs)
          for (var k in descs)
            defineProperty(out, k, descs[k]);

        return out;
      };

  var defineProperty = es5
    ? Object.defineProperty
    : function(o, k, desc) {
        o[k] = desc.value;
        return o;
      };

  var define = function(o, k, v){
    if (typeof k === function_) {
      v = k;
      k = name(v).replace(/_$/, '');
    }

    return defineProperty(o, k, { configurable: true, writable: true, value: v });
  };

  var isArray = es5
    ? (function(isArray){
        return function(o){
          return isArray(o) || o instanceof Array;
        };
      })(Array.isArray)
    : function(o){
        return o instanceof Array || objectToString(o) === '[object Array]';
      };

  // ############
  // ### Data ###
  // ############

  var Data = (function(){
    var locker = 'return function(k){if(k===s)return l}',
        random = Math.random,
        uids = create(null),
        slice = callbind(''.slice),
        indexOf = callbind([].indexOf);

    var createUID = function(){
      var key = slice(numberToString(random(), 36), 2);
      return key in uids ? createUID() : uids[key] = key;
    };

    var globalID = createUID();

    // common per-object storage area made visible by patching getOwnPropertyNames'
    function getOwnPropertyNames(obj){
      var props = getProperties(obj);
      if (hasOwn(obj, globalID))
        splice(props, indexOf(props, globalID), 1);
      return props;
    }

    if (es5) {
      // check for the random key on an object, create new storage if missing, return it
      var storage = function(obj){
        if (!hasOwn(obj, globalID))
          defineProperty(obj, globalID, { value: create(null) });
        return obj[globalID];
      };

      define(Object, getOwnPropertyNames);
    } else {

      var toStringToString = function(s){
        function toString(){ return s }
        return toString[toString_] = toString;
      }(Object[prototype_][toString_]+'');

      // store the values on a custom valueOf in order to hide them but store them locally
      var storage = function(obj){
        if (hasOwn(obj, toString_) && globalID in obj[toString_])
          return obj[toString_][globalID];

        if (!(toString_ in obj))
          throw new Error("Can't store values for "+obj);

        var oldToString = obj[toString_];
        function toString(){ return oldToString.call(this) }
        obj[toString_] = toString;
        toString[toString_] = toStringToString;
        return toString[globalID] = {};
      };
    }



    function Data(name){
      var puid = createUID(),
          iuid = createUID(),
          secret = {};

      secret[iuid] = { writable: true, value: undefined };

      var attach = function(obj){
        var store = storage(obj);
        if (hasOwn(store, puid))
          return store[puid](secret);

        var lockbox = create(null, secret);
        defineProperty(store, puid, {
          value: new Function('s', 'l', locker)(secret, lockbox)
        });
        return lockbox;
      };

      this.get = function(o){
        return attach(o)[iuid];
      };
      this.set = function(o, v){
        return attach(o)[iuid] = v;
      };

      if (name) {
        this.wrap = function(o, v){
          var lockbox = attach(o);
          if (lockbox[iuid])
            throw new TypeError("Object is already a " + name);
          lockbox[iuid] = v;
        };
        this.unwrap = function(o){
          var storage = attach(o)[iuid];
          if (!storage)
            throw new TypeError(name + " is not generic");
          return storage;
        };
      }
    }

    return Data;
  }());


  var exporter = (function(){
    var src = (''+Object).split('Object');

    function toString(){
      return src[0] + name(this) + src[1];
    }

    define(toString, toString);

    var prepFunction = { __proto__: [] } instanceof Array
      ? function(f){ f.__proto__ = toString }
      : function(f){ define(f, toString) };

    var prepare = function(def){
      var Ctor = def.shift();
      void function(){
        var brand = '[object ' + name(Ctor) + ']';
        function toString(){ return brand }
        def.push(toString);
      }();
      for (var i=0; i < def.length; i++) {
        prepFunction(def[i]);
        define(Ctor[prototype_], def[i]);
      }
      prepFunction(Ctor);
      return Ctor;
    }

    return function(name, init){
      if (name in exports)
        return exports[name];

      var data = new Data(name);

      return exports[name] = prepare(init(
        function(collection, value){
          data.wrap(collection, value);
        },
        function(collection){
          return data.unwrap(collection);
        }
      ));
    };
  }());


  var initialize = function(iterable, callback){
    if (iterable !== null && typeof iterable === object_ && typeof iterable.forEach === function_) {
      iterable.forEach(function(item, i){
        if (isArray(item) && item.length === 2)
          callback(iterable[i][0], iterable[i][1]);
        else
          callback(iterable[i], i);
      });
    }
  }


  var fixDelete = function(func, scopeNames, scopeValues){
    try {
      scopeNames[scopeNames.length] = ('return '+func).replace('e_', '\\u0065');
      return Function.apply(0, scopeNames).apply(0, scopeValues);
    } catch (e) {
      return func;
    }
  }

  // ###############
  // ### WeakMap ###
  // ###############

  var WeakMap = exporter('WeakMap', function(wrap, unwrap){
    var prototype = WeakMap[prototype_];
    var validate = function(key){
      if (key == null || typeof key !== object_ && typeof key !== function_)
        throw new TypeError("Invalid WeakMap key");
    }

    /**
     * @class        WeakMap
     * @description  Collection using objects with unique identities as keys that disallows enumeration
     *               and allows for better garbage collection.
     * @param        {Iterable} [iterable]  An item to populate the collection with.
     */
    function WeakMap(iterable){
      if (this === global || this == null || this === prototype)
        return new WeakMap(iterable);

      wrap(this, new Data);

      var self = this;
      iterable && initialize(iterable, function(value, key){
        call(set, self, value, key);
      });
    }
    /**
     * @method       <get>
     * @description  Retrieve the value in the collection that matches key
     * @param        {Any} key
     * @return       {Any}
     */
    function get(key){
      validate(key);
      var value = unwrap(this).get(key);
      return value === undefined_ ? undefined : value;
    }
    /**
     * @method       <set>
     * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
     * @param        {Any} key
     * @param        {Any} val
     **/
    function set(key, value){
      validate(key);
      // store a token for explicit undefined so that "has" works correctly
      unwrap(this).set(key, value === undefined ? undefined_ : value);
    }
    /*
     * @method       <has>
     * @description  Check if key is in the collection
     * @param        {Any} key
     * @return       {Boolean}
     **/
    function has(key){
      validate(key);
      return unwrap(this).get(key) !== undefined;
    }
    /**
     * @method       <delete>
     * @description  Remove key and matching value if found
     * @param        {Any} key
     * @return       {Boolean} true if item was in collection
     */
    function delete_(key){
      validate(key);
      var data = unwrap(this);

      if (data.get(key) === undefined)
        return false;

      data.set(key, undefined);
      return true;
    }

    delete_ = fixDelete(delete_, ['validate', 'unwrap'], [validate, unwrap]);
    return [WeakMap, get, set, has, delete_];
  }),


  // ###############
  // ### HashMap ###
  // ###############

  HashMap = exporter('HashMap', function(wrap, unwrap){
    var prototype = HashMap[prototype_],
        STRING = 0, NUMBER = 1, OTHER = 2,
        others = { 'true': true, 'false': false, 'null': null, 0: -0 };

    if ('toString' in create(null)) {
      var coerce = function(key){
        return typeof key === string_ ? '_'+key : ''+key;
      };
      var uncoerceString = function(key){
        return key.slice(1);
      }
    } else {
      var uncoerceString = coerce = function(key){
        return key;
      };
    }

    var uncoerce = function(type, key){
      switch (type) {
        case STRING: return uncoerceString(key);
        case NUMBER: return +key;
        case OTHER: return others[key];
      }
    }


    var validate = function(key){
      if (key == null) return OTHER;
      switch (typeof key) {
        case 'boolean': return OTHER;
        case string_: return STRING;
        case 'number': return key === 0 && Infinity / key === -Infinity ? OTHER : NUMBER;
        default: throw new TypeError("Invalid HashMap key");
      }
    }

    /**
     * @class          HashMap
     * @description    Collection that only allows primitives to be keys.
     * @param          {Iterable} [iterable]  An item to populate the collection with.
     */
    function HashMap(iterable){
      if (this === global || this == null || this === prototype)
        return new HashMap(iterable);

      wrap(this, {
        size: 0,
        0: create(null),
        1: create(null),
        2: create(null)
      });

      var self = this;
      iterable && initialize(iterable, function(value, key){
        call(set, self, value, key);
      });
    }
    /**
     * @method       <get>
     * @description  Retrieve the value in the collection that matches key
     * @param        {Any} key
     * @return       {Any}
     */
    function get(key){
      return unwrap(this)[validate(key)][coerce(key)];
    }
    /**
     * @method       <set>
     * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
     * @param        {Any} key
     * @param        {Any} val
     **/
    function set(key, value){
      var items = unwrap(this),
          data = items[validate(key)];

      key = coerce(key);
      key in data || items.size++;
      data[key] = value;
    }
    /**
     * @method       <has>
     * @description  Check if key exists in the collection.
     * @param        {Any} key
     * @return       {Boolean} is in collection
     **/
    function has(key){
      return coerce(key) in unwrap(this)[validate(key)];
    }
    /**
     * @method       <delete>
     * @description  Remove key and matching value if found
     * @param        {Any} key
     * @return       {Boolean} true if item was in collection
     */
    function delete_(key){
      var items = unwrap(this);
          data = items[validate(key)];

      key = coerce(key);
      if (key in data) {
        delete data[key];
        items.size--;
        return true;
      }

      return false;
    }
    /**
     * @method       <size>
     * @description  Retrieve the amount of items in the collection
     * @return       {Number}
     */
    function size(){
      return unwrap(this).size;
    }
    /**
     * @method       <forEach>
     * @description  Loop through the collection raising callback for each
     * @param        {Function} callback  `callback(value, key)`
     * @param        {Object}   context    The `this` binding for callbacks, default null
     */
    function forEach(callback, context){
      var data = unwrap(this);
      context = context == null ? global : context;
      for (var i=0; i < 3; i++)
        for (var key in data[i])
          call(callback, context, data[i][key], uncoerce(i, key), this);
    }

    delete_ = fixDelete(delete_, ['validate', 'unwrap', 'coerce'], [validate, unwrap, coerce]);
    return [HashMap, get, set, has, delete_, size, forEach];
  }),


  // ###########
  // ### Map ###
  // ###########

  Map = exporter('Map', function(wrap, unwrap){
    var prototype = Map[prototype_],
        wm = WeakMap[prototype_],
        hm = HashMap[prototype_],
        mget    = [callbind(hm.get), callbind(wm.get)],
        mset    = [callbind(hm.set), callbind(wm.set)],
        mhas    = [callbind(hm.has), callbind(wm.has)],
        mdelete = [callbind(hm['delete']), callbind(wm['delete'])];

    var type = function(o){
      return o != null && typeof o === object_ || typeof o === function_ ? 1 : 0;
    }

    /**
     * @class         Map
     * @description   Collection that allows any kind of value to be a key.
     * @param         {Iterable} [iterable]  An item to populate the collection with.
     */
    function Map(iterable){
      if (this === global || this == null || this === prototype)
        return new Map(iterable);

      wrap(this, {
        0: new HashMap,
        1: new WeakMap,
        keys: [],
        values: []
      });

      var self = this;
      iterable && initialize(iterable, function(value, key){
        call(set, self, value, key);
      });
    }
    /**
     * @method       <get>
     * @description  Retrieve the value in the collection that matches key
     * @param        {Any} key
     * @return       {Any}
     */
    function get(key){
      var data = unwrap(this),
          t = type(key);
      return data.values[mget[t](data[t], key)];
    }
    /**
     * @method       <set>
     * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
     * @param        {Any} key
     * @param        {Any} val
     **/
    function set(key, value){
      var data = unwrap(this),
          t = type(key),
          index = mget[t](data[t], key);

      if (index === undefined) {
        mset[t](data[t], key, data.keys.length);
        push(data.keys, key);
        push(data.values, value);
      } else {
        data.keys[index] = key;
        data.values[index] = value;
      }
    }
    /**
     * @method       <has>
     * @description  Check if key exists in the collection.
     * @param        {Any} key
     * @return       {Boolean} is in collection
     **/
    function has(key){
      var t = type(key);
      return mhas[t](unwrap(this)[t], key);
    }
    /**
     * @method       <delete>
     * @description  Remove key and matching value if found
     * @param        {Any} key
     * @return       {Boolean} true if item was in collection
     */
    function delete_(key){
      var data = unwrap(this),
          t = type(key),
          index = mget[t](data[t], key);

      if (index === undefined)
        return false;

      mdelete[t](data[t], key);
      splice(data.keys, index, 1);
      splice(data.values, index, 1);
      return true;
    }
    /**
     * @method       <size>
     * @description  Retrieve the amount of items in the collection
     * @return       {Number}
     */
    function size(){
      return unwrap(this).keys.length;
    }
    /**
     * @method       <forEach>
     * @description  Loop through the collection raising callback for each
     * @param        {Function} callback  `callback(value, key)`
     * @param        {Object}   context    The `this` binding for callbacks, default null
     */
    function forEach(callback, context){
      var data = unwrap(this),
          keys = data.keys,
          values = data.values;

      context = context == null ? global : context;

      for (var i=0, len=keys.length; i < len; i++)
        call(callback, context, values[i], keys[i], this);
    }

    delete_ = fixDelete(delete_,
      ['type', 'unwrap', 'call', 'splice'],
      [type, unwrap, call, splice]
    );
    return [Map, get, set, has, delete_, size, forEach];
  }),



  // ###########
  // ### Set ###
  // ###########

  Set = exporter('Set', function(wrap, unwrap){
    var prototype = Set[prototype_],
        m = Map[prototype_],
        msize = callbind(m.size),
        mforEach = callbind(m.forEach),
        mget = callbind(m.get),
        mset = callbind(m.set),
        mhas = callbind(m.has),
        mdelete = callbind(m['delete']);

    /**
     * @class        Set
     * @description  Collection of values that enforces uniqueness.
     * @param        {Iterable} [iterable]  An item to populate the collection with.
     **/
    function Set(iterable){
      if (this === global || this == null || this === prototype)
        return new Set(iterable);

      wrap(this, new Map);

      var self = this;
      iterable && initialize(iterable, function(value, key){
        call(add, self, key);
      });
    }
    /**
     * @method       <add>
     * @description  Insert value if not found, enforcing uniqueness.
     * @param        {Any} val
     */
    function add(key){
      mset(unwrap(this), key, key);
    }
    /**
     * @method       <has>
     * @description  Check if key exists in the collection.
     * @param        {Any} key
     * @return       {Boolean} is in collection
     **/
    function has(key){
      return mhas(unwrap(this), key);
    }
    /**
     * @method       <delete>
     * @description  Remove key and matching value if found
     * @param        {Any} key
     * @return       {Boolean} true if item was in collection
     */
    function delete_(key){
      return mdelete(unwrap(this), key);
    }
    /**
     * @method       <size>
     * @description  Retrieve the amount of items in the collection
     * @return       {Number}
     */
    function size(){
      return msize(unwrap(this));
    }
    /**
     * @method       <forEach>
     * @description  Loop through the collection raising callback for each. Index is simply the counter for the current iteration.
     * @param        {Function} callback  `callback(value, index)`
     * @param        {Object}   context    The `this` binding for callbacks, default null
     */
    function forEach(callback, context){
      var index = 0,
          self = this;
      mforEach(unwrap(this, function(key){
        call(callback, this, key, index++, self);
      }, context));
    }

    delete_ = fixDelete(delete_, ['mdelete', 'unwrap'], [mdelete, unwrap]);
    return [Set, add, has, delete_, size, forEach];
  });
}('string', 'object', 'function', 'prototype', 'toString',
  Array, Object, Function, Function.prototype, (0, eval)('this'),
  typeof exports === 'undefined' ? this : exports, {});
