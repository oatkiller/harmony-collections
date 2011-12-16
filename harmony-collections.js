(function(exports, global){

  var proto = Object.create(Object.prototype, { toString: value(toString) });

  if (deepCheck('Map', ['get', 'set', 'has', 'delete'])) {
    var Map = exports.Map = (function(){
      var maps = [], keysets = [], valsets = [], last = {};

      function Map(){
        var map = Object.create(Map.prototype);
        maps.push(map);
        keysets.push([]);
        valsets.push([]);
        return map;
      }

      Map.prototype = Object.create(proto, {
        constructor: value(Map),
        set: value(function set(key, val){
          var map = search(this, key);
          if (map.index < 0) map.index = map.keys.length;
          map.keys[map.index] = key;
          last.keyi = map.index;
          return map.vals[map.index] = val;
        }),
        get: value(function get(key){
          var map = search(this, key);
          return ~map.index ? map.vals[map.index] : undefined;
        }),
        has: value(function has(key){
          return !!~search(this, key).index;
        }),
        delete: value(function del(key){
          var map = search(this, key);
          if (!~map.index) return true;
          map.keys.splice(map.index, 1);
          map.vals.splice(map.index, 1);
          last.keyi = null;
          return true;
        }),
        iterate: value(function iterate(callback, context){
          var map = search(this);
          for (var i=0; map.keys[i++];) {
            callback.call(context || null, i, map.keys[i], map.vals[i]);
          }
        })
      });

      function search(map, key){
        var mapi = map === last.map ? last.mapi : find(maps, map);
        if (~mapi) {
          if (key !== undefined) {
            var keyi = (mapi === last.mapi && key === last.key) ? last.keyi : find(keysets[mapi], key);
            last.key = key;
            last.keyi = ~keyi ? keyi : null;
          } else {
            last.keyi = last.key = null
          }
          last.map = map;
          last.mapi = mapi;
          return {
            keys: keysets[mapi],
            vals: valsets[mapi],
            index: keyi
          };
        }
        IncompatibleError(Map, search.caller);
      }

      function find(keys, key){
        var i = keys.length;
        while (i--) {
          if (key === keys[i]) {
            return i;
          }
        }
        return -1;
      }

      return Map;
    })();
  }

  if (deepCheck('WeakMap', ['get', 'set', 'has', 'delete'])) {
    var WeakMap = exports.WeakMap = (function(){
      var weakmaps = Map();
      var last = { weakmap: "null", map: "null" };

      function WeakMap(){
        var weakmap = Object.create(WeakMap.prototype);
        weakmaps.set(weakmap, Map());
        return weakmap;
      }

      WeakMap.prototype = Object.create(proto, {
        constructor: value(WeakMap),
        set: value(function set(key, val){
          return search(this).set(key, val);
        }),
        get: value(function get(key){
          return search(this).get(key);
        }),
        has: value(function has(key){
          return search(this).has(key);
        }),
        delete: value(function del(key){
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
        IncompatibleError(WeakMap, search.caller);
      }

      return WeakMap;
    })();
  }

  if (deepCheck('Set', ['get', 'add', 'delete'])) {
    var Set = exports.Set = (function(){
      var sets = Map();
      var last = {};

      function Set(){
        var set = Object.create(Set.prototype);
        sets.set(set, Map());
        return set;
      }

      Set.prototype = Object.create(proto, {
        constructor: value(Set),
        has: value(function has(key){
          return search(this).has(key);
        }),
        add: value(function add(key){
          search(this).set(key, true);
        }),
        delete: value(function del(key){
          return search(this).delete(key);
        }),
        iterate: value(function iterate(callback, context){
          search(this).iterate(callback, context);
        })
      });

      function search(set){
        if (last.set === set) return last.map;
        var map = sets.get(set);
        if (map) {
          last.set = set;
          return last.map = map;
        }
        IncompatibleError(Set, search.caller);
      }

      return Set;
    })();
  }

  function value(val, hidden){
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

  function IncompatibleError(type, origin){
    var err = new TypeError();
    err.message = type.name+'.prototype.'+origin.name + ' called on incompatible object.';
    var stack = err.stack.split('\n');
    stack.splice(1, 3);
    err.stack = stack.join('\n')
    throw err;
  }

  function deepCheck(name, functions){
    if (typeof window === 'undefined') return true;
    if (name in global && global[name].name === name && global[name].prototype) {
      return !functions.every(function(fn){ return fn in global[name].prototype })
    }
    return true;
  }

})(
  typeof exports !== 'undefined' ? exports : this,
  typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this
);