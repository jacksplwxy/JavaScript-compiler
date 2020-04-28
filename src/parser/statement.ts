import { Identifier, Terminal } from './terminal'
import { Expr, AssignExpr, FunctionCallExpr, Args } from './expression'
import { LexicalScope } from '../SDT/LexicalScope'
import { ILGen } from '../SDT/ILGen'


//定义陈述语言抽象类
export abstract class Stmt {
  protected lexicalScope: LexicalScope
  //每个陈述语句都需要构建一次作用域
  buildLexicalScope(parent: LexicalScope): void {
    this.lexicalScope = parent
  }
  abstract print(level: number): void;
  abstract gen(il: ILGen, scopte: LexicalScope): void;
}

//声明语句
export class DeclareStmt extends Stmt {
  constructor(private left: Identifier, private right: Expr | Terminal) {
    super()
  }

  buildLexicalScope(parent: LexicalScope): void {
    this.lexicalScope = parent
    this.lexicalScope.bind(this.left.value, 'number')
  }


  print(level: number): void {
    const pad = ''.padStart(level * 2)
    console.log(pad + '=')
    this.left.print(level + 1)
    this.right.print(level + 1)
  }

  gen(il: ILGen): void {
    let scope: LexicalScope = this.lexicalScope
    il.add(`declare ${scope.getLexemeName(this.left.lvalue())}`);
    if (this.right && (<Expr>this.right).gen) {
      (<Expr>this.right).gen(il, scope)
    }
    il.add(`${scope.getLexemeName(this.left.lvalue())}=${this.right.rvalue()}`)
  }
}

export class IfStmt extends Stmt {
  /**
   * @param {*} expr if 后面的表达式
   * @param {*} ifBlock  if 后面的紧跟着的 Block
   * @param {*} elseIfStmt 如果有else if， 相当于else后面跟着的If语句
   * @param {*} elseBlock 如果没有else if 相当于else后面跟着的Block
   */
  constructor(private expr: Expr | Terminal, private ifBlock: Block, private elseIfStmt?: Stmt, private elseBlock?: Block) {
    super()
  }

  buildLexicalScope(parent: LexicalScope): void {
    super.buildLexicalScope(parent);
    (<Expr | Identifier>this.expr).bindLexicalScope(this.lexicalScope)
    this.ifBlock.buildLexicalScope(this.lexicalScope)
    this.elseIfStmt && this.elseIfStmt.buildLexicalScope(this.lexicalScope)
    this.elseBlock && this.elseBlock.buildLexicalScope(this.lexicalScope)
  }

  print(level: number): void {
    const pad = ''.padStart(level * 2)
    console.log(pad + 'if')
    this.expr.print(level + 1)
    this.ifBlock.print()
  }

  gen(il): void {
    (<Expr>this.expr).gen(il, this.lexicalScope)
    const ifCodeLine = il.add('', true)
    let ifBlockNextLineNo = null
    this.ifBlock.gen(il, this.lexicalScope)

    if (this.elseIfStmt) {
      if (!ifBlockNextLineNo) {
        ifBlockNextLineNo = il.current().lineno
      }
      this.elseIfStmt.gen(il, this.lexicalScope)
    } else if (this.elseBlock) {
      if (!ifBlockNextLineNo) {
        ifBlockNextLineNo = il.current().lineno
      }
      this.elseBlock.gen(il, this.lexicalScope)
    }

    // const nextLine = il.current().lines[ifCodeLine.lineno+1]
    const currentLine = il.currentLine()
    const l1 = il.genLabel()
    // il.bindLabel(nextLine.lineno, l1)
    il.bindLabel(currentLine.lineno + 1, l1)
    // currentLine.label = l2
    // nextLine.label = l1 

    ifCodeLine.code = `branch ${this.expr.rvalue()} ${l1}`
  }
}

export class ReturnStmt extends Stmt {
  constructor(private expr) {
    super()
    this.expr = expr
  }

  buildLexicalScope(parent): void {
    super.buildLexicalScope(parent)
    this.expr.bindLexicalScope(this.lexicalScope)
  }

  print(level): void {
    const pad = ''.padStart(level * 2)
    console.log(pad + 'return')
    this.expr.print(level + 1)
  }

  gen(il): void {
    this.expr && this.expr.gen && this.expr.gen(il, this.lexicalScope)
    il.add(`return ${this.lexicalScope.getLexemeName(this.expr.rvalue())}`)
  }
}

export class Function extends Stmt {
  constructor(private id: Identifier, private args: Args, private block: Block) {
    super()
  }

  buildLexicalScope(parent): void {
    this.lexicalScope = new LexicalScope(parent, {
      type: 'function',
      argc: this.args.size()
    })
    parent.bind(this.id.value, 'function')
    this.args.bindLexicalScope(this.lexicalScope)
    this.block.buildLexicalScope(this.lexicalScope, false)
  }

  print(level): void {
    const pad = ''.padStart(level * 2)
    console.log(pad + 'function:' + this.id)
    this.args.print(level + 1)
    // this.block.print(level + 1)
    this.block.print()
  }

  gen(il): void {
    il.add(`declare function ${this.lexicalScope.getLexemeName(this.id.lvalue())}`)
    il.beginSection(this.id.value + '@' + this.lexicalScope.id)
    il.add(`set %TOP% %SP%`)
    this.args.gen(il, this.lexicalScope)
    this.block.gen(il, this.lexicalScope)
    il.endSection()
  }
}


export class Block {
  protected lexicalScope: LexicalScope
  constructor(public stmts: Array<Stmt | Expr | Terminal>) { }

  buildLexicalScope(parent: LexicalScope, create = true): void {
    if (create) {
      this.lexicalScope = new LexicalScope(parent)
    } else {
      this.lexicalScope = parent
    }

    this.stmts.forEach((stmt: (Stmt | Expr | Terminal)) => {
      if (stmt instanceof Stmt) {
        stmt.buildLexicalScope(this.lexicalScope)
      } else {
        (<Expr | Identifier>stmt).bindLexicalScope(this.lexicalScope)
      }
    })
  }

  print(): void {
    for (let i = 0; i < this.stmts.length; i++) {
      this.stmts[i].print(0)
    }
  }
  gen(il: ILGen, scope: LexicalScope = this.lexicalScope): void {
    for (let i = 0; i < this.stmts.length; i++) {
      (<Stmt | Expr>this.stmts[i]).gen(il, scope)
    }
  }
}

export class Program extends Block {
  public ilGen: ILGen
  public lexicalScope: LexicalScope
  constructor(public stmts: Array<Stmt | Expr | Terminal>) {
    super(stmts)
    this.ilGen = new ILGen()
  }

  registerGlobals(scope): void {
    scope.bind('print', 'function')
  }

  buildLexicalScope(): void {
    this.lexicalScope = new LexicalScope()
    this.registerGlobals(this.lexicalScope)
    this.stmts.forEach(stmt => {
      if (stmt instanceof Stmt) {
        stmt.buildLexicalScope(this.lexicalScope)
      } else {
        (<Expr | Identifier>stmt).bindLexicalScope(this.lexicalScope)
      }
    })
  }

  gen(): void {
    this.ilGen.beginSection('main@1')
    this.ilGen.add('set %TOP% %SP%')
    for (let i = 0; i < this.stmts.length; i++) {
      (<Stmt | Expr>this.stmts[i]).gen(this.ilGen, this.lexicalScope)
    }
    this.ilGen.endSection()
  }
}
