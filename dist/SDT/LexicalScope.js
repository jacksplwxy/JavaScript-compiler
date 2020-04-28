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
    class LexicalScope {
        constructor(parent, others) {
            this.parent = parent;
            this.others = others;
            this.globalHash = null; //存放标识符的全局hash
            this.id = null; //本作用域id索引
            this.table = null; //存储标识符属性的符号表
            this.children = null; //子作用域列表
            this.index = null; //临时标识符索引
            //父作用域
            this.parent = parent;
            //其他数据，例如函数的实参
            this.others = others;
            //不存在父作用域时，初始化标识符全局hash
            if (!this.parent) {
                this.globalHash = {};
            }
            else {
                //存在父作用域时，globalHash就是指向父作用域的globalHash地址
                this.globalHash = parent.globalHash;
                //将本作用域加入到父作用域的children中
                this.parent.add(this);
            }
            this.id = LexicalScope.scopeId++;
            this.table = {};
            this.children = [];
            this.index = 0;
        }
        //添加子作用域
        add(subScope) {
            this.children.push(subScope);
        }
        //向上寻找id的作用域
        lookup(id) {
            if (id.indexOf('$') !== -1) {
                return this.globalHash[id];
            }
            let p = this;
            while (p) {
                if (p.table[id]) {
                    return p;
                }
                p = p.parent;
            }
            return null;
        }
        //定义临时标识符名，带上作用域id
        bindTempVar(type = 'number') {
            const varName = `$t` + this.index;
            this.bind(varName, type);
            return varName + '@' + this.id;
        }
        //标识符加入全局hash中，并指向它的作用域
        bind(id, type = 'number', others) {
            this.globalHash[id + '@' + this.id] = this;
            this.table[id] = Object.assign({ type, index: this.index++ }, others);
        }
        //给词法带上作用域id
        getLexemeName(id) {
            const scope = this.lookup(id);
            if (scope) {
                return id + '@' + scope.id;
            }
            else {
                throw `syntax error: lexeme ${id} not found.`;
            }
        }
        //将作用域状态打印出来
        print(level = 0) {
            const pad = ''.padStart(level * 2);
            console.log(`${pad}scope ${this.id}\n${pad}{`);
            for (let key in this.table) {
                console.log(`${pad}  ${key} : ${this.table[key].type}`);
            }
            this.children.forEach(child => {
                child.print(level + 1);
            });
            console.log(`${pad}}`);
        }
        //格式化数据为json
        toJSON() {
            const obj = Object.assign({ id: this.id, table: this.table, children: this.children.map(child => child.toJSON()) }, this.others);
            return obj;
        }
    }
    LexicalScope.scopeId = 1;
    exports.LexicalScope = LexicalScope;
});
//# sourceMappingURL=LexicalScope.js.map