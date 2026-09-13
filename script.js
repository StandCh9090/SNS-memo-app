// ===== データ管理 =====
let memos = [];
let sortOrder = 'desc'; // 'desc': 新しい順, 'asc': 古い順

// ===== DOM要素の取得 =====
const usernameInput = document.getElementById('usernameInput');
const memoInput = document.getElementById('memoInput');
const postBtn = document.getElementById('postBtn');
const timeline = document.getElementById('timeline');
const sortBtn = document.getElementById('sortBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

// ===== 初期化 =====
function init() {
    loadMemosFromStorage();
    renderTimeline();
    attachEventListeners();
}

// ===== イベントリスナー設定 =====
function attachEventListeners() {
    postBtn.addEventListener('click', postMemo);
    memoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            postMemo();
        }
    });
    sortBtn.addEventListener('click', toggleSort);
    clearAllBtn.addEventListener('click', clearAllMemos);
}

// ===== メモ投稿 =====
function postMemo() {
    const username = usernameInput.value.trim();
    const content = memoInput.value.trim();

    // バリデーション
    if (!username) {
        showAlert('お名前を入力してください！');
        usernameInput.focus();
        return;
    }

    if (!content) {
        showAlert('メモを入力してください！');
        memoInput.focus();
        return;
    }

    // メモオブジェクトの作成
    const memo = {
        id: Date.now(),
        username: username,
        content: content,
        timestamp: new Date().toLocaleString('ja-JP'),
        liked: false,
        likes: 0
    };

    // メモを配列に追加
    memos.unshift(memo);

    // ローカルストレージに保存
    saveMemosToStorage();

    // UI更新
    renderTimeline();

    // フォームをクリア
    memoInput.value = '';
    memoInput.focus();

    // ポップアップ表示
    showAlert('✅ メモを投稿しました！', 'success');
}

// ===== タイムライン表示 =====
function renderTimeline() {
    timeline.innerHTML = '';

    // メモが空の場合
    if (memos.length === 0) {
        timeline.innerHTML = `
            <div class="empty-state">
                <p>📭 まだメモがありません</p>
                <p>最初のメモを投稿してみましょう！</p>
            </div>
        `;
        return;
    }

    // ソート
    const sortedMemos = [...memos].sort((a, b) => {
        if (sortOrder === 'desc') {
            return b.id - a.id; // 新しい順
        } else {
            return a.id - b.id; // 古い順
        }
    });

    // メモカードを生成
    sortedMemos.forEach(memo => {
        const memoCard = createMemoCard(memo);
        timeline.appendChild(memoCard);
    });
}

// ===== メモカード作成 =====
function createMemoCard(memo) {
    const card = document.createElement('div');
    card.className = 'memo-card';
    card.id = `memo-${memo.id}`;

    const likeClass = memo.liked ? 'liked' : '';
    const likeText = memo.liked ? `❤️ ${memo.likes}` : `🤍 ${memo.likes}`;

    card.innerHTML = `
        <div class="memo-header">
            <span class="memo-username">${escapeHTML(memo.username)}</span>
            <span class="memo-time">${memo.timestamp}</span>
        </div>
        <div class="memo-content">${escapeHTML(memo.content)}</div>
        <div class="memo-footer">
            <button class="like-btn ${likeClass}" onclick="toggleLike(${memo.id})">
                ${likeText}
            </button>
            <button class="delete-btn" onclick="deleteMemo(${memo.id})">
                🗑️ 削除
            </button>
        </div>
    `;

    return card;
}

// ===== いいね機能 =====
function toggleLike(memoId) {
    const memo = memos.find(m => m.id === memoId);
    if (!memo) return;

    memo.liked = !memo.liked;
    memo.likes = memo.liked ? memo.likes + 1 : Math.max(0, memo.likes - 1);

    saveMemosToStorage();
    renderTimeline();
}

// ===== メモ削除 =====
function deleteMemo(memoId) {
    if (confirm('このメモを削除してもよろしいですか？')) {
        memos = memos.filter(m => m.id !== memoId);
        saveMemosToStorage();
        renderTimeline();
        showAlert('🗑️ メモを削除しました', 'info');
    }
}

// ===== ソート切り替え =====
function toggleSort() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    const orderText = sortOrder === 'desc' ? '⬇️ 新しい順' : '⬆️ 古い順';
    sortBtn.textContent = orderText;
    renderTimeline();
}

// ===== すべて削除 =====
function clearAllMemos() {
    if (memos.length === 0) {
        showAlert('削除するメモがありません', 'info');
        return;
    }

    if (confirm(`${memos.length}個のメモをすべて削除してもよろしいですか？\nこの操作は取り消せません。`)) {
        memos = [];
        saveMemosToStorage();
        renderTimeline();
        showAlert('🗑️ すべてのメモを削除しました', 'info');
    }
}

// ===== ローカルストレージ =====
function saveMemosToStorage() {
    try {
        localStorage.setItem('memos', JSON.stringify(memos));
    } catch (e) {
        console.error('ストレージの保存に失敗しました:', e);
    }
}

function loadMemosFromStorage() {
    try {
        const stored = localStorage.getItem('memos');
        memos = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('ストレージの読込に失敗しました:', e);
        memos = [];
    }
}

// ===== ユーティリティ関数 =====

// XSS対策：HTMLエスケープ
function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// アラート表示
function showAlert(message, type = 'warning') {
    // 簡単なアラート実装
    // より洗練されたアラートUIが必要な場合は別途実装可能
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : type === 'info' ? '#17a2b8' : '#ffc107'};
        color: ${type === 'warning' ? '#333' : 'white'};
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        font-weight: bold;
    `;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    // CSSアニメーション
    if (!document.getElementById('alertStyles')) {
        const style = document.createElement('style');
        style.id = 'alertStyles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 3秒後に削除
    setTimeout(() => {
        alertDiv.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// ===== アプリ起動 =====
document.addEventListener('DOMContentLoaded', init);
