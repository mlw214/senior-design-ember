function escapeFileName(name) {
  name = name.replace(/[^a-zA-Z0-9\.\-_]/g, '');
  if (name.length === 0 ||
      (name.length === 1 && name.search('\.|\-|_') === 0)) {
    return 'novalidname' + Math.ceil(Math.random() * 1000000) + '.txt';
  }
  if (name[name.length - 1] === '.') {
    return name.substring(0, name.length - 1) + '.txt';
  } else { return name + '.txt'; }
}

console.log(escapeFileName('test'));
console.log(escapeFileName('.test'));
console.log(escapeFileName('.-_test'));
console.log(escapeFileName('test.go_'));
console.log(escapeFileName('_test'));
console.log(escapeFileName('-test'));
console.log(escapeFileName('-.test'));
console.log(escapeFileName('.'));
console.log(escapeFileName('-'));
console.log(escapeFileName('_'));
console.log(escapeFileName('test.'));
console.log(escapeFileName('.///////'));