// ゲームブックシステム
class GameBook {
    constructor(storyData) {
        this.textDisplay = document.getElementById('text-display');
        this.choicesContainer = document.getElementById('choices-container');
        this.spaceHint = document.getElementById('space-hint');

        this.storyData = storyData;
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

        // タッチ/クリックイベント（スマホ対応）
        const storyContainer = document.getElementById('story-container');
        storyContainer.addEventListener('click', () => this.handleTap());
        storyContainer.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTap();
        });

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

    handleTap() {
        if (this.canAdvance) {
            this.nextScene();
        }
    }

    async showScene(sceneId) {
        const scene = this.storyData[sceneId];
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
        const scene = this.storyData[this.currentScene];
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

// ストーリーデータを読み込んでゲーム開始
async function loadStoryAndStart() {
    try {
        // まずLocalStorageから読み込みを試みる
        const savedData = localStorage.getItem('gamebook_story');
        if (savedData) {
            try {
                const storyData = JSON.parse(savedData);
                new GameBook(storyData);
                console.log('LocalStorageからストーリーを読み込みました');
                return;
            } catch (error) {
                console.error('LocalStorageの読み込みエラー:', error);
            }
        }

        // LocalStorageにない場合はstory.jsonから読み込み
        const response = await fetch('story.json');
        if (!response.ok) {
            throw new Error('ストーリーファイルの読み込みに失敗しました');
        }
        const storyData = await response.json();
        new GameBook(storyData);
    } catch (error) {
        console.error('Error loading story:', error);
        document.getElementById('text-display').textContent = 'ストーリーの読み込みに失敗しました。ページを再読み込みしてください。';
    }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', loadStoryAndStart);
