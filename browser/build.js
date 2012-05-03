var fs = require('fs');

function load(name){ return fs.readFileSync(name, 'utf8') }

var libs = [
  'harmony-collections',
].map(function(name){
  return load('../'+name+'.js');
});


var output = libs.join('\n\n');

fs.writeFileSync('../harmony-collections.browser.min.js', compress(output));

function compress(src) {
  src = src.replace(/\\u0065/g, '___');
  var parse = require('uglify-js').parser.parse;
  var ug = require('uglify-js').uglify;
  var opts = { make_seqs: true };
  src = ug.gen_code(ug.ast_squeeze_more(ug.ast_squeeze(parse(src), opts)));
  src = src.replace(/___/g, '\\u0065');
  return src;
}