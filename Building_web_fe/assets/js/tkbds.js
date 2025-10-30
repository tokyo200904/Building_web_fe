// ===================================================
// FILE: tkbds.js
// CHỨC NĂNG: Quản lý UI tìm kiếm (Modal, Offcanvas, jQuery)
// YÊU CẦU: Phải được tải SAU dsbds.js (vì nó gọi hàm loadBds())
// ===================================================

$(document).ready(function() {

    // --- Cấu hình chung ---
    const maxAreaValue = 1000;
    const maxPriceValue = 50000; // triệu VND
    const defaultPriceLabel = "Tất cả mức giá";
    const defaultAreaLabel = "Tất cả diện tích";

    // --- Biến trạng thái cho bộ lọc ĐÃ ÁP DỤNG (Bên ngoài Modal) ---
    let currentAppliedFilters = {};
    let currentSelectedPrice = { min: 0, max: maxPriceValue, label: defaultPriceLabel };
    let currentSelectedArea = { min: 0, max: maxAreaValue, label: defaultAreaLabel };
    let currentSelectedLoaiNha = "all";

    // --- Biến trạng thái TẠM THỜI cho Modal ---
    let modalSelectedPrice = { ...currentSelectedPrice };
    let modalSelectedArea = { ...currentSelectedArea };

    // --- Hàm cập nhật badge số lượng bộ lọc ---
    function updateFilterCountBadge() {
        let count = 0;
        for (const key in currentAppliedFilters) {
            count++;
        }
        $('#filterCountBadge').text(count);
        $('#filterCountBadge').toggle(count > 0);
    }

    /**
     * Hàm "ĐIỀU PHỐI" tìm kiếm
     * @param {object} filters - Đối tượng JSON chứa các bộ lọc
     */
    function filterAndDisplayResults(filters = {}) {
        // 1. Dọn dẹp JSON
        const cleanFilters = {};
        for (const key in filters) {
            const value = filters[key];
            if (value !== null && value !== "" && value !== undefined) {
                // Kiểm tra các trường hợp mặc định
                if (key === 'minPrice' && value === 0 && filters.labelPrice === defaultPriceLabel) continue;
                if (key === 'maxPrice' && value === maxPriceValue && filters.labelPrice === defaultPriceLabel) continue;
                if (key === 'minArea' && value === 0 && filters.labelArea === defaultAreaLabel) continue;
                if (key === 'maxArea' && value === maxAreaValue && filters.labelArea === defaultAreaLabel) continue;
                
                // Bỏ các key label
                if (key !== 'labelPrice' && key !== 'labelArea') {
                    cleanFilters[key] = value;
                }
            }
        }
        
        // Xóa các giá trị min/max thừa
        if (cleanFilters.minPrice === 0 && !cleanFilters.maxPrice) delete cleanFilters.minPrice;
        if (cleanFilters.maxPrice === maxPriceValue && !cleanFilters.minPrice) delete cleanFilters.maxPrice;
        if (cleanFilters.minArea === 0 && !cleanFilters.maxArea) delete cleanFilters.minArea;
        if (cleanFilters.maxArea === maxAreaValue && !cleanFilters.minArea) delete cleanFilters.maxArea;

        // 2. Lưu lại bộ lọc vừa áp dụng
        currentAppliedFilters = { ...cleanFilters }; 
        
        // 3. GỌI HÀM loadBds TỪ FILE dsbds.js
        if (typeof loadBds === 'function') {
            loadBds(currentAppliedFilters);
        } else {
            console.error("Lỗi: Hàm loadBds() không tồn tại. Đảm bảo dsbds.js được tải trước tkbds.js.");
        }
        
        // 4. Cập nhật badge
        updateFilterCountBadge();
    }

    // --- Xử lý tìm kiếm chính ---
    $('#btnMainSearch').on('click', function() {
        const searchTerm = $('#mainSearchInput').val().trim();
        console.log('Tìm kiếm chính:', searchTerm);
        // TH1: Tìm kiếm chỉ theo từ khóa
        filterAndDisplayResults({ searchTerm: searchTerm });
    });

    $('#mainSearchInput').on('keypress', function(e) {
        if (e.which === 13) $('#btnMainSearch').click();
    });

    // --- Logic cho Dropdown "Loại nhà đất" (Nút ngoài) ---
    $('#dropdownLoaiNha').text("Loại nhà đất");
    $('.dropdown-menu a.dropdown-item').on('click', function(e) {
        e.preventDefault();
        const $selectedItem = $(this);
        currentSelectedLoaiNha = $selectedItem.data('value');
        $('#dropdownLoaiNha').text($selectedItem.text());
        $('.dropdown-menu a.dropdown-item').removeClass('active');
        $selectedItem.addClass('active');
        $('#filterLoaiBds').val(currentSelectedLoaiNha === "all" ? "" : currentSelectedLoaiNha);
    });
    $('.dropdown-menu a.dropdown-item[data-value="all"]').addClass('active');

    // --- Hàm chung để xử lý Offcanvas KHI ĐƯỢC GỌI TỪ MODAL ---
    function setupOffcanvasOptions(offcanvasId, minInputId, maxInputId, optionsContainerId, maxValue, updateModalSpanId, btnParentId, isPrice) {
        const $offcanvas = $(`#${offcanvasId}`);
        const $minInput = $(`#${minInputId}`);
        const $maxInput = $(`#${maxInputId}`);
        const $optionsContainer = $(`#${optionsContainerId}`);
        const $updateModalSpan = $(`#${updateModalSpanId}`); // Span chứa text
        const $btnParent = $(`#${btnParentId}`);         // Nút cha chứa span
        const defaultLabel = isPrice ? defaultPriceLabel : defaultAreaLabel;

        let localSelectedOptionData = {};

        function updateOffcanvasUI() {
            $optionsContainer.find('.filter-option-item').removeClass('selected');
            $minInput.val("");
            $maxInput.val("");

            if (!localSelectedOptionData || !localSelectedOptionData.label) return;

            if (localSelectedOptionData.label === "Tùy chỉnh") {
                $minInput.val(localSelectedOptionData.min === 0 ? "" : localSelectedOptionData.min);
                $maxInput.val(localSelectedOptionData.max === maxValue ? "" : localSelectedOptionData.max);
                $optionsContainer.find('.filter-option-item[data-label="Tùy chỉnh"]').addClass('selected');
            } else {
                let $selectedItem = $optionsContainer.find(`.filter-option-item[data-label="${localSelectedOptionData.label}"]`);
                if ($selectedItem.length === 0) {
                     $optionsContainer.find('.filter-option-item').each(function() {
                         const itemMin = $(this).data('min');
                         let itemMax = $(this).data('max');
                         itemMax = (itemMax === 'max' || itemMax === 'custom') ? maxValue : itemMax;
                         if (localSelectedOptionData.min == itemMin && localSelectedOptionData.max == itemMax) {
                             $selectedItem = $(this);
                             return false;
                         }
                     });
                 }
                if ($selectedItem.length) {
                    $selectedItem.addClass('selected');
                } else {
                     $optionsContainer.find(`.filter-option-item[data-label="${defaultLabel}"]`).first().addClass('selected');
                }
            }
        }

        $offcanvas.on('show.bs.offcanvas', function() {
            localSelectedOptionData = isPrice ? { ...modalSelectedPrice } : { ...modalSelectedArea };
            updateOffcanvasUI();
        });

        $optionsContainer.find('.filter-option-item').on('click', function() {
             $optionsContainer.find('.filter-option-item').removeClass('selected');
             const $item = $(this);
             $item.addClass('selected');
             let minVal = $item.data('min');
             let maxVal = $item.data('max');
             let label = $item.data('label');
             
             let actualMinVal = (minVal === 'custom') ? 0 : minVal;
             let actualMaxVal = (maxVal === 'max' || maxVal === 'custom') ? maxValue : maxVal;
             
             if (label === "Tùy chỉnh") {
                localSelectedOptionData.min = parseInt($minInput.val()) || 0;
                localSelectedOptionData.max = parseInt($maxInput.val()) || maxValue;
             } else {
                localSelectedOptionData.min = actualMinVal;
                localSelectedOptionData.max = actualMaxVal;
             }
             localSelectedOptionData.label = label;

             if (label === defaultLabel) {
                 $minInput.val("");
                 $maxInput.val("");
             } else if (label !== "Tùy chỉnh") {
                 $minInput.val(localSelectedOptionData.min === 0 ? "" : localSelectedOptionData.min);
                 $maxInput.val(localSelectedOptionData.max === maxValue ? "" : localSelectedOptionData.max);
             }
        });
        
        // ** LOGIC MỚI: Tự động chọn "Tùy chỉnh" khi gõ vào input **
        function onInputType() {
             $optionsContainer.find('.filter-option-item').removeClass('selected');
             $optionsContainer.find('.filter-option-item[data-label="Tùy chỉnh"]').addClass('selected');
             localSelectedOptionData.label = "Tùy chỉnh";
        }
        $minInput.on('input', onInputType);
        $maxInput.on('input', onInputType);

        $(`#reset${offcanvasId.replace('offcanvas', '')}`).on('click', function() {
            localSelectedOptionData = { min: 0, max: maxValue, label: defaultLabel };
            updateOffcanvasUI();
        });

        $(`#apply${offcanvasId.replace('offcanvas', '')}`).on('click', function() {
            let minVal = parseInt($minInput.val()) || 0;
            let maxVal = parseInt($maxInput.val()) || maxValue;

            if (minVal > maxVal && $maxInput.val() !== "") {
                 [minVal, maxVal] = [maxVal, minVal];
                 $minInput.val(minVal);
                 $maxInput.val(maxVal === maxValue ? "" : maxVal);
            } else if ($maxInput.val() === "") {
                maxVal = maxValue;
            }

            localSelectedOptionData.min = minVal;
            localSelectedOptionData.max = maxVal;
            const unit = isPrice ? " triệu" : " m²"; // Sửa lại đơn vị giá

            if (localSelectedOptionData.label === "Tùy chỉnh" ) {
                 if ($minInput.val() === "" && $maxInput.val() === "") {
                     localSelectedOptionData.label = defaultLabel;
                 } else {
                     let minLabel = $minInput.val() !== "" ? $minInput.val() : "Dưới ";
                     let maxLabel = $maxInput.val() !== "" ? $maxInput.val() + (isPrice ? unit : unit) : " trở lên";
                     if ($minInput.val() !== "" && $maxInput.val() !== "") {
                         localSelectedOptionData.label = `${minLabel} - ${maxLabel}`;
                     } else if ($minInput.val() === "") {
                         localSelectedOptionData.label = `Dưới ${maxLabel}`;
                     } else {
                         localSelectedOptionData.label = `Từ ${minLabel}${(isPrice ? unit : unit)} ${maxLabel}`;
                     }
                 }
            }

            // *** LOGIC CẬP NHẬT GIAO DIỆN MODAL ***
            if (isPrice) {
                modalSelectedPrice = { ...localSelectedOptionData };
            } else {
                modalSelectedArea = { ...localSelectedOptionData };
            }
            
            // Cập nhật text
            $updateModalSpan.text(localSelectedOptionData.label);
            
            // Cập nhật style (thêm/xóa class)
            if (localSelectedOptionData.label === defaultLabel) {
                $btnParent.addClass('default-value');
            } else {
                $btnParent.removeClass('default-value');
            }
            // *** KẾT THÚC LOGIC CẬP NHẬT ***

            if (typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
                 const offcanvasInstance = bootstrap.Offcanvas.getInstance($offcanvas[0]);
                 if (offcanvasInstance) offcanvasInstance.hide();
            }
        });

         $offcanvas.find('.offcanvas-header .bi-arrow-left').on('click', function() {
             if (typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
                  const offcanvasInstance = bootstrap.Offcanvas.getInstance($offcanvas[0]);
                  if (offcanvasInstance) offcanvasInstance.hide();
             }
         });
    }

    // --- Khởi tạo Offcanvas (Cho Modal) ---
    // (Thêm ID của nút cha làm tham số cuối)
    setupOffcanvasOptions(
        'offcanvasPrice', 'offcanvasMinPriceInput', 'offcanvasMaxPriceInput',
        'offcanvasPriceOptionsContainer', maxPriceValue,
        'filterModalSelectedPrice', // ID span text
        'btnModalPrice',            // ID nút cha
        true
    );
    setupOffcanvasOptions(
        'offcanvasArea', 'offcanvasMinAreaInput', 'offcanvasMaxAreaInput',
        'offcanvasAreaOptionsContainer', maxAreaValue,
        'filterModalSelectedArea', // ID span text
        'btnModalArea',            // ID nút cha
        false
    );

    // --- Logic cho Modal Lọc nâng cao ---
    $('#filterModal').on('show.bs.modal', function() {
        // Đồng bộ trạng thái TẠM THỜI từ trạng thái ĐÃ ÁP DỤNG
        modalSelectedPrice = { ...currentSelectedPrice };
        modalSelectedArea = { ...currentSelectedArea };

        // Cập nhật text
        $('#filterModalSelectedPrice').text(modalSelectedPrice.label);
        $('#filterModalSelectedArea').text(modalSelectedArea.label);

        // Cập nhật style
        $('#btnModalPrice').toggleClass('default-value', modalSelectedPrice.label === defaultPriceLabel);
        $('#btnModalArea').toggleClass('default-value', modalSelectedArea.label === defaultAreaLabel);

        $('#filterTrangThai').val(currentAppliedFilters.trangThai || "");
        $('#filterLoaiBds').val(currentAppliedFilters.loaiBds || (currentSelectedLoaiNha === "all" ? "" : currentSelectedLoaiNha));
        $('#filterViTri').val(currentAppliedFilters.viTri || "");
    });

    // Khi bấm "Áp dụng bộ lọc" (trong Modal)
    $('#applyAdvancedFilters').on('click', function() {
        const filters = {
            searchTerm: $('#mainSearchInput').val().trim(),
            trangThai: $('#filterTrangThai').val(),
            loaiBds: $('#filterLoaiBds').val(),
            minPrice: modalSelectedPrice.min,
            maxPrice: modalSelectedPrice.max,
            labelPrice: modalSelectedPrice.label, // Gửi label để hàm filterAndDisplayResults dọn dẹp
            minArea: modalSelectedArea.min,
            maxArea: modalSelectedArea.max,
            labelArea: modalSelectedArea.label, // Gửi label để hàm filterAndDisplayResults dọn dẹp
            viTri: $('#filterViTri').val().trim(),
        };

        // Cập nhật trạng thái global từ trạng thái modal
        currentSelectedPrice = { ...modalSelectedPrice };
        currentSelectedArea = { ...modalSelectedArea };
        currentSelectedLoaiNha = filters.loaiBds || 'all';

        // Cập nhật text của các nút BÊN NGOÀI
        $('#btnPriceFilterOut').text(currentSelectedPrice.label);
        $('#btnAreaFilterOut').text(currentSelectedArea.label);
        const $selectedLoaiNhaItem = $(`.dropdown-menu a.dropdown-item[data-value="${currentSelectedLoaiNha}"]`);
        if ($selectedLoaiNhaItem.length) {
            $('#dropdownLoaiNha').text($selectedLoaiNhaItem.text());
             $('.dropdown-menu a.dropdown-item').removeClass('active');
             $selectedLoaiNhaItem.addClass('active');
        } else {
             $('#dropdownLoaiNha').text("Loại nhà đất");
             $('.dropdown-menu a.dropdown-item').removeClass('active');
             $('.dropdown-menu a.dropdown-item[data-value="all"]').addClass('active');
        }

        console.log('Áp dụng bộ lọc nâng cao (Modal) - Dữ liệu JSON cuối cùng:', filters);

        // Gọi API (hàm này sẽ tự dọn dẹp JSON và cập nhật badge)
        filterAndDisplayResults(filters);

        // Đóng Modal
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modalEl = document.getElementById('filterModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        }
    });

    // Khi bấm "Đặt lại" (trong Modal)
     $('#resetAdvancedFilters').on('click', function() {
         $('#advancedFilterForm')[0].reset();
         $('#filterViTri').val('');

         modalSelectedPrice = { min: 0, max: maxPriceValue, label: defaultPriceLabel };
         modalSelectedArea = { min: 0, max: maxAreaValue, label: defaultAreaLabel };

         $('#filterModalSelectedPrice').text(defaultPriceLabel);
         $('#filterModalSelectedArea').text(defaultAreaLabel);
         
         $('#btnModalPrice').addClass('default-value');
         $('#btnModalArea').addClass('default-value');
     });

    // Xử lý các nút mở Offcanvas bên ngoài Modal
    $('#btnPriceFilterOut').on('click', function() {
         console.warn("Nút này chưa có logic riêng. Đang dùng chung Offcanvas với Modal.");
    });
    $('#btnAreaFilterOut').on('click', function() {
         console.warn("Nút này chưa có logic riêng. Đang dùng chung Offcanvas với Modal.");
    });
    
    // Đọc filter từ URL (nếu có) khi tải trang
    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
        const filtersFromUrl = Object.fromEntries(params.entries());
        console.log("Tìm thấy filters từ URL, đang tải dữ liệu:", filtersFromUrl);
        // Cần thêm logic để cập nhật UI (nút bấm, text) dựa trên filtersFromUrl
        // ...
        filterAndDisplayResults(filtersFromUrl); // Tải dữ liệu với filter từ URL
    }
    
    // Khởi tạo trạng thái ban đầu của badge
    updateFilterCountBadge();

}); // Kết thúc $(document).ready()