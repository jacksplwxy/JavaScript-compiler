import { LexicalScope } from '../SDT/LexicalScope'

export class Terminal {
  constructor(public value: string | number) {
    this.value = value
  }

  //左值
  public lvalue(): string | number {
    return this.value
  }

  //右值
  public rvalue(): string | number {
    return this.value
  }

  //打印值
  public print(level): void {
    console.log(''.padStart(level * 2) + this.value)
  }

}

//标识符
export class Identifier extends Terminal {
  private scope: LexicalScope
  public bindLexicalScope(scope: LexicalScope) {
    this.scope = scope.lookup(this.value)
    if (this.scope === null) {
      throw `sytnax error: ${this.value} is not defined`
    }
  }
}

//数字
export class Numeral extends Terminal { }

