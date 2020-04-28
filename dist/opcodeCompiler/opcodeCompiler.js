(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OpcodeCompiler {
        constructor() { }
        //通过寄存器+偏移量寻址
        offset(register, lexeme, argc = 0) {
            if (lexeme.index < argc) {
                return `${register}+${4 * (argc - lexeme.index + 1)}`;
            }
            else if (lexeme.index > argc) {
                return `${register}-${4 * (lexeme.index - 1)}`;
            }
            else {
                return `${register}`;
            }
        }
        //获取地址
        addr(curScope, x, register = 'R0') {
            // 数字
            if (x[0].match(/[0-9]/)) {
                return '#' + x;
            }
            //消除%
            else if (x.indexOf('%') !== -1) {
                return x.replace(/%/g, '');
            }
            //
            else {
                // const argc = currentScop
                // console.log(curScope, curScope.children[0].table)
                const argc = curScope.type === 'function' ? curScope.argc : 0;
                const lexeme = curScope.find(x);
                // 分case讨论
                // case1: 变量在当前作用域
                // case2：变量不在当前作用域
                // case3: 当前作用域是变量作用域的子节点
                // case4: 当前作用域不是变量作用域的子节点
                if (curScope.id === lexeme.scopeId) {
                    return `${this.offset('TOP', lexeme, argc)}`;
                }
                else {
                    if (curScope.isParent(lexeme.scopeId)) {
                        const levelDiff = curScope.level - lexeme.level;
                        this.lines.push(`mov TOP ${register}`);
                        for (let i = 0; i < levelDiff; i++) {
                            this.lines.push(`mov @${register} ${register}`);
                        }
                        this.lines.push(`mov ${this.offset(register, lexeme, argc)} ${register}`);
                    }
                    else {
                        // 这种情况下TOP肯定指向父作用域
                        this.lines.push(`mov TOP ${register}`);
                        this.lines.push(`mov @${register} ${register}`);
                        this.lines.push(`mov ${this.offset(register, lexeme, argc)} ${register}`);
                    }
                }
            }
        }
        //翻译Pass
        translatePass(curScope, params) {
            const v = params[0];
            this.lines.push(`push ${this.addr(curScope, v, 'TOP')}`);
        }
        //翻译Branch
        translateBranch(curScope, params) {
            const v = params[0];
            const lb1 = params[1];
            this.lines.push(`jz ${lb1}`);
        }
        //翻译Call
        translateCall(curScope, params) {
            const func = params[0];
            this.lines.push(`push PC`);
            this.lines.push(`jump ${func}`);
        }
        //翻译set
        translateSet(curScope, params) {
            const assignee = params[0]; //临时变量
            const op = params[2]; //操作符
            const l = params[1]; //左值
            const r = params[3]; //右值
            //存在操作符时
            if (op) {
                //拿到左值的地址
                const a = this.addr(curScope, l, 'R0');
                //拿到右值的地址
                const b = this.addr(curScope, r, 'R1');
                switch (op) {
                    case "==": {
                        this.lines.push(`cmp ${a} ${b}`);
                        this.lines.push(`mov ZF ${this.addr(curScope, assignee, 'TOP')}`);
                        break;
                    }
                    case "||": {
                        this.lines.push(`mov ${a} R0`);
                        this.lines.push(`or R0 ${b}`);
                        this.lines.push(`mov R0 ${this.addr(curScope, assignee, 'TOP')}`);
                        break;
                    }
                    case '-': {
                        this.lines.push(`mov ${a} R0`);
                        this.lines.push(`sub R0 ${b}`);
                        this.lines.push(`mov R0 ${this.addr(curScope, assignee, 'TOP')}`);
                        break;
                    }
                    case '+': {
                        this.lines.push(`mov ${a} R0`);
                        this.lines.push(`add R0 ${b}`);
                        this.lines.push(`mov R0 ${this.addr(curScope, assignee, 'TOP')}`);
                    }
                }
            }
            else {
                const a = this.addr(curScope, assignee, 'R0');
                const b = this.addr(curScope, l, 'R1');
                this.lines.push(`mov ${b} ${a}`);
                if (assignee.indexOf('%') === -1) {
                    this.lines.push(`sub #-4 SP`);
                }
            }
        }
        parse(sourceCode, symbols) {
            this.lines = []; //初始化结果列表
            this.symbolTable = new SymbolTable(symbols); //创建符号表
            const ilLines = sourceCode.split('\n'); //将每行中间码数据拆成单个数组元素
            let sectionScope = null; //当前section作用域下的符号表
            //逐条解析单个三地址码
            for (let iline of ilLines) {
                if (iline.trim()) {
                    let label = '';
                    if (iline.indexOf(':') !== -1) {
                        [label, iline] = iline.split(':');
                    }
                    const prts = iline.split(' ').filter(x => x);
                    /**
                     * codeName：指令名称
                     * params：指令参数列表
                     */
                    const [codeName, ...params] = prts;
                    switch (codeName) {
                        case 'section': {
                            const [name, id] = params[0].split('@');
                            sectionScope = this.symbolTable.findScope(id);
                            break;
                        }
                        case 'set': {
                            this.translateSet(sectionScope, params);
                            break;
                        }
                        case 'branch': {
                            this.translateBranch(sectionScope, params);
                            break;
                        }
                        case 'pass': {
                            this.translatePass(sectionScope, params);
                            break;
                        }
                        case 'call': {
                            this.translateCall(sectionScope, params);
                            break;
                        }
                    }
                }
            }
        }
        print() {
            for (let line of this.lines) {
                console.log(line);
            }
        }
    }
    exports.OpcodeCompiler = OpcodeCompiler;
    //符号表类
    class SymbolTable {
        constructor(symbols, parent, level = 0) {
            this.symbols = symbols;
            this.parent = parent;
            this.level = level;
            if (this.level === 0) {
                this.hash = {};
            }
            if (this.parent) {
                this.hash = this.parent.hash;
            }
            for (let key in this.symbols) {
                this[key] = this.symbols[key];
            }
            this.hash[this.id] = this;
            //本机符号表中补充层级和作用域信息
            for (let key in this.table) {
                this.table[key].level = this.level;
                this.table[key].scopeId = this.id;
            }
            //子符号表
            this.children = symbols.children ? symbols.children.map(x => new SymbolTable(x, this, level + 1)) : null;
        }
        //根据id寻找符号表
        findScope(id) {
            return this.hash[id];
        }
        //根据id查找详情信息
        find(id) {
            //判断id是否带作用域
            if (id.indexOf('@') !== -1) {
                const [vid, scopeId] = id.split('@');
                const scope = this.hash[scopeId];
                return scope.table[vid];
            }
            else {
                //判断本级符号表是否存在id，没有的话则去父表中找
                if (this.table[id]) {
                    return this.table[id];
                }
                return this.parent.find(id);
            }
        }
        //判断当前符号表是不是scopeId表的父表
        isParent(scopeId) {
            if (this.findScope(scopeId).parent.id === this.id) {
                return true;
            }
            else {
                return false;
            }
        }
    }
});
//# sourceMappingURL=opcodeCompiler.js.map