let bdsToDeleteId = null;
let bdsToDeleteName = null;
let bdsList = []; // lưu toàn bộ danh sách từ API
const pageSize = 5; // số card mỗi trang
let currentPage = 1;

// Load danh sách từ API
async function loadBds() {
    try {
        const response = await fetch('http://localhost:8081/api/v1/bds');
        if (!response.ok) throw new Error('HTTP error! Status: ' + response.status);
        bdsList = await response.json();
        renderPage(1); // load trang đầu tiên
        renderPagination();
    } catch (error) {
        console.error('Lỗi khi tải danh sách BĐS:', error);
    }
}

// Render danh sách theo trang
function renderPage(page) {
    currentPage = page;
    const container = document.getElementById('bds-container');
    container.innerHTML = '';

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = bdsList.slice(start, end);

    pageItems.forEach(bds => {
        const imgSrc = bds.anhChinh ? bds.anhChinh : 'https://via.placeholder.com/1200x900.png?text=Building+Image+Large';

// Badge trạng thái
let badgeClass = 'bg-secondary';
let badgeText = '';
switch(bds.trangThai) {
    case 'cho_thue':
        badgeClass = 'bg-success';
        badgeText = 'BDS cho thuê';
        break;
    case 'ban':
        badgeClass = 'bg-danger';
        badgeText = 'BDS bán';
        break;
    case 'dang_xu_ly':
        badgeClass = 'bg-primary';
        badgeText = 'BDS Đang chờ xử lý';
        break;
        case 'da_ban':
        badgeClass = 'bg-primary';
        badgeText = 'BDS Đã bán';
        break;
    default:
        badgeText = 'Không xác định';
}
        const card = document.createElement('div');
        card.className = 'card mb-3 shadow-sm position-relative';
        card.innerHTML = `
            <span class="position-absolute top-0 end-0 m-3 badge ${badgeClass}">${badgeText}</span>
            <div class="row g-0">
                <div class="col-md-4 custom-img-container">
                    <img src="${imgSrc}" class="img-fluid rounded-start card-img-custom" alt="${bds.tieuDe}">
                </div>
                <div class="col-md-8">
                    <div class="card-body d-flex flex-column h-100">
                        <h5 class="card-title">${bds.tieuDe}</h5>
                        <ul class="list-unstyled mt-3 mb-4">
                            <li class="mb-2">
                                <i class="bi bi-arrows-fullscreen me-2 text-primary"></i>
                                <strong>Diện tích:</strong> ${bds.dienTich} m²
                            </li>
                            <li class="mb-2">
                                <i class="bi bi-geo-alt-fill me-2 text-danger"></i>
                                <strong>Vị trí:</strong> ${bds.viTri}
                            </li>
                            <li class="mb-2">
                                <i class="bi bi-cash-coin me-2 text-success"></i>
                                <strong>Giá:</strong> ${bds.gia ? bds.gia.toLocaleString('vi-VN') + ' VND' : 'Đang cập nhật'}
                            </li>
                        </ul>
                        <div class="mt-auto">
                            <button class="btn btn-primary" onclick="viewBds(${bds.maBds})">
                                <i class="bi bi-eye"></i> Xem chi tiết
                            </button>
                            <button class="btn btn-outline-warning ms-2" onclick="editBds(${bds.maBds})">
                                <i class="bi bi-pencil-square"></i> Sửa
                            </button>
                            <button class="btn btn-outline-danger ms-2" onclick="showDeleteModal(${bds.maBds}, '${bds.tieuDe}')">
                                <i class="bi bi-trash"></i> Xóa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Render pagination
function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(bdsList.length / pageSize);

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            renderPage(i);
            renderPagination();
        });
        paginationContainer.appendChild(li);
    }
}

// Các hàm điều hướng
function viewBds(id) {
    window.location.href = `Buldinh_admin_ctsp.html?id=${id}`;
}

function editBds(id) {
    // Chuyển sang trang sửa và truyền ID
    window.location.href = `Building_admin_editbds.html?id=${id}`;
}

// Xóa
// **<-- Đặt định nghĩa hàm showDeleteModal ở đây -->**
function showDeleteModal(id, tieuDe) {
    bdsToDeleteId = id; // Lưu ID để xóa
    bdsToDeleteName = tieuDe; // Lưu tên để hiển thị trong modal
    document.getElementById('deleteBdsName').textContent = tieuDe;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    deleteModal.show();
}


// Hàm xác nhận xóa: Đây là nơi chúng ta gọi API DELETE
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (bdsToDeleteId) {
        try {
            // Thực hiện cuộc gọi API DELETE
            const response = await fetch(`http://localhost:8081/api/v1/bds/${bdsToDeleteId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                    // Thêm Authorization header nếu API của bạn yêu cầu token
                    // 'Authorization': 'Bearer YOUR_AUTH_TOKEN'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Không thể đọc thông báo lỗi từ server.' }));
                throw new Error(errorData.message || `Lỗi khi xóa BĐS ID ${bdsToDeleteId}: ${response.statusText} (Status: ${response.status})`);
            }


            bdsToDeleteId = null;
            bdsToDeleteName = null;

            const modalEl = document.getElementById('deleteModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) { // Kiểm tra xem modalInstance có tồn tại không
                modalInstance.hide();
            }

            loadBds();

        } catch (error) {
            console.error('Lỗi khi xóa BĐS:', error);
            alert('Có lỗi xảy ra khi xóa bất động sản: ' + error.message);
        }
    } else {
        alert('Không có bất động sản nào được chọn để xóa.');
    }
});

window.onload = loadBds;