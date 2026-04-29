// ===== PARTICLES =====
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.reset();
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${this.opacity})`;
        ctx.fill();
    }
}

for (let i = 0; i < 60; i++) { particles.push(new Particle()); }

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
}
animateParticles();

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== MOBILE MENU =====
function toggleMenu() {
    document.getElementById('navLinks').classList.toggle('active');
}
function closeMenu() {
    document.getElementById('navLinks').classList.remove('active');
}

// ===== SCROLL REVEAL =====
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
revealElements.forEach(el => revealObserver.observe(el));

// ===== COUNTER ANIMATION =====
function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'));
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(target * eased);
        if (target >= 1000) {
            el.textContent = prefix + current.toLocaleString('en-US') + suffix;
        } else {
            el.textContent = prefix + current + suffix;
        }
        if (progress < 1) { requestAnimationFrame(update); }
    }
    requestAnimationFrame(update);
}

const counterElements = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            entry.target.dataset.animated = 'true';
            animateCounter(entry.target);
        }
    });
}, { threshold: 0.5 });
counterElements.forEach(el => counterObserver.observe(el));

// ===== CHART =====
const chartData = [
    { label: 'Ноя', value: 127000 },
    { label: 'Дек', value: 145000 },
    { label: 'Янв', value: 112000 },
    { label: 'Фев', value: 168000 },
    { label: 'Мар', value: 189000 },
    { label: 'Апр', value: 106000 },
];
const maxVal = Math.max(...chartData.map(d => d.value));
const chartContainer = document.getElementById('chartContainer');

chartData.forEach((d, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-bar-wrapper';
    const valueLabel = document.createElement('div');
    valueLabel.className = 'chart-bar-value';
    valueLabel.textContent = '$' + (d.value / 1000).toFixed(0) + 'K';
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    const heightPercent = (d.value / maxVal) * 85;
    bar.style.height = '0%';
    bar.style.transitionDelay = (i * 0.1) + 's';
    const label = document.createElement('div');
    label.className = 'chart-bar-label';
    label.textContent = d.label;
    wrapper.appendChild(valueLabel);
    wrapper.appendChild(bar);
    wrapper.appendChild(label);
    chartContainer.appendChild(wrapper);
    const chartObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            setTimeout(() => { bar.style.height = heightPercent + '%'; }, 200);
            chartObserver.unobserve(bar);
        }
    }, { threshold: 0.3 });
    chartObserver.observe(bar);
});

// ===== FORM SUBMIT =====
async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    const formContent = document.getElementById('formContent');
    const formSuccess = document.getElementById('formSuccess');
    
    // Собираем данные
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        // Показываем состояние загрузки
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Отправка...';
        
        // Отправляем на сервер
        const response = await fetch('/api/send-to-telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // ✅ Успех: показываем сообщение
            formContent.style.display = 'none';
            formSuccess.classList.add('show');
            form.reset();
            console.log('✅ Заявка успешно отправлена');
        } else {
            // ❌ Ошибка от сервера
            throw new Error(result.error || 'Ошибка отправки');
        }
        
    } catch (error) {
        console.error('🚨 Ошибка:', error);
        alert('Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.');
    } finally {
        // Возвращаем кнопку в исходное состояние
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
});

// ===== LIGHTBOX =====
const lightboxModal = document.getElementById('lightboxModal');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxCounter = document.getElementById('lightboxCounter');

let currentImageIndex = 0;
let reviewImages = [];

function collectReviewImages() {
    reviewImages = Array.from(document.querySelectorAll('.review-image'));
}

function openLightbox(index) {
    currentImageIndex = index;
    updateLightboxImage();
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function updateLightboxImage() {
    const img = reviewImages[currentImageIndex];
    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt;
    lightboxCounter.textContent = `${currentImageIndex + 1} из ${reviewImages.length}`;
}

function closeLightbox() {
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
}

function showPrevImage() {
    currentImageIndex = (currentImageIndex - 1 + reviewImages.length) % reviewImages.length;
    updateLightboxImage();
}

function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % reviewImages.length;
    updateLightboxImage();
}

// Init
collectReviewImages();

reviewImages.forEach((img, index) => {
    img.parentElement.addEventListener('click', () => openLightbox(index));
    img.style.cursor = 'pointer';
});

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrevImage(); });
lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showNextImage(); });

lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal) { closeLightbox(); }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxModal.classList.contains('active')) { closeLightbox(); }
    if (e.key === 'ArrowLeft' && lightboxModal.classList.contains('active')) { showPrevImage(); }
    if (e.key === 'ArrowRight' && lightboxModal.classList.contains('active')) { showNextImage(); }
});

const observer = new MutationObserver(() => { collectReviewImages(); });
observer.observe(document.querySelector('.reviews-grid'), { childList: true, subtree: true });