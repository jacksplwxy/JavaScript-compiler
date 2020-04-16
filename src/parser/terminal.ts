
//终结符
export class Terminal {
    constructor(public value: string | number) {
    }
}
//变量
export class Identifier extends Terminal { }
//数字
export class Numeral extends Terminal { }