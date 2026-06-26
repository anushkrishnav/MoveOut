/* ─── Config ──────────────────────────────────────────────── */
const PHONE       = '5859811189';
const LOCATION    = 'Park Point';
const CATEGORIES  = ['All', 'Electronics', 'Storage', 'Furniture', 'Office', 'Lighting', 'Utility'];

/* ─── Placeholder SVG (must be declared before handleImgError) */
const imagePlaceholderSVG = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

/* ─── Condition badge ─────────────────────────────────────── */
const CONDITION_MAP = {
  'excellent':     { cls: 'cond-excellent',  label: 'Excellent' },
  'brand new':     { cls: 'cond-new',        label: 'Brand New' },
  'used like new': { cls: 'cond-like-new',   label: 'Used Like New' },
  'good':          { cls: 'cond-good',       label: 'Good' },
  'used':          { cls: 'cond-used',       label: 'Used' },
  'wear and tear': { cls: 'cond-worn',       label: 'Wear & Tear' },
};
function conditionBadge(cond) {
  const key  = (cond || '').toLowerCase().trim();
  const meta = CONDITION_MAP[key] || { cls: 'cond-good', label: escHtml(cond || 'Unknown') };
  return `<span class="condition-badge ${meta.cls}">${meta.label}</span>`;
}

/* ─── Image error handler — called from onerror attribute ─── */
function handleImgError(img) {
  const slide = img.closest('.carousel-slide');
  if (slide) {
    slide.innerHTML = `<div class="img-placeholder">${imagePlaceholderSVG}<span>No image</span></div>`;
  }
}

/* ─── State ───────────────────────────────────────────────── */
let allProducts   = [];
let activeFilter  = 'All';
let searchQuery   = '';

/* ─── DOM refs ────────────────────────────────────────────── */
const grid        = document.getElementById('productGrid');
const countEl     = document.getElementById('resultsCount');
const searchInput = document.getElementById('searchInput');

/* ─── Init ────────────────────────────────────────────────── */
async function init() {
  try {
    const res  = await fetch('products.json');
    allProducts = await res.json();
  } catch (e) {
    grid.innerHTML = '<p class="empty"><h3>Could not load products.</h3><p>Make sure products.json is present.</p></p>';
    return;
  }
  buildFilters();
  render();
}

/* ─── Filters ─────────────────────────────────────────────── */
function buildFilters() {
  const wrap = document.getElementById('filterChips');
  wrap.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'chip' + (cat === activeFilter ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      activeFilter = cat;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
    wrap.appendChild(btn);
  });
}

/* ─── Render ──────────────────────────────────────────────── */
function render() {
  const q = searchQuery.toLowerCase();
  const filtered = allProducts.filter(p => {
    const matchCat = activeFilter === 'All' || p.category === activeFilter;
    const matchQ   = !q || [p.title, p.description, p.color, p.condition, p.notes, p.category]
      .some(v => v && v.toLowerCase().includes(q));
    return matchCat && matchQ;
  });

  countEl.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''} found`;
  grid.innerHTML = '';

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty"><h3>No items found</h3><p>Try a different search or filter.</p></div>`;
    return;
  }

  filtered.forEach(p => grid.appendChild(createCard(p)));
}

