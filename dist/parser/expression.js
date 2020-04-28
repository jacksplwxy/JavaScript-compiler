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
    class Expr {
        constructor(op, left, right) {
            this.op = op;
            this.left = left;
            this.right = right;
        }
        print(level = 0) {
            const pad = ''.padStart(level * 2);
            console.log(pad + this.op);
            this.left && this.left.print(level + 1);
            this.right && this.right.print(level + 1);
        }
        //代码生成
        gen(il, scope) {
            if (this.left && this.left.gen) {
                this.left.gen(il, scope);
            }
            if (this.right && this.right.gen) {
                this.right.gen(il, scope);
            }
            const tempVar = scope.bindTempVar();
            il.add(`set ${tempVar} ${this.left.rvalue()} ${this.op} ${this.right.rvalue()}`);
            this._rval = tempVar;
        }
        //获取临时标识符名
        rvalue() {
            return this._rval;
        }
        //绑定词法作用域
        bindLexicalScope(scope) {
            if (this.left && this.left.bindLexicalScope) {
                this.left.bindLexicalScope(scope);
            }
            if (this.right && this.right.bindLexicalScope) {
                this.right.bindLexicalScope(scope);
            }
        }
    }
    exports.Expr = Expr;
    //函数调用表达式
    class FunctionCallExpr extends Expr {
        constructor(id, args) {
            super('call', id, args);
            this.id = id;
            this.args = args;
        }
        gen(il, scope) {
            this.right.gen(il, scope);
            const tempVar = scope.bindTempVar();
            il.add(`call ${scope.getLexemeName(this.left.lvalue())}`);
            this._rval = tempVar;
        }
    }
    exports.FunctionCallExpr = FunctionCallExpr;
    class AssignExpr extends Expr {
        constructor(id, expr) {
            super('=', id, expr);
            this.id = id;
            this.expr = expr;
        }
        gen(il, scope) {
            il.add(`declare ${scope.getLexemeName(this.id.lvalue())}`);
            this.expr.gen(il, scope);
            il.add(`${scope.getLexemeName(this.id.lvalue())}=${this.expr.rvalue()}`);
        }
    }
    exports.AssignExpr = AssignExpr;
    class Args {
        constructor(args, type = 'call') {
            this.args = args;
            this.type = type;
        }
        print(level) {
            this.args.forEach(x => {
                x.print(level);
            });
        }
        size() {
            return this.args.length;
        }
        bindLexicalScope(scope) {
            for (let i = 0; i < this.args.length; i++) {
                if (this.type === 'function') {
                    scope.bind(this.args[i].value);
                    this.args[i].bindLexicalScope(scope);
                }
                else {
                    this.args[i].bindLexicalScope && this.args[i].bindLexicalScope(scope);
                }
            }
        }
        gen(il, scope) {
            if (this.type == 'call') {
                for (let i = 0; i < this.args.length; i++) {
                    const expr = this.args[i];
                    if (expr.gen) {
                        expr.gen(il, scope);
                    }
                    il.add(`pass ${expr.rvalue()}`);
                }
            }
        }
    }
    exports.Args = Args;
});
//# sourceMappingURL=expression.js.map