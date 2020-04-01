## JavaScript-compiler项目简介：
&emsp;&emsp;编译原理在编程世界中无处不在，是我们向高级或底层开发路上不得不要逾越的一道坎。编译原理比较复杂，我们不求写出一个完整的编译器，但掌握基本原理还是很有必要的。
<br/>
&emsp;&emsp;本项目是本人对编译原理学习的汇总，并尝试使用TypeScript实现一款简易JavaScript编译器，同时将对编译器的实现原理简明通俗阐述，希望可以帮忙需要了解编译器的朋友。
<br/>
&emsp;&emsp;核心内容：自动机、上下文无关文法、自顶向下语法分析、中序转换为后序算法解决语法优先级问题、中间代码生成、内存分配、运行时刻的词法作用域和闭包分析、opcode生成等。
<br/>
&emsp;&emsp;理解不到位的地方还望斧正。

## 编译器：
### 什么是编译器：
&emsp;&emsp;编译器就是将一种编程语言转换为另一种编程语言的程序
### 编译器的使用场景:
* 将高级代码编译成浏览器能识别的代码：例如vue中的.vue文件是无法被浏览器识别的，这时需要编译器将其编译成html文件才能正常显示。又如typescript编译成javascript，类似的还有Babel、ESLint、Stylus等等
* 热更新：接触过小程序开发的同学应该知道，小程序运行的环境禁止new Function，eval等方法的使用，导致我们无法直接执行字符串形式的动态代码。此外，许多平台也对这些JS自带的可执行动态代码的方法进行了限制，那么我们是没有任何办法了吗？既然如此，我们便可以用JS写一个解析器，让JS自己去运行自己。
* 开发跨平台工具：例如京东开源框架Taro，可以只书写一套代码，再通过Taro的编译工具，将源代码分别编译出可以在不同端（微信小程序、H5、App 端等）运行的代码。类似的还有Egret、Weex等等
* 其他常用工具：代码压缩、混淆等
### 编译流程：
* 常规编译过程：
  源码（source code） → 词法分析器（Lexical Analyzer） → 符号流（tokens） → 语法分析器（Syntax Analyzer） → 抽象语法树 → 语义分析（Semantics Analyzer） → 抽象语法树 → 中间代码生成（Intermediate Code/Language Generator） → 中间表现形式 → 代码优化器（Code Optimizer） → 中间表现形式 → 代码生成（Code Generator） → 目标机器语言
* C语言的编译过程：
  .c文件（源代码） → 预处理器（preprocessor） → .i文件 → 编译器（compiler） → .s文件（汇编码） → 汇编程序（assembler） → .o文件（可重定位机器码） → 链接器（Linker）/加载器  → .exe文件
* 早期Java的编译和解释执行过程：
  .java文件（源代码） → javac.exe进行编译 → .class字节码文件（中间码） → java.exe加载到虚拟机中 → 在虚拟机中解释执行字节码
* babel的编译过程：
  es6代码 → Babylon.parse → AST  → babel-traverse  → 新的AST → es5代码
* TypeScript的编译过程：
  .ts文件（源程序） → ts编译器 → .js文件*（目标程序）
* vue模板编译过程：
  <template></template> → parse(template.trim()) → AST → Optimize(ast) → 新的AST → generate(ast) → render函数
