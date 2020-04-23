
import { Tokenizer } from '../tokenizer/tokenizer'
let tokenizer = new Tokenizer('var myName = jacksplwxy + test')
console.log('结果:', JSON.stringify(tokenizer.tokens,null,2))