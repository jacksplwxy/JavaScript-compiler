(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Numeral = exports.Identifier = exports.Terminal = void 0;
    class Terminal {
        constructor(value) {
            this.value = value;
            this.value = value;
        }
        //左值
        lvalue() {
            return this.value;
        }
        //右值
        rvalue() {
            return this.value;
        }
        //打印值
        print(level) {
            console.log(''.padStart(level * 2) + this.value);
        }
    }
    exports.Terminal = Terminal;
    //标识符
    class Identifier extends Terminal {
        bindLexicalScope(scope) {
            this.scope = scope.lookup(this.value);
            if (this.scope === null) {
                throw `sytnax error: ${this.value} is not defined`;
            }
        }
    }
    exports.Identifier = Identifier;
    //数字
    class Numeral extends Terminal {
    }
    exports.Numeral = Numeral;
});
//# sourceMappingURL=terminal.js.map