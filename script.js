// ゲームブックシステム
class GameBook {
    constructor() {
        this.textDisplay = document.getElementById('text-display');
        this.choicesContainer = document.getElementById('choices-container');
        this.spaceHint = document.getElementById('space-hint');

        this.currentScene = 'start';
        this.isTyping = false;
        this.currentText = '';
        this.typeSpeed = 50; // ミリ秒
        this.canAdvance = false;

        this.init();
    }

    init() {
        // キーボードイベント
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 最初のシーンを表示
        this.showScene(this.currentScene);
    }

    handleKeyPress(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.canAdvance) {
                this.nextScene();
            }
        }
    }

    async showScene(sceneId) {
        const scene = storyData[sceneId];
        if (!scene) {
            console.error('Scene not found:', sceneId);
            return;
        }

        this.currentScene = sceneId;
        this.canAdvance = false;
        this.hideChoices();
        this.hideHint();

        // テキストを表示
        await this.typeText(scene.text, scene.effects);

        // 選択肢があれば表示
        if (scene.choices) {
            this.showChoices(scene.choices);
        } else if (scene.next) {
            // 次のシーンがある場合はスペースキーで進める
            this.canAdvance = true;
            this.showHint();
        }
    }

    async typeText(text, effects = []) {
        this.textDisplay.innerHTML = '';
        this.isTyping = true;

        // テキストをパース（エフェクト付き）
        const segments = this.parseText(text, effects);

        for (let segment of segments) {
            await this.typeSegment(segment);
        }

        this.isTyping = false;
    }

    parseText(text, effects) {
        // エフェクトがない場合は通常テキスト
        if (!effects || effects.length === 0) {
            return [{ text: text, effect: null }];
        }

        const segments = [];
        let lastIndex = 0;

        // エフェクトの位置でテキストを分割
        for (let effect of effects) {
            // エフェクト前のテキスト
            if (effect.start > lastIndex) {
                segments.push({
                    text: text.substring(lastIndex, effect.start),
                    effect: null
                });
            }

            // エフェクト付きテキスト
            segments.push({
                text: text.substring(effect.start, effect.end),
                effect: effect.type
            });

            lastIndex = effect.end;
        }

        // 残りのテキスト
        if (lastIndex < text.length) {
            segments.push({
                text: text.substring(lastIndex),
                effect: null
            });
        }

        return segments;
    }

    async typeSegment(segment) {
        const chars = segment.text.split('');

        for (let char of chars) {
            const span = document.createElement('span');
            span.textContent = char;

            if (segment.effect) {
                span.className = `text-${segment.effect}`;
            }

            this.textDisplay.appendChild(span);

            // 改行以外で待機
            if (char !== '\n') {
                await this.sleep(this.typeSpeed);
            }
        }
    }

    showChoices(choices) {
        this.choicesContainer.innerHTML = '';
        this.choicesContainer.classList.remove('hidden');

        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.textContent = choice.text;
            button.onclick = () => this.selectChoice(choice.next);

            // キーボードショートカット（1, 2, 3...）
            document.addEventListener('keydown', (e) => {
                if (e.key === String(index + 1)) {
                    this.selectChoice(choice.next);
                }
            }, { once: true });

            this.choicesContainer.appendChild(button);
        });
    }

    hideChoices() {
        this.choicesContainer.classList.add('hidden');
    }

    selectChoice(nextScene) {
        this.showScene(nextScene);
    }

    nextScene() {
        const scene = storyData[this.currentScene];
        if (scene.next) {
            this.showScene(scene.next);
        }
    }

    showHint() {
        this.spaceHint.classList.remove('hidden');
    }

    hideHint() {
        this.spaceHint.classList.add('hidden');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ストーリーデータ
const storyData = {
    start: {
        text: '午後9時。\n\n塾からの帰り道。',
        next: 'scene1'
    },

    scene1: {
        text: '街灯の少ない住宅街を、私は一人で歩いている。\n\n今日は母の仕事が遅く、迎えは来ない。',
        next: 'scene2'
    },

    scene2: {
        text: 'いつもなら友達と一緒なのに、今日は体調不良で早退してしまった。\n\n...少し、怖い。',
        next: 'choice1'
    },

    choice1: {
        text: '前方で道が二つに分かれている。',
        choices: [
            { text: '明るい大通りを遠回りして帰る', next: 'safe_route1' },
            { text: '暗い路地の近道を通る', next: 'dark_route1' }
        ]
    },

    // 安全ルート
    safe_route1: {
        text: '少し遠回りだけど、明るい大通りを選んだ。\n\n街灯に照らされた道路は、いつもより眩しく感じる。',
        next: 'safe_route2'
    },

    safe_route2: {
        text: 'コンビニの前を通り過ぎる。\n\n温かい光と、レジの「いらっしゃいませ」という声が聞こえる。',
        next: 'safe_route3'
    },

    safe_route3: {
        text: '時々車が通り過ぎていく。\n\n人の気配がある道は、やっぱり安心する。',
        next: 'safe_ending'
    },

    safe_ending: {
        text: '15分ほど歩いて、無事に家に着いた。\n\n「ただいま」\n\n今日も何事もない、平和な一日だった。\n\n【 END - 平和な帰り道 】'
    },

    // 暗い路地ルート
    dark_route1: {
        text: '時間を優先して、近道を選んだ。\n\n路地に入ると、急に周りが暗くなる。',
        next: 'dark_route2',
        effects: [
            { start: 33, end: 48, type: 'small' }
        ]
    },

    dark_route2: {
        text: 'ざわ...ざわ...\n\n木々が風に揺れる音。',
        next: 'dark_route3',
        effects: [
            { start: 0, end: 12, type: 'small' }
        ]
    },

    dark_route3: {
        text: '足音が響く。\n\n...私の足音だけじゃない？',
        next: 'dark_route4'
    },

    dark_route4: {
        text: '後ろから、誰かの足音が聞こえる気がする。',
        next: 'choice2',
        effects: [
            { start: 17, end: 22, type: 'shake' }
        ]
    },

    choice2: {
        text: 'どうしよう...',
        choices: [
            { text: '振り返って確認する', next: 'look_back1' },
            { text: '走って逃げる', next: 'run_away1' }
        ]
    },

    // 振り返るルート
    look_back1: {
        text: '勇気を出して、振り返った。',
        next: 'look_back2'
    },

    look_back2: {
        text: '...誰もいない。',
        next: 'look_back3'
    },

    look_back3: {
        text: '街灯のない路地は真っ暗だ。\n\n本当に誰もいないのかな...？',
        next: 'look_back4',
        effects: [
            { start: 25, end: 38, type: 'small' }
        ]
    },

    look_back4: {
        text: 'ガサガサッ！',
        next: 'look_back5',
        effects: [
            { start: 0, end: 7, type: 'large' }
        ]
    },

    look_back5: {
        text: '茂みから何かが飛び出してきた！',
        next: 'look_back6',
        effects: [
            { start: 0, end: 16, type: 'shake' }
        ]
    },

    look_back6: {
        text: '「にゃー」\n\n...猫だった。',
        next: 'look_back7'
    },

    look_back7: {
        text: '黒猫がこちらをじっと見つめている。\n\nゆっくりと尻尾を振って、どこかへ歩いて行った。',
        next: 'look_back8'
    },

    look_back8: {
        text: '心臓がドキドキしている。\n\n猫でよかった...早く帰ろう。',
        next: 'cat_ending'
    },

    cat_ending: {
        text: 'その後、何事もなく家に着いた。\n\n猫に驚かされたことは、誰にも言わないでおこう。\n\n【 END - 黒猫との遭遇 】'
    },

    // 逃げるルート
    run_away1: {
        text: '考えるより先に、足が動いた。',
        next: 'run_away2'
    },

    run_away2: {
        text: '走る。\n\n走る。\n\n走る。',
        next: 'run_away3'
    },

    run_away3: {
        text: '後ろから、何かが追いかけてくる気配がする。',
        next: 'run_away4',
        effects: [
            { start: 18, end: 26, type: 'shake' }
        ]
    },

    run_away4: {
        text: '足音が、近づいてくる。\n\nいや、違う...',
        next: 'run_away5',
        effects: [
            { start: 0, end: 3, type: 'shake' }
        ]
    },

    run_away5: {
        text: 'これは私の足音だけだ。\n\n自分の足音が反響していただけ。',
        next: 'run_away6'
    },

    run_away6: {
        text: '明るい場所まで走り切った。\n\nはぁ、はぁ、はぁ...',
        next: 'run_away7',
        effects: [
            { start: 18, end: 34, type: 'small' }
        ]
    },

    run_away7: {
        text: '振り返っても、誰もいない。\n\n...最初から誰もいなかったのかもしれない。',
        next: 'run_away8'
    },

    run_away8: {
        text: 'でも、確かに何かを感じた。\n\nあの暗闇には、何かがいる。',
        next: 'fear_ending',
        effects: [
            { start: 30, end: 39, type: 'emphasis' }
        ]
    },

    fear_ending: {
        text: '息を整えながら、家まで急いだ。\n\n今日のことは、きっと忘れられない。\n\n暗い夜道には、何かがいる――\n\n【 END - 暗闇の何か 】',
        effects: [
            { start: 51, end: 64, type: 'shake' }
        ]
    }
};

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    new GameBook();
});
