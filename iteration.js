/* Shim for Set and Map to allow some form of iteration in V8 until it's implemented for maps */

global.Map && global.Set && global.WeakMap &&

(function(OMap, OSet){
	global.Map = Map;

	var maps = new WeakMap;
	var keymaps = new WeakMap;

	var proto = Object.create(Object.prototype, { toString: __(toString) });

	function Map(){
				// map is an instance of the new wrapper Map
		var map = Object.create(Map.prototype)
				// omap is a native map instance this will wrap
		  , omap = maps.set(map, new OMap)
				// keymap will form a chain as keys are added, keeping the link
		  , keymap = keymaps.set(map, new OMap);

		// use omap is a pointer to the first item
		// keymap uses itself to point to the current last item
		keymap.set(keymap, omap);
		return map;
	}

	Map.prototype = Object.create(proto, {
		constructor: __(Map),
		get: __(function get(key){
			return maps.get(this).get(key);
		}),
		set: __(function set(key, val){
			if (!this.has(key)) {
				var keymap = keymaps.get(this);
				// get current last, point it and keymap to new key
				keymap.set(keymap, keymap.set(keymap.get(keymap), key));
			}
			return maps.get(this).set(key, val);
		}),
		has: __(function has(key){
			return maps.get(this).has(key);
		}),
		delete: __(function del(key){
			if (this.has(key)) {
				var keymap = keymaps.get(this);
				//keymap.get
			}
			return maps.get(this).delete(key);
		}),
		keys: __(function keys(){
			var keymap = keymaps.get(this)
			  , current = maps.get(this)
			  , ret = [];

			while (keymap.has(current)) {
				current = keymap.get(current);
				ret.push(current);
			}
			return ret;
		}),
		values: __(function values(){
			return this.keys().map(function(s){ return this.get(s) }, this);
		}),
		iterate: __(function iterate(callback, context){
      var keys = this.keys();
      for (var i=0, len=keys.length; i < len; i++) {
        callback.call(context || null, keys[i], this.get(keys[i]), i);
      }
    })
	});

  function __(val, hidden){
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


  function egal(x, y){
    if (x === y) {
      return x !== 0 || 1 / x === 1 / y;
    }
    return x !== x && y !== y;
  }

})(global.Map, global.Set);
