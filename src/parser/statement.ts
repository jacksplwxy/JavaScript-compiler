import { Identifier, Terminal } from './terminal'
import { Expr, Args } from './expression'

export interface IStmt { }

//整个程序
export class Program {
    constructor(public stmts: Array<IStmt>) { }
}

//块
export class Block {
    constructor(private stmts: Array<IStmt>) { }
}

//赋值语句
export class AssignStmt implements IStmt {
    constructor(private left: Identifier, private right: (Expr | Terminal | FunctionCallStmt | AssignStmt)) { }
}

//if语句
export class IfStmt implements IStmt {
    constructor(private expr: (Expr | Terminal | FunctionCallStmt | AssignStmt), private ifBlock: Block, private ifStmt?: IfStmt, private elseBlock?: Block) { }
}

//return 语句
export class ReturnStmt implements IStmt {
    constructor(private expr: (Expr | Terminal | FunctionCallStmt | AssignStmt)) { }
}

//function语句
export class Function {
    constructor(private id: string, private args: Args | Array<null>, private block: Block) { }
}

//id(args) function执行表达式
export class FunctionCallStmt implements IStmt {
    constructor(private id: string, private args: Args) { }
}

