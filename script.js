// ==========================================
// 1. YAPILANDIRMA VE DEĞİŞKENLER
// ==========================================
const SHEET_ID = '1_rzNiHjjiacM8cIfsc5m777B96M08EW8eDDyaQmKXng';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
const IMGBB_API_KEY = 'b58dfab5d3cbb564f3ab93c8a36e93b4';

let basket = [];

// ==========================================
// 2. GOOGLE SHEETS'TEN VERİ ÇEKME
// ==========================================
async function loadServices() {
    try {
        const res = await fetch(URL);
        const text = await res.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));
        const rows = json.table.rows;
        const container = document.getElementById('services-grid');
        
        if (!container) return;
        container.innerHTML = '';

        rows.forEach((row, i) => {
            // 1. İlk satır başlık ise atla (Opsiyonel: i === 0 ise return diyebilirsin)
           // if (i === 0) return;

            // 2. HAYALET SATIR KONTROLÜ: İsim alanı boşsa kartı oluşturma
            if (!row.c[0] || !row.c[0].v || row.c[0].v.trim() === "") return;

            const name = row.c[0].v;
            const price = row.c[1] ? row.c[1].v : 0;
            const desc = row.c[2] ? row.c[2].v : "";
            let imgUrl = (row.c[3] && row.c[3].v) ? row.c[3].v : "https://placehold.co/300x200/E19F9F/ffffff?text=Nails";

            const safeName = name.replace(/'/g, "\\'");

            container.innerHTML += `
                <div class="card">
                    <img src="${imgUrl}" class="service-img" alt="${name}" 
                         onerror="this.src='https://placehold.co/300x200/E19F9F/ffffff?text=Image+Not+Found'">
                    <h3>${name}</h3>
                    <p style="font-size:0.8rem; height:40px; overflow:hidden; margin:10px 0;">${desc}</p>
                    <div class="price">£${price}</div>
                    <button class="btn" onclick="addToCart('${safeName}', ${price})">Add to Cart</button>
                </div>`;
        });
    } catch (e) {
        console.error("Yükleme hatası:", e);
        if(document.getElementById('services-grid')) {
            document.getElementById('services-grid').innerHTML = "Services currently unavailable. 🛠️";
        }
    }
}

// ==========================================
// 3. SEPET İŞLEMLERİ (ADD & REMOVE)
// ==========================================
function addToCart(name, price) {
    const item = { 
        id: '_' + Math.random().toString(36).substr(2, 9), 
        name, 
        price 
    };
    basket.push(item);
    updateUI();
}

function removeFromCart(id) {
    basket = basket.filter(item => item.id !== id);
    updateUI();
}

function updateUI() {
    const list = document.getElementById('cart-items');
    const totalPriceDisplay = document.getElementById('total-price');
    const hiddenServices = document.getElementById('hidden-services');
    const hiddenTotal = document.getElementById('hidden-total');
    
    let total = 0;

    if (!list) return;

    if (basket.length === 0) {
        list.innerHTML = '<p class="empty-msg">Bag is empty.</p>';
    } else {
        list.innerHTML = basket.map(item => {
            total += item.price;
            return `
                <div class="cart-item">
                    <span>${item.name}</span>
                    <span>£${item.price} <i class="fas fa-times-circle remove-item" style="cursor:pointer; color:#E19F9F;" onclick="removeFromCart('${item.id}')"></i></span>
                </div>
            `;
        }).join('');
    }

    if(totalPriceDisplay) totalPriceDisplay.innerText = total;
    
    // Gizli inputları form gönderimi için hazır tut
    if(hiddenServices) hiddenServices.value = basket.map(i => `${i.name} (£${i.price})`).join(", ");
    if(hiddenTotal) hiddenTotal.value = "£" + total;
}

// ==========================================
// 4. FİNAL FORM GÖNDERİMİ (ImgBB + Formspree)
// ==========================================
const orderForm = document.getElementById('nail-form');

if (orderForm) {
    orderForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (basket.length === 0) {
            alert("Please add a service to your bag first! 💅");
            return;
        }

        const btn = document.getElementById('send-btn');
        const photoInput = document.getElementById('photo');
        const hiddenPhotoUrl = document.getElementById('hidden-photo-url');
        
        btn.innerText = "Processing... 📸";
        btn.disabled = true;

        try {
            // A: Fotoğrafı ImgBB'ye Yükle
            if (photoInput && photoInput.files[0]) {
                btn.innerText = "Uploading Photo... 📸";
                const imgFormData = new FormData();
                imgFormData.append("image", photoInput.files[0]);

                const imgResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: "POST",
                    body: imgFormData
                });
                const imgResult = await imgResponse.json();
                
                if (imgResult.success) {
                    hiddenPhotoUrl.value = imgResult.data.url;
                }
            } else {
                hiddenPhotoUrl.value = "No photo provided";
            }

            // B: Formspree'ye Gönder
            btn.innerText = "Sending Order... ✨";
            const formData = new FormData(orderForm);
            const data = Object.fromEntries(formData.entries());

            const response = await fetch(orderForm.action, {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                alert("Order sent to Sude! ✨ Sude will contact you soon.");
                basket = []; 
                updateUI();
                orderForm.reset();
            } else {
                alert("Submission failed. Please check your form.");
            }

        } catch (error) {
            console.error("System error:", error);
            alert("An error occurred. Please try again.");
        } finally {
            btn.disabled = false;
            btn.innerText = "Confirm & Send Order ✨";
        }
    });
}

// ==========================================
// 5. RESİM ÖNİZLEME (MODAL)
// ==========================================
function openModal(imgSrc) {
    const modal = document.getElementById('imageModal');
    const fullImg = document.getElementById('fullImage');
    
    if (modal && fullImg) {
        modal.style.display = "flex";
        fullImg.src = imgSrc;
        document.body.style.overflow = "hidden"; // Kaydırmayı durdur
    }
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto"; // Kaydırmayı aç
    }
}

// Global Tıklama Dinleyicisi (Modal & Resimler)
document.addEventListener('click', function(e) {
    // Resim açma
    if (e.target && e.target.classList.contains('service-img')) {
        openModal(e.target.src);
    }

    // Modal kapatma (Çarpı veya Arka Plan)
    const modal = document.getElementById('imageModal');
    if (e.target && (e.target.classList.contains('close-modal') || e.target === modal)) {
        closeModal();
    }
});

// ESC ile kapatma
document.addEventListener('keydown', function(e) {
    if (e.key === "Escape") closeModal();
});

// ==========================================
// 6. BAŞLATMA
// ==========================================
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;

window.onload = () => {
    loadServices();
    
    if (typeof Swiper !== 'undefined') {
        new Swiper(".mySwiper", {
            loop: true,
            pagination: { el: ".swiper-pagination", clickable: true },
            autoplay: { delay: 3000, disableOnInteraction: false },
        });
    }
};