## 前言：
&emsp;&emsp;语法分析是计算机专业本科阶段《编译原理》的重点和难点，对于很多像我这样没有专业背景的前端同学来说直接学习有一定难度，所以我增加前言部分对语法分析做一个主线介绍，避免在书本的各种抽象概念中迷失了方向。
<br/><br/>
&emsp;&emsp;我们知道，编译原理就是将一种语言转换为另一种语言。这里的语言指的并不是我们平时说话的中文或者英语这类自然语言，而是计算机语言，编译原理被称为形式语言，它是一类无需知道太多语言背景、无歧义的语言。而自然语言通常难以处理，主要是因为难以识别语言中哪些是名词哪些是动词哪些是形容词。例如：“进口汽车”这句话，“进口”到底是动词还是形容词？所以我们要解析一门语言，前提是这门语言有严格的语法规定的语言，而定义语言的语法规格称为文法。
<br/><br/>
&emsp;&emsp;1956年，一个叫乔姆斯基的老外将文法按照规范的严格性分为0型、1型、2型和3型共4中文法，从0到3文法规则是逐渐增加严的。一般的计算机语言是2型，因为0和1型文法定义宽松，将大大增加解析难度、降低解析效率，而3型文法限制又多，不利于语言设计灵活性。2型文法也叫做上下文无关文法（CFG）。
<br/><br/>
&emsp;&emsp;语法分析的目的就是通过词法分析器拿到的token流 + 结合文法规则，通过一定算法得到一颗抽象语法树（AST）。抽象语法树是非常重要的概念，尤其在前端领域应用很广。典型应用如babel插件，它的原理就是：es6代码 → Babylon.parse → AST  → babel-traverse  → 新的AST → es5代码。想更快了解AST，可以看看这个项目：[esprima](https://github.com/jquery/esprima)。
<br/><br/>
&emsp;&emsp;从生成AST效率和实现难度上，前人总结主要有2种解析算法：自顶向下的分析方法和自底向上的分析方法。自底向上算法分析文法范围广，但实现难度大。而自顶向下算法实现相对简单，并且能够解析文法的范围也不错，所以我们可以自顶向下算法来实现我们的js编译器。
<br/><br/>
&emsp;&emsp;自顶向下的分析方法又可以分为递归下降分析法和预测分析方法，其中递归下降分析法可能产生回溯，效率低。而预测分析方法是递归下降分析法的一个特例，它可以通过loakahead的方式消除回溯。
<br/><br/>
&emsp;&emsp;预测分析法并不能解析所以CFG文法，实际上它只能解析LL(1)文法，所以我们应该通过调整产生式，使文法尽可能的符合LL(1)文法。不过即使不能完全满足LL(1)也问题不大，我们可以通过一个特殊处理解决那些超出LL(1)范围的文法。
<br/><br/>
&emsp;&emsp;综上所述，我们可以得出如下制作js parse的思路：
<br/><br/>
&emsp;&emsp;&emsp;①选择合适算法：自顶向下、自底向上和通用方法。而自顶向下实现简单、可读性好、效率高，所以选择自顶向下。自顶向下具体通过递归下降实现，但存在回溯问题，所以采用预测分析法
<br/>
&emsp;&emsp;&emsp;②判判js是否满足LL文法：预测分析法要求语言满足LL(k)文法，为简化模型，我们先判定js是否满足LL(1)文法。
&emsp;&emsp;&emsp;③获取js文法：根据js语言特点得到形式化定义文法G。
<br/>
&emsp;&emsp;&emsp;④文法G优化：先提取G产生式左公共因子，再消除左递归，这样就有可能变为LL(1)文法。然后要分别写出改写后文法的FIRST集、FOLLOW集、SELECT集，如果相同左部的SELECT集的交集不为空集，则为LL(1)文法。
  ⑤即使部分文法不能完全满足LL(1)，也没关系，我们可以通过特例特殊处理的办法使得整体文法兼容到LL(1)预测分析算法。这步通常可以满足所有编程语言，还不好处理的话就只能采用自底向上算法了。[为什么所有的教科书中都不赞成手写自底向上的语法分析器？ - 冯东的回答 - 知乎](https://www.zhihu.com/question/21475266/answer/18346898)
<br/><br/><br/>


## 内容：
* 语法分析：将一段字符串推导称为一个语法树，即根据CFG和tokens生成AST
* AST解析过程：Program → Block → Stmt（Assign Stmt、If Stmt...） → (Expr) → (Term) → Factor（Factor为可以终结的token）
* 形式语言（Formal Language）：无需知道语言的太多背景，无歧义的语言，计算机语言必需是形式语言。自然语言中通常存在命名实体识别的问题。
* 命名实体识别：如何识别语言中，哪些是名词
* 文法：定义语言的语法
* 非终结符：除tokens以外的字符串称为非终结符，非终结符可以再次进行语法分析产生新的终结符的树。
* 判断一个词串是否是满足文法的句子？
  </br>
  ~&emsp; 如果通过文法的开始符号推导得到该词串，则说明该词串是文法的一个句子
  </br>
  ~&emsp; 如果通过词串规约得到该文法的开始符号，则说明该词串是文法的一个句子
* 句型和句子：
  </br>
  ~&emsp; 句型：一个句型中既可包含终结符，又可以包含非终结符，也可能是空串
  </br>
  ~&emsp; 句子：句子是不包含非终结符的句型
* 符号：
  </br>
  ~&emsp; →：推导，使用一个产生式把一个非终结符替换为产生式右边内容的过程，推导又分为最左推导和最右推导
  </br>
  ~&emsp; ←：规约，是推导的逆操作，它是使用一个产生式将产生式右边内容替换为一个非终结符的过程。
  </br>
  ~&emsp; |：或者的意思。 对于最左推导，从左至右按顺序尝试匹配
* 简称：
  </br>
  ~&emsp; Program：源程序
  </br>
  ~&emsp; Block：代码块
  </br>
  ~&emsp; Statement：语句，简写Stmt
  </br>
  ~&emsp; Assignment Statement：赋值语句
  </br>
  ~&emsp; Expression：表达式
  </br>
  ~&emsp; Term：语句
  </br>
  ~&emsp; Factor：可以终结的token
* 定义文法G：
  ```
  ① S → L | LT
  ② T → L | D | TL |TD
  ③ L → a | b | c | ... | z
  ④ D → 0 | 1 | 2 | ... | 9
  ```
  ~&emsp; 文法G分析：
  ```
    第④条产生式：D可推导出某个数字，所以D表示一个数字
    第③条产生式：L可推导出某个字母，所有L表示一个字母
    第②条产生式：
      T可推导出L，表明T表示一个字母；
      T也可以推导出D，表明T也表示一个字母；
      T可推导出TL，TL可以推导出LL | DL | TLL | TDL，LL | DL | TLL | TDL又可以推导出另外16种表示，16种表示又可以推出16 * 4种表示，直到无穷尽个表示，但T终归表示为一个字母，或一个数字，或一个字母数字串
    第①条产生式：S可以推导出一个字母，或者一个字母开头的字母数字串，所以S可以表示一个标识符（即变量名）。S是G文法的开始符，所以文法G生成的语言是标识符。
  ```
  ~&emsp; 假设第②条产生式有如下推导过程：
  ```
    T → TL
      → TDL
      → TDDL
      → TLDDL
      → DLDDL
  ```
    ~~ &emsp; 该推导过程的前面4步包含非终结符，所以是句型。第5步不包含非终结符，是句子。
    </br>
    ~~ &emsp; 实际上，T是可能推导出无穷个句子的，既然文法可以生成无穷个句子，所以说文法解决了无穷语言的有穷表示问题。
    </br>
    ~~ &emsp; 由文法G的开始符号S推导出的所有句子构成的集合成为文法G生成的语言，记为L(G)
* 文法的分类：
  </br>
  ~&emsp; 0型文法：只需满足产生式的左部至少包含一个非终结符，所以称为无限制文法
  </br>
  ~&emsp; 1型文法：在0型文法基础上要求产生式的左部符号个数不能多于右部中符号的个数，产生式一般形式：a1Aa2 → a1βa2(β!=空串)，也称为上下文有关文法
  </br>
  ~&emsp; 2型文法：在1型文法基础上所有产生式左部都为唯一一个非终结符，例如上面的文法G的S、T、L、D都为唯一的非终结符，也称为上下文无关文法（Context Free Gramma），简称CFG。即无需知道背景，即可将一个表达式根据语法规则(含优先级判定)推导成一个AST结构
  </br>
  ~&emsp; 3型文法：在2型文法基础上要求右部满足A → wβ或A → w，也称为正则文法，可以描述编程语言中的多数单词
* 4种文法的关系：逐级限制、逐级包含的关系
* 文法的形式化定义：
  </br>
  ~&emsp; 举个自然语言处理的例子：
  ```
    例如自然语言中的句子的典型结构
      主语 谓语 宾语
      名词 动词 名词
    例子：
      名词：{羊， 老虎， 草， 水}
      动词：{吃， 喝}
    句子：
      羊 吃 草
      羊 喝 水
      老虎 吃 老虎
      草 吃 老虎
      ......
    对这个例子，我们进行形式化分析：（S 表示句子， → 表示推出， N 表示名词， V 表示动词）
      S → N V N 
      N → s(sheep) | t(tiger) | g(grass) | w(water)
      V → e(eat) | d(drink)
    我们将其中的大写符号叫做非终结符：{S, N, V}
    将小写的符号（名词+谓词）叫做终结符：{s, t, g, w, e, d}
    开始符号是：S
  ```
  ~&emsp; 根据以上例子得到文法形式化定义，G是一个四元组：
  ```
    G = (T, N, P, S)
       T 是终结符集合
       N 是非终结符集合
       P 是一组产生式规则
         每条规则的形式： X -> β1 β2 ... βn, n >= 0
           其中 X ∈ N, βi ∈（T ∪ N）
       S 是唯一的开始符号（非终结符，S ∈ N
  ```
  ~&emsp; 将以上例子转化为文法形式化分析：
  ```
    G = {N, T, P, S}
    非终结符号：N = {S, N, V}
    终结符号： T = {s, t, g, w, e, d}
    开始符号：S
    产生式规则集合：
    { S → N V N,
      N → s,
      N → t,
      N → g,
      N → w,
      V → e,
      V → d
    }
    该集合可以简写为：
    S → N V N
    N → s | t | g | w
    V → e | d
  ```
  ~&emsp; 一个从编程语言生成文法的实例：[如何写出文法](https://www.zhihu.com/question/51341918)
* CFG分析树：
  ```
  设计文法G（简化版本算术表达式文法）：
    ① E → E + E
    ② E → E * E
    ③ E → -E
    ④ E → (E)
    ⑤ E → id
  可能推导出如下分析树：
          E
        /   \
       -     E
          /  |  \
        (    E    )
          /  |  \
        E    +    E
  ```
  ~ &emsp; 根节点的标号为文法开始符号，例如分析树第一行的E
  </br>
  ~ &emsp; 内部节点表示一个产生式A → β的应用，该节点的标号是此产生式左部A。该节点的子节点的标号从左到右构成了产生式的右部
* 二义性（ambiguity）：如果一个文法可以为某个句子构建多棵不同的语法树，那么这个文法就是二义性的。设计文法时需要注意消除文法的二义性，例如引入新的非终结符或者空产生式或者消歧规则。
* 语法分析有3种方式：
  </br>
  ~&emsp; 自顶向下的分析方法（Top-down）:从顶部根节点向底部叶节点构造分析树
  </br>
  ~&emsp; 自底向上的分析方法（Bottom-up）:从底部叶节点向顶部根节点构造分析树
  </br>
  ~&emsp; 通用型分析方法：通用型语法分析算法适用于任意文法，但其分析效率非常低，实际并无太多应用，所以主要使用自顶向下型和自底向上型的语法分析算法
* 自顶向下的分析方法有2种类型：
  </br>
  ~&emsp; 递归下降分析法：可能产生回溯，降低效率
  </br>
  ~&emsp; 预测分析方法：递归下降分析法的一个特例
* 自底向上的分析方法有2种类型：
  </br>
  ~&emsp; 算符优先分析法：适用性比较广
  </br>
  ~&emsp; LR分析法：适用性比算符优先分析法更广
* 自顶向下文法推导分析树的过程中，每一步都需要做2个选择，例如简化版本算术表达式文法G：
  </br>
  &emsp;&emsp;①替换当前句型中的哪个非终结符：例如简化版本算术表达式文法G的开始符E → E + E，这时该选择哪个E进行替换呢？
  </br>
  &emsp;&emsp;②用该非终结符的哪个候选式进行替换：例如简化版本算术表达式文法中的E，我们该选择5个候选式的哪个选式进行替换呢？
* 最左推导和最右推导：
  </br>
  ~&emsp;  最左推导：在自顶向下最左推导中，总是选择每个句型的最左终结符进行替换。最右规约是最左推导自底向上的逆过程
  </br>
  ~&emsp;  最右推导：在自顶向下最右推导中，总是选择每个句型的最右终结符进行替换。最左规约是最右推导自底向上的逆过程
* 分析树采用最左或者最右推导，推出的结果是唯一的。因为在推导的每一步，当前句型中的最左或最右非终结符都是唯一的
* （重要）由于分析都在自左向右的扫描tokens，所以自顶向下分析采用最左推导方式：[编译原理·哈尔滨工业大学·07：45的时候详细展示了推导过程](https://www.bilibili.com/video/BV1zW411t7YE?p=19)
  </br>
  ~&emsp; 总是选择每个句型的“最左非终结符”进行替换
  </br>
  ~&emsp; 根据输入流中的“下一个终结符”，逐个尝试选择最左非终结符的候选式中的一个
* 递归下降分析法面临的问题：
  </br>
  ~&emsp; 左递归转换无限循环问题：需要通过将左递归转换为右递归消除无限循环
  </br>
  ~&emsp; 回溯问题，回溯会影响解析效率，回溯问题可以通过提取公因子或通过预测分析解决（预测分析是递归下降的改进）。
* 回溯：
  </br>
  ~&emsp; 根据输入流中的“下一个终结符”，逐个尝试选择最左非终结符的候选式中的一个。有可能多次尝试才能匹配到输入流中的“下一个终结符”。匹配失败时退回到上一步重新尝试的过程叫回溯。
  </br>
  ~&emsp; 回溯影响程序效率，必须消除
  </br>
  ~&emsp; 回溯实例1：
  ```
    例如文法G：
      S → aAd | aBe
      A → c
      B → b
    输入流：
      a b c
    解析：初始时输入指针指向a，从文法S开始推导，S的两个候选式都是以输入流a开始，所以不能确定选择哪个，所以产生回溯。这种回溯可以通过引入其他非终结符Term，或者也叫通过提取公因子方式解决：经过反复提取左因子，就能够把每个非终结符的所有候选首符集变成为两两不相交。
  ```
  ~&emsp; 回溯实例2： https://zhuanlan.zhihu.com/p/67083281
* 预测分析（Predictive Parsing）：
  </br>
  ~&emsp; 预测分析不需要回溯，是一种确定的自顶向下分析方法。
  </br>
  ~&emsp; 是递归下降的一个特例，通过在输入中向前看固定数（通常为1）符号来选择正确的A-产生式。它可以对某些文法构造出向前看k个输入符的预测分析器，该类文法有时也叫做LL(k)文法类。
  </br>
  ~&emsp; 只有LL(k)文法才能进行预测分析
* LL(k)文法
  </br>
  ~&emsp; 自顶向下型语法分析算法是从语法分析树的根节点开始，使用最左推导的方法，推导构建完整的语法分析树，适用于LL(k)文法。
  </br>
  ~&emsp; LL(k)文法的第一个L是输入从左到右（left to right），第二个L是最左推导（leftmost derivation），k是前瞻符号（lookahead symbol）数量。
* 判断文法是否是LL(1)文法：
   </br>
   ~&emsp; 根据LL(1) 文法的定义来判断，分三步走：
   </br>
   &emsp;&emsp;①文法不含左递归
   </br>
   &emsp;&emsp;②对文法中的任一个非终结符A的各个产生式的侯选首终结符集两两不相交，即：若A->α1|α2|…|αn ，则 First(αi)∩ First(αj) = φ ( i ≠ j )
   </br>
   &emsp;&emsp;③对文法中的每个非终结符A,若它的某个首终结符集含有ε ，则First(A)∩Follow(A) = φ
   </br>
   ~&emsp; 如：判断下述文法是否是LL(1)文法：S -> aAS|bA ->  bA|ε
   </br>
   &emsp;&emsp;①该文法不含左递归
   </br>
   &emsp;&emsp;②First(S ->aAS)={a} First(S ->b)={b}  First(A ->bA)={b} First(A ->ε)={ε}  S和A的侯选式的first集都不相交，满足条件②
   </br>
   &emsp;&emsp;③由于ε∈First(A ->ε)  Follow(A)=First(S)={a,b} Follow(A) ∩ First(A->bA) ) ≠ φ不满足条件3，则不是LL(1)文法
* LR(k)文法：没有严格的定义，一个文法只要能构造出语法分析表，适用移入—规约语法分析器解析，它就是LR文法。
  </br>
  ~&emsp; 自底向上语法分析算法是从语法分析树的叶子节点开始，逐渐向上到达根节点，反向构造出一个最右推导序列，从而构建完整的语法分析树，适用于LR(k)文法。
  </br>
  ~&emsp; LR(k)文法的L是输入从左到右，R是反向最右推导（rightmost derivation in reverse），k是前瞻符号数量。
* LR文法比LL文法的优势：
  </br>
  ~&emsp; LR文法是LL文法的超集，LR文法约束非常宽松，LR文法几乎适用于所有编程语言。
  </br>
  ~&emsp; LR分析算法过程无回溯，是最高效的分析算法之一,所以其自动化生成算法可以被工程应用。
  </br>
  ~&emsp; LR分析算法可尽早地检测到语法错误。
* LL文法比LR文法的优势：https://www.zhihu.com/question/21475266/answer/18346898
  </br>
  &emsp;&emsp;LR文法解析通常采用自底向上语法分析算法，而自底向上语法分析算法的实现较复杂，可读性差，所以很多教材推荐采用工具生成（绝大多数是   bison/yacc）。而手工实现LL文法的自顶向下parse工程上更适合。
  </br>
  &emsp;&emsp;对LL文法进行优化可以很大程度抵消LR文法的优势或者占据优势：
  </br>
  ~ &emsp; 效率：Terence Parr，ANTLR的作者，开发了LL'(k) parser，把复杂度降低到O(|T| x k)，所以LL文法parse同样高效，其自动化生成算法也可被工程应用
  </br>
  ~ &emsp; 约束范围：LL'(k)的适应范围小于LL(k)但大于LL(k-1)。目前流行的LR parser generator是LALR，其parsing strength弱于LR(1)。所以还不能和任意LL(k)相比
  </br>
  ~ &emsp; 把LL(k)语法改写为LR(1)是非常反直观的做法。
  </br>
  ~ &emsp; Bottom-up parser的优势建立在严格的数学基础上，要求语言必须是context-free（上下文无关）语法。实际中严格的context-free语法很少。可读性极好的 LL parser可以任意加入ad-hoc trick（特殊处理技巧）来分析context-sensitive（上下文相关）语法，乃至于使用回溯来分析undetermined（未确定）语法。而bottom-up parser就无能为力了。
  </br>
  ~ &emsp; 实际中设计语言可以尽量向LL(1)靠拢。注意这一条并不和上一条矛盾。一个语言可以是99%的LL(1)语法加上几个undetermined语法的特例。这时用bottom-up parser 最尴尬的，parsing strength在99%的情况下白白浪费（之所以说是浪费是因为这种strength是以readability为代价的），在1%的特例中还非常难于处理
    
* LL和LR的范围：
  </br>
  ![LL和LR的范围](imgs/LL(k)和LR(k)的解析范围.jpg)
  
* 该js parse将采用手写递归下降parser：从LL1开始，如果遇到实在不能解析的语法再扩大lookahead范围或加入ad-hoc，即自顶向下递归下降 + lookahead + ad-hoc + 运算符优先级 → AST
* 表达式自顶向下分析方法过程：解析过程是通过3个解析函数，按照解析顺序自顶向下：parseExpr() → parseTerm() → parseLiteral()
* EOF：end of file，程序编写中的一个小技巧，将EOF加入到tokens流的结尾，避免一些边界条件判断，俗称“哨兵”
* 表达式顺序解析：但是该解析存在优先级的问题
    ```
  Expr → Expr + digit | Expr - digit | digit
    ```
* 表达式优先级问题的解决：引入其他非终结符Term
    ```
  Expr → Expr + Term | Expr - Term | Expr
  Term → -Expr | (Expr) | Term * Literal | Term / Literal | Literal
  Literal → number | variable | string
  其中，Literal表示数字、字符串或变量，Term表示非终结符，Expr表示表达式
  例如表达式：Expr(3+5*7) → Expr(3) + Term(5*7) 
    ```
* 表达式左递归无限循环问题：转换函数时，为了递归有出口，注意要将左递归转换为右递归。例如有左结合表达式：
    ```
    Expr  → Expr + Term | Expr - Term | Term
    我们转换为函数时如下,将陷入死循环
    function parseExpr(string){
      parseExpr(string) //此处递归，直接进入死循环
      eat(+)
      eat(Term)
      parseExpr(string)
    }
    转换右结合表达式为：
    Expr  → termExpr`
    Expr` → +Expr | -Expr | e
    再换为函数时如下：
    function parseExpr(string){
      eat(Term)  //吃掉一个token
      parseExpr`(string)
      eat(+)  //吃掉一个加号
      parseExpr(string) //递归，直到吃完整个tokens，完成解析
    }
    右结合完整语法分析模型：
    Expr  → Expr + Term | Expr - Term | Term
    转为：
    Expr  → termExpr`
    Expr` → +Expr | -Expr | e
    右结合完整语法分析模型：
    Term  → -Expr | (Expr) | Term * Literal | Term / Literal | Literal
    转为：
    Term  → LiteralTerm` | -ExprTerm` | (Expr)Term`
    Term` → *Term | /Term | e
    ```
* statement：陈述语句。
    ```
  例如 赋值语句(assign statement)： var x=1
  例如 if语句(if statement)： if(Expr){}[else if(){}]else{}
    ```
* if语句的递归向下分析：
  ```
  parseIfStmt() → eat(if) → parseExpr() → parseBlock() → eat(else) → parseIfStmt()
                | eat(if) → parseExpr() → parseBlock()
                | eat(if) → parseExpr() → parseBlock() → eat(else) → parseBlock() (该过程可简化为一个parseBlock())
  ```
* function语句的递归向下分析：
  ```
  parseFnStmt() → eat(function) → eat(id) → eat(params) → parseBlock()
  params → e | param,params
  param → Literal(可能是id、number、string)
  ```
* class语句的递归向下分析：
  ```
  parseClassStmt() → eat(class) → eat(id) → eat(extends) → eat(id) → parseBlock()
                   | eat(class) → eat(id) → parseBlock()
  ```
* import语句的递归向下分析：
  ```
  parseImportStmt() → eat(import) → eat(id | object | array) → eat(from) → eat(string)
  ```
* 整体的语法分析：
  ```
  program → statements | e
  statements → statement statements | e
  statement → assignStmt | ifStmt | whileStmt | switchStmt | functionStmt | forStmt | classStmt |importStmt ...
  ```
* 复杂表达式的解析：以上只能解决+-*/的优先级问题，多层优先级问题使用后序遍历解决
* 中序表达式：例如：a+b*c、a*b+c。树节点的左子树一定比右子树先遍历，即先处理左树再节点再右树，但不太适合解析
* 后序表达式：例如：ab+c*、ab*c+，适合解析
* 中序转换为后序：
  </br>
  ~&emsp; a、b、c字母的先后顺序不会变，操作符改变顺序即可。
  </br>
  ~&emsp; 将运算符压出/移除栈(stack)，来实现中序表达式转变后序表达式
  </br>
  ~&emsp; 例如中序表达式a*b+c的转换后序：
    ```
    ①*压入栈 → stack：* , ab
    ②+压入栈，此时*的优先级高于+，将*出栈 → stack：+  ,a*b
    ③后续无操作符，此时将+出栈 → stack：  ,a*bc+
    ④a*bc+ → a*b+c
    ```
    ~&emsp; 例如中序表达式a+b*c的转换后序：
    ```
    ①+压入栈 → stack：+ , ab
    ②*压入栈，此时*的优先级高于+，无符号出栈 → stack：+*  ,ab
    ③后续无操作符，此时将符号出栈 → stack：  ,abc*+
    ④abc*+ → ab*c+ → a+b*c
    ```
    ~&emsp; 例如中序表达式a+b*c+d的转换后序：
    ```
    ①+压入栈 → stack：+ , ab
    ②*压入栈，此时*的优先级高于+，无符号出栈 → stack：+*  ,ab
    ③+压入栈，此时*的优先级高于+，将+*出栈 → stack：+  ,abc*+
    ④后续无操作符，此时将符号出栈 → stack：  ,abc*+d+
    ⑤abc*+d+ → ab*c+d+ → a+b*cd+ → a+b*c+d
    ```
    ~&emsp; 例如中序表达式a==b+c*d的转换后序：
    ```
    ①==压入栈 → stack：== , ab
    ②+压入栈，此时+的优先级低于==，==符号出栈 → stack：+  ,ab==
    ③*压入栈，此时*的优先级高于+，无符号出栈 → stack：+*  ,ab==c
    ④后续无操作符，此时将符号出栈 → stack：  ,ab==cd*+
    ⑤ab==cd*+ →a==bcd*+ → a==b*c+d
    ```
    ~&emsp; 例如中序表达式a+b*(c+d)的转换后序：
    ```
    ①+压入栈 → stack：+ , a
    ②*压入栈，此时+的优先级低于*，无符号出栈 → stack：+*  ,ab
    ③(压入栈，无符号出栈 → stack：+*(  ,ab
    ④+压入栈，无符号出栈 → stack：+*(+  ,abc
    ⑤)压入栈，无符号出栈 → stack：+*(+)  ,abcd
    ⑥此时+在括号中先出栈 → stack：+*  ,abcd+
    ⑥其他出栈 → stack：  ,abcd+*+
    ⑦abcd+*+ → ab(c+d)*+ → ab*(c+d)+ → a+b*(c+d)
    ```
* [语法分析器代码入口](../src/parser/parser.ts)
