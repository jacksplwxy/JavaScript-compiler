(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../parser/parser", "../opcodeCompiler/opcodeCompiler"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const parser_1 = require("../parser/parser");
    const opcodeCompiler_1 = require("../opcodeCompiler/opcodeCompiler");
    const sourceCode = `
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
    console.log('-----AST------');
    ast.print();
    console.log('-----SYMBOL TABLE--------');
    ast.lexicalScope.print();
    console.log('-----IR------');
    ast.gen();
    ast.ilGen.print();
    const compiler = new opcodeCompiler_1.OpcodeCompiler();
    compiler.parse(ast.ilGen.toText(), ast.lexicalScope.toJSON());
    console.log('-----OPcode------');
    compiler.print();
});
//# sourceMappingURL=opcodeCompiler.js.map