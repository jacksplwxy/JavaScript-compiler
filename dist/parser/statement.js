(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../SDT/LexicalScope", "../SDT/ILGen"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Program = exports.Block = exports.Function = exports.ReturnStmt = exports.IfStmt = exports.DeclareStmt = exports.Stmt = void 0;
    const LexicalScope_1 = require("../SDT/LexicalScope");
    const ILGen_1 = require("../SDT/ILGen");
    //定义陈述语言抽象类
    class Stmt {
        //每个陈述语句都需要构建一次作用域
        buildLexicalScope(parent) {
            this.lexicalScope = parent;
        }
    }
    exports.Stmt = Stmt;
    //声明语句
    class DeclareStmt extends Stmt {
        constructor(left, right) {
            super();
            this.left = left;
            this.right = right;
        }
        buildLexicalScope(parent) {
            this.lexicalScope = parent;
            this.lexicalScope.bind(this.left.value, 'number');
        }
        print(level) {
            const pad = ''.padStart(level * 2);
            console.log(pad + '=');
            this.left.print(level + 1);
            this.right.print(level + 1);
        }
        gen(il) {
            let scope = this.lexicalScope;
            il.add(`declare ${scope.getLexemeName(this.left.lvalue())}`);
            if (this.right && this.right.gen) {
                this.right.gen(il, scope);
            }
            il.add(`${scope.getLexemeName(this.left.lvalue())}=${this.right.rvalue()}`);
        }
    }
    exports.DeclareStmt = DeclareStmt;
    class IfStmt extends Stmt {
        /**
         * @param {*} expr if 后面的表达式
         * @param {*} ifBlock  if 后面的紧跟着的 Block
         * @param {*} elseIfStmt 如果有else if， 相当于else后面跟着的If语句
         * @param {*} elseBlock 如果没有else if 相当于else后面跟着的Block
         */
        constructor(expr, ifBlock, elseIfStmt, elseBlock) {
            super();
            this.expr = expr;
            this.ifBlock = ifBlock;
            this.elseIfStmt = elseIfStmt;
            this.elseBlock = elseBlock;
        }
        buildLexicalScope(parent) {
            super.buildLexicalScope(parent);
            this.expr.bindLexicalScope(this.lexicalScope);
            this.ifBlock.buildLexicalScope(this.lexicalScope);
            this.elseIfStmt && this.elseIfStmt.buildLexicalScope(this.lexicalScope);
            this.elseBlock && this.elseBlock.buildLexicalScope(this.lexicalScope);
        }
        print(level) {
            const pad = ''.padStart(level * 2);
            console.log(pad + 'if');
            this.expr.print(level + 1);
            this.ifBlock.print();
        }
        gen(il) {
            this.expr.gen(il, this.lexicalScope);
            const ifCodeLine = il.add('', true);
            let ifBlockNextLineNo = null;
            this.ifBlock.gen(il, this.lexicalScope);
            if (this.elseIfStmt) {
                if (!ifBlockNextLineNo) {
                    ifBlockNextLineNo = il.current().lineno;
                }
                this.elseIfStmt.gen(il, this.lexicalScope);
            }
            else if (this.elseBlock) {
                if (!ifBlockNextLineNo) {
                    ifBlockNextLineNo = il.current().lineno;
                }
                this.elseBlock.gen(il, this.lexicalScope);
            }
            // const nextLine = il.current().lines[ifCodeLine.lineno+1]
            const currentLine = il.currentLine();
            const l1 = il.genLabel();
            // il.bindLabel(nextLine.lineno, l1)
            il.bindLabel(currentLine.lineno + 1, l1);
            // currentLine.label = l2
            // nextLine.label = l1 
            ifCodeLine.code = `branch ${this.expr.rvalue()} ${l1}`;
        }
    }
    exports.IfStmt = IfStmt;
    class ReturnStmt extends Stmt {
        constructor(expr) {
            super();
            this.expr = expr;
            this.expr = expr;
        }
        buildLexicalScope(parent) {
            super.buildLexicalScope(parent);
            this.expr.bindLexicalScope(this.lexicalScope);
        }
        print(level) {
            const pad = ''.padStart(level * 2);
            console.log(pad + 'return');
            this.expr.print(level + 1);
        }
        gen(il) {
            this.expr && this.expr.gen && this.expr.gen(il, this.lexicalScope);
            il.add(`return ${this.lexicalScope.getLexemeName(this.expr.rvalue())}`);
        }
    }
    exports.ReturnStmt = ReturnStmt;
    class Function extends Stmt {
        constructor(id, args, block) {
            super();
            this.id = id;
            this.args = args;
            this.block = block;
        }
        buildLexicalScope(parent) {
            this.lexicalScope = new LexicalScope_1.LexicalScope(parent, {
                type: 'function',
                argc: this.args.size()
            });
            parent.bind(this.id.value, 'function');
            this.args.bindLexicalScope(this.lexicalScope);
            this.block.buildLexicalScope(this.lexicalScope, false);
        }
        print(level) {
            const pad = ''.padStart(level * 2);
            console.log(pad + 'function:' + this.id);
            this.args.print(level + 1);
            // this.block.print(level + 1)
            this.block.print();
        }
        gen(il) {
            il.add(`declare function ${this.lexicalScope.getLexemeName(this.id.lvalue())}`);
            il.beginSection(this.id.value + '@' + this.lexicalScope.id);
            il.add(`set %TOP% %SP%`);
            this.args.gen(il, this.lexicalScope);
            this.block.gen(il, this.lexicalScope);
            il.endSection();
        }
    }
    exports.Function = Function;
    class Block {
        constructor(stmts) {
            this.stmts = stmts;
        }
        buildLexicalScope(parent, create = true) {
            if (create) {
                this.lexicalScope = new LexicalScope_1.LexicalScope(parent);
            }
            else {
                this.lexicalScope = parent;
            }
            this.stmts.forEach((stmt) => {
                if (stmt instanceof Stmt) {
                    stmt.buildLexicalScope(this.lexicalScope);
                }
                else {
                    stmt.bindLexicalScope(this.lexicalScope);
                }
            });
        }
        print() {
            for (let i = 0; i < this.stmts.length; i++) {
                this.stmts[i].print(0);
            }
        }
        gen(il, scope = this.lexicalScope) {
            for (let i = 0; i < this.stmts.length; i++) {
                this.stmts[i].gen(il, scope);
            }
        }
    }
    exports.Block = Block;
    class Program extends Block {
        constructor(stmts) {
            super(stmts);
            this.stmts = stmts;
            this.ilGen = new ILGen_1.ILGen();
        }
        registerGlobals(scope) {
            scope.bind('print', 'function');
        }
        buildLexicalScope() {
            this.lexicalScope = new LexicalScope_1.LexicalScope();
            this.registerGlobals(this.lexicalScope);
            this.stmts.forEach(stmt => {
                if (stmt instanceof Stmt) {
                    stmt.buildLexicalScope(this.lexicalScope);
                }
                else {
                    stmt.bindLexicalScope(this.lexicalScope);
                }
            });
        }
        gen() {
            this.ilGen.beginSection('main@1');
            this.ilGen.add('set %TOP% %SP%');
            for (let i = 0; i < this.stmts.length; i++) {
                this.stmts[i].gen(this.ilGen, this.lexicalScope);
            }
            this.ilGen.endSection();
        }
    }
    exports.Program = Program;
});
//# sourceMappingURL=statement.js.map