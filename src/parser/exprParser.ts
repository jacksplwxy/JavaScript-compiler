

import { Expr, FunctionCallExpr, AssignExpr } from './expression'
import { Parser } from './parser'
import { IToken } from '../tokenizer/tokenizer'
import { Terminal, Identifier } from './terminal'

//表达式parser
export class expressionParser {
    //优先级序列表
    readonly PRIORITY_TABLE = {
        '+': 60,
        '-': 60,
        '*': 70,
        '/': 70,
        '>=': 80,
        '<=': 80,
        '>': 80,
        '<': 80,
        '&&': 90,
        '||': 90,
        '==': 100,
        '!=': 100,
        '(': 1000,
        ')': 1000
    }

    constructor(private parser: Parser) { }

    //表达式解析方法
    public exprParser(): (Expr | Terminal) {
        if (this.parser.lookahead.value === ')') {
            return null
        }
        // PreOrder : 前序
        // inOrder : 中序
        // PostOrder : 后序
        return this.constructAST(this.inOrderToPostOrder())
    }

    //构建AST：abcd+*+ → ab(c+d)*+ → ab*(c+d)+ → a+b*(c+d)
    private constructAST(postOrderOutput: Array<IToken | Terminal | Expr>): (Expr | Terminal) {
        const stack = []
        for (let i = 0; i < postOrderOutput.length; i++) {
            const current: (IToken | Terminal | Expr) = postOrderOutput[i]
            if ((<IToken>current).type === 'operator') {
                const r: (Terminal | Expr) = stack.pop()
                const l: Identifier = stack.pop()
                const expr: Expr = new Expr((<IToken>current).value, l, r)
                stack.push(expr)
            } else {
                stack.push(current)
            }
        }
        return stack[0]
    }

    /**
     * 帮助Pop Stack直到Prediction满足
     * @param {*} stack 
     * @param {Lambda} prediction 
     * @param {*} callback 
     */
    private popUntil(stack: Array<IToken>, prediction: (token?: IToken) => boolean, callback: (token?: IToken) => void): void {
        let token: IToken = null
        while (token = stack.pop()) {
            if (prediction(token)) {
                stack.push(token)
                break
            }
            callback(token)
        }
    }

    /**
     * 后序遍历实现表达式优先级算法：中序表达式a+b*(c+d)的转换后序表达式abcd+*+
     */
    private inOrderToPostOrder(): Array<IToken | Terminal | Expr> {
        const opStack: Array<IToken> = []
        const output: Array<IToken | Terminal | Expr> = []
        while (this.parser.lookahead.value != 'eof' && this.parser.lookahead.value !== '}') {
            if (this.parser.lookahead.value === '(') {
                opStack.push(this.parser.lookahead)
                this.parser.match('(')
            } else if (this.parser.lookahead.value === ')') {
                this.popUntil(opStack, (token: IToken) => token.value === '(', (token: IToken) => {
                    output.push(token)
                })
                const op: IToken = opStack.pop()
                // 遇到没有左括号匹配的情况意味着需要停止处理
                if (!op || op.value !== '(') {
                    break
                }
                this.parser.match(')')
                if (this.parser.lookahead.type != 'operator') {
                    break
                }
            } else if (this.parser.lookahead.type === 'operator') {
                const op: IToken = this.parser.lookahead
                if (!(op.value in this.PRIORITY_TABLE)) {
                    throw `An operator expected in @line ${this.parser.lookahead.lineNo} but ${this.parser.lookahead.value} found`
                }
                this.parser.match(op.value)
                const lastOp: IToken = opStack[opStack.length - 1]
                if (!lastOp) { // opStack是空的
                    opStack.push(op)
                } else {
                    if (this.PRIORITY_TABLE[op.value] <= this.PRIORITY_TABLE[lastOp.value]) {
                        this.popUntil(opStack, (token: IToken) => !token || token.value === '(', (token: IToken) => {
                            output.push(token)
                        })
                    }
                    opStack.push(op)
                }
            } else {
                const factor: (Terminal | Expr) = this.parser.parseFactor()
                output.push(factor)
                if (this.parser.lookahead.type != 'operator' || this.parser.lookahead.value === '=') {
                    break
                }
            }
        }
        //op栈出栈存入结果栈中
        if (opStack.length > 0) {
            while (opStack.length > 0) {
                output.push(opStack.pop())
            }
        }
        return output
    }
}