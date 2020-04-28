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
    const ast = new parser_1.Parser().parse(`
    function febonacci(n) {
        if(n == 1 || n == 2) {
          return n
        }
        return febonacci(n-1) + febonacci(n-2)
    }
    var feb = febonacci(n)
    var x=y+3*(y-z)
    var xx=x+y*(5+6)

`);
    console.log('ast', JSON.stringify(ast.stmts, null, 4));
});
//# sourceMappingURL=parser.js.map