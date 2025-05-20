let projects = [];
let images = {};
const projectsContainer = document.getElementById('projectsContainer');
const searchInput = document.getElementById('searchInput');
const branchFilter = document.getElementById('branchFilter');
const regionFilter = document.getElementById('regionFilter');

// Load both data files
Promise.all([
  fetch('js/table-data.json').then(res => res.json()),
  fetch('images.json').then(res => res.json())
]).then(([data, imgData]) => {
  projects = data.filter(arr => Array.isArray(arr) && arr.length >= 6 && arr[1] && arr[2] && arr[3]);
  images = imgData;
  renderFilters();
  renderProjects();
});

function renderFilters() {
  // Unique branches and regions
  const branches = [...new Set(projects.map(p => p[2]))].sort();
  const regions = [...new Set(projects.map(p => p[3]))].sort();

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

function renderProjects() {
  const search = searchInput.value.trim().toLowerCase();
  const branch = branchFilter.value;
  const region = regionFilter.value;

  const filtered = projects.filter(p => {
    const nameMatch = !search || p[1].toLowerCase().includes(search);
    const branchMatch = !branch || p[2] === branch;
    const regionMatch = !region || p[3] === region;
    return nameMatch && branchMatch && regionMatch;
  });

  projectsContainer.innerHTML = filtered.length
    ? filtered.map(projectCardHTML).join('')
    : '<div>Нічого не знайдено.</div>';
}

function projectCardHTML(p) {
  return `
    <div class="project-card">
      <div class="project-id">#${p[0]}</div>
      <div class="corner">
        <div>${p[3]}</div>
        <div>${p[2]}</div>
      </div>
      <img src="${getImageFromId(p[0])}" alt="Фото проєкту" class="card-img" data-full="${getImageFromId(p[0])}" onerror="this.src='https://via.placeholder.com/320x160?text=No+Image';">
      <div class="name">${p[1]}</div>
      <div class="links">
        <a href="${p[4]}" target="_blank">Деталі</a>
        <a href="${p[5]}" target="_blank">Віртуальний постер</a>
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