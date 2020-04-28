import { Terminal, Identifier } from './terminal'
import { ILGen } from '../SDT/ILGen'
import { LexicalScope } from '../SDT/LexicalScope'

export class Expr {
  protected _rval: string
  constructor(private op: string, protected left: (Expr | Terminal | Args), protected right: (Expr | Terminal | Args)) { }

  public print(level: number = 0): void {
    const pad: string = ''.padStart(level * 2)
    console.log(pad + this.op)
    this.left && this.left.print(level + 1)
    this.right && this.right.print(level + 1)
  }

  //代码生成
  public gen(il: ILGen, scope: LexicalScope) {
    if (this.left && (<Expr | Args>this.left).gen) {
      (<Expr | Args>this.left).gen(il, scope)
    }
    if (this.right && (<Expr | Args>this.right).gen) {
      (<Expr | Args>this.right).gen(il, scope)
    }
    const tempVar: string = scope.bindTempVar()
    il.add(`set ${tempVar} ${(<Expr | Terminal>this.left).rvalue()} ${this.op} ${(<Expr | Terminal>this.right).rvalue()}`)
    this._rval = tempVar;
  }

  //获取临时标识符名
  public rvalue(): string {
    return this._rval;
  }

  //绑定词法作用域
  public bindLexicalScope(scope) {
    if (this.left && (<Expr | Args>this.left).bindLexicalScope) {
      (<Expr | Args>this.left).bindLexicalScope(scope)
    }
    if (this.right && (<Expr | Args>this.right).bindLexicalScope) {
      (<Expr | Args>this.right).bindLexicalScope(scope)
    }
  }
}

//函数调用表达式
export class FunctionCallExpr extends Expr {
  constructor(private id: Identifier, private args: Args) {
    super('call', id, args)
  }

  gen(il: ILGen, scope: LexicalScope) {
    (<Expr | Args>this.right).gen(il, scope)
    const tempVar = scope.bindTempVar()
    il.add(`call ${scope.getLexemeName((<Terminal>this.left).lvalue())}`)
    this._rval = tempVar
  }
}

export class AssignExpr extends Expr {
  constructor(private id: Identifier, private expr: Expr | Terminal) {
    super('=', id, expr)
  }

  gen(il: ILGen, scope: LexicalScope): void {
    il.add(`declare ${scope.getLexemeName(this.id.lvalue())}`);
    (<Expr>this.expr).gen(il, scope)
    il.add(`${scope.getLexemeName(this.id.lvalue())}=${this.expr.rvalue()}`)
  }
}

export class Args {
  constructor(private args: Array<Expr | Identifier>, private type = 'call') { }

  print(level): void {
    this.args.forEach(x => {
      x.print(level)
    })
  }

  size(): number {
    return this.args.length
  }

  bindLexicalScope(scope: LexicalScope): void {
    for (let i = 0; i < this.args.length; i++) {
      if (this.type === 'function') {
        scope.bind((<Identifier>this.args[i]).value)
        this.args[i].bindLexicalScope(scope)
      } else {
        this.args[i].bindLexicalScope && this.args[i].bindLexicalScope(scope)
      }
    }
  }

  gen(il: ILGen, scope: LexicalScope): void {
    if (this.type == 'call') {
      for (let i = 0; i < this.args.length; i++) {
        const expr = this.args[i]
        if ((<Expr>expr).gen) {
          (<Expr>expr).gen(il, scope)
        }
        il.add(`pass ${expr.rvalue()}`)
      }
    }
  }

}

