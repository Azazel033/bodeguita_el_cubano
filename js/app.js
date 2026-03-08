const params = new URLSearchParams(window.location.search);
const tipo = params.get("tipo");
const lang = params.get("lang") || localStorage.getItem("lang") || "es";

const labels = {
  es: { recomendado: "RECOMENDADO", agotado: "AGOTADO",    titulos: { bebidas: "Bebidas Tropicales", comidas: "Especialidades Cubanas",   postres: "Postres de la Casa" } },
  en: { recomendado: "RECOMMENDED", agotado: "SOLD OUT",   titulos: { bebidas: "Tropical Drinks",    comidas: "Cuban Specialties",         postres: "House Desserts"     } },
  de: { recomendado: "EMPFOHLEN",   agotado: "AUSVERKAUFT", titulos: { bebidas: "Tropische Getränke", comidas: "Kubanische Spezialitäten", postres: "Hausdesserts"       } }
};

const placeholderEmoji = { bebidas: "🍹", comidas: "🍽️", postres: "🍰" };

// ---- LIGHTBOX ----
const overlay = document.createElement("div");
overlay.className = "lightbox-overlay";
overlay.innerHTML = `
  <span class="lightbox-close">&#x2715;</span>
  <img id="lightbox-img" src="" alt="">
  <div class="lightbox-caption" id="lightbox-caption"></div>
`;
document.body.appendChild(overlay);

const lightboxImg     = overlay.querySelector("#lightbox-img");
const lightboxCaption = overlay.querySelector("#lightbox-caption");

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightboxCaption.textContent = alt;
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

overlay.addEventListener("click", e => {
  if (e.target !== lightboxImg) closeLightbox();
});
overlay.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });

// ---- RENDER ----
if (tipo) {
  const l = labels[lang] || labels.es;
  document.getElementById("titulo-categoria").textContent = l.titulos[tipo] || tipo;

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  fetch(`data/${tipo}-${lang}.json`)
    .then(r => r.json())
    .then(data => renderMenu(data, l, tipo))
    .catch(err => console.error("Error cargando el menú:", err));
}

function renderMenu(items, l, tipo) {
  const container = document.getElementById("menu-container");
  container.innerHTML = "";

  items
    .filter(item => item.activo)
    .forEach(item => {
      const card = document.createElement("div");
      card.classList.add("menu-card");
      if (item.agotado) card.classList.add("agotado");

      const tieneImagen = item.imagen && item.imagen.trim() !== "";
      const imagenHTML = tieneImagen
        ? `<div class="menu-image">
             <img src="${item.imagen}" alt="${item.nombre}" loading="lazy" data-src="${item.imagen}" data-nombre="${item.nombre}">
           </div>`
        : `<div class="menu-image-placeholder">${placeholderEmoji[tipo] || "🍴"}</div>`;

      const recomendadoHTML = item.recomendado
        ? `<div class="badge recomendado">${l.recomendado}</div>`
        : "";

      card.innerHTML = `
        <div class="menu-info">
          ${recomendadoHTML}
          <h3>${item.nombre}</h3>
          <p class="descripcion">${item.descripcion || ""}</p>
          <div class="precio">${item.precio}${item.moneda}</div>
        </div>
        ${imagenHTML}
      `;

      container.appendChild(card);
    });

  // Delegar clicks en imágenes
  container.addEventListener("click", e => {
    const img = e.target.closest(".menu-image img");
    if (img) openLightbox(img.dataset.src, img.dataset.nombre);
  });
}