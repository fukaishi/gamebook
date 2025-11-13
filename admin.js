// ストーリーエディタ
class StoryEditor {
    constructor() {
        this.storyData = {};
        this.currentSceneId = null;
        this.originalSceneId = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStoryFromFile();
    }

    setupEventListeners() {
        // JSONの読み込み
        document.getElementById('load-json-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        // JSONの保存
        document.getElementById('save-json-btn').addEventListener('click', () => {
            this.saveJSON();
        });

        // 新規シーン
        document.getElementById('add-scene-btn').addEventListener('click', () => {
            this.addNewScene();
        });

        // シーンの保存
        document.getElementById('save-scene-btn').addEventListener('click', () => {
            this.saveCurrentScene();
        });

        // シーンの削除
        document.getElementById('delete-scene-btn').addEventListener('click', () => {
            this.deleteCurrentScene();
        });

        // 遷移タイプの切り替え
        document.querySelectorAll('input[name="transition-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleTransitionType(e.target.value);
            });
        });

        // 選択肢の追加
        document.getElementById('add-choice-btn').addEventListener('click', () => {
            this.addChoice();
        });

        // エフェクトの追加
        document.getElementById('add-effect-btn').addEventListener('click', () => {
            this.addEffect();
        });
    }

    async loadStoryFromFile() {
        try {
            const response = await fetch('story.json');
            if (response.ok) {
                this.storyData = await response.json();
                this.renderSceneList();
            }
        } catch (error) {
            console.log('初回読み込み:', error);
        }
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                this.storyData = JSON.parse(event.target.result);
                this.renderSceneList();
                alert('JSONファイルを読み込みました');
            } catch (error) {
                alert('JSONファイルの読み込みに失敗しました: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    renderSceneList() {
        const container = document.getElementById('scenes-container');
        container.innerHTML = '';

        Object.keys(this.storyData).forEach(sceneId => {
            const scene = this.storyData[sceneId];
            const item = document.createElement('div');
            item.className = 'scene-item';
            if (sceneId === this.currentSceneId) {
                item.classList.add('active');
            }

            const preview = scene.text.substring(0, 30).replace(/\n/g, ' ');

            item.innerHTML = `
                <div class="scene-item-id">${sceneId}</div>
                <div class="scene-item-preview">${preview}...</div>
            `;

            item.addEventListener('click', () => {
                this.selectScene(sceneId);
            });

            container.appendChild(item);
        });
    }

    selectScene(sceneId) {
        this.currentSceneId = sceneId;
        this.originalSceneId = sceneId;
        this.renderSceneList();
        this.renderSceneEditor(sceneId);
    }

    renderSceneEditor(sceneId) {
        const scene = this.storyData[sceneId];

        // エディタを表示
        document.getElementById('editor-placeholder').classList.add('hidden');
        document.getElementById('editor-content').classList.remove('hidden');

        // シーンIDを設定
        document.getElementById('scene-id').value = sceneId;

        // テキストを設定
        document.getElementById('scene-text').value = scene.text || '';

        // 遷移タイプを設定
        if (scene.choices) {
            document.querySelector('input[name="transition-type"][value="choices"]').checked = true;
            this.toggleTransitionType('choices');
            this.renderChoices(scene.choices);
        } else {
            document.querySelector('input[name="transition-type"][value="next"]').checked = true;
            this.toggleTransitionType('next');
            document.getElementById('scene-next').value = scene.next || '';
        }

        // エフェクトを設定
        this.renderEffects(scene.effects || []);
    }

    toggleTransitionType(type) {
        const nextSection = document.getElementById('next-section');
        const choicesSection = document.getElementById('choices-section');

        if (type === 'next') {
            nextSection.classList.remove('hidden');
            choicesSection.classList.add('hidden');
        } else {
            nextSection.classList.add('hidden');
            choicesSection.classList.remove('hidden');
        }
    }

    renderChoices(choices) {
        const container = document.getElementById('choices-list');
        container.innerHTML = '';

        choices.forEach((choice, index) => {
            this.addChoiceToUI(choice.text, choice.next, index);
        });
    }

    addChoice() {
        this.addChoiceToUI('', '', -1);
    }

    addChoiceToUI(text, next, index) {
        const container = document.getElementById('choices-list');
        const item = document.createElement('div');
        item.className = 'choice-item';
        item.innerHTML = `
            <input type="text" class="form-control" placeholder="選択肢テキスト" value="${text}" data-field="text">
            <input type="text" class="form-control" placeholder="次のシーンID" value="${next}" data-field="next">
            <button class="btn btn-danger" onclick="this.parentElement.remove()">削除</button>
        `;
        container.appendChild(item);
    }

    renderEffects(effects) {
        const container = document.getElementById('effects-list');
        container.innerHTML = '';

        effects.forEach((effect, index) => {
            this.addEffectToUI(effect.start, effect.end, effect.type, index);
        });
    }

    addEffect() {
        this.addEffectToUI(0, 10, 'large', -1);
    }

    addEffectToUI(start, end, type, index) {
        const container = document.getElementById('effects-list');
        const item = document.createElement('div');
        item.className = 'effect-item';
        item.innerHTML = `
            <div>
                <label>開始位置</label>
                <input type="number" class="form-control" value="${start}" data-field="start" min="0">
            </div>
            <div>
                <label>終了位置</label>
                <input type="number" class="form-control" value="${end}" data-field="end" min="0">
            </div>
            <div>
                <label>タイプ</label>
                <select class="form-control" data-field="type">
                    <option value="large" ${type === 'large' ? 'selected' : ''}>大きく (large)</option>
                    <option value="small" ${type === 'small' ? 'selected' : ''}>小さく (small)</option>
                    <option value="shake" ${type === 'shake' ? 'selected' : ''}>震える (shake)</option>
                    <option value="emphasis" ${type === 'emphasis' ? 'selected' : ''}>強調 (emphasis)</option>
                </select>
            </div>
            <div class="effect-preview">
                文字位置 ${start}〜${end}
            </div>
            <button class="btn btn-danger btn-small" onclick="this.parentElement.remove()">削除</button>
        `;
        container.appendChild(item);
    }

    saveCurrentScene() {
        // シーンIDを取得
        const newSceneId = document.getElementById('scene-id').value.trim();
        if (!newSceneId) {
            alert('シーンIDを入力してください');
            return;
        }

        // テキストを取得
        const text = document.getElementById('scene-text').value;

        // シーンデータを構築
        const sceneData = { text };

        // 遷移タイプを取得
        const transitionType = document.querySelector('input[name="transition-type"]:checked').value;

        if (transitionType === 'next') {
            const next = document.getElementById('scene-next').value.trim();
            if (next) {
                sceneData.next = next;
            }
        } else {
            // 選択肢を取得
            const choices = [];
            document.querySelectorAll('#choices-list .choice-item').forEach(item => {
                const text = item.querySelector('[data-field="text"]').value.trim();
                const next = item.querySelector('[data-field="next"]').value.trim();
                if (text && next) {
                    choices.push({ text, next });
                }
            });
            if (choices.length > 0) {
                sceneData.choices = choices;
            }
        }

        // エフェクトを取得
        const effects = [];
        document.querySelectorAll('#effects-list .effect-item').forEach(item => {
            const start = parseInt(item.querySelector('[data-field="start"]').value);
            const end = parseInt(item.querySelector('[data-field="end"]').value);
            const type = item.querySelector('[data-field="type"]').value;
            if (!isNaN(start) && !isNaN(end)) {
                effects.push({ start, end, type });
            }
        });
        if (effects.length > 0) {
            sceneData.effects = effects;
        }

        // 元のシーンIDと異なる場合は削除
        if (this.originalSceneId && this.originalSceneId !== newSceneId) {
            delete this.storyData[this.originalSceneId];
        }

        // シーンを保存
        this.storyData[newSceneId] = sceneData;
        this.currentSceneId = newSceneId;
        this.originalSceneId = newSceneId;

        // 一覧を更新
        this.renderSceneList();

        alert('シーンを保存しました');
    }

    addNewScene() {
        let newId = 'new_scene';
        let counter = 1;

        while (this.storyData[newId]) {
            newId = `new_scene_${counter}`;
            counter++;
        }

        this.storyData[newId] = {
            text: '新しいシーンのテキストを入力してください'
        };

        this.selectScene(newId);
    }

    deleteCurrentScene() {
        if (!this.currentSceneId) return;

        if (confirm(`シーン「${this.currentSceneId}」を削除しますか？`)) {
            delete this.storyData[this.currentSceneId];
            this.currentSceneId = null;
            this.originalSceneId = null;

            // 一覧を更新
            this.renderSceneList();

            // エディタを非表示
            document.getElementById('editor-placeholder').classList.remove('hidden');
            document.getElementById('editor-content').classList.add('hidden');

            alert('シーンを削除しました');
        }
    }

    saveJSON() {
        const json = JSON.stringify(this.storyData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'story.json';
        a.click();

        URL.revokeObjectURL(url);

        alert('JSONファイルをダウンロードしました');
    }
}

// エディタを起動
window.addEventListener('DOMContentLoaded', () => {
    new StoryEditor();
});
