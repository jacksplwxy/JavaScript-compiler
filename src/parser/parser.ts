
import { Tokenizer, IToken } from '../tokenizer/tokenizer'
import { IStmt, Program, AssignStmt, Function, Block, IfStmt, ReturnStmt, FunctionCallStmt } from './statement'
import { Expr, Args } from './expression'
import { Terminal, Identifier, Numeral } from './terminal'
import { expressionParser } from './exprParser'

/**
 * 自顶部向下递归+lookahead一个token的parser
 * Program -> Stmts
 * Stmts -> Stmt Stmts | ϵ
 * Stmt -> AssignStmt | IfStmt | WhileStmt | Function | Block | ...
 * xxStmt -> Expr | Stmt | Terminal
 * Expr -> Terminal
 */
export class Parser {
    public tokens: Array<IToken>    //token流
    public lookahead: IToken    //下一个token
    private index: number   //第index个token
    //语法分析函数
    public parse(sourceCode): Program {
        //从词法分析器拿到tokens
        this.tokens = new Tokenizer(sourceCode).tokens
        // 增加一个哨兵，用于判断结尾
        this.tokens.push({ type: 'eof', value: null })
        this.index = 0
        this.lookahead = this.tokens[this.index++]
        return new Program(this.parseStmts())
    }
    //向前读一个token：封装index，避免危险操作
    private read(): void {
        if (this.lookahead.type !== 'eof') {
            this.lookahead = this.tokens[this.index++]
        }
    }
    //校验token,并向前读一个
    public match(value): string {
        if (this.lookahead.value === value) {
            this.read()
            return value
        }
        throw `syntax error @line ${this.lookahead.lineNo} : expect ${value} here but ${this.lookahead.value} found.`
    }
    //校验类型（静态语言）,并向前读一个
    private matchType(type): void {
        if (this.lookahead.type === type) {
            this.read()
        }
        throw 'syntax error'
    }

    //解析表达式
    private parseExpr(): (Expr | Terminal | FunctionCallStmt | AssignStmt) {
        return new expressionParser(this).exprParser()
    }

    /**
     * Stmts -> Stmt Stmts | ϵ
     */
    private parseStmts(): Array<IStmt> {
        const stmts = []
        while (this.lookahead.type !== 'eof' && this.lookahead.value !== '}') {
            stmts.push(this.parseStmt())
        }
        return stmts
    }
    /**
     * Stmt -> AssignStmt | IfStmt | WhileStmt | Function | Block | ...
     * AssignStmt -> var <id> = Expr
     * IfStmt -> if Expr Block else IfStmt | if Expr Block | Stmt
     */
    private parseStmt(): IStmt {
        if (this.lookahead.type === 'id' || this.lookahead.type === 'number') { // 表达式
            return this.parseExpr()
        }
        switch (this.lookahead.value) {
            case 'var':
                return this.parseAssignStmt()
            case 'function':
                return this.parseFunctionStmt()
            case 'if':
                return this.parseIfStmt()
            case 'return':
                return this.parseReturnStmt()
            default:
                console.log(this.lookahead)
                throw `syntax error @line ${this.lookahead.lineNo} : not impl. ${this.lookahead.value}`
        }
    }
    /**
     * 解析block
     */
    private parseBlock(): Block {
        this.match('{')
        const stmts = this.parseStmts()
        this.match('}')
        return new Block(stmts)
    }
    /**
     * FunctionStmt -> function {id}(...ARGS) BLOCK
     */
    private parseFunctionStmt(): Function {
        this.match('function')
        if (this.lookahead.type !== 'id') {
            throw 'syntax error'
        }
        const id = this.lookahead.value
        this.match(id)
        this.match('(')
        const args = this.parseFuncArguments()
        this.match(')')
        const block = this.parseBlock()
        return new Function(id, args, block)
    }
    /**
     * ReturnStmt -> return Expr
     */
    private parseReturnStmt(): ReturnStmt {
        this.match('return')
        const expr = this.parseExpr()
        return new ReturnStmt(expr)
    }
    /**
     * Args -> <id> | <id>,Args | ϵ
     */
    private parseFuncArguments(): Args | Array<null> {
        let list: Array<Args | Identifier> = []
        if (this.lookahead.type === 'id') {
            const id = this.lookahead.value
            this.match(id)
            list.push(new Identifier(id))
            if (this.lookahead.value === ',') {
                this.match(',')
                list = list.concat(this.parseFuncArguments())
            }
        } else {
            return []
        }
        return new Args(list)
    }
    /**
     * fn(args)函数调用的参数解析
     */
    private parseArguments(): Args {
        let list = []
        let expr = null
        while ((expr = this.parseExpr())) {
            list.push(expr)
        }
        return new Args(list)
    }
    /**
     * IfStmt -> if Expr Block | if Expr Block else IfStmt | if Expr Block else Block
     */
    private parseIfStmt(): IfStmt {
        this.match('if')
        const expr = this.parseExpr()
        const ifBlock = this.parseBlock()
        if (this.lookahead.value === 'else') {
            this.match('else')
            // @ts-ignore
            if (this.lookahead.value === 'if') {
                const ifStmt = this.parseIfStmt()
                return new IfStmt(expr, ifBlock, ifStmt)
            } else {
                const elseBlock = this.parseBlock()
                return new IfStmt(expr, ifBlock, null, elseBlock)
            }
        } else {
            return new IfStmt(expr, ifBlock)
        }
    }
    /**
     * AssignStmt -> var id = expr
     */
    private parseAssignStmt(): AssignStmt {
        this.match('var')
        if (this.lookahead.type !== 'id') {
            throw 'syntax error'
        }
        const id: Identifier = new Identifier(this.lookahead.value)
        this.match(this.lookahead.value)
        this.match('=')
        const right = this.parseExpr()
        return new AssignStmt(id, right)
    }
    /**
     * 表达式中的单个factor -> number | id | fn() | l=r
     */
    public parseFactor(): Terminal | FunctionCallStmt | AssignStmt {
        if (this.lookahead.type === 'number') {
            const value = this.match(this.lookahead.value)
            return new Numeral(value)
        } else if (this.lookahead.type === 'id') {
            const value = this.match(this.lookahead.value)
            if (this.lookahead.value === '(') {
                this.match('(')
                const args = this.parseArguments()
                this.match(')')
                return new FunctionCallStmt(value, args)
            } else if (this.lookahead.value === '=') {
                this.match('=')
                const expr = this.parseExpr()
                return new AssignStmt(new Identifier(value), expr)
            }
            return new Identifier(value)
        } else if (this.lookahead.type === 'string') {
            throw 'not impl.'
        } else {
            throw `syntax error, expect a factor but ${this.lookahead.value} found`
        }
    }
}


