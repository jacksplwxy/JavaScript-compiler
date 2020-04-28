import { Parser } from '../parser/parser'
import { OpcodeCompiler } from '../opcodeCompiler/opcodeCompiler'

const sourceCode = `
function febonacci(n) {
  if(n == 1 || n == 2) {
    return n
  }
  return febonacci(n-1) + febonacci(n-2)
}

print( febonacci(5) )

`

const parser = new Parser()
const ast = parser.parse(sourceCode)
console.log('-----AST------')
ast.print()
console.log('-----SYMBOL TABLE--------')
ast.lexicalScope.print()
console.log('-----IR------')
ast.gen()
ast.ilGen.print()
const compiler = new OpcodeCompiler()
compiler.parse(ast.ilGen.toText(), ast.lexicalScope.toJSON())
console.log('-----OPcode------')
compiler.print()