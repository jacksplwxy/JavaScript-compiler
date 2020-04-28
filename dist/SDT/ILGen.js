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
    class ILGen {
        constructor() {
            this.stack = [];
            this.sections = [];
        }
        //为每个作用域单独创建一个section
        beginSection(mark) {
            const section = new Section(mark);
            this.sections.push(section);
            this.stack.push(section);
        }
        //生成LB标签
        genLabel() {
            return `LB${ILGen.labelCounter++}`;
        }
        //解析完成时出栈
        endSection() {
            this.stack.pop();
        }
        //在当前section中添加中间码数据
        add(code) {
            return this.current().add(code);
        }
        //获取当前section
        current() {
            return this.stack[this.stack.length - 1];
        }
        //获取当前section中栈顶中间码数据
        currentLine() {
            const section = this.current();
            return section.lines[section.lines.length - 1];
        }
        //LB与代码行数绑定
        bindLabel(index, label) {
            const section = this.current();
            section.bindLabel(index, label);
        }
        //将所有中间码结果打印出来，带上行号
        print() {
            for (let i = this.sections.length - 1; i >= 0; i--) {
                const section = this.sections[i];
                console.log('section:' + section.mark);
                for (let line of section.lines) {
                    console.log(`${line.lineno}:${line.code}`);
                }
            }
        }
        //将数组中的中间码格式化成string，带换行
        toText() {
            let text = '';
            for (let i = this.sections.length - 1; i >= 0; i--) {
                const section = this.sections[i];
                text += 'section ' + section.mark + '\n';
                for (let line of section.lines) {
                    if (section.labels[line.lineno]) {
                        text += section.labels[line.lineno] + ":" + line.code + '\n';
                    }
                    else {
                        text += line.code + '\n';
                    }
                }
            }
            return text;
        }
    }
    ILGen.labelCounter = 1;
    exports.ILGen = ILGen;
    //片段
    class Section {
        constructor(mark) {
            this.mark = mark;
            this.lines = [];
            this.lineno = 0;
            this.labels = [];
        }
        //LB与代码行数绑定
        bindLabel(index, label) {
            this.labels[index] = label;
        }
        //将生成的中间码加入lines列表，并返回
        add(code) {
            const line = {
                code,
                lineno: this.lineno++
            };
            this.lines.push(line);
            return line;
        }
    }
});
//# sourceMappingURL=ILGen.js.map