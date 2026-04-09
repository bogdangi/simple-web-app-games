const UI = {
    en: {
        title: 'Word in Context',
        backToGames: 'Back to Games',
        language: 'Language',
        tagline: 'Choose the word that fits best in each sentence.',
        score: 'Score',
        question: 'Question',
        of: 'of',
        correct: 'Correct!',
        wrongChoice: 'Not quite right',
        whyWrong: 'Why your choice doesn\'t fit:',
        whyCorrect: 'Why this is the best fit:',
        correctWas: 'The best word was:',
        next: 'Next',
        startGame: 'Start Game',
        playAgain: 'Play Again',
        roundComplete: 'Round Complete!',
        yourScore: 'Your score:',
        perfect: 'Perfect! 🎉',
        great: 'Great job! 🌟',
        good: 'Good effort! 👍',
        keepPracticing: 'Keep practicing! 💪',
        rulesTitle: 'How to play',
        rule1: 'Read each sentence carefully — one word is missing.',
        rule2: 'Pick the word that fits the context best.',
        rule3: 'If you pick the wrong word, you\'ll learn exactly why it doesn\'t fit.',
        questionsPerRound: 'Questions per round',
        streak: 'Streak',
        readingTextLabel: 'Fill-in-the-blank sentence',
    },
    de: {
        title: 'Wort im Kontext',
        backToGames: 'Zurück zu Spielen',
        language: 'Sprache',
        tagline: 'Wähle das Wort, das am besten in jeden Satz passt.',
        score: 'Punkte',
        question: 'Frage',
        of: 'von',
        correct: 'Richtig!',
        wrongChoice: 'Nicht ganz richtig',
        whyWrong: 'Warum deine Wahl nicht passt:',
        whyCorrect: 'Warum das die beste Wahl ist:',
        correctWas: 'Das beste Wort war:',
        next: 'Weiter',
        startGame: 'Spiel starten',
        playAgain: 'Nochmal spielen',
        roundComplete: 'Runde abgeschlossen!',
        yourScore: 'Deine Punkte:',
        perfect: 'Perfekt! 🎉',
        great: 'Super gemacht! 🌟',
        good: 'Gute Leistung! 👍',
        keepPracticing: 'Weiter üben! 💪',
        rulesTitle: 'Spielregeln',
        rule1: 'Lies jeden Satz sorgfältig — ein Wort fehlt.',
        rule2: 'Wähle das Wort, das am besten in den Kontext passt.',
        rule3: 'Bei einer falschen Wahl erfährst du genau, warum sie nicht passt.',
        questionsPerRound: 'Fragen pro Runde',
        streak: 'Serie',
        readingTextLabel: 'Lückensatz',
    },
    uk: {
        title: 'Слово в контексті',
        backToGames: 'Назад до ігор',
        language: 'Мова',
        tagline: 'Обери слово, яке найкраще підходить до кожного речення.',
        score: 'Очки',
        question: 'Питання',
        of: 'з',
        correct: 'Правильно!',
        wrongChoice: 'Не зовсім правильно',
        whyWrong: 'Чому твій вибір не підходить:',
        whyCorrect: 'Чому це найкращий вибір:',
        correctWas: 'Найкраще слово було:',
        next: 'Далі',
        startGame: 'Розпочати гру',
        playAgain: 'Грати знову',
        roundComplete: 'Раунд завершено!',
        yourScore: 'Твій рахунок:',
        perfect: 'Ідеально! 🎉',
        great: 'Чудово! 🌟',
        good: 'Непогано! 👍',
        keepPracticing: 'Продовжуй практикуватись! 💪',
        rulesTitle: 'Як грати',
        rule1: 'Уважно читай кожне речення — одне слово пропущено.',
        rule2: 'Обери слово, яке найкраще відповідає контексту.',
        rule3: 'Якщо вибір неправильний, ти дізнаєшся чому він не підходить.',
        questionsPerRound: 'Питань за раунд',
        streak: 'Серія',
        readingTextLabel: 'Речення з пропуском',
    }
};

