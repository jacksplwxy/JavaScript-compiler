(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../parser/parser"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const parser_1 = require("../parser/parser");
    const sourceCode = `
var b = 2
function closureFn(){
  var c = 3
  var d = 4
  var a = b/(c+d)
  return a
}

function febonacci(n) {
  if(n == 1 || n == 2) {
    return n
  }
  return febonacci(n-1) + febonacci(n-2)
}

print( febonacci(5) )

`;
    const parser = new parser_1.Parser();
    const ast = parser.parse(sourceCode);
    ast.print();
    console.log('-----SYMBOL TABLE--------');
    ast.lexicalScope.print();
    console.log('-----il------');
    ast.gen();
    ast.ilGen.print();
});
//# sourceMappingURL=ILGen.js.map