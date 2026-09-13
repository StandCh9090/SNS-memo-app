// ===== データ管理 =====
let memos = [];
let sortOrder = 'desc'; // 'desc': 新しい順, 'asc': 古い順
let currentSearchQuery = '';
let currentFilter = 'all';
let editingMemoId = null;

// ===== DOM要素の取得 =====
const usernameInput = document.getElementById('usernameInput');
const memoInput = document.getElementById('memoInput');
const postBtn = document.getElementById('postBtn');
const timeline = document.getElementById('timeline');
const sortBtn = document.getElementById('sortBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const searchInfo = document.getElementById('searchInfo');
const searchCount = document.getElementById('searchCount');
const editModal = document.getElementById('editModal');
const editUsername = document.getElementById('editUsername');
const editContent = document.getElementById('editContent');
const saveEditBtn = document.getElementById('saveEditBtn');

// ===== 初期化 =====
function init() {
    loadMemosFromStorage();
    loadThemePreference();
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
    themeToggleBtn.addEventListener('click', toggleTheme);
    searchInput.addEventListener('input', handleSearch);
    filterSelect.addEventListener('change', handleFilter);
    saveEditBtn.addEventListener('click', saveEditedMemo);
    
    // モーダルの外側をクリックで閉じる
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
}

// ===== ダークモード ===== 
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
    showAlert(isDark ? '🌙 ダークモードに切り替えました' : '☀️ ライトモードに切り替えました', 'info');
}

function loadThemePreference() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = document.body.classList.contains('dark-mode');
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
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

// ===== 検索処理 =====
function handleSearch(e) {
    currentSearchQuery = e.target.value.toLowerCase();
    renderTimeline();
}

// ===== フィルター処理 =====
function handleFilter(e) {
    currentFilter = e.target.value;
    renderTimeline();
}

// ===== メモのフィルタリング =====
function getFilteredMemos() {
    return memos.filter(memo => {
        // 検索条件
        const matchesSearch = !currentSearchQuery || 
            memo.content.toLowerCase().includes(currentSearchQuery) ||
            memo.username.toLowerCase().includes(currentSearchQuery);

        // フィルター条件
        let matchesFilter = true;
        if (currentFilter === 'liked') {
            matchesFilter = memo.liked;
        } else if (currentFilter === 'notLiked') {
            matchesFilter = !memo.liked;
        }

        return matchesSearch && matchesFilter;
    });
}

// ===== タイムライン表示 =====
function renderTimeline() {
    timeline.innerHTML = '';

    const filteredMemos = getFilteredMemos();

    // 検索結果情報の表示
    if (currentSearchQuery || currentFilter !== 'all') {
        searchInfo.style.display = 'block';
        searchCount.textContent = filteredMemos.length;
    } else {
        searchInfo.style.display = 'none';
    }

    // メモが空の場合
    if (filteredMemos.length === 0) {
        let emptyMessage = '📭 メモがありません';
        if (currentSearchQuery) {
            emptyMessage = `🔍 「${currentSearchQuery}」に該当するメモが見つかりません`;
        } else if (currentFilter !== 'all') {
            emptyMessage = `📭 ${currentFilter === 'liked' ? 'いいね済み' : 'いいなし'}のメモがありません`;
        }

        timeline.innerHTML = `
            <div class="empty-state">
                <p>${emptyMessage}</p>
            </div>
        `;
        return;
    }

    // ソート
    const sortedMemos = [...filteredMemos].sort((a, b) => {
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
            <button class="edit-btn" onclick="openEditModal(${memo.id})">
                ✏️ 編集
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

// ===== 編集機能 =====
function openEditModal(memoId) {
    const memo = memos.find(m => m.id === memoId);
    if (!memo) return;

    editingMemoId = memoId;
    editUsername.value = memo.username;
    editContent.value = memo.content;
    editModal.classList.add('show');
    editContent.focus();
}

function closeEditModal() {
    editModal.classList.remove('show');
    editingMemoId = null;
    editUsername.value = '';
    editContent.value = '';
}

function saveEditedMemo() {
    const username = editUsername.value.trim();
    const content = editContent.value.trim();

    if (!username) {
        showAlert('お名前を入力してください！');
        editUsername.focus();
        return;
    }

    if (!content) {
        showAlert('メモを入力してください！');
        editContent.focus();
        return;
    }

    const memo = memos.find(m => m.id === editingMemoId);
    if (!memo) return;

    memo.username = username;
    memo.content = content;
    memo.timestamp = new Date().toLocaleString('ja-JP');

    saveMemosToStorage();
    renderTimeline();
    closeEditModal();
    showAlert('✅ メモを編集しました！', 'success');
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
        showAlert('⚠️ メモの保存に失敗しました', 'warning');
    }
}

function loadMemosFromStorage() {
    try {
        const stored = localStorage.getItem('memos');
        memos = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('ストレージの読込に失敗しました:', e);
        memos = [];
        showAlert('⚠️ メモの読込に失敗しました', 'warning');
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
