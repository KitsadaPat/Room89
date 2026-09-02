/* =========================================================
   script.js
   ใช้ร่วมกันทุกหน้า: product.html, order.html, admin.html
   สคริปต์จะตรวจสอบเองว่าหน้าปัจจุบันมี element ที่เกี่ยวข้องหรือไม่
   แล้วรัน initializer ของหน้านั้น ๆ โดยอัตโนมัติ
   ========================================================= */

/* ---------------------------------------------------------
   CONFIG: แก้ 2 ค่านี้ให้เป็นของจริงก่อนใช้งาน
   --------------------------------------------------------- */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxFyNvmM9o5Ppf8ZhUwoeG4wM0y8SLRIciVCGmfQgU1bWwghQWi8bD8dKosNBueAV7E9Q/exec';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQtGlMfoIWM_UEpeb2pTNGABydpvuxjDUUimQlZv5PlSnZy2uxCa-YGpktsAXMwZk_LuDD7FT12hvtW/pub?gid=0&single=true&output=csv';

/* mood ที่รองรับ (ปุ่มกรองในหน้า product.html) */
const MOOD_LIST = ['ทั้งหมด', 'Fresh', 'Relax', 'Focus', 'Romance'];

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('product-list')) {
    initProductPage();
  }
  if (document.getElementById('orderForm')) {
    initOrderPage();
  }
  if (document.querySelector('#ordersTable tbody')) {
    initAdminPage();
  }
});

/* =========================================================
   1) PRODUCT PAGE (product.html)
   ต้องการ: #filter-bar, #product-list
   ========================================================= */
function initProductPage() {
  const filterBar = document.getElementById('filter-bar');
  const productList = document.getElementById('product-list');

  let allProducts = [];

  // อ่าน mood จาก URL parameter เช่น product.html?mood=Fresh
  const urlParams = new URLSearchParams(window.location.search);
  const initialMood = urlParams.get('mood') || 'ทั้งหมด';

  fetch('products.json')
    .then((res) => res.json())
    .then((data) => {
      allProducts = data;
      renderFilterBar(filterBar, initialMood, (mood) => {
        renderProducts(productList, filterProducts(allProducts, mood));
      });
      renderProducts(productList, filterProducts(allProducts, initialMood));
    })
    .catch((error) => {
      console.error(error);
      productList.innerHTML = '<p>ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง</p>';
    });
}

// สร้างปุ่มกรอง mood
function renderFilterBar(container, activeMood, onSelect) {
  container.innerHTML = '';
  MOOD_LIST.forEach((mood) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = mood;
    btn.dataset.mood = mood;
    btn.className = 'filter-btn' + (mood === activeMood ? ' active' : '');

    btn.addEventListener('click', () => {
      // อัปเดตปุ่ม active
      container.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // อัปเดต URL parameter โดยไม่ reload หน้า
      const params = new URLSearchParams(window.location.search);
      if (mood === 'ทั้งหมด') {
        params.delete('mood');
      } else {
        params.set('mood', mood);
      }
      const newUrl =
        window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);

      onSelect(mood);
    });

    container.appendChild(btn);
  });
}

// กรองสินค้าตาม mood ที่เลือก (รองรับกรณี product.mood เป็น string หรือ array)
function filterProducts(products, mood) {
  if (!mood || mood === 'ทั้งหมด') return products;
  return products.filter((p) => {
    if (Array.isArray(p.mood)) {
      return p.mood.includes(mood);
    }
    return p.mood === mood;
  });
}

// วาดการ์ดสินค้า
function renderProducts(container, products) {
  container.innerHTML = '';

  if (!products || products.length === 0) {
    container.innerHTML = '<p>ไม่พบสินค้าในหมวดนี้</p>';
    return;
  }

  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    card.appendChild(img);

    const name = document.createElement('h3');
    name.textContent = product.name;
    card.appendChild(name);

    const size = document.createElement('p');
    size.className = 'product-size';
    size.textContent = product.size;
    card.appendChild(size);

    const price = document.createElement('p');
    price.className = 'product-price';
    price.textContent = product.price + ' บาท';
    card.appendChild(price);

    const orderBtn = document.createElement('a');
    orderBtn.className = 'order-btn';
    orderBtn.textContent = 'สั่งซื้อ';
    const params = new URLSearchParams();
    params.set('item', product.name);
    params.set('price', product.price);
    orderBtn.href = 'order.html?' + params.toString();
    card.appendChild(orderBtn);

    container.appendChild(card);
  });
}

/* =========================================================
   2) ORDER PAGE (order.html)
   ต้องการ: #orderForm, #customerName, #contact, #items, #total, #note
   ========================================================= */
function initOrderPage() {
  const form = document.getElementById('orderForm');
  const itemsField = document.getElementById('items');
  const totalField = document.getElementById('total');

  // อ่านค่า item และ price จาก URL parameter แล้วเติมลงฟอร์มทันที
  const params = new URLSearchParams(window.location.search);
  const item = params.get('item');
  const price = params.get('price');

  if (item !== null) {
    itemsField.value = item;
  }
  if (price !== null) {
    totalField.value = price; // ห้ามลืมเติมช่องนี้เด็ดขาด
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const payload = {
      customerName: document.getElementById('customerName').value,
      contact: document.getElementById('contact').value,
      items: document.getElementById('items').value,
      total: document.getElementById('total').value,
      note: document.getElementById('note').value,
    };

    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then(() => {
        window.location.href = 'thankyou.html';
      })
      .catch((error) => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      });
  });
}

/* =========================================================
   3) ADMIN PAGE (admin.html)
   ต้องการ: #ordersTable tbody
   ดึง CSV จาก CSV_URL แล้ว parse เอง (ไม่ใช้ library ภายนอก)
   ========================================================= */
function initAdminPage() {
  const tbody = document.querySelector('#ordersTable tbody');

  fetch(CSV_URL)
    .then((res) => res.text())
    .then((csvText) => {
      const rows = parseCSV(csvText);
      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">ไม่มีข้อมูล</td></tr>';
        return;
      }

      // แถวแรกเป็น header: [timestamp, customerName, contact, items, total, note]
      const header = rows[0];
      const dataRows = rows.slice(1).filter((r) => r.length > 1 || r[0] !== '');

      // เรียงจากล่าสุดขึ้นก่อน โดยอิงคอลัมน์แรก (วันเวลา)
      dataRows.sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateB - dateA;
      });

      renderOrdersTable(tbody, dataRows);
    })
    .catch((error) => {
      console.error(error);
      tbody.innerHTML = '<tr><td colspan="6">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</td></tr>';
    });
}

// วาดตารางคำสั่งซื้อ
function renderOrdersTable(tbody, rows) {
  tbody.innerHTML = '';
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    // คอลัมน์: วันเวลา, ชื่อลูกค้า, เบอร์โทร/Line, รายการสินค้า, จำนวนเงินรวม, หมายเหตุ
    for (let i = 0; i < 6; i++) {
      const td = document.createElement('td');
      td.textContent = row[i] !== undefined ? row[i] : '';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
}

// ฟังก์ชัน parse CSV แบบไม่พึ่ง library ภายนอก
// รองรับ: field ที่ครอบด้วย double quote, comma ภายใน quote, quote คู่ ("") ที่หมายถึง " ตัวเดียว, และ newline ภายใน quote
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  // normalize line endings
  const str = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const nextChar = str[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        i++; // ข้าม quote ตัวที่สอง
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
  }

  // เก็บ field/row สุดท้ายถ้ายังไม่ได้ push (ไฟล์ไม่ได้ลงท้ายด้วย newline)
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
