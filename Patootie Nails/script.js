// 1. Yapılandırma
const SHEET_ID = '1_rzNiHjjiacM8cIfsc5m777B96M08EW8eDDyaQmKXng';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

let basket = [];





// 2. Google Sheets'ten Veri Çekme
//async function loadServices() {
  //  try {
   //     const res = await fetch(URL);
   //     const text = await res.text();
        // Google'ın JSON formatındaki gereksiz başlığı temizliyoruz
      //  const json = JSON.parse(text.substr(47).slice(0, -2));
      //  const rows = json.table.rows;
        
    //    const container = document.getElementById('services-grid');
    //    if (!container) return;
        
     //   container.innerHTML = '';
//
     //   rows.forEach((row, i) => {
        //    if(i === 0) return; // Başlık satırını atla
            
        //   const name = row.c[0] ? row.c[0].v : "Service";
      //      const price = row.c[1] ? row.c[1].v : 0;
        //    const desc = row.c[2] ? row.c[2].v : "";

            // HTML oluştururken isimdeki tek tırnakları kaçırıyoruz (escaping)
         //   const safeName = name.replace(/'/g, "\\'");

            //container.innerHTML += `
              //  <div class="card">
                //    <h3>${name}</h3>
                   // <p style="font-size:0.8rem; margin:10px 0;">${desc}</p>
                 //   <div class="price">£${price}</div>
                 //   <button class="btn" onclick="addToCart('${safeName}', ${price})">Add to Cart</button>
              //  </div>`;
      //  });
   // } catch (e) {
      //  console.error("Hizmetler yüklenirken hata oluştu:", e);
      //  document.getElementById('services-grid').innerHTML = "Failed to load services.";
   // }
//} 

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
            if(i === 0) return; 

           // ... döngü içindeki kısım ...
const name = row.c[0] ? row.c[0].v : "Service";
const price = row.c[1] ? row.c[1].v : 0;
const desc = row.c[2] ? row.c[2].v : "";

// Sheet'teki 4. sütunu (index 3) alıyoruz
let imgUrl = (row.c[3] && row.c[3].v) ? row.c[3].v : "";

// Eğer hücre boşsa veya link hatalıysa senin verdiğin o resmi varsayılan yapalım
if (!imgUrl || imgUrl === "") {
    imgUrl = "https://docs.google.com/spreadsheets/d/{1_rzNiHjjiacM8cIfsc5m777B96M08EW8eDDyaQmKXng}/gviz/tq?tqx=out:json"; // Senin verdiğin o resmin URL'si
}

const safeName = name.replace(/'/g, "\\'");

container.innerHTML += `
    <div class="card">
        <img src="${imgUrl}" class="service-img" alt="${name}" onerror="this.src='https://via.placeholder.com/300x200?text=Resim+Bulunamadi'">
        <h3>${name}</h3>
        <p style="font-size:0.8rem; margin:10px 0;">${desc}</p>
        <div class="price">£${price}</div>
        <button class="btn" onclick="addToCart('${safeName}', ${price})">Add to Cart</button>
    </div>`;
        });
    } catch (e) {
        console.error("Yükleme hatası:", e);
        document.getElementById('services-grid').innerHTML = "Hizmetler şu an yüklenemedi. 🛠️";
    }
}






// 3. Sepet İşlemleri
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

// 4. Arayüzü Güncelleme
function updateUI() {
    const list = document.getElementById('cart-items');
    const totalPriceDisplay = document.getElementById('total-price');
    const hiddenServices = document.getElementById('hidden-services');
    const hiddenTotal = document.getElementById('hidden-total');
    
    let total = 0;

    if (basket.length === 0) {
        list.innerHTML = '<p class="empty-msg">Bag is empty.</p>';
    } else {
        list.innerHTML = basket.map(item => {
            total += item.price;
            return `
                <div class="cart-item">
                    <span>${item.name}</span>
                    <span>£${item.price} <i class="fas fa-times-circle remove-item" onclick="removeFromCart('${item.id}')"></i></span>
                </div>
            `;
        }).join('');
    }

    totalPriceDisplay.innerText = total;
    
    // Formspree üzerinden Sude'ye gidecek gizli alanları dolduruyoruz
    if(hiddenServices) hiddenServices.value = basket.map(i => `${i.name} (£${i.price})`).join(", ");
    if(hiddenTotal) hiddenTotal.value = "£" + total;
}

// 5. Form Gönderimi (Formspree)
const orderForm = document.getElementById('nail-form');
if (orderForm) {
    orderForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (basket.length === 0) {
            alert("Please add a service to your bag!");
            return;
        }

        const btn = document.getElementById('send-btn');
        const status = document.getElementById('form-status');
        
        btn.innerText = "Sending... ✨";
        btn.disabled = true;

        try {
            const response = await fetch(orderForm.action, {
                method: "POST",
                body: new FormData(orderForm),
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                status.style.display = "block";
                status.style.backgroundColor = "#D4EDDA";
                status.style.color = "#155724";
                status.innerText = "Order sent to Sude! 💅";
                
                basket = [];
                updateUI();
                orderForm.reset();
            } else {
                throw new Error();
            }
        } catch (error) {
            status.style.display = "block";
            status.style.backgroundColor = "#F8D7DA";
            status.style.color = "#721c24";
            status.innerText = "Error! Please try again.";
        } finally {
            btn.disabled = false;
            btn.innerText = "Confirm & Send Order ✨";
        }
    });
}

// 6. Swiper Başlatma
new Swiper(".mySwiper", {
    loop: true,
    pagination: { el: ".swiper-pagination", clickable: true },
    autoplay: { delay: 2000, disableOnInteraction: false },
});

// 7. Global Erişim Tanımlamaları
// (HTML içindeki onclick='addToCart(...)' yapıları için gerekli)
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.onload = loadServices;