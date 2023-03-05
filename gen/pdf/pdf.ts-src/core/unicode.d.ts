export declare function mapSpecialUnicodeValues(code: number): number;
export declare function getUnicodeForGlyph(name: string, glyphsUnicodeMap: Record<string, number>): number;
export declare function getUnicodeRangeFor(value: number): number;
export declare const getNormalizedUnicodes: () => Record<string, "i" | "s" | "子" | "辰" | "酉" | " " | "ff" | "fi" | "ii" | "vi" | "dz" | "st" | "." | "No" | "..." | "X" | "D" | "V" | "C" | "I" | "L" | "M" | "c" | "d" | "l" | "m" | "v" | "x" | "fl" | "ffi" | "ffl" | "xi" | "_" | "DZ" | "Dz" | "IJ" | "LJ" | "Lj" | "NJ" | "Nj" | "ij" | "lj" | "nj" | "¨" | " ̈" | "¯" | " ̄" | "´" | " ́" | "µ" | "μ" | "¸" | " ̧" | "Ĳ" | "ĳ" | "Ŀ" | "L·" | "ŀ" | "l·" | "ŉ" | "ʼn" | "ſ" | "Ǆ" | "DŽ" | "ǅ" | "Dž" | "ǆ" | "dž" | "Ǉ" | "ǈ" | "ǉ" | "Ǌ" | "ǋ" | "ǌ" | "Ǳ" | "ǲ" | "ǳ" | "˘" | " ̆" | "˙" | " ̇" | "˚" | " ̊" | "˛" | " ̨" | "˜" | " ̃" | "˝" | " ̋" | "ͺ" | " ͅ" | "΄" | "ϐ" | "β" | "ϑ" | "θ" | "ϒ" | "Υ" | "ϕ" | "φ" | "ϖ" | "π" | "ϰ" | "κ" | "ϱ" | "ρ" | "ϲ" | "ς" | "ϴ" | "Θ" | "ϵ" | "ε" | "Ϲ" | "Σ" | "և" | "եւ" | "ٵ" | "اٴ" | "ٶ" | "وٴ" | "ٷ" | "ۇٴ" | "ٸ" | "يٴ" | "ำ" | "ํา" | "ຳ" | "ໍາ" | "ໜ" | "ຫນ" | "ໝ" | "ຫມ" | "ཷ" | "ྲཱྀ" | "ཹ" | "ླཱྀ" | "ẚ" | "aʾ" | "᾽" | " ̓" | "᾿" | "῀" | " ͂" | "῾" | " ̔" | " " | " " | " " | " " | " " | " " | " " | " " | "‗" | " ̳" | "․" | "‥" | ".." | "…" | "″" | "′′" | "‴" | "′′′" | "‶" | "‵‵" | "‷" | "‵‵‵" | "‼" | "!!" | "‾" | " ̅" | "⁇" | "??" | "⁈" | "?!" | "⁉" | "!?" | "⁗" | "′′′′" | " " | "₨" | "Rs" | "℀" | "a/c" | "℁" | "a/s" | "℃" | "°C" | "℅" | "c/o" | "℆" | "c/u" | "ℇ" | "Ɛ" | "℉" | "°F" | "№" | "℡" | "TEL" | "ℵ" | "א" | "ℶ" | "ב" | "ℷ" | "ג" | "ℸ" | "ד" | "℻" | "FAX" | "Ⅰ" | "Ⅱ" | "II" | "Ⅲ" | "III" | "Ⅳ" | "IV" | "Ⅴ" | "Ⅵ" | "VI" | "Ⅶ" | "VII" | "Ⅷ" | "VIII" | "Ⅸ" | "IX" | "Ⅹ" | "Ⅺ" | "XI" | "Ⅻ" | "XII" | "Ⅼ" | "Ⅽ" | "Ⅾ" | "Ⅿ" | "ⅰ" | "ⅱ" | "ⅲ" | "iii" | "ⅳ" | "iv" | "ⅴ" | "ⅵ" | "ⅶ" | "vii" | "ⅷ" | "viii" | "ⅸ" | "ix" | "ⅹ" | "ⅺ" | "ⅻ" | "xii" | "ⅼ" | "ⅽ" | "ⅾ" | "ⅿ" | "∬" | "∫∫" | "∭" | "∫∫∫" | "∯" | "∮∮" | "∰" | "∮∮∮" | "⑴" | "(1)" | "⑵" | "(2)" | "⑶" | "(3)" | "⑷" | "(4)" | "⑸" | "(5)" | "⑹" | "(6)" | "⑺" | "(7)" | "⑻" | "(8)" | "⑼" | "(9)" | "⑽" | "(10)" | "⑾" | "(11)" | "⑿" | "(12)" | "⒀" | "(13)" | "⒁" | "(14)" | "⒂" | "(15)" | "⒃" | "(16)" | "⒄" | "(17)" | "⒅" | "(18)" | "⒆" | "(19)" | "⒇" | "(20)" | "⒈" | "1." | "⒉" | "2." | "⒊" | "3." | "⒋" | "4." | "⒌" | "5." | "⒍" | "6." | "⒎" | "7." | "⒏" | "8." | "⒐" | "9." | "⒑" | "10." | "⒒" | "11." | "⒓" | "12." | "⒔" | "13." | "⒕" | "14." | "⒖" | "15." | "⒗" | "16." | "⒘" | "17." | "⒙" | "18." | "⒚" | "19." | "⒛" | "20." | "⒜" | "(a)" | "⒝" | "(b)" | "⒞" | "(c)" | "⒟" | "(d)" | "⒠" | "(e)" | "⒡" | "(f)" | "⒢" | "(g)" | "⒣" | "(h)" | "⒤" | "(i)" | "⒥" | "(j)" | "⒦" | "(k)" | "⒧" | "(l)" | "⒨" | "(m)" | "⒩" | "(n)" | "⒪" | "(o)" | "⒫" | "(p)" | "⒬" | "(q)" | "⒭" | "(r)" | "⒮" | "(s)" | "⒯" | "(t)" | "⒰" | "(u)" | "⒱" | "(v)" | "⒲" | "(w)" | "⒳" | "(x)" | "⒴" | "(y)" | "⒵" | "(z)" | "⨌" | "∫∫∫∫" | "⩴" | "::=" | "⩵" | "==" | "⩶" | "===" | "⺟" | "母" | "⻳" | "龟" | "⼀" | "一" | "⼁" | "丨" | "⼂" | "丶" | "⼃" | "丿" | "⼄" | "乙" | "⼅" | "亅" | "⼆" | "二" | "⼇" | "亠" | "⼈" | "人" | "⼉" | "儿" | "⼊" | "入" | "⼋" | "八" | "⼌" | "冂" | "⼍" | "冖" | "⼎" | "冫" | "⼏" | "几" | "⼐" | "凵" | "⼑" | "刀" | "⼒" | "力" | "⼓" | "勹" | "⼔" | "匕" | "⼕" | "匚" | "⼖" | "匸" | "⼗" | "十" | "⼘" | "卜" | "⼙" | "卩" | "⼚" | "厂" | "⼛" | "厶" | "⼜" | "又" | "⼝" | "口" | "⼞" | "囗" | "⼟" | "土" | "⼠" | "士" | "⼡" | "夂" | "⼢" | "夊" | "⼣" | "夕" | "⼤" | "大" | "⼥" | "女" | "⼦" | "⼧" | "宀" | "⼨" | "寸" | "⼩" | "小" | "⼪" | "尢" | "⼫" | "尸" | "⼬" | "屮" | "⼭" | "山" | "⼮" | "巛" | "⼯" | "工" | "⼰" | "己" | "⼱" | "巾" | "⼲" | "干" | "⼳" | "幺" | "⼴" | "广" | "⼵" | "廴" | "⼶" | "廾" | "⼷" | "弋" | "⼸" | "弓" | "⼹" | "彐" | "⼺" | "彡" | "⼻" | "彳" | "⼼" | "心" | "⼽" | "戈" | "⼾" | "戶" | "⼿" | "手" | "⽀" | "支" | "⽁" | "攴" | "⽂" | "文" | "⽃" | "斗" | "⽄" | "斤" | "⽅" | "方" | "⽆" | "无" | "⽇" | "日" | "⽈" | "曰" | "⽉" | "月" | "⽊" | "木" | "⽋" | "欠" | "⽌" | "止" | "⽍" | "歹" | "⽎" | "殳" | "⽏" | "毋" | "⽐" | "比" | "⽑" | "毛" | "⽒" | "氏" | "⽓" | "气" | "⽔" | "水" | "⽕" | "火" | "⽖" | "爪" | "⽗" | "父" | "⽘" | "爻" | "⽙" | "爿" | "⽚" | "片" | "⽛" | "牙" | "⽜" | "牛" | "⽝" | "犬" | "⽞" | "玄" | "⽟" | "玉" | "⽠" | "瓜" | "⽡" | "瓦" | "⽢" | "甘" | "⽣" | "生" | "⽤" | "用" | "⽥" | "田" | "⽦" | "疋" | "⽧" | "疒" | "⽨" | "癶" | "⽩" | "白" | "⽪" | "皮" | "⽫" | "皿" | "⽬" | "目" | "⽭" | "矛" | "⽮" | "矢" | "⽯" | "石" | "⽰" | "示" | "⽱" | "禸" | "⽲" | "禾" | "⽳" | "穴" | "⽴" | "立" | "⽵" | "竹" | "⽶" | "米" | "⽷" | "糸" | "⽸" | "缶" | "⽹" | "网" | "⽺" | "羊" | "⽻" | "羽" | "⽼" | "老" | "⽽" | "而" | "⽾" | "耒" | "⽿" | "耳" | "⾀" | "聿" | "⾁" | "肉" | "⾂" | "臣" | "⾃" | "自" | "⾄" | "至" | "⾅" | "臼" | "⾆" | "舌" | "⾇" | "舛" | "⾈" | "舟" | "⾉" | "艮" | "⾊" | "色" | "⾋" | "艸" | "⾌" | "虍" | "⾍" | "虫" | "⾎" | "血" | "⾏" | "行" | "⾐" | "衣" | "⾑" | "襾" | "⾒" | "見" | "⾓" | "角" | "⾔" | "言" | "⾕" | "谷" | "⾖" | "豆" | "⾗" | "豕" | "⾘" | "豸" | "⾙" | "貝" | "⾚" | "赤" | "⾛" | "走" | "⾜" | "足" | "⾝" | "身" | "⾞" | "車" | "⾟" | "辛" | "⾠" | "⾡" | "辵" | "⾢" | "邑" | "⾣" | "⾤" | "釆" | "⾥" | "里" | "⾦" | "金" | "⾧" | "長" | "⾨" | "門" | "⾩" | "阜" | "⾪" | "隶" | "⾫" | "隹" | "⾬" | "雨" | "⾭" | "靑" | "⾮" | "非" | "⾯" | "面" | "⾰" | "革" | "⾱" | "韋" | "⾲" | "韭" | "⾳" | "音" | "⾴" | "頁" | "⾵" | "風" | "⾶" | "飛" | "⾷" | "食" | "⾸" | "首" | "⾹" | "香" | "⾺" | "馬" | "⾻" | "骨" | "⾼" | "高" | "⾽" | "髟" | "⾾" | "鬥" | "⾿" | "鬯" | "⿀" | "鬲" | "⿁" | "鬼" | "⿂" | "魚" | "⿃" | "鳥" | "⿄" | "鹵" | "⿅" | "鹿" | "⿆" | "麥" | "⿇" | "麻" | "⿈" | "黃" | "⿉" | "黍" | "⿊" | "黑" | "⿋" | "黹" | "⿌" | "黽" | "⿍" | "鼎" | "⿎" | "鼓" | "⿏" | "鼠" | "⿐" | "鼻" | "⿑" | "齊" | "⿒" | "齒" | "⿓" | "龍" | "⿔" | "龜" | "⿕" | "龠" | "〶" | "〒" | "〸" | "〹" | "卄" | "〺" | "卅" | "゛" | " ゙" | "゜" | " ゚" | "ㄱ" | "ᄀ" | "ㄲ" | "ᄁ" | "ㄳ" | "ᆪ" | "ㄴ" | "ᄂ" | "ㄵ" | "ᆬ" | "ㄶ" | "ᆭ" | "ㄷ" | "ᄃ" | "ㄸ" | "ᄄ" | "ㄹ" | "ᄅ" | "ㄺ" | "ᆰ" | "ㄻ" | "ᆱ" | "ㄼ" | "ᆲ" | "ㄽ" | "ᆳ" | "ㄾ" | "ᆴ" | "ㄿ" | "ᆵ" | "ㅀ" | "ᄚ" | "ㅁ" | "ᄆ" | "ㅂ" | "ᄇ" | "ㅃ" | "ᄈ" | "ㅄ" | "ᄡ" | "ㅅ" | "ᄉ" | "ㅆ" | "ᄊ" | "ㅇ" | "ᄋ" | "ㅈ" | "ᄌ" | "ㅉ" | "ᄍ" | "ㅊ" | "ᄎ" | "ㅋ" | "ᄏ" | "ㅌ" | "ᄐ" | "ㅍ" | "ᄑ" | "ㅎ" | "ᄒ" | "ㅏ" | "ᅡ" | "ㅐ" | "ᅢ" | "ㅑ" | "ᅣ" | "ㅒ" | "ᅤ" | "ㅓ" | "ᅥ" | "ㅔ" | "ᅦ" | "ㅕ" | "ᅧ" | "ㅖ" | "ᅨ" | "ㅗ" | "ᅩ" | "ㅘ" | "ᅪ" | "ㅙ" | "ᅫ" | "ㅚ" | "ᅬ" | "ㅛ" | "ᅭ" | "ㅜ" | "ᅮ" | "ㅝ" | "ᅯ" | "ㅞ" | "ᅰ" | "ㅟ" | "ᅱ" | "ㅠ" | "ᅲ" | "ㅡ" | "ᅳ" | "ㅢ" | "ᅴ" | "ㅣ" | "ᅵ" | "ㅤ" | "ᅠ" | "ㅥ" | "ᄔ" | "ㅦ" | "ᄕ" | "ㅧ" | "ᇇ" | "ㅨ" | "ᇈ" | "ㅩ" | "ᇌ" | "ㅪ" | "ᇎ" | "ㅫ" | "ᇓ" | "ㅬ" | "ᇗ" | "ㅭ" | "ᇙ" | "ㅮ" | "ᄜ" | "ㅯ" | "ᇝ" | "ㅰ" | "ᇟ" | "ㅱ" | "ᄝ" | "ㅲ" | "ᄞ" | "ㅳ" | "ᄠ" | "ㅴ" | "ᄢ" | "ㅵ" | "ᄣ" | "ㅶ" | "ᄧ" | "ㅷ" | "ᄩ" | "ㅸ" | "ᄫ" | "ㅹ" | "ᄬ" | "ㅺ" | "ᄭ" | "ㅻ" | "ᄮ" | "ㅼ" | "ᄯ" | "ㅽ" | "ᄲ" | "ㅾ" | "ᄶ" | "ㅿ" | "ᅀ" | "ㆀ" | "ᅇ" | "ㆁ" | "ᅌ" | "ㆂ" | "ᇱ" | "ㆃ" | "ᇲ" | "ㆄ" | "ᅗ" | "ㆅ" | "ᅘ" | "ㆆ" | "ᅙ" | "ㆇ" | "ᆄ" | "ㆈ" | "ᆅ" | "ㆉ" | "ᆈ" | "ㆊ" | "ᆑ" | "ㆋ" | "ᆒ" | "ㆌ" | "ᆔ" | "ㆍ" | "ᆞ" | "ㆎ" | "ᆡ" | "㈀" | "(ᄀ)" | "㈁" | "(ᄂ)" | "㈂" | "(ᄃ)" | "㈃" | "(ᄅ)" | "㈄" | "(ᄆ)" | "㈅" | "(ᄇ)" | "㈆" | "(ᄉ)" | "㈇" | "(ᄋ)" | "㈈" | "(ᄌ)" | "㈉" | "(ᄎ)" | "㈊" | "(ᄏ)" | "㈋" | "(ᄐ)" | "㈌" | "(ᄑ)" | "㈍" | "(ᄒ)" | "㈎" | "(가)" | "㈏" | "(나)" | "㈐" | "(다)" | "㈑" | "(라)" | "㈒" | "(마)" | "㈓" | "(바)" | "㈔" | "(사)" | "㈕" | "(아)" | "㈖" | "(자)" | "㈗" | "(차)" | "㈘" | "(카)" | "㈙" | "(타)" | "㈚" | "(파)" | "㈛" | "(하)" | "㈜" | "(주)" | "㈝" | "(오전)" | "㈞" | "(오후)" | "㈠" | "(一)" | "㈡" | "(二)" | "㈢" | "(三)" | "㈣" | "(四)" | "㈤" | "(五)" | "㈥" | "(六)" | "㈦" | "(七)" | "㈧" | "(八)" | "㈨" | "(九)" | "㈩" | "(十)" | "㈪" | "(月)" | "㈫" | "(火)" | "㈬" | "(水)" | "㈭" | "(木)" | "㈮" | "(金)" | "㈯" | "(土)" | "㈰" | "(日)" | "㈱" | "(株)" | "㈲" | "(有)" | "㈳" | "(社)" | "㈴" | "(名)" | "㈵" | "(特)" | "㈶" | "(財)" | "㈷" | "(祝)" | "㈸" | "(労)" | "㈹" | "(代)" | "㈺" | "(呼)" | "㈻" | "(学)" | "㈼" | "(監)" | "㈽" | "(企)" | "㈾" | "(資)" | "㈿" | "(協)" | "㉀" | "(祭)" | "㉁" | "(休)" | "㉂" | "(自)" | "㉃" | "(至)" | "㋀" | "1月" | "㋁" | "2月" | "㋂" | "3月" | "㋃" | "4月" | "㋄" | "5月" | "㋅" | "6月" | "㋆" | "7月" | "㋇" | "8月" | "㋈" | "9月" | "㋉" | "10月" | "㋊" | "11月" | "㋋" | "12月" | "㍘" | "0点" | "㍙" | "1点" | "㍚" | "2点" | "㍛" | "3点" | "㍜" | "4点" | "㍝" | "5点" | "㍞" | "6点" | "㍟" | "7点" | "㍠" | "8点" | "㍡" | "9点" | "㍢" | "10点" | "㍣" | "11点" | "㍤" | "12点" | "㍥" | "13点" | "㍦" | "14点" | "㍧" | "15点" | "㍨" | "16点" | "㍩" | "17点" | "㍪" | "18点" | "㍫" | "19点" | "㍬" | "20点" | "㍭" | "21点" | "㍮" | "22点" | "㍯" | "23点" | "㍰" | "24点" | "㏠" | "1日" | "㏡" | "2日" | "㏢" | "3日" | "㏣" | "4日" | "㏤" | "5日" | "㏥" | "6日" | "㏦" | "7日" | "㏧" | "8日" | "㏨" | "9日" | "㏩" | "10日" | "㏪" | "11日" | "㏫" | "12日" | "㏬" | "13日" | "㏭" | "14日" | "㏮" | "15日" | "㏯" | "16日" | "㏰" | "17日" | "㏱" | "18日" | "㏲" | "19日" | "㏳" | "20日" | "㏴" | "21日" | "㏵" | "22日" | "㏶" | "23日" | "㏷" | "24日" | "㏸" | "25日" | "㏹" | "26日" | "㏺" | "27日" | "㏻" | "28日" | "㏼" | "29日" | "㏽" | "30日" | "㏾" | "31日" | "ﬀ" | "ﬁ" | "ﬂ" | "ﬃ" | "ﬄ" | "ﬅ" | "ſt" | "ﬆ" | "ﬓ" | "մն" | "ﬔ" | "մե" | "ﬕ" | "մի" | "ﬖ" | "վն" | "ﬗ" | "մխ" | "ﭏ" | "אל" | "ﭐ" | "ٱ" | "ﭑ" | "ﭒ" | "ٻ" | "ﭓ" | "ﭔ" | "ﭕ" | "ﭖ" | "پ" | "ﭗ" | "ﭘ" | "ﭙ" | "ﭚ" | "ڀ" | "ﭛ" | "ﭜ" | "ﭝ" | "ﭞ" | "ٺ" | "ﭟ" | "ﭠ" | "ﭡ" | "ﭢ" | "ٿ" | "ﭣ" | "ﭤ" | "ﭥ" | "ﭦ" | "ٹ" | "ﭧ" | "ﭨ" | "ﭩ" | "ﭪ" | "ڤ" | "ﭫ" | "ﭬ" | "ﭭ" | "ﭮ" | "ڦ" | "ﭯ" | "ﭰ" | "ﭱ" | "ﭲ" | "ڄ" | "ﭳ" | "ﭴ" | "ﭵ" | "ﭶ" | "ڃ" | "ﭷ" | "ﭸ" | "ﭹ" | "ﭺ" | "چ" | "ﭻ" | "ﭼ" | "ﭽ" | "ﭾ" | "ڇ" | "ﭿ" | "ﮀ" | "ﮁ" | "ﮂ" | "ڍ" | "ﮃ" | "ﮄ" | "ڌ" | "ﮅ" | "ﮆ" | "ڎ" | "ﮇ" | "ﮈ" | "ڈ" | "ﮉ" | "ﮊ" | "ژ" | "ﮋ" | "ﮌ" | "ڑ" | "ﮍ" | "ﮎ" | "ک" | "ﮏ" | "ﮐ" | "ﮑ" | "ﮒ" | "گ" | "ﮓ" | "ﮔ" | "ﮕ" | "ﮖ" | "ڳ" | "ﮗ" | "ﮘ" | "ﮙ" | "ﮚ" | "ڱ" | "ﮛ" | "ﮜ" | "ﮝ" | "ﮞ" | "ں" | "ﮟ" | "ﮠ" | "ڻ" | "ﮡ" | "ﮢ" | "ﮣ" | "ﮤ" | "ۀ" | "ﮥ" | "ﮦ" | "ہ" | "ﮧ" | "ﮨ" | "ﮩ" | "ﮪ" | "ھ" | "ﮫ" | "ﮬ" | "ﮭ" | "ﮮ" | "ے" | "ﮯ" | "ﮰ" | "ۓ" | "ﮱ" | "ﯓ" | "ڭ" | "ﯔ" | "ﯕ" | "ﯖ" | "ﯗ" | "ۇ" | "ﯘ" | "ﯙ" | "ۆ" | "ﯚ" | "ﯛ" | "ۈ" | "ﯜ" | "ﯝ" | "ﯞ" | "ۋ" | "ﯟ" | "ﯠ" | "ۅ" | "ﯡ" | "ﯢ" | "ۉ" | "ﯣ" | "ﯤ" | "ې" | "ﯥ" | "ﯦ" | "ﯧ" | "ﯨ" | "ى" | "ﯩ" | "ﯪ" | "ئا" | "ﯫ" | "ﯬ" | "ئە" | "ﯭ" | "ﯮ" | "ئو" | "ﯯ" | "ﯰ" | "ئۇ" | "ﯱ" | "ﯲ" | "ئۆ" | "ﯳ" | "ﯴ" | "ئۈ" | "ﯵ" | "ﯶ" | "ئې" | "ﯷ" | "ﯸ" | "ﯹ" | "ئى" | "ﯺ" | "ﯻ" | "ﯼ" | "ی" | "ﯽ" | "ﯾ" | "ﯿ" | "ﰀ" | "ئج" | "ﰁ" | "ئح" | "ﰂ" | "ئم" | "ﰃ" | "ﰄ" | "ئي" | "ﰅ" | "بج" | "ﰆ" | "بح" | "ﰇ" | "بخ" | "ﰈ" | "بم" | "ﰉ" | "بى" | "ﰊ" | "بي" | "ﰋ" | "تج" | "ﰌ" | "تح" | "ﰍ" | "تخ" | "ﰎ" | "تم" | "ﰏ" | "تى" | "ﰐ" | "تي" | "ﰑ" | "ثج" | "ﰒ" | "ثم" | "ﰓ" | "ثى" | "ﰔ" | "ثي" | "ﰕ" | "جح" | "ﰖ" | "جم" | "ﰗ" | "حج" | "ﰘ" | "حم" | "ﰙ" | "خج" | "ﰚ" | "خح" | "ﰛ" | "خم" | "ﰜ" | "سج" | "ﰝ" | "سح" | "ﰞ" | "سخ" | "ﰟ" | "سم" | "ﰠ" | "صح" | "ﰡ" | "صم" | "ﰢ" | "ضج" | "ﰣ" | "ضح" | "ﰤ" | "ضخ" | "ﰥ" | "ضم" | "ﰦ" | "طح" | "ﰧ" | "طم" | "ﰨ" | "ظم" | "ﰩ" | "عج" | "ﰪ" | "عم" | "ﰫ" | "غج" | "ﰬ" | "غم" | "ﰭ" | "فج" | "ﰮ" | "فح" | "ﰯ" | "فخ" | "ﰰ" | "فم" | "ﰱ" | "فى" | "ﰲ" | "في" | "ﰳ" | "قح" | "ﰴ" | "قم" | "ﰵ" | "قى" | "ﰶ" | "قي" | "ﰷ" | "كا" | "ﰸ" | "كج" | "ﰹ" | "كح" | "ﰺ" | "كخ" | "ﰻ" | "كل" | "ﰼ" | "كم" | "ﰽ" | "كى" | "ﰾ" | "كي" | "ﰿ" | "لج" | "ﱀ" | "لح" | "ﱁ" | "لخ" | "ﱂ" | "لم" | "ﱃ" | "لى" | "ﱄ" | "لي" | "ﱅ" | "مج" | "ﱆ" | "مح" | "ﱇ" | "مخ" | "ﱈ" | "مم" | "ﱉ" | "مى" | "ﱊ" | "مي" | "ﱋ" | "نج" | "ﱌ" | "نح" | "ﱍ" | "نخ" | "ﱎ" | "نم" | "ﱏ" | "نى" | "ﱐ" | "ني" | "ﱑ" | "هج" | "ﱒ" | "هم" | "ﱓ" | "هى" | "ﱔ" | "هي" | "ﱕ" | "يج" | "ﱖ" | "يح" | "ﱗ" | "يخ" | "ﱘ" | "يم" | "ﱙ" | "يى" | "ﱚ" | "يي" | "ﱛ" | "ذٰ" | "ﱜ" | "رٰ" | "ﱝ" | "ىٰ" | "ﱞ" | " ٌّ" | "ﱟ" | " ٍّ" | "ﱠ" | " َّ" | "ﱡ" | " ُّ" | "ﱢ" | " ِّ" | "ﱣ" | " ّٰ" | "ﱤ" | "ئر" | "ﱥ" | "ئز" | "ﱦ" | "ﱧ" | "ئن" | "ﱨ" | "ﱩ" | "ﱪ" | "بر" | "ﱫ" | "بز" | "ﱬ" | "ﱭ" | "بن" | "ﱮ" | "ﱯ" | "ﱰ" | "تر" | "ﱱ" | "تز" | "ﱲ" | "ﱳ" | "تن" | "ﱴ" | "ﱵ" | "ﱶ" | "ثر" | "ﱷ" | "ثز" | "ﱸ" | "ﱹ" | "ثن" | "ﱺ" | "ﱻ" | "ﱼ" | "ﱽ" | "ﱾ" | "ﱿ" | "ﲀ" | "ﲁ" | "ﲂ" | "ﲃ" | "ﲄ" | "ﲅ" | "ﲆ" | "ﲇ" | "ﲈ" | "ما" | "ﲉ" | "ﲊ" | "نر" | "ﲋ" | "نز" | "ﲌ" | "ﲍ" | "نن" | "ﲎ" | "ﲏ" | "ﲐ" | "ﲑ" | "ير" | "ﲒ" | "يز" | "ﲓ" | "ﲔ" | "ين" | "ﲕ" | "ﲖ" | "ﲗ" | "ﲘ" | "ﲙ" | "ئخ" | "ﲚ" | "ﲛ" | "ئه" | "ﲜ" | "ﲝ" | "ﲞ" | "ﲟ" | "ﲠ" | "به" | "ﲡ" | "ﲢ" | "ﲣ" | "ﲤ" | "ﲥ" | "ته" | "ﲦ" | "ﲧ" | "ﲨ" | "ﲩ" | "ﲪ" | "ﲫ" | "ﲬ" | "ﲭ" | "ﲮ" | "ﲯ" | "ﲰ" | "ﲱ" | "ﲲ" | "صخ" | "ﲳ" | "ﲴ" | "ﲵ" | "ﲶ" | "ﲷ" | "ﲸ" | "ﲹ" | "ﲺ" | "ﲻ" | "ﲼ" | "ﲽ" | "ﲾ" | "ﲿ" | "ﳀ" | "ﳁ" | "ﳂ" | "ﳃ" | "ﳄ" | "ﳅ" | "ﳆ" | "ﳇ" | "ﳈ" | "ﳉ" | "ﳊ" | "ﳋ" | "ﳌ" | "ﳍ" | "له" | "ﳎ" | "ﳏ" | "ﳐ" | "ﳑ" | "ﳒ" | "ﳓ" | "ﳔ" | "ﳕ" | "ﳖ" | "نه" | "ﳗ" | "ﳘ" | "ﳙ" | "هٰ" | "ﳚ" | "ﳛ" | "ﳜ" | "ﳝ" | "ﳞ" | "يه" | "ﳟ" | "ﳠ" | "ﳡ" | "ﳢ" | "ﳣ" | "ﳤ" | "ﳥ" | "ﳦ" | "ثه" | "ﳧ" | "ﳨ" | "سه" | "ﳩ" | "شم" | "ﳪ" | "شه" | "ﳫ" | "ﳬ" | "ﳭ" | "ﳮ" | "ﳯ" | "ﳰ" | "ﳱ" | "ﳲ" | "ـَّ" | "ﳳ" | "ـُّ" | "ﳴ" | "ـِّ" | "ﳵ" | "طى" | "ﳶ" | "طي" | "ﳷ" | "عى" | "ﳸ" | "عي" | "ﳹ" | "غى" | "ﳺ" | "غي" | "ﳻ" | "سى" | "ﳼ" | "سي" | "ﳽ" | "شى" | "ﳾ" | "شي" | "ﳿ" | "حى" | "ﴀ" | "حي" | "ﴁ" | "جى" | "ﴂ" | "جي" | "ﴃ" | "خى" | "ﴄ" | "خي" | "ﴅ" | "صى" | "ﴆ" | "صي" | "ﴇ" | "ضى" | "ﴈ" | "ضي" | "ﴉ" | "شج" | "ﴊ" | "شح" | "ﴋ" | "شخ" | "ﴌ" | "ﴍ" | "شر" | "ﴎ" | "سر" | "ﴏ" | "صر" | "ﴐ" | "ضر" | "ﴑ" | "ﴒ" | "ﴓ" | "ﴔ" | "ﴕ" | "ﴖ" | "ﴗ" | "ﴘ" | "ﴙ" | "ﴚ" | "ﴛ" | "ﴜ" | "ﴝ" | "ﴞ" | "ﴟ" | "ﴠ" | "ﴡ" | "ﴢ" | "ﴣ" | "ﴤ" | "ﴥ" | "ﴦ" | "ﴧ" | "ﴨ" | "ﴩ" | "ﴪ" | "ﴫ" | "ﴬ" | "ﴭ" | "ﴮ" | "ﴯ" | "ﴰ" | "ﴱ" | "ﴲ" | "ﴳ" | "ﴴ" | "ﴵ" | "ﴶ" | "ﴷ" | "ﴸ" | "ﴹ" | "ﴺ" | "ﴻ" | "ﴼ" | "اً" | "ﴽ" | "ﵐ" | "تجم" | "ﵑ" | "تحج" | "ﵒ" | "ﵓ" | "تحم" | "ﵔ" | "تخم" | "ﵕ" | "تمج" | "ﵖ" | "تمح" | "ﵗ" | "تمخ" | "ﵘ" | "جمح" | "ﵙ" | "ﵚ" | "حمي" | "ﵛ" | "حمى" | "ﵜ" | "سحج" | "ﵝ" | "سجح" | "ﵞ" | "سجى" | "ﵟ" | "سمح" | "ﵠ" | "ﵡ" | "سمج" | "ﵢ" | "سمم" | "ﵣ" | "ﵤ" | "صحح" | "ﵥ" | "ﵦ" | "صمم" | "ﵧ" | "شحم" | "ﵨ" | "ﵩ" | "شجي" | "ﵪ" | "شمخ" | "ﵫ" | "ﵬ" | "شمم" | "ﵭ" | "ﵮ" | "ضحى" | "ﵯ" | "ضخم" | "ﵰ" | "ﵱ" | "طمح" | "ﵲ" | "ﵳ" | "طمم" | "ﵴ" | "طمي" | "ﵵ" | "عجم" | "ﵶ" | "عمم" | "ﵷ" | "ﵸ" | "عمى" | "ﵹ" | "غمم" | "ﵺ" | "غمي" | "ﵻ" | "غمى" | "ﵼ" | "فخم" | "ﵽ" | "ﵾ" | "قمح" | "ﵿ" | "قمم" | "ﶀ" | "لحم" | "ﶁ" | "لحي" | "ﶂ" | "لحى" | "ﶃ" | "لجج" | "ﶄ" | "ﶅ" | "لخم" | "ﶆ" | "ﶇ" | "لمح" | "ﶈ" | "ﶉ" | "محج" | "ﶊ" | "محم" | "ﶋ" | "محي" | "ﶌ" | "مجح" | "ﶍ" | "مجم" | "ﶎ" | "مخج" | "ﶏ" | "مخم" | "ﶒ" | "مجخ" | "ﶓ" | "همج" | "ﶔ" | "همم" | "ﶕ" | "نحم" | "ﶖ" | "نحى" | "ﶗ" | "نجم" | "ﶘ" | "ﶙ" | "نجى" | "ﶚ" | "نمي" | "ﶛ" | "نمى" | "ﶜ" | "يمم" | "ﶝ" | "ﶞ" | "بخي" | "ﶟ" | "تجي" | "ﶠ" | "تجى" | "ﶡ" | "تخي" | "ﶢ" | "تخى" | "ﶣ" | "تمي" | "ﶤ" | "تمى" | "ﶥ" | "جمي" | "ﶦ" | "جحى" | "ﶧ" | "جمى" | "ﶨ" | "سخى" | "ﶩ" | "صحي" | "ﶪ" | "شحي" | "ﶫ" | "ضحي" | "ﶬ" | "لجي" | "ﶭ" | "لمي" | "ﶮ" | "يحي" | "ﶯ" | "يجي" | "ﶰ" | "يمي" | "ﶱ" | "ممي" | "ﶲ" | "قمي" | "ﶳ" | "نحي" | "ﶴ" | "ﶵ" | "ﶶ" | "عمي" | "ﶷ" | "كمي" | "ﶸ" | "نجح" | "ﶹ" | "مخي" | "ﶺ" | "لجم" | "ﶻ" | "كمم" | "ﶼ" | "ﶽ" | "ﶾ" | "جحي" | "ﶿ" | "حجي" | "ﷀ" | "مجي" | "ﷁ" | "فمي" | "ﷂ" | "بحي" | "ﷃ" | "ﷄ" | "ﷅ" | "ﷆ" | "سخي" | "ﷇ" | "نجي" | "﹉" | "﹊" | "﹋" | "﹌" | "﹍" | "﹎" | "﹏" | "ﺀ" | "ء" | "ﺁ" | "آ" | "ﺂ" | "ﺃ" | "أ" | "ﺄ" | "ﺅ" | "ؤ" | "ﺆ" | "ﺇ" | "إ" | "ﺈ" | "ﺉ" | "ئ" | "ﺊ" | "ﺋ" | "ﺌ" | "ﺍ" | "ا" | "ﺎ" | "ﺏ" | "ب" | "ﺐ" | "ﺑ" | "ﺒ" | "ﺓ" | "ة" | "ﺔ" | "ﺕ" | "ت" | "ﺖ" | "ﺗ" | "ﺘ" | "ﺙ" | "ث" | "ﺚ" | "ﺛ" | "ﺜ" | "ﺝ" | "ج" | "ﺞ" | "ﺟ" | "ﺠ" | "ﺡ" | "ح" | "ﺢ" | "ﺣ" | "ﺤ" | "ﺥ" | "خ" | "ﺦ" | "ﺧ" | "ﺨ" | "ﺩ" | "د" | "ﺪ" | "ﺫ" | "ذ" | "ﺬ" | "ﺭ" | "ر" | "ﺮ" | "ﺯ" | "ز" | "ﺰ" | "ﺱ" | "س" | "ﺲ" | "ﺳ" | "ﺴ" | "ﺵ" | "ش" | "ﺶ" | "ﺷ" | "ﺸ" | "ﺹ" | "ص" | "ﺺ" | "ﺻ" | "ﺼ" | "ﺽ" | "ض" | "ﺾ" | "ﺿ" | "ﻀ" | "ﻁ" | "ط" | "ﻂ" | "ﻃ" | "ﻄ" | "ﻅ" | "ظ" | "ﻆ" | "ﻇ" | "ﻈ" | "ﻉ" | "ع" | "ﻊ" | "ﻋ" | "ﻌ" | "ﻍ" | "غ" | "ﻎ" | "ﻏ" | "ﻐ" | "ﻑ" | "ف" | "ﻒ" | "ﻓ" | "ﻔ" | "ﻕ" | "ق" | "ﻖ" | "ﻗ" | "ﻘ" | "ﻙ" | "ك" | "ﻚ" | "ﻛ" | "ﻜ" | "ﻝ" | "ل" | "ﻞ" | "ﻟ" | "ﻠ" | "ﻡ" | "م" | "ﻢ" | "ﻣ" | "ﻤ" | "ﻥ" | "ن" | "ﻦ" | "ﻧ" | "ﻨ" | "ﻩ" | "ه" | "ﻪ" | "ﻫ" | "ﻬ" | "ﻭ" | "و" | "ﻮ" | "ﻯ" | "ﻰ" | "ﻱ" | "ي" | "ﻲ" | "ﻳ" | "ﻴ" | "ﻵ" | "لآ" | "ﻶ" | "ﻷ" | "لأ" | "ﻸ" | "ﻹ" | "لإ" | "ﻺ" | "ﻻ" | "لا" | "ﻼ">;
export declare function reverseIfRtl(chars: string): string;
export interface CharUnicodeCategory {
    isWhitespace: boolean;
    isZeroWidthDiacritic: boolean;
    isInvisibleFormatMark: boolean;
}
export declare function getCharUnicodeCategory(char: string): CharUnicodeCategory;
export declare function clearUnicodeCaches(): void;
//# sourceMappingURL=unicode.d.ts.map