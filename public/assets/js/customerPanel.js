class CustomerPanelApp {
  constructor(bootstrap) {
    this.data = Array.isArray(bootstrap.data) ? bootstrap.data : [];
    this.devices = bootstrap.devices || {};
    this.fetchDatabasePath = bootstrap.fetchDatabasePath || {};
    this.input = document.getElementById("searchInput");
    this.resultContainer = document.getElementById("resultContainer");
    this.noteToggle = document.getElementById("noteToggle");
    this.fetchBtn = document.getElementById("fetchBtn");

    this.currentFilteredData = [];
    this.allData = this.data.filter((item) =>
      Array.isArray(item.cart)
        ? item.cart.length > 0
        : (item.cart_count || 0) > 0
    );
    this.clickTimer = null;
  }

  init() {
    this.bindUI();
    this.installSwipeDismiss("#detailModal");
    this.installSwipeDismiss("#deviceModal");
    this.resultContainer.innerHTML = "<p><em>Không có kết quả</em></p>";
  }

  bindUI() {
    this.input.addEventListener("input", () => this.applyFilter());
    this.noteToggle.addEventListener("click", () => {
      // Khi bật/tắt note toggle, reset input search về trống
      this.input.value = "";
      
      this.noteToggle.classList.toggle("active");
      this.noteToggle.setAttribute(
        "aria-pressed",
        this.noteToggle.classList.contains("active")
      );
      this.applyFilter();
    });
    if (this.fetchBtn) {
      this.fetchBtn.addEventListener("click", () => this.refreshData());
    }
    // Close on backdrop click
    window.addEventListener("click", (event) => {
      const detailModal = document.getElementById("detailModal");
      const deviceModal = document.getElementById("deviceModal");
      if (event.target === detailModal) detailModal.style.display = "none";
      if (event.target === deviceModal) deviceModal.style.display = "none";
    });
    // Close buttons
    document.querySelectorAll("#detailModal .close").forEach((el) =>
      el.addEventListener("click", () => {
        document.getElementById("detailModal").style.display = "none";
        document.body.style.overflow = ""; 
      })
    );
    document.querySelectorAll("#deviceModal .close").forEach((el) =>
      el.addEventListener("click", () => {
        document.getElementById("deviceModal").style.display = "none";
      })
    );
  }

  mapVpsLabel(vpsType) {
    const map = {
      "80v4 đơn": "I",
      "86v4 đơn": "II",
      "80v4 dual": "III",
      "86v4 dual": "IV",
      "96v4 dual": "V",
    };
    return map[vpsType] ? `${vpsType} (${map[vpsType]})` : vpsType;
  }

  renderInfo(items) {
    if (!items || items.length === 0) {
      this.resultContainer.innerHTML = "<p><em>Không có kết quả</em></p>";
      this.currentFilteredData = [];
      return;
    }
    this.currentFilteredData = items;
    const header = `
            <thead>
                <tr>
                    <th class="mobile-only">Tên hiển thị</th>
                    <th class="mobile-only">Password</th>
                    <th class="mobile-only">Máy thuê/mua</th>
                    <th class="desktop-only">Username</th>
                    <th class="desktop-only">Tên hiển thị</th>
                    <th class="desktop-only">Password</th>
                    <th class="desktop-only">Máy thuê/mua</th>
                    <th class="desktop-only">VPS</th>
                    <th class="desktop-only">Đến hạn</th>
                    <th class="desktop-only">Trạng Thái</th>
                    <th class="desktop-only">Ghi Chú</th>
                </tr>
            </thead>`;
    const body = items
      .map(
        (item, idx) => `
            <tr class="${item.note ? "row-with-note" : ""} ${
          item.status == "Máy mua" ? "row-with-buyer" : ""
        } mobile-clickable desktop-clickable" data-index="${idx}">
                <td class="mobile-only">${item.display_name}</td>
                <td class="mobile-only clickable" data-copy="${
                  item.password
                }">${item.password}</td>
                <td class="mobile-only machine-column">${item.cart
                  .slice()
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((cartNum) => {
                    const firstDigit = cartNum.charAt(0);
                    const host = `tpserver${firstDigit}.drayddns.com:${cartNum}`;
                    return `<span class="clickable" data-device-host="${host}" data-cart="${cartNum}">${cartNum}</span>`;
                  })
                  .join("")} (${item.cart_count})</td>
                <td class="desktop-only">${item.username}</td>
                <td class="desktop-only">${item.display_name}</td>
                <td class="desktop-only clickable" data-copy="${
                  item.password
                }">${item.password}</td>
                <td class="desktop-only machine-column">${item.cart
                  .slice()
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((cartNum) => {
                    const firstDigit = cartNum.charAt(0);
                    const host = `tpserver${firstDigit}.drayddns.com:${cartNum}`;
                    return `<span class="clickable" data-device-host="${host}" data-cart="${cartNum}">${cartNum}</span>`;
                  })
                  .join("")} (${item.cart_count})</td>
                <td class="desktop-only">${this.mapVpsLabel(item.vps)}</td>
                <td class="desktop-only">${item.expired_hour_at || "--"} ${
          item.expired_day_at
        }</td>
                <td class="desktop-only">${item.status}</td>
                <td class="desktop-only">${item.note || "(không)"}</td>
            </tr>
        `
      )
      .join("");
    this.resultContainer.innerHTML = `<table class="mobile-table">${header}<tbody>${body}</tbody></table>`;
    this.bindResultInteractions();
  }

  bindResultInteractions() {
    this.resultContainer.querySelectorAll("tr").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (!(e.target instanceof HTMLElement)) return;
        if (!e.target.classList.contains("clickable")) {
          const index = parseInt(row.getAttribute("data-index"), 10);
          this.showDetails(index);
        }
      });
      // Prevent browser default double-tap zoom on row
      row.addEventListener("dblclick", (e) => e.preventDefault());
    });
    this.resultContainer.querySelectorAll("[data-copy]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        this.copyWithFeedback(e, el.getAttribute("data-copy"));
      });
    });
    this.resultContainer
      .querySelectorAll("[data-device-host]")
      .forEach((el) => {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const host = el.getAttribute("data-device-host");
          const cart = el.getAttribute("data-cart");
          this.copyWithFeedback(e, host, "device", cart);
        });
      });
  }

  copyWithFeedback(event, text, popupType = null, cartNumber = null) {
    if (this.clickTimer) {
      if (popupType === "device" && cartNumber !== null) {
        clearTimeout(this.clickTimer);
        this.clickTimer = null;
        this.showDeviceModal(this.devices[cartNumber]);
      }
    } else {
      this.clickTimer = setTimeout(() => {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            const original = event.target.textContent;
            event.target.textContent = "Copied!";
            event.target.classList.add("copied");
            setTimeout(() => {
              event.target.textContent = original;
              event.target.classList.remove("copied");
            }, 1000);
          })
          .catch(console.error);
        this.clickTimer = null;
      }, 250);
    }
  }

  showDetails(index) {
    const item = this.currentFilteredData[index];
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML = `
            <h2>Chi tiết máy ${item.status == "Máy mua" ? "mua" : "thuê"}</h2>
            <p><strong>Tên hiển thị:</strong> ${item.display_name}</p>
            <p><strong>Username:</strong> ${item.username}</p>
            <p><strong>Password:</strong> <span class="clickable" id="copyPass">${
              item.password
            }</span></p>
            <p><strong>Máy ${
              item.status == "Máy mua" ? "mua" : "thuê"
            }:</strong> ${item.cart
      .slice()
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((cartNum) => {
        const firstDigit = cartNum.charAt(0);
        const host = `tpserver${firstDigit}.drayddns.com:${cartNum}`;
        return `<span class="clickable" data-device-host="${host}" data-cart="${cartNum}">${cartNum}</span>`;
      })
      .join(", ")}</p>
            <p><strong>VPS:</strong> ${this.mapVpsLabel(item.vps)}</p>
            <p><strong>Giờ Hết Hạn:</strong> ${item.expired_hour_at || "--"}</p>
            <p><strong>Ngày Hết Hạn:</strong> ${item.expired_day_at || "--"}</p>
            <p style="${
              item.status == "Máy mua" ? "color: #00cfff" : ""
            }"><strong>Trạng Thái:</strong> ${item.status}</p>
            <p><strong>Ghi Chú:</strong> ${item.note || "(không)"}</p>
        `;
    const passEl = modalContent.querySelector("#copyPass");
    if (passEl)
      passEl.addEventListener("click", (e) =>
        this.copyWithFeedback(e, item.password)
      );
    modalContent.querySelectorAll("[data-device-host]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const host = el.getAttribute("data-device-host");
        const cart = el.getAttribute("data-cart");
        this.copyWithFeedback(e, host, "device", cart);
      });
    });
    document.getElementById("detailModal").style.display = "block";
    document.body.style.overflow = "hidden";
  }

  showDeviceModal(device) {
    const deviceContent = document.getElementById("deviceContent");
    deviceContent.innerHTML = `
            <h2>Cấu hình ${device.location || "--"}</h2>
            <table style="width:100%; border-collapse:collapse;">
                <tr>
                    <td><strong>Main:</strong></td><td colspan="3">${
                      device.main || "--"
                    }</td>
                </tr>
                <tr>
                    <td><strong>Chip:</strong></td><td colspan="3">${
                      device.chip || "--"
                    }</td>
                </tr>
                <tr>
                    <td><strong>VGA:</strong></td><td colspan="3">${
                      device.vga || "--"
                    }</td>
                </tr>
                <tr>
                    <td><strong>RAM:</strong></td><td colspan="3">${
                      device.ram_capacity || "--"
                    } (${device.ram_details || "--"})</td>
                </tr>
                <tr>
                    <td><strong>Ổ cứng:</strong></td><td colspan="3">${
                      device.disk || "--"
                    }</td>
                </tr>
                <tr>
                    <td><strong>Nguồn:</strong></td>
                    <td colspan="3">
                        <span>${device.power || "--"}</span>
                        <span style="float: right; color: #0066cc; cursor: pointer; text-decoration: underline;" 
                              class="clickable" 
                              data-copy="${this.formatDeviceNotice(device.chip || "", device.main || "")}">
                            Thông báo máy
                        </span>
                    </td>
                </tr>
            </table>
        `;
    
    // Thêm event listener cho "Thông báo máy" để copy clipboard
    const noticeEl = deviceContent.querySelector("[data-copy]");
    if (noticeEl) {
      noticeEl.addEventListener("click", (e) => {
        const text = e.target.getAttribute("data-copy");
        this.copyWithFeedback(e, text);
      });
    }
    
    document.getElementById("deviceModal").style.display = "block";
  }

  installSwipeDismiss(selector) {
    const modal = document.querySelector(selector);
    if (!modal) return;
    const content = modal.querySelector(".modal-content");
    const THRESHOLD = 100;
    let startY = null;
    let lastY = null;
    modal.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches || e.touches.length === 0) return;
        const touch = e.touches[0];
        startY = touch.clientY;
        lastY = startY;
      },
      { passive: true }
    );
    modal.addEventListener(
      "touchmove",
      (e) => {
        if (!e.touches || startY === null) return;
        lastY = e.touches[0].clientY;
      },
      { passive: true }
    );
    modal.addEventListener("touchend", () => {
      if (startY === null || lastY === null) {
        startY = null;
        lastY = null;
        return;
      }
      const deltaY = startY - lastY;
      const isSwipeUp = deltaY > THRESHOLD;
      if (isSwipeUp) {
        modal.classList.add("swipe-dismiss");
        const onAnimEnd = () => {
          modal.removeEventListener("animationend", onAnimEnd);
          modal.style.display = "none";
          modal.classList.remove("swipe-dismiss");
        };
        modal.addEventListener("animationend", onAnimEnd);
      }
      startY = null;
      lastY = null;
    });
  }

  async refreshData() {
    try {
      this.fetchBtn.textContent = "🔄 Đang tải...";
      this.fetchBtn.disabled = true;
      const [newDataJson, newDeviceJson] = await Promise.all([
        fetch(this.fetchDatabasePath + "/fetch_data.php").then((r) => r.json()),
        fetch(this.fetchDatabasePath + "/fetch_device_data.php").then((r) =>
          r.json()
        ),
      ]);
      this.data = Array.isArray(newDataJson) ? newDataJson : [];
      this.devices = newDeviceJson || {};
      this.allData = this.data.filter((item) =>
        Array.isArray(item.cart)
          ? item.cart.length > 0
          : (item.cart_count || 0) > 0
      );
      this.applyFilter();
      this.fetchBtn.textContent = "✅ Đã cập nhật!";
      setTimeout(() => {
        this.fetchBtn.textContent = "🔄 Làm mới";
      }, 2000);
    } catch (e) {
      console.error("Error fetching data:", e);
      this.fetchBtn.textContent = "❌ Lỗi!";
      setTimeout(() => {
        this.fetchBtn.textContent = "🔄 Làm mới";
      }, 2000);
    } finally {
      this.fetchBtn.disabled = false;
    }
  }

  applyFilter() {
    const val = this.input.value.trim();
    const onlyNotes = this.noteToggle.classList.contains("active");
    
    if (!onlyNotes && !val) {
      this.resultContainer.innerHTML = "<p><em>Không có kết quả</em></p>";
      this.currentFilteredData = [];
      return;
    }
    
    let base = this.allData;
    if (onlyNotes) base = base.filter((item) => !!item.note);
    
    let foundList = base;
    
    if (val) {
      // Kiểm tra xem search có phải là định dạng số được phân tách không
      const numberPattern = /^[\d\s,.;]+$/;
      
      if (numberPattern.test(val)) {
        // Xử lý tìm kiếm theo nhiều máy
        const machineNumbers = val
          .replace(/[.,;]/g, ' ') // Thay dấu phẩy, chấm, chấm phẩy thành dấu cách
          .split(/\s+/) // Tách theo dấu cách (1 hoặc nhiều dấu cách)
          .filter(num => num.trim() !== '') // Loại bỏ chuỗi rỗng
          .map(num => num.trim()); // Trim từng số
        
        if (machineNumbers.length > 0) {
          // Tìm kiếm theo danh sách máy
          foundList = base.filter((item) => {
            if (!Array.isArray(item.cart)) return false;
            
            return item.cart.some((cartItem) => {
              const cartStr = (cartItem || "").toLowerCase();
              return machineNumbers.some(num => cartStr.includes(num));
            });
          });
        }
      } else {
        // Tìm kiếm theo text thông thường
        const valLower = val.toLowerCase();
        foundList = base.filter(
          (item) =>
            (Array.isArray(item.cart) &&
              item.cart.some((c) => (c || "").toLowerCase().includes(valLower))) ||
            (item.username && item.username.toLowerCase().includes(valLower)) ||
            (item.display_name && item.display_name.toLowerCase().includes(valLower))
        );
      }
    }
    
    this.renderInfo(foundList);
  }

  formatDeviceNotice(chip, main) {
    if (!chip) return "";
    
    const chipLast4 = chip.slice(-4);
    const mainLower = (main || "").trim().toLowerCase();
    
    // Logic format theo yêu cầu
    if (/x10/i.test(mainLower)) {
      return `X10X99 ${chipLast4} dual`;
    }
    if (/f8d/i.test(mainLower)) {
      return `F8D ${chipLast4} dual`;
    }
    if (/oem/i.test(mainLower)) {
      return `OEM ${chipLast4} dual`;
    }
    if (/đơn/i.test(mainLower)) {
      if (/td4/i.test(mainLower)) {
        return `TD4 ${chipLast4} đơn`;
      } else if (/tfq/i.test(mainLower)) {
        return `TFQ ${chipLast4} đơn`;
      } else {
        return `HD4 ${chipLast4} đơn`;
      }
    }
    
    // Fallback: chip dual
    return `${chipLast4} dual`;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const bootstrap = window.bootstrapCustomer || { data: [], devices: {} };
  new CustomerPanelApp(bootstrap).init();
});
