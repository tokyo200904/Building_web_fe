
document.addEventListener('DOMContentLoaded', function () {
    const API_ENDPOINT = '/api/yeucau/dangtin'; // Endpoint của bạn
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imageUploadInput = document.getElementById('imageUploadInput');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const postRealEstateForm = document.getElementById('postRealEstateForm');

    let uploadedFiles = []; // Mảng chứa các File object
    let mainImageIndex = -1; // Index của ảnh chính trong uploadedFiles

    // --- IMAGE UPLOAD LOGIC ---
    imageUploadArea.addEventListener('click', () => imageUploadInput.click());
    imageUploadArea.addEventListener('dragover', (e) => { e.preventDefault(); imageUploadArea.style.borderColor = '#007bff'; });
    imageUploadArea.addEventListener('dragleave', () => { imageUploadArea.style.borderColor = '#a0d9ff'; });
    imageUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = '#a0d9ff';
        handleFiles(Array.from(e.dataTransfer.files));
    });
    imageUploadInput.addEventListener('change', (e) => handleFiles(Array.from(e.target.files)));

    function handleFiles(files) {
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                uploadedFiles.push(file);
            }
        });
        if (mainImageIndex === -1 && uploadedFiles.length > 0) {
            mainImageIndex = 0; // Đặt ảnh đầu tiên làm ảnh chính nếu chưa có
        }
        renderPreviews();
    }

    function renderPreviews() {
        imagePreviewContainer.innerHTML = '';
        uploadedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                if (index === mainImageIndex) {
                    previewItem.classList.add('main-image');
                }

                previewItem.innerHTML = `
                            <img src="${e.target.result}" alt="Preview">
                            <span class="remove-image" data-index="${index}"><i class="bi bi-x"></i></span>
                            ${index !== mainImageIndex ? `<span class="set-main-image" data-index="${index}">Đặt làm ảnh chính</span>` : ''}
                        `;
                imagePreviewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }

    imagePreviewContainer.addEventListener('click', (e) => {
        if (e.target.closest('.remove-image')) {
            const indexToRemove = parseInt(e.target.closest('.remove-image').dataset.index);
            uploadedFiles.splice(indexToRemove, 1);
            if (mainImageIndex === indexToRemove) {
                mainImageIndex = uploadedFiles.length > 0 ? 0 : -1; // Chọn ảnh đầu tiên còn lại làm chính, hoặc reset
            } else if (mainImageIndex > indexToRemove) {
                mainImageIndex--; // Điều chỉnh index của ảnh chính
            }
            renderPreviews();
        } else if (e.target.closest('.set-main-image')) {
            mainImageIndex = parseInt(e.target.closest('.set-main-image').dataset.index);
            renderPreviews();
        }
    });

    // --- FORM SUBMIT LOGIC ---
    postRealEstateForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        if (uploadedFiles.length === 0) {
            alert('Vui lòng tải lên ít nhất một hình ảnh cho bất động sản.');
            return;
        }
        if (mainImageIndex === -1) {
            mainImageIndex = 0; // Đảm bảo có ảnh chính nếu người dùng không chọn
        }

        const formData = new FormData();
        const jsonBody = {};

        // Thu thập dữ liệu text và số
        const fields = [
            'tieuDe', 'moTa', 'gia', 'donViTien', 'loaiBds', 'mucDichTinDang',
            'viTri', 'quanHuyen', 'thanhPho', 'dienTich', 'soPhongNgu',
            'soPhongTam', 'tang', 'tongTang', 'noiThat', 'namXayDung'
        ];

        fields.forEach(field => {
            const input = this.elements[field];
            if (input) {
                if (input.type === 'number') {
                    jsonBody[field] = input.value ? parseFloat(input.value) : null;
                } else if (input.tagName === 'SELECT' || input.type === 'text' || input.tagName === 'TEXTAREA') {
                    jsonBody[field] = input.value || null;
                }
            }
        });

        // --- Đã loại bỏ logic thu thập tiện ích ở đây ---

        // Gắn JSON body vào FormData dưới dạng một phần tử JSON string
        formData.append('data', JSON.stringify(jsonBody));

        // Gắn ảnh chính và các ảnh phụ vào FormData
        uploadedFiles.forEach((file, index) => {
            if (index === mainImageIndex) {
                formData.append('mainImageFile', file); // key cho ảnh chính
            } else {
                formData.append('otherImageFiles', file); // key cho các ảnh phụ
            }
        });

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                body: formData,
                // 'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Thêm token nếu cần
            });

            // Lấy nội dung JSON từ response
            const result = await response.json();

            if (response.ok) {
                // *** ĐÂY LÀ THAY ĐỔI QUAN TRỌNG ***

                // Hiển thị thông báo động từ Backend
                alert(result.message || 'Thao tác thành công!');

                // Dựa vào status (nếu có) để quyết định thêm
                // Ví dụ: if (result.status === 'published') { ... }

                postRealEstateForm.reset(); // Reset form
                uploadedFiles = [];
                mainImageIndex = -1;
                renderPreviews(); // Xóa ảnh preview

            } else {
                // Xử lý lỗi (giữ nguyên code cũ của bạn)
                alert('Có lỗi xảy ra khi gửi yêu cầu: ' + (result.message || response.statusText));
            }
        } catch (error) {
            console.error('Lỗi mạng hoặc server:', error);
            alert('Không thể kết nối đến server. Vui lòng thử lại.');
        }
    });
});