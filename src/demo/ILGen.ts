
import { Parser } from '../parser/parser'
const sourceCode = `
var b = 2
function closureFn(){
  var c = 3
  var d = 4
  var a = b/(c+d)
  return a
}

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
ast.print()
console.log('-----SYMBOL TABLE--------')
ast.lexicalScope.print()
console.log('-----il------')
ast.gen()
ast.ilGen.print()
