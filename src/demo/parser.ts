import { Parser } from '../parser/parser'

const ast = new Parser().parse(`
    function febonacci(n) {
        if(n == 1 || n == 2) {
          return n
        }
        return febonacci(n-1) + febonacci(n-2)
    }
    var feb = febonacci(n)
`)
console.log('ast', JSON.stringify(ast.stmts, null, 4))