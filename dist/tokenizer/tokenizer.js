/**
 * 词法分析器，核心算法是DFA，参考:../../01_词法分析/README.md
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../common/LexicalError"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Tokenizer = void 0;
    const LexicalError_1 = require("../common/LexicalError");
    class Tokenizer {
        constructor(sourceCode) {
            this.tokens = [];
            this.codeIndex = 0; //当前扫描到源码的第codeIndex个字符
            this.lineNo = 0; //行号
            this.KEYWORDS = [
                'var',
                'if',
                'else',
                'while',
                'for',
                'break',
                'continue',
                'function',
                'return',
            ];
            this.scanner(sourceCode);
        }
        //token生成器
        makeToken(type, value, lineNo) {
            return { type, value, lineNo };
        }
        //自动机装饰器
        decorator(automation_func) {
            return (...args) => {
                const token = automation_func(...args);
                this.codeIndex += token.value.length;
                token.lineNo = this.lineNo;
                this.tokens.push(token);
            };
        }
        //源码扫描器
        scanner(sourceCode) {
            this.tokens = [];
            this.codeIndex = 0;
            this.lineNo = 0;
            const getTokenLiteral = this.decorator(this.literalAutomat.bind(this));
            const getTokenNumber = this.decorator(this.numberAutomat.bind(this));
            const getTokenOp = this.decorator(this.operatorAutomat.bind(this));
            while (this.codeIndex < sourceCode.length) {
                const currentChar = sourceCode[this.codeIndex];
                if (currentChar.match(/[A-Za-z]/)) {
                    getTokenLiteral(sourceCode, this.codeIndex);
                }
                else if (currentChar.match(/[0-9.]/)) {
                    getTokenNumber(sourceCode, this.codeIndex);
                }
                else if (currentChar.match(/[+-\\*/&|=!;()]/)) {
                    getTokenOp(sourceCode, this.codeIndex);
                }
                else if (currentChar === '{' || currentChar === '}') {
                    this.codeIndex++;
                    this.tokens.push(this.makeToken('block', currentChar, this.lineNo));
                }
                else if (currentChar === '\n' || currentChar === '\r') {
                    this.codeIndex++;
                    this.lineNo++;
                    continue;
                }
                else if (currentChar === ' ' || currentChar === '\t') {
                    this.codeIndex++;
                    continue;
                }
                else {
                    throw new LexicalError_1.LexicalError(`lexical error:unexpected char ${currentChar} in line ${this.lineNo} `);
                }
            }
        }
        //变量自动机
        literalAutomat(sourceCode, index) {
            let state = 0;
            let str = '';
            function getNextChar() {
                return sourceCode[index++];
            }
            while (true) {
                switch (state) {
                    case 0: {
                        const nextChar = getNextChar();
                        if (nextChar.match(/[A-Za-z]/)) {
                            str += nextChar;
                            state = 1;
                        }
                        else {
                            throw new LexicalError_1.LexicalError('not a illegal operator');
                        }
                        break;
                    }
                    case 1: {
                        const nextChar = getNextChar();
                        if (nextChar && nextChar.match(/[A-Za-z0-9]/)) {
                            str += nextChar;
                        }
                        else {
                            if (this.KEYWORDS.indexOf(str) > -1) {
                                return this.makeToken('keyword', str);
                            }
                            else {
                                return this.makeToken('id', str);
                            }
                        }
                        break;
                    }
                }
            }
        }
        //数字自动机
        numberAutomat(sourceCode, index) {
            let state = 0;
            let num = '';
            while (true) {
                const nextChar = sourceCode[index++];
                switch (state) {
                    case 0: {
                        if (nextChar === '0') {
                            num += nextChar;
                            state = 2;
                        }
                        else if (nextChar.match(/^[0-9]$/)) {
                            num += nextChar;
                            state = 1;
                        }
                        else if (nextChar === '.') {
                            num += nextChar;
                            state = 3;
                        }
                        else {
                            throw new LexicalError_1.LexicalError('not a number');
                        }
                        break;
                    }
                    case 1: {
                        if (nextChar.match(/[0-9]/)) {
                            num += nextChar;
                        }
                        else {
                            return this.makeToken('number', num);
                        }
                        break;
                    }
                    case 2: {
                        if (nextChar.match(/[1-9]/)) {
                            num += nextChar;
                            state = 1;
                        }
                        else if (nextChar === '.') {
                            num += nextChar;
                            state = 4;
                        }
                        else {
                            return this.makeToken('number', num);
                        }
                        break;
                    }
                    case 3: {
                        if (nextChar.match(/[0-9]/)) {
                            state = 5;
                            num += nextChar;
                        }
                        else {
                            throw new LexicalError_1.LexicalError('not a number');
                        }
                    }
                    case 4: {
                        if (nextChar.match(/[0-9]/)) {
                            state = 5;
                            num += nextChar;
                        }
                        else {
                            return this.makeToken('number', num);
                        }
                        break;
                    }
                    case 5: {
                        if (nextChar.match(/[0-9]/)) {
                            num += nextChar;
                        }
                        else {
                            return this.makeToken('number', num);
                        }
                    }
                }
            }
        }
        //运算符自动机
        operatorAutomat(sourceCode, index) {
            let state = 0;
            let operator = '';
            while (true) {
                const nextChar = sourceCode[index++];
                operator += nextChar;
                switch (state) {
                    case 0: {
                        switch (nextChar) {
                            case '+':
                                state = 1;
                                break;
                            case '-':
                                state = 2;
                                break;
                            case '*':
                            case '/':
                                return this.makeToken('operator', operator);
                            case '=':
                                state = 5;
                                break;
                            case '&':
                                state = 6;
                                break;
                            case '|':
                                state = 7;
                                break;
                            case '>':
                                state = 8;
                                break;
                            case '<':
                                state = 9;
                                break;
                            case '!':
                                state = 10;
                                break;
                            case '(':
                            case ')':
                            case ';':
                                return this.makeToken('operator', operator);
                            default:
                                throw new LexicalError_1.LexicalError('not an operator');
                        }
                        break;
                    }
                    case 1: {
                        if (nextChar === '+') {
                            return this.makeToken('operator', '++');
                        }
                        return this.makeToken('operator', '+');
                    }
                    case 2: {
                        if (nextChar === '-') {
                            return this.makeToken('operator', '--');
                        }
                        return this.makeToken('operator', '-');
                    }
                    case 5: {
                        if (nextChar === '=') {
                            return this.makeToken('operator', '==');
                        }
                        return this.makeToken('operator', '=');
                    }
                    case 6: {
                        if (nextChar === '&') {
                            return this.makeToken('operator', '&&');
                        }
                        return this.makeToken('operator', '&');
                    }
                    case 7: {
                        if (nextChar === '|') {
                            return this.makeToken('operator', '||');
                        }
                        return this.makeToken('operator', '|');
                    }
                    case 8: {
                        if (nextChar === '=') {
                            return this.makeToken('operator', '>=');
                        }
                        return this.makeToken('operator', '>');
                    }
                    case 9: {
                        if (nextChar === '=') {
                            return this.makeToken('operator', '<=');
                        }
                        return this.makeToken('operator', '<');
                    }
                    case 10: {
                        if (nextChar === '=') {
                            return this.makeToken('operator', '!=');
                        }
                        return this.makeToken('operator', '!');
                    }
                    default:
                        throw new LexicalError_1.LexicalError('not an operator');
                }
            }
        }
    }
    exports.Tokenizer = Tokenizer;
});
//# sourceMappingURL=tokenizer.js.map