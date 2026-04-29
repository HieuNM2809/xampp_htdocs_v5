// Cấu hình Database
const DB_NAME = 'MyDatabase';
const DB_VERSION = 1;
const STORE_NAME = 'users';

let db = null;
let currentEditId = null;

// Mở hoặc tạo database
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Tạo object store nếu chưa tồn tại
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = database.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true
                });

                // Tạo index cho email để tìm kiếm nhanh
                objectStore.createIndex('email', 'email', { unique: false });
                objectStore.createIndex('name', 'name', { unique: false });
            }
        };
    });
}

// Hiển thị thông báo
function showStatus(message, type = 'success') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;

    setTimeout(() => {
        statusEl.className = 'status';
    }, 3000);
}

// Thêm dữ liệu
async function addData() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const age = document.getElementById('age').value.trim();

    if (!name || !email || !age) {
        showStatus('Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }

    try {
        if (!db) await openDatabase();

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);

        const data = {
            name: name,
            email: email,
            age: parseInt(age),
            createdAt: new Date().toISOString()
        };

        const request = objectStore.add(data);

        request.onsuccess = () => {
            showStatus('Thêm dữ liệu thành công!');
            clearForm();
            loadData();
        };

        request.onerror = () => {
            showStatus('Lỗi khi thêm dữ liệu!', 'error');
        };
    } catch (error) {
        showStatus('Lỗi: ' + error.message, 'error');
        console.error('Error adding data:', error);
    }
}

// Đọc tất cả dữ liệu
async function loadData() {
    try {
        if (!db) await openDatabase();

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();

        request.onsuccess = () => {
            const data = request.result;
            displayData(data);
        };

        request.onerror = () => {
            showStatus('Lỗi khi đọc dữ liệu!', 'error');
        };
    } catch (error) {
        showStatus('Lỗi: ' + error.message, 'error');
        console.error('Error loading data:', error);
    }
}

// Hiển thị dữ liệu
function displayData(data) {
    const dataList = document.getElementById('dataList');

    if (data.length === 0) {
        dataList.innerHTML = '<div class="empty-state">Chưa có dữ liệu</div>';
        return;
    }

    dataList.innerHTML = data.map(item => `
        <div class="data-item">
            <div class="data-item-info">
                <strong>${item.name}</strong>
                <span>📧 ${item.email}</span>
                <span>🎂 ${item.age} tuổi</span>
                <span style="font-size: 12px; color: #999;">${new Date(item.createdAt).toLocaleString('vi-VN')}</span>
            </div>
            <div class="data-item-actions">
                <button class="btn-small btn-edit" onclick="editData(${item.id})">Sửa</button>
                <button class="btn-small btn-delete" onclick="deleteData(${item.id})">Xóa</button>
            </div>
        </div>
    `).join('');
}

// Sửa dữ liệu
async function editData(id) {
    try {
        if (!db) await openDatabase();

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(id);

        request.onsuccess = () => {
            const data = request.result;
            if (data) {
                document.getElementById('name').value = data.name;
                document.getElementById('email').value = data.email;
                document.getElementById('age').value = data.age;

                currentEditId = id;
                document.getElementById('btnAdd').disabled = true;
                document.getElementById('btnUpdate').disabled = false;

                // Scroll to form
                document.querySelector('.controls').scrollIntoView({ behavior: 'smooth' });
            }
        };
    } catch (error) {
        showStatus('Lỗi: ' + error.message, 'error');
        console.error('Error editing data:', error);
    }
}

// Cập nhật dữ liệu
async function updateData() {
    if (currentEditId === null) return;

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const age = document.getElementById('age').value.trim();

    if (!name || !email || !age) {
        showStatus('Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }

    try {
        if (!db) await openDatabase();

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);

        // Lấy dữ liệu cũ trước
        const getRequest = objectStore.get(currentEditId);

        getRequest.onsuccess = () => {
            const oldData = getRequest.result;
            const updatedData = {
                ...oldData,
                name: name,
                email: email,
                age: parseInt(age),
                updatedAt: new Date().toISOString()
            };

            const updateRequest = objectStore.put(updatedData);

            updateRequest.onsuccess = () => {
                showStatus('Cập nhật dữ liệu thành công!');
                clearForm();
                loadData();
            };

            updateRequest.onerror = () => {
                showStatus('Lỗi khi cập nhật dữ liệu!', 'error');
            };
        };
    } catch (error) {
        showStatus('Lỗi: ' + error.message, 'error');
        console.error('Error updating data:', error);
    }
}

// Xóa dữ liệu
async function deleteData(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa dữ liệu này?')) {
        return;
    }

    try {
        if (!db) await openDatabase();

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.delete(id);

        request.onsuccess = () => {
            showStatus('Xóa dữ liệu thành công!');
            loadData();
        };

        request.onerror = () => {
            showStatus('Lỗi khi xóa dữ liệu!', 'error');
        };
    } catch (error) {
        showStatus('Lỗi: ' + error.message, 'error');
        console.error('Error deleting data:', error);
    }
}

// Xóa tất cả dữ liệu
async function clearAllData() {
    if (!confirm('Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu? Hành động này không thể hoàn tác!')) {
        return;
    }

    try {
        if (!db) await openDatabase();

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.clear();

        request.onsuccess = () => {
            showStatus('Đã xóa tất cả dữ liệu!');
            loadData();
        };

        request.onerror = () => {
            showStatus('Lỗi khi xóa dữ liệu!', 'error');
        };
    } catch (error) {
        showStatus('Lỗi: ' + error.message, 'error');
        console.error('Error clearing data:', error);
    }
}

// Xóa form
function clearForm() {
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('age').value = '';
    currentEditId = null;
    document.getElementById('btnAdd').disabled = false;
    document.getElementById('btnUpdate').disabled = true;
}

// Khởi tạo
async function init() {
    try {
        await openDatabase();
        showStatus('Kết nối database thành công!');
        loadData();
    } catch (error) {
        showStatus('Lỗi khi khởi tạo database: ' + error.message, 'error');
        console.error('Error initializing:', error);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnAdd').addEventListener('click', addData);
    document.getElementById('btnUpdate').addEventListener('click', updateData);
    document.getElementById('btnClear').addEventListener('click', clearAllData);

    // Cho phép nhấn Enter để thêm
    document.getElementById('age').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (currentEditId === null) {
                addData();
            } else {
                updateData();
            }
        }
    });

    init();
});

