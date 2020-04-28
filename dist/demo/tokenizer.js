(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../tokenizer/tokenizer"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tokenizer_1 = require("../tokenizer/tokenizer");
    let tokenizer = new tokenizer_1.Tokenizer('var myName = jacksplwxy + test');
    console.log('结果:', JSON.stringify(tokenizer.tokens, null, 2));
});
//# sourceMappingURL=tokenizer.js.map