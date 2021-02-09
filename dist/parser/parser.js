(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../tokenizer/tokenizer", "./statement", "./expression", "./terminal", "./exprParser"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Parser = void 0;
    const tokenizer_1 = require("../tokenizer/tokenizer");
    const statement_1 = require("./statement");
    const expression_1 = require("./expression");
    const terminal_1 = require("./terminal");
    const exprParser_1 = require("./exprParser");
    /**
     * 自顶部向下递归+lookahead一个token的parser
     * Program -> Stmts
     * Stmts -> Stmt Stmts | ϵ
     * Stmt -> AssignExpr | IfStmt | WhileStmt | Function | Block | ...
     * xxStmt -> Expr | Stmt | Terminal
     * Expr -> Terminal
     */
    class Parser {
        //语法分析函数
        parse(sourceCode) {
            //从词法分析器拿到tokens
            this.tokens = new tokenizer_1.Tokenizer(sourceCode).tokens;
            // 增加一个哨兵，用于判断结尾
            this.tokens.push({ type: 'eof', value: null });
            this.index = 0;
            this.lookahead = this.tokens[this.index++];
            const program = this.parseProgram();
            program.buildLexicalScope();
            return program;
        }
        //向前读一个token：封装index，避免危险操作
        read() {
            if (this.lookahead.type !== 'eof') {
                this.lookahead = this.tokens[this.index++];
            }
        }
        //校验token,并向前读一个
        match(value) {
            if (this.lookahead.value === value) {
                this.read();
                return value;
            }
            throw `syntax error @line ${this.lookahead.lineNo} : expect ${value} here but ${this.lookahead.value} found.`;
        }
        //校验类型（静态语言）,并向前读一个
        matchType(type) {
            if (this.lookahead.type === type) {
                this.read();
            }
            throw 'syntax error';
        }
        //解析表达式
        parseExpr() {
            return new exprParser_1.expressionParser(this).exprParser();
        }
        /**
         * Stmts -> Stmt Stmts | ϵ
         */
        parseStmts() {
            const stmts = [];
            while (this.lookahead.type !== 'eof' && this.lookahead.value !== '}') {
                stmts.push(this.parseStmt());
            }
            return stmts;
        }
        /**
         * Program -> Stmts
         */
        parseProgram() {
            return new statement_1.Program(this.parseStmts());
        }
        /**
         * Stmt -> AssignExpr | IfStmt | WhileStmt | Function | Block | ...
         * AssignExpr -> var <id> = Expr
         * IfStmt -> if Expr Block else IfStmt | if Expr Block | Stmt
         */
        parseStmt() {
            if (this.lookahead.type === 'id' || this.lookahead.type === 'number') {
                return this.parseExpr();
            }
            switch (this.lookahead.value) {
                case 'var':
                    return this.parseDeclareStmt();
                case 'function':
                    return this.parseFunctionStmt();
                case 'if':
                    return this.parseIfStmt();
                case 'return':
                    return this.parseReturnStmt();
                default:
                    console.log(this.lookahead);
                    throw `syntax error @line ${this.lookahead.lineNo} : not impl. ${this.lookahead.value}`;
            }
        }
        parseBlock() {
            this.match('{');
            const stmts = this.parseStmts();
            this.match('}');
            return new statement_1.Block(stmts);
        }
        /**
         * FunctionStmt -> function {id}(...ARGS) BLOCK
         */
        parseFunctionStmt() {
            this.match('function');
            if (this.lookahead.type !== 'id') {
                throw 'syntax error';
            }
            const id = this.lookahead.value;
            this.match(id);
            this.match('(');
            const args = this.parseFuncArguments();
            this.match(')');
            const block = this.parseBlock();
            return new statement_1.Function(new terminal_1.Identifier(id), args, block);
        }
        /**
         * ReturnStmt -> return Expr
         */
        parseReturnStmt() {
            this.match('return');
            const expr = this.parseExpr();
            return new statement_1.ReturnStmt(expr);
        }
        /**
         * Args -> <id> | <id>,Args | ϵ
         */
        parseFuncArguments() {
            let list = [];
            if (this.lookahead.type === 'id') {
                const id = this.lookahead.value;
                this.match(id);
                list.push(new terminal_1.Identifier(id));
                if (this.lookahead.value === ',') {
                    this.match(',');
                    list = list.concat(this.parseFuncArguments());
                }
            }
            // else {
            //   return []
            // }
            return new expression_1.Args(list, 'function');
        }
        /**
       * fn(args)函数调用的参数解析
       */
        parseArguments() {
            let list = [];
            let expr = null;
            while ((expr = this.parseExpr())) {
                list.push(expr);
            }
            return new expression_1.Args(list);
        }
        /**
         * IfStmt -> if Expr Block | if Expr Block else IfStmt | if Expr Block else Block
         */
        parseIfStmt() {
            this.match('if');
            const expr = this.parseExpr();
            const ifBlock = this.parseBlock();
            if (this.lookahead.value === 'else') {
                this.match('else');
                // @ts-ignore
                if (this.lookahead.value === 'if') {
                    const ifStmt = this.parseIfStmt();
                    return new statement_1.IfStmt(expr, ifBlock, ifStmt);
                }
                else {
                    const elseBlock = this.parseBlock();
                    return new statement_1.IfStmt(expr, ifBlock, null, elseBlock);
                }
            }
            else {
                return new statement_1.IfStmt(expr, ifBlock);
            }
        }
        /**
         * DeclareStmt -> var id = expr
         */
        parseDeclareStmt() {
            this.match('var');
            if (this.lookahead.type !== 'id') {
                throw 'syntax error';
            }
            const id = new terminal_1.Identifier(this.lookahead.value);
            this.match(this.lookahead.value);
            this.match('=');
            const right = this.parseExpr();
            return new statement_1.DeclareStmt(id, right);
        }
        /**
         * factor -> number | string | id
         */
        parseFactor() {
            if (this.lookahead.type === 'number') {
                const value = this.match(this.lookahead.value);
                return new terminal_1.Numeral(value);
            }
            else if (this.lookahead.type === 'id') {
                const value = this.match(this.lookahead.value);
                if (this.lookahead.value === '(') {
                    this.match('(');
                    const args = this.parseArguments();
                    this.match(')');
                    return new expression_1.FunctionCallExpr(new terminal_1.Identifier(value), args);
                }
                else if (this.lookahead.value === '=') {
                    this.match('=');
                    const expr = this.parseExpr();
                    return new expression_1.AssignExpr(new terminal_1.Identifier(value), expr);
                }
                return new terminal_1.Identifier(value);
            }
            else if (this.lookahead.type === 'string') {
                throw 'not impl.';
            }
            else {
                throw `syntax error, expect a factor but ${this.lookahead.value} found`;
            }
        }
    }
    exports.Parser = Parser;
});
//# sourceMappingURL=parser.js.map