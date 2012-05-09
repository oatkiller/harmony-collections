var tap = require("tap");
var test = tap.test;
var WM;
var map;
var secrets = ['secrets'];

var methods = ['get', 'set', 'has', 'delete'];

test('load', function(t){
  t.ok(WM = require('../').WeakMap, 'WeakMap loaded');
  t.similar(Object.getOwnPropertyNames(WM.prototype).sort(), [
    'constructor','delete','get', 'has','set','toString'
  ], 'has all expected prototype properties');
  t.same(WM.name, 'WeakMap', 'check name');
  t.same(WM+'', 'function WeakMap() { [native code] }', 'check toString');
  t.same(WM.prototype+'', '[object WeakMap]', 'check brand');

  t.end();
});


test('basic usage', function(t){
  t.ok(map = new WM, 'create instance');
  t.same(Object.getPrototypeOf(map), WM.prototype, 'instance of WeakMap.prototype');
  t.similar(Object.getOwnPropertyNames(map), [], 'no observable properties on the instance');
  t.same(map.get(WM), undefined, 'retreiving non-existant key returns undefined');
  t.same(map.set(WM, secrets), secrets, 'set works and returns given val');
  t.same(map.get(WM), secrets, 'retreiving works');
  t.same(map.set(WM, 'overwrite'), 'overwrite', 'primitive value set works');
  t.same(map.get(WM), 'overwrite', 'overwriting works');
  t.same(map.has(WM), true, 'has returns true');
  t.same(map.delete(WM), true, 'delete returns true');
  t.same(map.has(WM), false, 'has returns false');
  t.same(map.get(WM), undefined, 'retreiving deleted item returns undefined');
  t.end();
});

test('errors', function(t){
  methods.forEach(function(method){
    t.throws(function(){ map[method]('string', secrets) }, 'primitive key in '+method+' throws');
    t.throws(function(){ map[method].call({}, {}) }, 'using '+method+' on a non-weakmap throws');
  });
  t.end();
});


function formatSize(s){
  if (isNaN(s) || s <= 0) return '0b';
  for (var b=0; s >= 1024; b++) s /= 1024;
  return (b ? s.toFixed(2)+' '+' kmgt'[b] : s+' ')+'b';
}

function MemoryReading(name, time){
  var reading = process.memoryUsage();
  this.timing = process.hrtime(time);
  this.name = name;
  this.time = process.hrtime(zero)[1];
  this.rss = reading.rss;
  this.total = reading.heapTotal;
  this.used = reading.heapUsed;
}
var zero = process.hrtime();

MemoryReading.prototype = {
  constructor: MemoryReading,
  compare: function compare(other){
    var first, last;
    if (other.time > this.time) {
      first = this;
      last = other;
    } else {
      first = other;
      last = this;
    }
    var out = Object.create(MemoryReading.prototype);
    out.start = first;
    out.end = last;
    out.name = first.name + ' to ' + last.name;
    out.time = last.time - first.time;
    out.rss = last.rss - first.rss;
    out.total = last.total - first.total;
    out.used = last.total - first.total;
    return out;
  },
  inspect: function(){
    return require('util').inspect({
      name: this.name,
      time: this.time / 1000000 | 0,
      rss: formatSize(this.rss),
      total: formatSize(this.total),
      used: formatSize(this.used)
    });
  }
};

var reading = MemoryReading.reading = function(readings){
  return function reading(name){
    name = name || 'auto';
    if (name in readings) {
      var result = readings[name].compare(new MemoryReading(name + '-end'));
      delete readings[name];
      return result;
    } else {
      readings[name] = new MemoryReading(name);
    }
  }
}({});

test('garbage collection', function(t){
  reading();
  for (var i=0; i < 100; i++)
    new WM;
  console.log(reading());
  t.end();
});

// test('reif