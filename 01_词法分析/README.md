* 词法分析的目标：词法分析的目标是将文本分割成一个个的“token”，例如：init、main、init、x、;、x、=、3、;、}等等。同时它可以去掉一些注释、空格、回车等等无效字符
* 词法分析生成token的办法有2种：
  <br/>
  ~&emsp;使用正则进行词法分析：需要写大量的正则表达式，正则之间还有冲突需要处理，不容易维护，性能不高，所以正则只适合一些简单的模板语法，真正复杂的语言并不合适。并且有的语言并不一定自带正则引擎。
  <br/>
  ~&emsp;使用自动机进行词法分析：自动机可以很好的生成token
* 有穷状态自动机（finite state machine）：在有限个输入的情况下，在这些状态中转移并期望最终达到终止状态。
* 有穷状态自动机根据确定性可以分为：
  <br/>~&emsp;“确定有穷状态自动机”（DFA - Deterministic finite automaton）
  <br/>~&emsp;“非确定有穷自动机”（NFA - Non-deterministic finite automaton）。
* DFA：在输入一个状态时，只得到一个固定的状态。DFA 可以认为是一种特殊的 NFA。
* NFA：当输入一个字符或者条件得到一个状态机的集合。JavaScript 正则采用的是 NFA 引擎
* ε-NFA：NFA的一个小分支。我们用ε边来表示一个状态可以不读入字符就跳转到另一个状态 上，ε-NFA就是在NFA中存在这种边的情况
* 示例：实现一个正则为(a|b)*abb的自动机（https://www.bilibili.com/video/BV1zW411t7YE?p=15，07：05）
  <br/>~&emsp;NFA的实现(状态0遇到a有0和1两种状态,无法确定)
    ```
    →state：0  -a→ state:0
               -b→ state:0
               -a→ state:1   -b→ state:2   -b→ state:3 makeToken
    ```
  <br/>~&emsp;DFA的实现（状态0遇到a只有state1一种状态）
    ```
    →state：0  -b→ state:0
               -a→ state:1   -b→ state:2   -b→ state:3 makeToken  -a→ state:1
                                                                  -b→ state:0
                                           -a→ state:1
                             -a→ state:1
    ```
* 正则表达式可以等价的转为一个有穷自动机。
* 正则引擎实际上就是使用自动计算法实现的。
* DFA和NFA的关系：
  <br/>~&emsp;DFA和NFA之间可以相互转换
  <br/>~&emsp;NFA比DFA更加直观的看出它的匹配状态
  <br/>~&emsp;DFA比NFA更加容易使用计算机进行实现
* 正则表达式的自动机实现（自动化词法生成器的实现）：
  因为NFA更直观，所以先将正则表达式转换为NFA。而DFA更容易使用代码实现，所以再将NFA转换为DFA。简而言之就是：正则表达式 → NFA → DFA
* 正则表达式虽然可以等价转换为DFA，但为了简化代码，我们完全可以直接使用DFA实现一个词法分析器。
* 关系运算符DFA（部分）：
  <br/>第一行解析:→state：0  ->→ state:1   -=→ state:5 makeToken（op,≥）：
  <br/>表示开始状态0，当遇到>符号时进入状态1，当遇到=符号时进入状态5，此时结束匹配，生成token为操作符≥
  ```
  →state：0  -+→ state:1    -+→ makeToken（op,++）
                            -others→ makeToken（op,+）
             --→ state:2    --→ makeToken（op,--）
                            -others→ makeToken（op,-）
             -*→ makeToken（op,*）    
             -/→ makeToken（op,/） 
             -=→ state:4    -=→ makeToken（op,==）
                            -others→ makeToken（op,=）
             -&→ state:5    -&→ makeToken（op,&&）
                            -others→ makeToken（op,&）
             -|→ state:6    -|→ makeToken（op,||）
                            -others→ makeToken（op,|）
             ->→ state:7    -=→ makeToken（op,>=）
                            -others→ makeToken（op,>）
             -<→ state:8    -=→ makeToken（op,<>=）
                            -others→ makeToken（op,<）
             -!→ state:9   -=→ makeToken（op,!=）
                            -others→ makeToken（op,!）
             -(→ makeToken（op,(）
             -)→ makeToken（op,)）
             -others→ err
  ```
* 变量名DFA：
  ```
  →state：0  -a-z||A-Z→ state:1   -a-z||A-Z||0-9||_→ state:1 
                                  -others→ state:2 makeToken（接着判断该tokens是否属于keywords）
             -others→ err
  ```
* 数字DFA(不含二进制和科学计算法)：
  ```
  →state：0  -1-9→ state:1   -0-9→ state:1
                             -others→ state:6 makeToken
                             -.→ state:4  -other→ state:6 makeToken
                                          -0-9→ state:5  -0-9→ state:5
                                                         -others→ state:6 makeToken
             -0→ state:2     -0-9→ state:1
                             -other→ state:6 makeToken
                             -.→ state:4
             -.→ state:3     -0-9→ state:5           
             -others→ err
  ```
* [词法分析器代码入口](../src/tokenizer/tokenizer.ts)