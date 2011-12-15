(function(exports, global){
  "use strict";
  if (global.Map && global.Map.prototype) {
    var mapproto = global.Map.prototype;
    if ('set' in mapproto && 'get' in mapproto && 'has' in mapproto && 'delete' in mapproto) return;
  }

  var Map = exports.Map = (function(){
    var maps = [], keysets = [], valsets = [], last = {};

    function Map(){
      var map = Object.create(Map.prototype);
      maps.push(map);
      keysets.push([]);
      valsets.push([]);
      return map;
    }

    Map.prototype = Object.create(null, {
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
        if (!~map.index) return false;
        map.keys.splice(map.index, 1);
        map.vals.splice(map.index, 1);
        last.keyi = null;
        return true;
      })
    });

    function search(map, key){
      var mapi = map === last.map ? last.mapi : find(maps, map);
      if (~mapi) {
        var keyi = (mapi === last.mapi && key === last.key) ? last.keyi : find(keysets[mapi], key);
        last.map = map;
        last.mapi = mapi;
        last.key = key;
        last.keyi = ~keyi ? keyi : null;
        return {
          keys: keysets[mapi],
          vals: valsets[mapi],
          index: keyi
        };
      }
      throw new TypeError("This isn't a Map");
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

    return Object.freeze(Map);
  })();

  exports.WeakMap = (function(){
    var weakmaps = Map();
    var last = {};

    function WeakMap(){
      var weakmap = Object.create(WeakMap.prototype);
      weakmaps.set(weakmap, Map());
      return weakmap;
    }

    WeakMap.prototype = Object.create(null, {
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
      if (~map) {
        last.weakmap = weakmap;
        return last.map = map;
      }
      throw new TypeError("This isn't a WeakMap");
    }

    return Object.freeze(WeakMap);
  })();

  exports.Set = (function(){
    var sets = Map();
    var last = {};

    function Set(){
      var set = Object.create(Set.prototype);
      sets.set(set, Map());
      return set;
    }
    Set.prototype = Object.create(null, {
      has: value(function has(key){
        return search(this).has(key);
      }),
      set: value(function set(key){
        search(this).set(key, true);
      }),
      delete: value(function del(key){
        return search(this).delete(key);
      })
    });

    function search(set){
      if (last.set === set) return last.map;
      var map = sets.get(set);
      if (~map) {
        last.set = set;
        return last.map = map;
      }
      throw new TypeError("This isn't a Set");
    }

    return Object.freeze(Set);
  })();


  function value(val){
    return { value: val, enumerable: true };
  }

})(
  typeof exports !== 'undefined' ? exports : this,
  typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this
);