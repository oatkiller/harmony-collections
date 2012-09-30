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

void function(global, exports, undefined_, undefined){
  "use strict";

  var getProps = Object.getOwnPropertyNames,
      defProp  = Object.defineProperty,
      toSource = Function.prototype.toString,
      create   = Object.create,
      hasOwn   = Object.prototype.hasOwnProperty,
      fname    = /^\n?function\s?(\w*)?_?\(/;


  function define(o, k, v){
    if (typeof k === 'function')
      v = k, k = name(v).replace(/_$/, '');
    return defProp(o, k, { configurable: true, writable: true, value: v });
  }

  function name(f){
    return typeof f !== 'function' ? '' : 'name' in f ? f.name : toSource.call(fname).match(f)[1];
  }

  // ############
  // ### Data ###
  // ############

  var Data = (function(){
    var lockboxDesc = { value: { writable: true, value: undefined } },
        locker = 'return function(k){if(k===s)return l}',
        uids = create(null),
        globalID = createUID();

    function createUID(){
      var key = Math.random().toString(36).slice(2);
      return key in uids ? createUID() : uids[key] = key;
    }

    function storage(obj){
      if (hasOwn.call(obj, globalID))
        return obj[globalID];

      if (!Object.isExtensible(obj))
        throw new TypeError("Object must be extensible");

      var store = create(null);
      defProp(obj, globalID, { value: store });
      return store;
    }

    // common per-object storage area made visible by patching getOwnPropertyNames'
    define(Object, function getOwnPropertyNames(obj){
      var props = getProps(obj);
      if (hasOwn.call(obj, globalID))
        props.splice(props.indexOf(globalID), 1);
      return props;
    });

    function Data(){
      var puid = createUID(),
          secret = {};

      this.unlock = function(obj){
        var store = storage(obj);
        if (hasOwn.call(store, puid))
          return store[puid](secret);

        var lockbox = create(null, lockboxDesc);
        defProp(store, puid, {
          value: new Function('s', 'l', locker)(secret, lockbox)
        });
        return lockbox;
      }
    }

    define(Data.prototype, function get(o){ return this.unlock(o).value });
    define(Data.prototype, function set(o, v){ this.unlock(o).value = v });

    return Data;
  }());


  exports.WeakMap = (function(){
    var data = new Data,
        prototype = WeakMap.prototype;


    function validate(key){
      if (key == null || typeof key !== 'object' && typeof key !== 'function')
        throw new TypeError("Invalid WeakMap key");
    }

    function wrap(collection, value){
      var store = data.unlock(collection);
      if (store.value)
        throw new TypeError("Object is already a WeakMap");
      store.value = value;
    }

    function unwrap(collection){
      var storage = data.unlock(collection).value;
      if (!storage)
        throw new TypeError("WeakMap is not generic");
      return storage;
    }

    function initialize(weakmap, iterable){
      if (iterable !== null && typeof iterable === 'object' && typeof iterable.forEach === 'function') {
        iterable.forEach(function(item, i){
          if (item instanceof Array && item.length === 2)
            set.call(weakmap, iterable[i][0], iterable[i][1]);
        });
      }
    }


    function WeakMap(iterable){
      if (this === global || this == null || this === prototype)
        return new WeakMap(iterable);

      wrap(this, new Data);
      initialize(this, iterable);
    }

    function get(key){
      validate(key);
      var value = unwrap(this).get(key);
      return value === undefined_ ? undefined : value;
    }

    function set(key, value){
      validate(key);
      // store a token for explicit undefined so that "has" works correctly
      unwrap(this).set(key, value === undefined ? undefined_ : value);
    }

    function has(key){
      validate(key);
      return unwrap(this).get(key) !== undefined;
    }

    function delete_(key){
      validate(key);
      var data = unwrap(this);
      var had = data.get(key) !== undefined;
      data.set(key, undefined);
      return had;
    }

    [get, set, has, delete_].forEach(function(method){
      define(prototype, method);
    });

    return WeakMap;
  }());
}(new Function('return this')(), typeof exports === 'undefined' ? this : exports, {});
