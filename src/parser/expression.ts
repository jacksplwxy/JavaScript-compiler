import { Terminal, Identifier } from './terminal'
import { IStmt, FunctionCallStmt, AssignStmt } from './statement'


//表达式
export class Expr {
    constructor(private op: string, private left: Identifier, private right: (Expr | Terminal | FunctionCallStmt | AssignStmt)) { }
}

//参数
export class Args {
    constructor(private args: Array<Args | Identifier>) { }
}