let projects = [];
let images = {};
let participants = [];
const projectsContainer = document.getElementById('projectsContainer');
const searchInput = document.getElementById('searchInput');
const branchFilter = document.getElementById('branchFilter');
const regionFilter = document.getElementById('regionFilter');
const sectionFilter = document.getElementById('sectionFilter');
const placeFilter = document.getElementById('placeFilter');
const minMark = document.getElementById('minMark');

// Load both data files
Promise.all([
  fetch('js/table-data-compsci.json').then(res => res.json()),
  fetch('images.json').then(res => res.json())
]).then(([data, imgData]) => {
  projects = data.filter(obj => obj && obj.title && obj.branch && obj.region);
  images = imgData;
  renderFilters();
  renderProjects();
});

// Load participants data
fetch('js/participants_by_name.json')
  .then(res => res.json())
  .then(data => {
    participants = data;
    renderFiltersExtended();
    renderProjects();
  });

function renderFilters() {
  // Unique branches and regions
  const branches = [...new Set(projects.map(p => p.branch))].sort();
  const regions = [...new Set(projects.map(p => p.region))].sort();

  branchFilter.innerHTML = '<option value="">Всі галузі</option>';
  regionFilter.innerHTML = '<option value="">Всі області</option>';

  branches.forEach(branch => {
    const opt = document.createElement('option');
    opt.value = branch;
    opt.textContent = branch;
    branchFilter.appendChild(opt);
  });
  regions.forEach(region => {
    const opt = document.createElement('option');
    opt.value = region;
    opt.textContent = region;
    regionFilter.appendChild(opt);
  });
}

// Extend filters for section and place
function renderFiltersExtended() {
  // Sections from projects
  const sections = [...new Set(projects.map(p => p.section).filter(Boolean))].sort();
  sectionFilter.innerHTML = '<option value="">Всі секції</option>';
  sections.forEach(section => {
    const opt = document.createElement('option');
    opt.value = section;
    opt.textContent = section;
    sectionFilter.appendChild(opt);
  });
}

function renderProjects() {
  const search = searchInput.value.trim().toLowerCase();
  const branch = branchFilter.value;
  const region = regionFilter.value;
  const section = sectionFilter.value;
  const place = placeFilter.value;
  const min = parseFloat(minMark.value) || -Infinity;

  const filtered = projects.filter(p => {
    const nameMatch = !search || p.title.toLowerCase().includes(search);
    const branchMatch = !branch || p.branch === branch;
    const regionMatch = !region || p.region === region;
    const sectionMatch = !section || p.section === section;

    // Find participant by author name (if available)
    let participant = null;
    if (p.author) {
      const authorName = p.author.replace(/^Автор:\s*/, '').trim();
      participant = participants.find(part => part.name === authorName);
    }
    const placeMatch = !place || (participant && (participant.place === place || (place === '-' && !participant.place)));
    const markMatch = !minMark.value || (participant && participant.gen_mark >= min);

    return nameMatch && branchMatch && regionMatch && sectionMatch && placeMatch && markMatch;
  });

  projectsContainer.innerHTML = filtered.length
    ? filtered.map(projectCardHTML).join('')
    : '<div>Нічого не знайдено.</div>';
}

function projectCardHTML(p) {
  let participantInfo = '';
  if (p.author) {
    const authorName = p.author.replace(/^Автор:\s*/, '').trim();
    const participant = participants.find(part => part.name === authorName);
    if (participant) {
      participantInfo = `
        <div class="participant-info">
          <span>Місце: <b>${participant.place || '-'}</b></span>
          <span>Загальний бал: <b>${participant.gen_mark || '-'}</b></span>
        </div>
      `;
    }
  }
  return `
    <div class="project-card">
      <div class="project-id">#${p.id}</div>
      <div class="corner">
        <div>${p.region}</div>
        <div>${p.branch}</div>
      </div>
      <img src="${getImageFromId(p.id)}" alt="Фото проєкту" class="card-img" data-full="${getImageFromId(p.id)}" onerror="this.src='https://via.placeholder.com/320x160?text=No+Image';">
      <div class="name">${p.title}</div>
      ${p.section ? `<div class="section">Секція: <span>${p.section}</span></div>` : ""}
      ${participantInfo}
      <div class="links">
        <a href="${p.details_url}" target="_blank">Деталі</a>
        <a href="${p.booth_url}" target="_blank">Віртуальний постер</a>
      </div>
    </div>
  `;
}

