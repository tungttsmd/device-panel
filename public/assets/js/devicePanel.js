class DeviceFormatter {
  static formatNotice(chipStr, mainStr = "") {
    if (!chipStr) return "";
    const chip = chipStr.slice(-4);
    const main = (mainStr || "").trim().toLowerCase();
    if (/x10/i.test(main)) return "X10X99";
    if (/f8d/i.test(main)) return "F8D";
    if (/oem/i.test(main)) return "OEM";
    if (/td4/i.test(main)) return "TD4";
    if (/đơn/i.test(main)) return "HD4";
    return `${chip} dual`;
  }
}

class DeviceStateStore {
  constructor(buyers) {
    this.notesByLocation = {};
    this.stateByLocation = {};
    this.buyers = Array.isArray(buyers) ? buyers : [];
  }
  getState(location) {
    return this.stateByLocation[location] || "inactive";
  }
  setState(location, state) {
    this.stateByLocation[location] = state;
  }
  setNote(location, text) {
    this.notesByLocation[location] = text;
  }
  getNote(location) {
    return this.notesByLocation[location] || "";
  }
  clearNote(location) {
    delete this.notesByLocation[location];
  }
  isNoted(location) {
    return !!this.notesByLocation[location];
  }
  isBought(location) {
    return this.buyers.some(
      (b) => Array.isArray(b.cart) && b.cart.includes(location)
    );
  }
}

class DeviceRenderer {
  constructor(containerId, stateStore, formatter) {
    this.container = document.getElementById(containerId);
    this.stateStore = stateStore;
    this.formatter = formatter;
  }
  render(devices) {
    this.container.innerHTML = "";
    devices.forEach((device) => this.#renderRow(device));
  }
  #renderRow(device) {
    const state = this.stateStore.getState(device.location);
    const isBought = this.stateStore.isBought(device.location);
    const row = document.createElement("div");
    row.classList.add("device-row");
    if (isBought) row.classList.add("row-with-buyer");
    row.innerHTML = `
            <div class="device-cell" data-location="${
              device.location
            }" data-state="${state}">
                <p>
                    <strong>${device.location}</strong>
                    <strong style='float:right'>${device.chip || "--"}</strong>
                </p>
                <p>${this.formatter.formatNotice(
                  device.chip || "--",
                  device.main || "--"
                )} || ${device.vga || "--"} || ${device.disk || "--"}</p>
                <p>${device.ram_capacity || "--"} (${
      device.ram_details || "--"
    }) || ${device.power || "--"}</p>
            </div>
        `;
    const cell = row.querySelector(".device-cell");
    const applyState = (newState) => {
      cell.dataset.state = newState;
      this.stateStore.setState(device.location, newState);
      cell.classList.remove("active", "note");
      const oldInput = cell.querySelector(".note-input");
      if (oldInput) oldInput.remove();
      switch (newState) {
        case "inactive":
          row.classList.remove("no-border");
          this.stateStore.clearNote(device.location);
          break;
        case "active":
          cell.classList.add("active");
          row.classList.add("no-border");
          break;
        case "note":
          cell.classList.add("note");
          row.classList.add("no-border");
          this.stateStore.setState(device.location, "note"); // <-- thêm dòng này để lưu
          const input = document.createElement("textarea");
          input.classList.add("note-input");
          input.placeholder = "Nhập ghi chú cho " + device.location;
          input.value = this.stateStore.getNote(device.location);
          [
            "click",
            "mousedown",
            "mouseup",
            "touchstart",
            "touchend",
            "touchcancel",
          ].forEach((evt) =>
            input.addEventListener(evt, (e) => e.stopPropagation())
          );
          input.addEventListener("input", (ev) =>
            this.stateStore.setNote(device.location, ev.target.value)
          );
          cell.appendChild(input);
          input.focus();
          break;
      }
    };
    cell.addEventListener("click", () => {
      if (cell.suppressClickUntil && Date.now() < cell.suppressClickUntil)
        return;
      if (cell.dataset.state === "inactive") applyState("active");
    });
    cell.addEventListener("dblclick", () => {
      if (cell.dataset.state === "active" || cell.dataset.state === "note")
        applyState("inactive");
    });
    cell.addEventListener("mousedown", () => {
      cell.holdTimeout = setTimeout(() => {
        if (cell.dataset.state !== "note") applyState("note");
      }, 500);
    });
    cell.addEventListener("mouseup", () => clearTimeout(cell.holdTimeout));
    cell.addEventListener("mouseleave", () => clearTimeout(cell.holdTimeout));
    let lastTap = 0,
      startX = 0,
      startY = 0,
      hasMoved = false;
    cell.addEventListener("touchstart", (e) => {
      if (e.target.tagName === "TEXTAREA") return;
      const t = e.touches && e.touches[0];
      startX = t ? t.clientX : 0;
      startY = t ? t.clientY : 0;
      hasMoved = false;
      cell.holdTimeout = setTimeout(() => {
        if (cell.dataset.state !== "note") applyState("note");
      }, 500);
    });
    cell.addEventListener(
      "touchmove",
      (e) => {
        if (e.target.tagName === "TEXTAREA") return;
        const t = e.touches && e.touches[0];
        if (!t) return;
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (!hasMoved && dx * dx + dy * dy > 100) {
          hasMoved = true;
          clearTimeout(cell.holdTimeout);
        }
      },
      { passive: true }
    );
    cell.addEventListener("touchend", (e) => {
      if (e?.target?.tagName === "TEXTAREA") return;
      clearTimeout(cell.holdTimeout);
      if (hasMoved) {
        cell.suppressClickUntil = Date.now() + 400;
        return;
      }
      const current = Date.now();
      const tapLength = current - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        if (cell.dataset.state === "active" || cell.dataset.state === "note")
          applyState("inactive");
      } else {
        if (cell.dataset.state === "inactive") applyState("active");
      }
      lastTap = current;
    });
    cell.addEventListener("touchcancel", () => clearTimeout(cell.holdTimeout));
    if (state === "note") applyState("note");
    if (state === "active") applyState("active");
    this.container.appendChild(row);
  }
}

