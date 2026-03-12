const params = new URLSearchParams(window.location.search);
const tipo = params.get("tipo");
const lang = params.get("lang") || localStorage.getItem("lang") || "es";

const labels = {
  es: { recomendado: "RECOMENDADO", agotado: "AGOTADO",     titulos: { bebidas: "Bebidas Tropicales",   comidas: "Especialidades Cubanas",    postres: "Postres de la Casa" } },
  en: { recomendado: "RECOMMENDED", agotado: "SOLD OUT",    titulos: { bebidas: "Tropical Drinks",      comidas: "Cuban Specialties",         postres: "House Desserts"     } },
  de: { recomendado: "EMPFOHLEN",   agotado: "AUSVERKAUFT", titulos: { bebidas: "Tropische Getränke",   comidas: "Kubanische Spezialitäten",  postres: "Hausdesserts"       } }
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

  fetch(`data/${tipo}-${lang}.json?_=${Date.now()}`, { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      if (tipo === "bebidas") {
        renderMenuBebidas(data, l);
      } else {
        renderMenu(data, l, tipo);
      }
    })
    .catch(err => console.error("Error cargando el menú:", err));
}

// ---- RENDER NORMAL (comidas / postres) ----
function renderMenu(items, l, tipo) {
  const container = document.getElementById("menu-container");
  container.innerHTML = "";

  items
    .filter(item => item.activo)
    .forEach(item => {
      container.appendChild(buildCard(item, l, tipo));
    });

  // Delegar clicks en imágenes
  container.addEventListener("click", e => {
    const img = e.target.closest(".menu-image img");
    if (img) openLightbox(img.dataset.src, img.dataset.nombre);
  });
}

// ---- RENDER BEBIDAS CON SUBCATEGORÍAS ----
function renderMenuBebidas(items, l) {
  const container = document.getElementById("menu-container");
  container.innerHTML = "";

  const activos = items.filter(item => item.activo);

  // Obtener subcategorías en el orden en que aparecen en el JSON (sin duplicados)
  const subcats = [];
  activos.forEach(item => {
    if (item.clasificacion && !subcats.includes(item.clasificacion)) {
      subcats.push(item.clasificacion);
    }
  });

  // --- ÍNDICE VISUAL ---
  const indexDiv = document.createElement("div");
  indexDiv.className = "bebidas-index";

  subcats.forEach(cat => {
    const anchor = document.createElement("a");
    anchor.href = `#seccion-${slugify(cat)}`;
    anchor.className = "bebidas-index-item";
    anchor.addEventListener("click", e => {
      e.preventDefault();
      const target = document.getElementById(`seccion-${slugify(cat)}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    const img = document.createElement("img");
    img.src = `assets/bebidas/clasificacion/${cat}.png`;
    img.alt = cat;
    img.onerror = () => {
      // Si no existe la imagen, mostrar texto como fallback
      img.style.display = "none";
      const span = document.createElement("span");
      span.textContent = cat;
      anchor.appendChild(span);
    };

    anchor.appendChild(img);
    indexDiv.appendChild(anchor);
  });

  container.appendChild(indexDiv);

  // --- SECCIONES POR SUBCATEGORÍA ---
  subcats.forEach(cat => {
    const itemsDeCat = activos.filter(item => item.clasificacion === cat);
    if (itemsDeCat.length === 0) return;

    // Imagen cabecera de sección
    const seccion = document.createElement("div");
    seccion.className = "bebidas-seccion";
    seccion.id = `seccion-${slugify(cat)}`;

    const headerImg = document.createElement("img");
    headerImg.src = `assets/bebidas/clasificacion/${cat}.png`;
    headerImg.alt = cat;
    headerImg.className = "bebidas-seccion-header";
    headerImg.onerror = () => {
      headerImg.style.display = "none";
      const titulo = document.createElement("h2");
      titulo.className = "bebidas-seccion-titulo";
      titulo.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      seccion.insertBefore(titulo, seccion.firstChild);
    };
    seccion.appendChild(headerImg);

    // Tarjetas de esa subcategoría
    const cardsDiv = document.createElement("div");
    cardsDiv.className = "bebidas-seccion-cards";
    itemsDeCat.forEach(item => {
      cardsDiv.appendChild(buildCard(item, l, "bebidas"));
    });
    seccion.appendChild(cardsDiv);

    container.appendChild(seccion);
  });

  // Delegar clicks en imágenes
  container.addEventListener("click", e => {
    const img = e.target.closest(".menu-image img");
    if (img) openLightbox(img.dataset.src, img.dataset.nombre);
  });
}

// ---- CONSTRUIR TARJETA ----
function buildCard(item, l, tipo) {
  const card = document.createElement("div");
  card.classList.add("menu-card");
  if (item.agotado) card.classList.add("agotado");

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
  `;

  // Añadir imagen solo si existe en el JSON; si falla al cargar, se elimina silenciosamente
  if (item.imagen && item.imagen.trim() !== "") {
    const imgWrapper = document.createElement("div");
    imgWrapper.className = "menu-image";

    const img = document.createElement("img");
    img.src = item.imagen;
    img.alt = item.nombre;
    img.loading = "lazy";
    img.dataset.src = item.imagen;
    img.dataset.nombre = item.nombre;
    img.onerror = () => imgWrapper.remove();

    imgWrapper.appendChild(img);
    card.appendChild(imgWrapper);
  }

  return card;
}

// ---- UTILIDAD ----
function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