function getImageFromId(id) {
  return images[id] || 'https://via.placeholder.com/320x160?text=No+Image';
}

// Events
searchInput.addEventListener('input', renderProjects);
branchFilter.addEventListener('change', renderProjects);
regionFilter.addEventListener('change', renderProjects);
sectionFilter.addEventListener('change', renderProjects);
placeFilter.addEventListener('change', renderProjects);
minMark.addEventListener('input', renderProjects);

// Modal logic
const modal = document.getElementById('photoModal');
const modalImg = document.getElementById('modalImg');
const modalClose = document.getElementById('modalClose');

projectsContainer.addEventListener('click', function(e) {
  if (e.target.classList.contains('card-img')) {
    modal.style.display = 'flex';
    modalImg.src = e.target.dataset.full;
  }
});
modalClose.addEventListener('click', () => {
  modal.style.display = 'none';
  modalImg.src = '';
});
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
    modalImg.src = '';
  }
});

// --- Zoom logic for modal image ---
let zoomLevel = 1;

function setZoom(level) {
  zoomLevel = Math.max(0.2, Math.min(level, 5)); // Limit zoom between 0.2x and 5x
  updateTransform();
}

// Mouse wheel zoom
modalImg.addEventListener('wheel', function(e) {
  e.preventDefault();
  if (e.deltaY < 0) setZoom(zoomLevel + 0.1);
  else setZoom(zoomLevel - 0.1);
});

// Optional: Add zoom buttons to modal
const zoomInBtn = document.createElement('button');
zoomInBtn.textContent = '+';
zoomInBtn.style.position = 'absolute';
zoomInBtn.style.bottom = '40px';
zoomInBtn.style.right = '80px';
zoomInBtn.style.fontSize = '2rem';
zoomInBtn.style.zIndex = '1002';

const zoomOutBtn = document.createElement('button');
zoomOutBtn.textContent = '−';
zoomOutBtn.style.position = 'absolute';
zoomOutBtn.style.bottom = '40px';
zoomOutBtn.style.right = '40px';
zoomOutBtn.style.fontSize = '2rem';
zoomOutBtn.style.zIndex = '1002';

zoomInBtn.onclick = () => setZoom(zoomLevel + 0.2);
zoomOutBtn.onclick = () => setZoom(zoomLevel - 0.2);

modal.appendChild(zoomInBtn);
modal.appendChild(zoomOutBtn);

// Reset zoom when modal opens/closes
projectsContainer.addEventListener('click', function(e) {
  if (e.target.classList.contains('card-img')) {
    setZoom(1);
  }
});
modalClose.addEventListener('click', () => setZoom(1));
modal.addEventListener('click', (e) => {
  if (e.target === modal) setZoom(1);
});

// --- Drag logic for modal image ---
let isDragging = false;
let startX = 0, startY = 0;
let translateX = 0, translateY = 0;
let lastTranslateX = 0, lastTranslateY = 0;

function updateTransform() {
  modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
}

modalImg.addEventListener('mousedown', function(e) {
  if (zoomLevel === 1) return; // Only allow drag when zoomed
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  modalImg.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', function(e) {
  if (!isDragging) return;
  translateX = lastTranslateX + (e.clientX - startX);
  translateY = lastTranslateY + (e.clientY - startY);
  updateTransform();
});

window.addEventListener('mouseup', function() {
  if (!isDragging) return;
  isDragging = false;
  lastTranslateX = translateX;
  lastTranslateY = translateY;
  modalImg.style.cursor = 'grab';
});

// Reset position and zoom when modal opens/closes
function resetModalTransform() {
  setZoom(1);
  translateX = 0;
  translateY = 0;
  lastTranslateX = 0;
  lastTranslateY = 0;
  modalImg.style.transform = '';
  modalImg.style.cursor = 'grab';
}

projectsContainer.addEventListener('click', function(e) {
  if (e.target.classList.contains('card-img')) {
    resetModalTransform();
  }
});
modalClose.addEventListener('click', resetModalTransform);
modal.addEventListener('click', (e) => {
  if (e.target === modal) resetModalTransform();
});

// Also reset on image load
modalImg.addEventListener('load', resetModalTransform);