class FilterController {
  constructor(allDevices, renderer, stateStore) {
    this.allDevices = Object.values(allDevices || {});
    this.renderer = renderer;
    this.stateStore = stateStore;
    this.searchInput = document.getElementById("searchInput");
    this.serverSelect = document.getElementById("serverSelect");
    this.noteToggle = document.getElementById("noteToggle");
    this.#bindUI();
  }
  
  #bindUI() {
    this.searchInput.addEventListener("input", () => this.applyFilter());
    this.serverSelect.addEventListener("change", () => this.applyFilter());
    this.noteToggle.addEventListener("click", () => {
      // Khi bật/tắt note toggle, đưa dropdown về "Tất cả" và search về trống
      this.serverSelect.value = "all";
      this.searchInput.value = "";
      
      this.noteToggle.classList.toggle("active");
      this.noteToggle.setAttribute(
        "aria-pressed",
        this.noteToggle.classList.contains("active")
      );
      this.applyFilter();
    });
  }
  
  applyFilter() {
    const prefix = this.serverSelect.value || "all";
    const onlyNotes = this.noteToggle.classList.contains("active");
    const search = (this.searchInput.value || "").trim();
    const hasSearch = search.length > 0;
    
    let list = this.allDevices;
    
    // Lọc theo note trước (nếu được bật)
    if (onlyNotes) {
      list = list.filter(
        (d) => this.stateStore.getState(d.location) === "note"
      );
      
      // Sau đó vẫn lọc theo dropdown server (nếu không phải "Tất cả")
      if (prefix !== "all") {
        list = list.filter((d) => (d.location || "").startsWith(prefix));
      }
    } else {
      // Khi không bật note toggle, chỉ lọc theo dropdown server
      if (prefix !== "all") {
        list = list.filter((d) => (d.location || "").startsWith(prefix));
      }
    }
    
    // Cuối cùng lọc theo search input
    if (hasSearch) {
      // Kiểm tra xem search có phải là định dạng số được phân tách không
      const numberPattern = /^[\d\s,.;]+$/;
      
      if (numberPattern.test(search)) {
        // Xử lý tìm kiếm theo nhiều máy
        const machineNumbers = search
          .replace(/[.,;]/g, ' ') // Thay dấu phẩy, chấm, chấm phẩy thành dấu cách
          .split(/\s+/) // Tách theo dấu cách (1 hoặc nhiều dấu cách)
          .filter(num => num.trim() !== '') // Loại bỏ chuỗi rỗng
          .map(num => num.trim()); // Trim từng số
        
        if (machineNumbers.length > 0) {
          // Tìm kiếm theo danh sách máy
          list = list.filter((d) => {
            const location = d.location || "";
            return machineNumbers.some(num => location.includes(num));
          });
        }
      } else {
        // Tìm kiếm theo text thông thường
        const searchLower = search.toLowerCase();
        list = list.filter((d) =>
          (d.location || "").toLowerCase().includes(searchLower)
        );
      }
    }
    
    this.renderer.render(list);
  }
}

class App {
  constructor(devices, buyers) {
    this.stateStore = new DeviceStateStore(buyers);
    this.renderer = new DeviceRenderer(
      "resultContainer",
      this.stateStore,
      DeviceFormatter
    );
    this.filter = new FilterController(devices, this.renderer, this.stateStore);
  }
  init() {
    this.renderer.render(Object.values(window.bootstrapDevice?.devices || {}));
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const bootstrap = window.bootstrapDevice || { devices: {}, buyers: [] };
  new App(bootstrap.devices, bootstrap.buyers).init();
});