const PUZZLES = {
    en: [
        {
            sentence: "The scientist made a remarkable ___ that changed our understanding of the universe.",
            answer: "discovery",
            options: ["discovery", "invention", "decision", "journey"],
            explanations: {
                invention: "'Invention' means creating a new device or method, but a scientist who finds something already existing in nature makes a 'discovery', not an invention.",
                decision: "A 'decision' is a choice made between options. It does not describe a scientific finding or breakthrough.",
                journey: "A 'journey' refers to travel from one place to another, not a scientific finding or breakthrough."
            },
            correctExplanation: "'Discovery' perfectly fits here because it means finding something that already exists but was previously unknown — exactly what scientists do when they reveal new truths about the universe."
        },
        {
            sentence: "She spoke so ___ that everyone in the back of the hall could hear her clearly.",
            answer: "loudly",
            options: ["loudly", "quickly", "softly", "rarely"],
            explanations: {
                quickly: "'Quickly' describes speed, not volume. Speaking quickly would affect clarity of speech, but the sentence says everyone could hear her 'clearly', implying good volume.",
                softly: "'Softly' means the opposite of what the sentence implies. If she spoke softly, people in the back would struggle to hear, contradicting the sentence.",
                rarely: "'Rarely' means not often, describing frequency of an action, not a quality of how she spoke in this moment."
            },
            correctExplanation: "'Loudly' is correct because the sentence tells us people in the back could hear her clearly, which requires sufficient volume."
        },
        {
            sentence: "The old bridge was so ___ that the engineers decided it needed to be rebuilt immediately.",
            answer: "fragile",
            options: ["fragile", "ancient", "narrow", "expensive"],
            explanations: {
                ancient: "'Ancient' means very old, but age alone doesn't necessarily require a bridge to be rebuilt. The reason must be about its structural condition.",
                narrow: "Being 'narrow' is a design limitation, but it wouldn't typically be the sole reason engineers decide to immediately rebuild a bridge.",
                expensive: "If a bridge were 'expensive', that would be a reason to keep it, not rebuild it. This contradicts the logic of the sentence."
            },
            correctExplanation: "'Fragile' means easily broken or damaged — a structural quality that would directly cause engineers to order an immediate rebuild for safety reasons."
        },
        {
            sentence: "The chef carefully ___ the herbs before adding them to the dish.",
            answer: "chopped",
            options: ["chopped", "tasted", "collected", "burned"],
            explanations: {
                tasted: "'Tasted' means sampling food for flavor. You taste food after preparation, not before cutting. The sentence says this was done before adding herbs to the dish.",
                collected: "'Collected' means gathering from a source. Herbs are collected from a garden; this action typically happens before bringing them to the kitchen, not right before adding to a dish.",
                burned: "If the chef 'burned' the herbs, they would be ruined and unsuitable for a dish. A careful chef would not add burned herbs."
            },
            correctExplanation: "'Chopped' fits because chefs routinely cut herbs into small pieces before adding them to dishes, and the word 'carefully' reinforces this precise kitchen action."
        },
        {
            sentence: "After hours of negotiation, both sides finally reached a ___ that satisfied everyone.",
            answer: "compromise",
            options: ["compromise", "conclusion", "conflict", "victory"],
            explanations: {
                conclusion: "A 'conclusion' is an end or a finding, but it doesn't imply that both sides gave something up. It doesn't capture the mutual agreement quality needed here.",
                conflict: "A 'conflict' means a disagreement or fight. Reaching a conflict would mean the situation got worse, contradicting 'satisfied everyone'.",
                victory: "A 'victory' implies one side won, which contradicts 'satisfied everyone' — a victory typically means the other side lost."
            },
            correctExplanation: "'Compromise' is correct because it specifically means both sides gave up something to reach an agreement — that's why it satisfies everyone."
        },
        {
            sentence: "The documentary was so ___ that viewers were left with a lot to think about.",
            answer: "thought-provoking",
            options: ["thought-provoking", "entertaining", "brief", "colorful"],
            explanations: {
                entertaining: "'Entertaining' means fun or enjoyable, but it doesn't explain why viewers were 'left with a lot to think about'. Entertainment doesn't necessarily provoke deep thought.",
                brief: "'Brief' means short in duration. A short documentary wouldn't necessarily leave viewers with something to think about — and a very short film might actually leave them wanting more.",
                colorful: "'Colorful' describes visual aesthetics. While a colorful film can be beautiful, visual color alone doesn't cause viewers to reflect deeply on ideas."
            },
            correctExplanation: "'Thought-provoking' literally means something that provokes thought — it directly explains why viewers were left with things to think about."
        },
        {
            sentence: "The athlete trained ___ for years before finally winning the championship.",
            answer: "tirelessly",
            options: ["tirelessly", "briefly", "carelessly", "occasionally"],
            explanations: {
                briefly: "'Briefly' means for a short time. Training briefly for 'years' is a contradiction — and brief training wouldn't typically lead to a championship win.",
                carelessly: "'Carelessly' means without attention or effort. An athlete who trains carelessly would be unlikely to develop the skill needed to win a championship.",
                occasionally: "'Occasionally' means only sometimes. Occasional training over years shows inconsistency, which rarely leads to championship-level performance."
            },
            correctExplanation: "'Tirelessly' means working without rest or fatigue, reflecting the intense dedication over years that leads to a championship win."
        },
        {
            sentence: "The map was so ___ that even small villages were shown with their street names.",
            answer: "detailed",
            options: ["detailed", "large", "colorful", "outdated"],
            explanations: {
                large: "A 'large' map has a big physical size, but that alone doesn't mean it would show small villages with their street names. Detail and size are different properties.",
                colorful: "A 'colorful' map uses many colors, but colors don't determine whether fine details like small villages and street names are included.",
                outdated: "An 'outdated' map would be old and inaccurate. Showing small villages and street names is a sign of precision and completeness, not age."
            },
            correctExplanation: "'Detailed' means containing many specific pieces of information — exactly what a map showing small villages with street names demonstrates."
        },
        {
            sentence: "The news of his promotion spread ___ through the office within minutes.",
            answer: "quickly",
            options: ["quickly", "quietly", "sadly", "slowly"],
            explanations: {
                quietly: "'Quietly' means without noise or fuss, but the sentence says the news spread 'within minutes', implying it traveled fast, not that it was done discreetly.",
                sadly: "'Sadly' describes an emotional tone. A promotion is typically good news, so it spreading sadly would be strange. The sentence also doesn't give any reason for sadness.",
                slowly: "'Slowly' contradicts 'within minutes'. If news spreads slowly, it takes a long time — not just minutes."
            },
            correctExplanation: "'Quickly' fits because spreading throughout an office 'within minutes' describes fast movement of information."
        },
        {
            sentence: "The museum's new exhibit was ___ praised by art critics from around the world.",
            answer: "widely",
            options: ["widely", "barely", "silently", "locally"],
            explanations: {
                barely: "'Barely' means only to a very small extent, which contradicts the idea of critics 'from around the world' praising the exhibit.",
                silently: "'Silently' means without making a sound. Critics publicly write and speak reviews; they cannot silently praise something in a way others would know.",
                locally: "'Locally' means in a small area nearby. 'Critics from around the world' implies global reach, contradicting a local scope."
            },
            correctExplanation: "'Widely' means to a great extent across many areas — perfectly matching 'critics from around the world'."
        },
        {
            sentence: "The storm caused so much ___ that several roads were closed for days.",
            answer: "damage",
            options: ["damage", "noise", "change", "excitement"],
            explanations: {
                noise: "While storms are noisy, 'noise' alone doesn't close roads. Roads are closed due to physical harm to infrastructure, not sound.",
                change: "'Change' is very vague. While a storm changes things, the context — closing roads for days — points specifically to physical destruction.",
                excitement: "'Excitement' is a positive emotional response. Closing roads for days due to excitement makes no sense in this context."
            },
            correctExplanation: "'Damage' means physical harm or destruction — the only logical reason why roads would need to be closed for multiple days after a storm."
        },
        {
            sentence: "She was ___ by the sudden noise and dropped everything she was holding.",
            answer: "startled",
            options: ["startled", "amused", "bored", "confused"],
            explanations: {
                amused: "'Amused' means finding something funny or entertaining. Being amused by a noise would not cause someone to drop everything — amusement is a calm reaction.",
                bored: "'Bored' means feeling uninterested. Boredom is a gradual feeling, not a reaction to a sudden noise, and doesn't cause dropping things.",
                confused: "While confusion can follow a sudden noise, 'confused' doesn't explain the physical reaction of dropping things. Being startled specifically causes sudden physical fright."
            },
            correctExplanation: "'Startled' describes a sudden fright response to an unexpected stimulus — exactly the reaction that would cause someone to drop things involuntarily."
        },
        {
            sentence: "The children listened ___ as their grandmother told stories about the old days.",
            answer: "attentively",
            options: ["attentively", "reluctantly", "loudly", "impatiently"],
            explanations: {
                reluctantly: "'Reluctantly' means unwillingly or with resistance. If children listened reluctantly, they probably wouldn't be enjoying the stories, which contradicts the warm scene described.",
                loudly: "'Loudly' describes making noise. Listening is a passive activity — you can't listen loudly. This word mismatches the action described.",
                impatiently: "'Impatiently' means wanting something to end or happen sooner. Impatient listening suggests the children wanted the stories to stop, which contradicts the scene."
            },
            correctExplanation: "'Attentively' means with full attention and care — perfectly describing children who are engaged and focused on their grandmother's stories."
        },
        {
            sentence: "The new policy was met with strong ___ from employees who felt it was unfair.",
            answer: "opposition",
            options: ["opposition", "approval", "silence", "curiosity"],
            explanations: {
                approval: "'Approval' means agreement and support. The sentence says the policy was 'unfair', so employees would not be approving it.",
                silence: "While silence can be a form of protest, 'strong silence' is not a natural phrase and doesn't capture active resistance from employees who feel wronged.",
                curiosity: "'Curiosity' is a neutral feeling of interest. Employees feeling something is unfair would react with opposition, not mere curiosity."
            },
            correctExplanation: "'Opposition' means actively resisting or disagreeing — the natural reaction from employees who believe a policy is unfair."
        },
        {
            sentence: "The instructions were written so ___ that even a child could follow them.",
            answer: "clearly",
            options: ["clearly", "briefly", "formally", "technically"],
            explanations: {
                briefly: "'Briefly' means in a short manner. Short instructions aren't necessarily easy to understand — they could actually be too vague for a child to follow.",
                formally: "'Formally' means in an official, structured style. Formal language is often complex, which would make it harder, not easier, for a child to understand.",
                technically: "'Technically' implies specialized or expert language. Technical instructions would be harder for a child to follow, not easier."
            },
            correctExplanation: "'Clearly' means in a way that is easy to understand — the only quality that directly explains why even a child could follow the instructions."
        }
    ],
    de: [
        {
            sentence: "Der Wissenschaftler machte eine bemerkenswerte ___, die unser Verständnis des Universums veränderte.",
            answer: "Entdeckung",
            options: ["Entdeckung", "Erfindung", "Entscheidung", "Reise"],
            explanations: {
                Erfindung: "'Erfindung' bedeutet, etwas Neues zu erschaffen (z.B. ein Gerät). Ein Wissenschaftler, der etwas findet, das in der Natur bereits existiert, macht eine 'Entdeckung', keine Erfindung.",
                Entscheidung: "Eine 'Entscheidung' ist eine Wahl zwischen Optionen. Sie beschreibt keinen wissenschaftlichen Fund oder Durchbruch.",
                Reise: "Eine 'Reise' bezieht sich auf Bewegung von einem Ort zum anderen, nicht auf einen wissenschaftlichen Fund."
            },
            correctExplanation: "'Entdeckung' passt perfekt, weil es bedeutet, etwas zu finden, das bereits existiert, aber vorher unbekannt war — genau das tun Wissenschaftler."
        },
        {
            sentence: "Sie sprach so ___, dass alle im hinteren Teil des Saals sie deutlich hören konnten.",
            answer: "laut",
            options: ["laut", "schnell", "leise", "selten"],
            explanations: {
                schnell: "'Schnell' beschreibt Geschwindigkeit, nicht Lautstärke. Wenn der Satz besagt, dass alle sie klar hören konnten, geht es um Lautstärke.",
                leise: "'Leise' bedeutet das Gegenteil. Wenn sie leise gesprochen hätte, hätten die Leute im Hintergrund sie nicht hören können.",
                selten: "'Selten' beschreibt die Häufigkeit einer Handlung, nicht die Art und Weise, wie sie in diesem Moment gesprochen hat."
            },
            correctExplanation: "'Laut' ist richtig, weil der Satz besagt, dass Menschen im hinteren Teil sie deutlich hören konnten — das erfordert ausreichende Lautstärke."
        },
        {
            sentence: "Nach stundenlangen Verhandlungen erzielten beide Seiten endlich einen ___, der alle zufriedenstellte.",
            answer: "Kompromiss",
            options: ["Kompromiss", "Schluss", "Konflikt", "Sieg"],
            explanations: {
                Schluss: "Ein 'Schluss' ist ein Ende oder eine Schlussfolgerung, aber er impliziert nicht, dass beide Seiten etwas aufgegeben haben.",
                Konflikt: "Ein 'Konflikt' bedeutet Streit. Einen Konflikt zu erreichen würde bedeuten, die Situation hat sich verschlechtert — das widerspricht 'alle zufriedenstellte'.",
                Sieg: "Ein 'Sieg' impliziert, dass eine Seite gewonnen hat, was bedeutet, die andere hat verloren. Das widerspricht 'alle zufriedenstellte'."
            },
            correctExplanation: "'Kompromiss' ist richtig, weil er bedeutet, dass beide Seiten etwas aufgegeben haben, um eine Einigung zu erzielen — deshalb sind alle zufrieden."
        },
        {
            sentence: "Das Rezept war so ___, dass sogar ein Kind es verstehen konnte.",
            answer: "klar",
            options: ["klar", "kurz", "förmlich", "technisch"],
            explanations: {
                kurz: "'Kurz' bedeutet wenig Text. Kurze Anweisungen sind nicht unbedingt verständlich — sie können zu vage für ein Kind sein.",
                förmlich: "'Förmlich' bedeutet offiziellen Stil. Formelle Sprache ist oft komplex und schwerer für Kinder zu verstehen.",
                technisch: "'Technisch' impliziert Fachsprache. Technische Anweisungen wären für ein Kind schwieriger, nicht einfacher."
            },
            correctExplanation: "'Klar' bedeutet leicht verständlich — die einzige Eigenschaft, die direkt erklärt, warum sogar ein Kind dem Rezept folgen könnte."
        },
        {
            sentence: "Der Sturm verursachte so viele ___, dass mehrere Straßen tagelang gesperrt wurden.",
            answer: "Schäden",
            options: ["Schäden", "Geräusche", "Veränderungen", "Aufregung"],
            explanations: {
                Geräusche: "Obwohl Stürme laut sind, schließt 'Lärm' allein keine Straßen. Straßen werden wegen physischer Zerstörung gesperrt.",
                Veränderungen: "'Veränderungen' ist sehr vage. Der Kontext — tagelange Straßensperrungen — deutet auf physische Zerstörung hin.",
                Aufregung: "'Aufregung' ist eine positive Emotion. Straßensperrungen wegen Aufregung ergibt in diesem Kontext keinen Sinn."
            },
            correctExplanation: "'Schäden' bedeutet physische Zerstörung — der einzige logische Grund, warum Straßen nach einem Sturm tagelang gesperrt werden."
        },
        {
            sentence: "Die Kinder hörten ___, als ihre Großmutter Geschichten aus alten Zeiten erzählte.",
            answer: "aufmerksam",
            options: ["aufmerksam", "widerwillig", "laut", "ungeduldig"],
            explanations: {
                widerwillig: "'Widerwillig' bedeutet ohne Begeisterung. Wenn Kinder widerwillig zuhören, genießen sie die Geschichten vermutlich nicht, was der warmen Szene widerspricht.",
                laut: "'Laut' beschreibt Geräuschproduktion. Zuhören ist eine passive Tätigkeit — man kann nicht laut zuhören.",
                ungeduldig: "'Ungeduldig' bedeutet, dass man möchte, dass etwas aufhört. Das würde bedeuten, die Kinder wollten, dass die Geschichten enden."
            },
            correctExplanation: "'Aufmerksam' bedeutet mit voller Aufmerksamkeit — perfekt für Kinder, die die Geschichten ihrer Großmutter genießen."
        },
        {
            sentence: "Sie war so ___, dass sie alles fallen ließ, als das laute Geräusch sie überraschte.",
            answer: "erschrocken",
            options: ["erschrocken", "amüsiert", "gelangweilt", "verwirrt"],
            explanations: {
                amüsiert: "'Amüsiert' bedeutet, etwas lustig zu finden. Amüsement würde nicht dazu führen, dass jemand alles fallen lässt.",
                gelangweilt: "'Gelangweilt' ist ein allmähliches Gefühl, keine Reaktion auf ein plötzliches Geräusch.",
                verwirrt: "Obwohl Verwirrung auf ein lautes Geräusch folgen kann, erklärt 'verwirrt' nicht das physische Fallen lassen von Dingen."
            },
            correctExplanation: "'Erschrocken' beschreibt eine plötzliche Schreckreaktion auf ein unerwartetes Ereignis — genau das, was jemanden dazu bringt, Dinge fallen zu lassen."
        },
        {
            sentence: "Der Dokumentarfilm war so ___, dass die Zuschauer viel zum Nachdenken hatten.",
            answer: "nachdenklich stimmend",
            options: ["nachdenklich stimmend", "unterhaltsam", "kurz", "farbenfroh"],
            explanations: {
                unterhaltsam: "'Unterhaltsam' bedeutet spaßig oder angenehm, erklärt aber nicht, warum Zuschauer 'viel zum Nachdenken' hatten.",
                kurz: "'Kurz' beschreibt die Dauer. Ein kurzer Film würde Zuschauer nicht unbedingt zum Nachdenken anregen.",
                farbenfroh: "'Farbenfroh' beschreibt visuelle Ästhetik. Farben allein regen nicht zu tiefem Nachdenken an."
            },
            correctExplanation: "'Nachdenklich stimmend' bedeutet wörtlich, dass etwas zum Nachdenken anregt — es erklärt direkt, warum Zuschauer viel zu reflektieren hatten."
        },
        {
            sentence: "Der Athlet trainierte ___ jahrelang, bevor er die Meisterschaft gewann.",
            answer: "unermüdlich",
            options: ["unermüdlich", "kurz", "nachlässig", "gelegentlich"],
            explanations: {
                kurz: "'Kurz' bedeutet für kurze Zeit. Jahrelanges kurzes Training ist ein Widerspruch, und kurzes Training führt selten zu einem Meistertitel.",
                nachlässig: "'Nachlässig' bedeutet ohne Sorgfalt. Ein nachlässiger Athlet würde kaum die Fähigkeit entwickeln, eine Meisterschaft zu gewinnen.",
                gelegentlich: "'Gelegentlich' bedeutet nur manchmal. Gelegentliches Training über Jahre zeigt Inkonsistenz, die selten zu Meisterschaftserfolg führt."
            },
            correctExplanation: "'Unermüdlich' bedeutet ohne Rast oder Ermüdung zu arbeiten — genau die intensive Hingabe über Jahre, die zu einem Meistertitel führt."
        },
        {
            sentence: "Die neue Regelung stieß auf starken ___ von Mitarbeitern, die sie für unfair hielten.",
            answer: "Widerstand",
            options: ["Widerstand", "Zustimmung", "Schweigen", "Neugier"],
            explanations: {
                Zustimmung: "'Zustimmung' bedeutet Einverständnis. Der Satz sagt, die Regelung sei 'unfair', also würden die Mitarbeiter nicht zustimmen.",
                Schweigen: "'Starkes Schweigen' ist keine natürliche Aussage und erfasst keinen aktiven Widerstand.",
                Neugier: "'Neugier' ist ein neutrales Interesse. Mitarbeiter, die eine Regelung für unfair halten, reagieren mit Widerstand, nicht mit bloßer Neugier."
            },
            correctExplanation: "'Widerstand' bedeutet aktives Dagegen-Sein — die natürliche Reaktion von Mitarbeitern, die eine Regelung für unfair halten."
        }
    ],
    uk: [
        {
            sentence: "Вчений зробив видатне ___, яке змінило наше розуміння всесвіту.",
            answer: "відкриття",
            options: ["відкриття", "винахід", "рішення", "подорож"],
            explanations: {
                винахід: "'Винахід' означає створення чогось нового (наприклад, пристрою). Вчений, який знаходить щось, що вже існує в природі, робить 'відкриття', а не винахід.",
                рішення: "'Рішення' — це вибір між варіантами. Воно не описує наукову знахідку чи прорив.",
                подорож: "'Подорож' стосується переміщення з місця на місце, а не наукової знахідки."
            },
            correctExplanation: "'Відкриття' ідеально підходить, бо означає знаходження того, що вже існує, але було раніше невідоме — саме це роблять вчені."
        },
        {
            sentence: "Вона говорила так ___, що всі у задній частині залу могли чути її чітко.",
            answer: "голосно",
            options: ["голосно", "швидко", "тихо", "рідко"],
            explanations: {
                швидко: "'Швидко' описує темп, а не гучність. Речення каже, що всі могли чути її чітко — це стосується гучності.",
                тихо: "'Тихо' означає протилежне. Якби вона говорила тихо, люди ззаду не змогли б чути її.",
                рідко: "'Рідко' описує частоту дії, а не те, як вона говорила в цей момент."
            },
            correctExplanation: "'Голосно' правильно, бо речення каже, що люди ззаду могли чути її чітко — це вимагає достатньої гучності."
        },
        {
            sentence: "Після годин переговорів обидві сторони нарешті досягли ___, яка задовольнила всіх.",
            answer: "компромісу",
            options: ["компромісу", "висновку", "конфлікту", "перемоги"],
            explanations: {
                висновку: "'Висновок' — це завершення або результат, але він не має на увазі, що обидві сторони чимось поступилися.",
                конфлікту: "'Конфлікт' означає суперечку. Досягти конфлікту означало б, що ситуація погіршилась — це суперечить 'задовольнила всіх'.",
                перемоги: "'Перемога' означає, що одна сторона виграла, а інша програла. Це суперечить тому, що всі були задоволені."
            },
            correctExplanation: "'Компроміс' правильно, бо означає, що обидві сторони чимось поступилися для досягнення згоди — тому всі задоволені."
        },
        {
            sentence: "Буря завдала стільки ___, що кілька доріг були закриті на кілька днів.",
            answer: "шкоди",
            options: ["шкоди", "шуму", "змін", "хвилювання"],
            explanations: {
                шуму: "Хоча бурі гучні, самий 'шум' не закриває дороги. Дороги закривають через фізичні руйнування інфраструктури.",
                змін: "'Зміни' дуже розмито. Контекст — закриття доріг на кілька днів — вказує на фізичні руйнування.",
                хвилювання: "'Хвилювання' — це позитивна емоція. Закривати дороги через хвилювання не має сенсу."
            },
            correctExplanation: "'Шкода' означає фізичні руйнування — єдина логічна причина, чому дороги були б закриті після бурі на кілька днів."
        },
        {
            sentence: "Діти слухали ___, поки їхня бабуся розповідала історії про старі часи.",
            answer: "уважно",
            options: ["уважно", "неохоче", "голосно", "нетерпляче"],
            explanations: {
                неохоче: "'Неохоче' означає без бажання. Якби діти слухали неохоче, вони б не насолоджувалися оповідями, що суперечить теплій сцені.",
                голосно: "'Голосно' описує видачу звуків. Слухання — пасивна дія; не можна слухати голосно.",
                нетерпляче: "'Нетерпляче' означає бажання, щоб щось закінчилося. Це означало б, що діти хотіли, щоб оповіді припинились."
            },
            correctExplanation: "'Уважно' означає з повною увагою — ідеально для дітей, які насолоджуються оповідями своєї бабусі."
        },
        {
            sentence: "Вона була така ___, що впустила все, що тримала, почувши раптовий гучний звук.",
            answer: "злякана",
            options: ["злякана", "розважена", "знуджена", "збентежена"],
            explanations: {
                розважена: "'Розважена' означає, що їй щось здалося смішним. Розвага не змушує людину впускати речі.",
                знуджена: "'Знуджена' — це поступове відчуття, а не реакція на раптовий звук.",
                збентежена: "Хоча збентеження може виникнути після гучного звуку, воно не пояснює фізичну реакцію — впускання речей."
            },
            correctExplanation: "'Злякана' описує раптову реакцію переляку на несподіване — саме те, що змушує людину мимоволі впускати речі."
        },
        {
            sentence: "Документальний фільм був настільки ___, що глядачі мали над чим замислитись.",
            answer: "змістовним",
            options: ["змістовним", "розважальним", "коротким", "барвистим"],
            explanations: {
                розважальним: "'Розважальний' означає веселий або приємний, але не пояснює, чому глядачі мали 'над чим замислитись'.",
                коротким: "'Короткий' описує тривалість. Короткий фільм не обов'язково змушує глядачів глибоко роздумувати.",
                барвистим: "'Барвистий' описує зорову естетику. Кольори самі по собі не спонукають до глибоких роздумів."
            },
            correctExplanation: "'Змістовний' означає такий, що дає матеріал для роздумів — саме це пояснює, чому глядачі мали над чим замислитись."
        },
        {
            sentence: "Спортсмен ___ тренувався роками, перш ніж виграти чемпіонат.",
            answer: "невтомно",
            options: ["невтомно", "недовго", "недбало", "зрідка"],
            explanations: {
                недовго: "'Недовго' означає протягом короткого часу. Роками недовго тренуватися — це протиріччя, і таке тренування рідко веде до перемоги на чемпіонаті.",
                недбало: "'Недбало' означає без старання. Спортсмен, який тренується недбало, навряд чи розвине необхідні навички для чемпіонату.",
                зрідка: "'Зрідка' означає лише іноді. Нерегулярні тренування протягом років показують непослідовність, яка рідко призводить до чемпіонського рівня."
            },
            correctExplanation: "'Невтомно' означає працювати без відпочинку та втоми — саме така самовіддача роками призводить до перемоги на чемпіонаті."
        },
        {
            sentence: "Нова політика зустріла сильний ___ з боку співробітників, які вважали її несправедливою.",
            answer: "спротив",
            options: ["спротив", "схвалення", "мовчання", "цікавість"],
            explanations: {
                схвалення: "'Схвалення' означає підтримку. Речення каже, що політика вважалася 'несправедливою', тому співробітники б її не схвалювали.",
                мовчання: "'Сильне мовчання' — неприродне словосполучення і не відображає активного спротиву.",
                цікавість: "'Цікавість' — нейтральне почуття. Співробітники, які вважають щось несправедливим, реагують спротивом, а не просто цікавістю."
            },
            correctExplanation: "'Спротив' означає активне заперечення — природна реакція співробітників, які вважають політику несправедливою."
        },
        {
            sentence: "Інструкції були написані настільки ___, що навіть дитина могла їм слідувати.",
            answer: "зрозуміло",
            options: ["зрозуміло", "стисло", "офіційно", "технічно"],
            explanations: {
                стисло: "'Стисло' означає небагато тексту. Короткі інструкції не обов'язково зрозумілі — вони можуть бути занадто розмитими для дитини.",
                офіційно: "'Офіційно' означає формальний стиль. Офіційна мова часто складна і важча для розуміння дітьми.",
                технічно: "'Технічно' означає вузькоспеціалізовану мову. Технічні інструкції були б складнішими для дитини, а не простішими."
            },
            correctExplanation: "'Зрозуміло' означає так, щоб легко зрозуміти — єдина якість, яка прямо пояснює, чому навіть дитина могла слідувати інструкціям."
        }
    ]
};