/* ─── Card Builder ────────────────────────────────────────── */
function createCard(p) {
  const card = document.createElement('div');
  card.className = 'card' + (p.status === 'sold' ? ' sold' : '');

  /* --- Carousel images --- */
  const imageCount = p.imageCount || 0;
  const slides = [];
  for (let i = 1; i <= imageCount; i++) {
    slides.push(`${p.id}_${i}.jpg`);
  }

  const slidesHTML = imageCount === 0
    ? `<div class="carousel-slide"><div class="img-placeholder">${imagePlaceholderSVG}<span>No photo yet</span></div></div>`
    : slides.map((filename, idx) => `
        <div class="carousel-slide">
          <img
            src="products/${filename}"
            alt="${escHtml(p.title)} image ${idx + 1}"
            onerror="handleImgError(this)"
            loading="lazy"
          />
        </div>
      `).join('');

  const dotsHTML = slides.length > 1
    ? `<div class="carousel-dots">${slides.map((_, i) => `<span class="dot${i === 0 ? ' active' : ''}"></span>`).join('')}</div>`
    : '';

  const arrowsHTML = slides.length > 1
    ? `<button class="carousel-btn prev" aria-label="Previous">${chevronLeft}</button>
       <button class="carousel-btn next" aria-label="Next">${chevronRight}</button>`
    : '';

  /* --- Price --- */
  const priceHTML = `
    <div class="card-price">
      ${p.originalPrice ? `<div class="original-price">Was $${p.originalPrice}</div>` : ''}
      <div class="asking-price"><span>$</span>${p.askingPrice}</div>
    </div>
  `;

  /* --- Notes --- */
  const notesHTML = p.notes ? `<div class="card-notes">${escHtml(p.notes)}</div>` : '';

  /* --- WhatsApp message --- */
  const waMsg = encodeURIComponent(`Hi, I'm interested in item ${p.id} - ${p.title}. Is it still available?`);

  card.innerHTML = `
    <div class="card-badge"># ${p.id}</div>
    <div class="carousel">
      <div class="carousel-slides">${slidesHTML}</div>
      ${arrowsHTML}
      ${dotsHTML}
    </div>
    <div class="card-body">
      <div class="card-title">${escHtml(p.title)}</div>
      <div class="card-meta">
        <span class="meta-pill">${escHtml(p.category)}</span>
        <span class="meta-pill">${escHtml(p.color)}</span>
        ${conditionBadge(p.condition)}
      </div>
      <div class="card-desc">${escHtml(p.description)}</div>
      ${notesHTML}
      ${priceHTML}
      <div class="card-actions">
        <a class="btn btn-whatsapp" href="https://wa.me/1${PHONE}?text=${waMsg}" target="_blank" rel="noopener">
          ${whatsappIcon} WhatsApp
        </a>
        <a class="btn btn-call" href="tel:${PHONE}">
          ${phoneIcon} Call
        </a>
      </div>
      <div class="as-is-note">Sold as-is &nbsp;·&nbsp; No refunds &nbsp;·&nbsp; No returns</div>
    </div>
  `;

  /* --- Carousel logic --- */
  let currentSlide = 0;

  if (slides.length > 1) {
    const slidesWrap = card.querySelector('.carousel-slides');
    const dots       = card.querySelectorAll('.dot');

    function goTo(idx) {
      currentSlide = (idx + slides.length) % slides.length;
      slidesWrap.style.transform = `translateX(-${currentSlide * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
    }

    card.querySelector('.prev').addEventListener('click', () => goTo(currentSlide - 1));
    card.querySelector('.next').addEventListener('click', () => goTo(currentSlide + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
  }

  /* --- Click image to open lightbox --- */
  if (imageCount > 0) {
    card.querySelector('.carousel').addEventListener('click', (e) => {
      if (e.target.closest('.carousel-btn') || e.target.closest('.carousel-dots')) return;
      openLightbox(p, currentSlide);
    });
    card.querySelector('.carousel').style.cursor = 'zoom-in';
  }

  return card;
}

/* ─── PDF Export ──────────────────────────────────────────── */
async function exportPDF() {
  const btn = document.getElementById('exportBtn');
  const orig = btn.innerHTML;
  btn.innerHTML = `${spinnerIcon} Generating…`;
  btn.disabled = true;

  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

  /* ── Dimensions ── */
  const PW = doc.internal.pageSize.getWidth();   // 210
  const PH = doc.internal.pageSize.getHeight();  // 297
  const M  = 13;                                 // margin
  const GAP = 5;                                 // gap between columns
  const COL = (PW - M * 2 - GAP) / 2;           // ~89.5mm per column
  const CARD_H  = 78;                            // product card height
  const HDR_H   = 38;                            // page header height
  const FTR_H   = 10;                            // footer height
  const IMG_W   = 44;                            // image width inside card
  const IMG_H   = 40;                            // image height inside card

  /* ── Colour palette ── */
  const C = {
    dark:      [26,  26,  26 ],
    gold:      [201, 168, 76 ],
    goldLight: [232, 213, 163],
    brown:     [107, 76,  42 ],
    gray:      [110, 110, 110],
    lightGray: [200, 200, 200],
    cream:     [250, 248, 244],
    white:     [255, 255, 255],
    red:       [192, 57,  43 ],
  };

  const fill  = (c) => doc.setFillColor(...c);
  const draw  = (c) => doc.setDrawColor(...c);
  const color = (c) => doc.setTextColor(...c);
  const lw    = (n) => doc.setLineWidth(n);

  /* ── Page header ── */
  function pageHeader(label) {
    // Dark top band
    fill(C.dark); doc.rect(0, 0, PW, 7, 'F');
    // Gold accent line
    fill(C.gold);  doc.rect(0, 7, PW, 1.2, 'F');

    // Title
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
    color(C.dark);
    doc.text('Moving Out Sale', PW / 2, 19, { align: 'center' });

    // Sub
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    color(C.gray);
    doc.text(
      `Pickup only · ${LOCATION}  ·  Call or WhatsApp: ${PHONE}  ·  All items sold as-is · No refunds · No returns`,
      PW / 2, 25, { align: 'center' }
    );

    // Gold divider with label
    draw(C.goldLight); lw(0.4);
    doc.line(M, 31, PW - M, 31);

    if (label) {
      fill(C.dark); doc.roundedRect(PW / 2 - 22, 27.5, 44, 7, 2, 2, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      color(C.gold);
      doc.text(label, PW / 2, 32.5, { align: 'center' });
    } else {
      fill(C.gold); doc.circle(PW / 2, 31, 1, 'F');
    }
  }

  /* ── Page footer ── */
  function pageFooter(num, total) {
    const fy = PH - 8;
    draw(C.goldLight); lw(0.3);
    doc.line(M, fy, PW - M, fy);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    color(C.gray);
    doc.text('All items sold as-is. No refunds. No returns. Pickup only at Park Point.', M, fy + 4);
    doc.text(`${num} / ${total}`, PW - M, fy + 4, { align: 'right' });
  }

  /* ── Product card ── */
  async function productCard(p, cx, cy) {
    // Drop shadow
    fill([215, 210, 200]); doc.roundedRect(cx + 1.2, cy + 1.2, COL, CARD_H, 3, 3, 'F');

    // Card background
    fill(C.white); draw(C.goldLight); lw(0.35);
    doc.roundedRect(cx, cy, COL, CARD_H, 3, 3, 'FD');

    // Gold left accent bar
    fill(C.gold); doc.roundedRect(cx, cy, 3, CARD_H, 1.5, 0, 'F');

    // Image background
    fill(C.cream); doc.rect(cx + 3, cy, IMG_W, CARD_H, 'F');

    // Product image
    if (p.imageCount > 0) {
      try {
        const imgD = await toBase64(`products/${p.id}_1.jpg`);
        const iy = cy + (CARD_H - IMG_H) / 2;
        doc.addImage(imgD, 'JPEG', cx + 3, iy, IMG_W, IMG_H, undefined, 'FAST');
      } catch (_) {}
    }

    // Vertical separator
    draw(C.goldLight); lw(0.3);
    doc.line(cx + 3 + IMG_W, cy + 4, cx + 3 + IMG_W, cy + CARD_H - 4);

    // Text zone
    const tx = cx + IMG_W + 7;
    const tw = COL - IMG_W - 10;
    let ty = cy + 10;

    // Title
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
    color(C.dark);
    const tLines = doc.splitTextToSize(p.title, tw);
    doc.text(tLines.slice(0, 2), tx, ty);
    ty += tLines.slice(0, 2).length * 5 + 2;

    // Category · Color · Condition
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    color(C.brown);
    doc.text(`${p.category}  ·  ${p.color}  ·  ${p.condition}`, tx, ty);
    ty += 4.5;

    // Thin divider
    draw(C.goldLight); lw(0.25); doc.line(tx, ty, tx + tw, ty); ty += 3.5;

    // Notes
    if (p.notes) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7);
      color(C.gray);
      const nLines = doc.splitTextToSize(p.notes, tw);
      doc.text(nLines.slice(0, 2), tx, ty);
      ty += nLines.slice(0, 2).length * 3.8 + 2.5;
    }

    // Original price (struck through)
    if (p.originalPrice) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      color(C.lightGray);
      const wasText = `Was $${p.originalPrice}`;
      doc.text(wasText, tx, ty);
      const ww = doc.getTextWidth(wasText);
      draw(C.lightGray); lw(0.3); doc.line(tx, ty - 1, tx + ww, ty - 1);
      ty += 5;
    }

    // Asking price
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
    color(C.dark);
    doc.text(`$${p.askingPrice}`, tx, ty + 7);

    // ID badge bottom-left inside image area
    const badgeY = cy + CARD_H - 9;
    fill(C.dark); doc.roundedRect(cx + 4, badgeY, 24, 7.5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    color(C.gold);
    doc.text(`# ${p.id}`, cx + 6, badgeY + 5.2);

    // As-is label bottom-right
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
    color(C.lightGray);
    doc.text('As-is · No returns', cx + COL - 2, cy + CARD_H - 2, { align: 'right' });

    // SOLD overlay
    if (p.status === 'sold') {
      fill([255, 255, 255]); doc.setGState(doc.GState({ opacity: 0.75 }));
      doc.roundedRect(cx, cy, COL, CARD_H, 3, 3, 'F');
      doc.setGState(doc.GState({ opacity: 1 }));
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
      color(C.red);
      doc.text('SOLD', cx + COL / 2, cy + CARD_H / 2 + 4, { align: 'center' });
    }
  }

  /* ── Appendix image block (2×2 grid) ── */
  async function appendixBlock(item, ax, ay, bw, bh) {
    // Frame
    fill(C.cream); draw(C.goldLight); lw(0.35);
    doc.roundedRect(ax, ay, bw, bh + 13, 2, 2, 'FD');

    // Image
    if (item) {
      try {
        const imgD = await toBase64(item.src);
        doc.addImage(imgD, 'JPEG', ax + 1, ay + 1, bw - 2, bh - 2, undefined, 'FAST');
      } catch (_) {}

      // Label band
      fill(C.dark); doc.rect(ax, ay + bh - 1, bw, 14, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      color(C.gold);
      doc.text(doc.splitTextToSize(item.title, bw - 4)[0], ax + 3, ay + bh + 5.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
      color([180, 180, 180]);
      doc.text(item.sub, ax + 3, ay + bh + 10.5);
    }
  }

  /* ══════════════════════════════════════════════════════════
     MAIN CATALOG
  ══════════════════════════════════════════════════════════ */
  const q = searchQuery.toLowerCase();
  const visible = allProducts.filter(p => {
    const matchCat = activeFilter === 'All' || p.category === activeFilter;
    const matchQ   = !q || [p.title, p.description, p.color, p.condition, p.notes, p.category]
      .some(v => v && v.toLowerCase().includes(q));
    return matchCat && matchQ;
  });

  const CARD_GAP  = 5;
  const CONTENT_Y = HDR_H + 2;
  const CONTENT_H = PH - HDR_H - FTR_H;

  let pageNum = 1;
  pageHeader(null);

  let rowY = CONTENT_Y;
  let colIdx = 0; // 0 = left, 1 = right

  for (const p of visible) {
    if (rowY + CARD_H > PH - FTR_H) {
      doc.addPage(); pageNum++;
      pageHeader(null);
      rowY = CONTENT_Y; colIdx = 0;
    }

    const cx = colIdx === 0 ? M : M + COL + GAP;
    await productCard(p, cx, rowY);

    if (colIdx === 1) { rowY += CARD_H + CARD_GAP; colIdx = 0; }
    else              { colIdx = 1; }
  }

  /* ══════════════════════════════════════════════════════════
     APPENDIX — all photos, 4 per page (2×2)
  ══════════════════════════════════════════════════════════ */
  const appendixItems = [];
  for (const p of allProducts) {
    for (let i = 1; i <= p.imageCount; i++) {
      appendixItems.push({
        src:   `products/${p.id}_${i}.jpg`,
        title: `#${p.id}  ${p.title}`,
        sub:   `Photo ${i} of ${p.imageCount}`,
      });
    }
  }

  if (appendixItems.length > 0) {
    const BW = (PW - M * 2 - GAP) / 2;       // block width  ~89.5mm
    const BH = Math.round(BW * 0.72);         // block image height ~64mm
    const BLOCK_FULL = BH + 14;               // image + label band
    const ROW_GAP    = 5;

    for (let ai = 0; ai < appendixItems.length; ai += 4) {
      doc.addPage(); pageNum++;
      const isFirst = ai === 0;
      pageHeader('Photo Appendix — All Product Images');

      // Row 1
      await appendixBlock(appendixItems[ai],     M,           CONTENT_Y,       BW, BH);
      await appendixBlock(appendixItems[ai + 1], M + BW + GAP, CONTENT_Y,     BW, BH);

      // Row 2
      const row2Y = CONTENT_Y + BLOCK_FULL + ROW_GAP;
      await appendixBlock(appendixItems[ai + 2], M,             row2Y,         BW, BH);
      await appendixBlock(appendixItems[ai + 3], M + BW + GAP,  row2Y,        BW, BH);
    }
  }

  /* ── Add footer + page numbers to every page ── */
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    pageFooter(i, totalPages);
  }

  doc.save('moving-out-sale-catalog.pdf');
  btn.innerHTML = orig;
  btn.disabled = false;
}

/* ─── Helpers ─────────────────────────────────────────────── */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function toBase64(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = src;
  });
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─── SVG Icons ───────────────────────────────────────────── */
const whatsappIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

const phoneIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.55 10.5a19.79 19.79 0 01-3.07-8.67A2 2 0 012.48 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.06 6.06l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`;

const chevronLeft = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
const chevronRight = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

const searchIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

const spinnerIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur=".8s" repeatCount="indefinite"/></path></svg>`;

const pdfIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;

/* ─── Lightbox ────────────────────────────────────────────── */
(function () {
  const lb      = document.getElementById('lightbox');
  const lbImg   = document.getElementById('lbImg');
  const lbStage = document.getElementById('lbStage');
  const lbCount = document.getElementById('lbCounter');
  const lbPrev  = document.getElementById('lbPrev');
  const lbNext  = document.getElementById('lbNext');

  let product = null, index = 0;
  let scale = 1, panX = 0, panY = 0;
  let dragging = false, dragOrigin = null;
  let pinchDist = null;

  function applyTransform(animated) {
    lbImg.style.transition = animated ? 'transform .2s ease' : 'none';
    lbImg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    lbStage.classList.toggle('zoomed', scale > 1);
  }

  function resetZoom(animated) {
    scale = 1; panX = 0; panY = 0;
    applyTransform(animated);
  }

  function updateUI() {
    const count = product.imageCount;
    lbImg.src = `products/${product.id}_${index + 1}.jpg`;
    lbImg.alt = product.title;
    lbCount.textContent = count > 1 ? `${index + 1} / ${count}` : '';
    lbPrev.style.display = count > 1 ? '' : 'none';
    lbNext.style.display = count > 1 ? '' : 'none';
    resetZoom(false);
  }

  window.openLightbox = function (p, idx) {
    product = p; index = idx;
    updateUI();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    resetZoom(false);
  }

  document.getElementById('lbClose').addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });

  lbPrev.addEventListener('click', () => {
    index = (index - 1 + product.imageCount) % product.imageCount;
    updateUI();
  });
  lbNext.addEventListener('click', () => {
    index = (index + 1) % product.imageCount;
    updateUI();
  });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')      close();
    if (e.key === 'ArrowLeft')   { index = (index - 1 + product.imageCount) % product.imageCount; updateUI(); }
    if (e.key === 'ArrowRight')  { index = (index + 1) % product.imageCount; updateUI(); }
  });

  /* --- Scroll to zoom --- */
  lbStage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    scale = Math.min(6, Math.max(1, scale + delta));
    if (scale === 1) { panX = 0; panY = 0; }
    applyTransform(false);
  }, { passive: false });

  /* --- Double-click to toggle zoom --- */
  lbStage.addEventListener('dblclick', () => {
    if (scale > 1) { resetZoom(true); }
    else           { scale = 2.5; applyTransform(true); }
  });

  /* --- Mouse drag to pan --- */
  lbStage.addEventListener('mousedown', (e) => {
    if (scale <= 1) return;
    dragging = true;
    dragOrigin = { x: e.clientX - panX, y: e.clientY - panY };
    lbStage.classList.add('dragging');
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    panX = e.clientX - dragOrigin.x;
    panY = e.clientY - dragOrigin.y;
    applyTransform(false);
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    lbStage.classList.remove('dragging');
  });

  /* --- Touch: pinch to zoom + single-finger pan --- */
  lbStage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      pinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1 && scale > 1) {
      dragging = true;
      dragOrigin = { x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY };
    }
  }, { passive: true });

  lbStage.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && pinchDist !== null) {
      e.preventDefault();
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      scale = Math.min(6, Math.max(1, scale * (newDist / pinchDist)));
      pinchDist = newDist;
      if (scale === 1) { panX = 0; panY = 0; }
      applyTransform(false);
    } else if (e.touches.length === 1 && dragging) {
      panX = e.touches[0].clientX - dragOrigin.x;
      panY = e.touches[0].clientY - dragOrigin.y;
      applyTransform(false);
    }
  }, { passive: false });

  lbStage.addEventListener('touchend', () => {
    pinchDist = null;
    dragging = false;
  });
})();

/* ─── Event Listeners ─────────────────────────────────────── */
document.getElementById('searchInput').addEventListener('input', e => {
  searchQuery = e.target.value;
  render();
});

document.getElementById('exportBtn').addEventListener('click', exportPDF);

/* ─── Search icon injection ───────────────────────────────── */
document.querySelector('.search-wrap svg')?.replaceWith(
  (() => { const d = document.createElement('div'); d.innerHTML = searchIcon; return d.firstChild; })()
);

/* ─── Start ───────────────────────────────────────────────── */
init();
