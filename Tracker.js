// Host
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
        .then(() => console.log("Service Worker Registered"))
        .catch(err => console.error("Service Worker Failed", err));
}

// Stars
const starContainers = document.querySelectorAll('.stars');

starContainers.forEach(container => {
    const stars = container.querySelectorAll('.star');

    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const hoverValue = star.dataset.value;
            highlightStars(container, hoverValue);
        });

        star.addEventListener('mouseleave', () => {
            const currentRating = container.getAttribute('data-rating') || 0;
            highlightStars(container, currentRating);
        });

        star.addEventListener('click', () => {
            const rating = star.dataset.value;
            container.setAttribute('data-rating', rating);
            highlightStars(container, rating);
            localStorage.setItem(container.dataset.anime, rating);
        });
    });

    const savedRating = localStorage.getItem(container.dataset.anime);
    if (savedRating) {
        container.setAttribute('data-rating', savedRating);
        highlightStars(container, savedRating);
    }
});

function highlightStars(container, rating) {
    const stars = container.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.toggle('selected', star.dataset.value <= rating);
    });
}

// Progress tracker
const progressSections = document.querySelectorAll('.progress-section');

progressSections.forEach(section => {
    const watchedInput = section.querySelector('.watched-input');
    const totalInput = section.querySelector('.total-input');
    const fill = section.querySelector('.progress-fill');
    const text = section.querySelector('.progress-text');
    const animeKey = section.dataset.anime;

    const savedData = JSON.parse(localStorage.getItem(animeKey + '_progress')) || {
        watched: 0,
        total: parseInt(totalInput.value)
    };
    watchedInput.value = savedData.watched;
    totalInput.value = savedData.total;
    updateProgress();

    watchedInput.addEventListener('input', updateProgress);
    totalInput.addEventListener('input', updateProgress);

    function updateProgress() {
        const watched = parseInt(watchedInput.value) || 0;
        const total = parseInt(totalInput.value) || 1;
        const percent = Math.min(100, Math.round((watched / total) * 100));

        fill.style.width = percent + '%';
        text.textContent = percent + '%';
        localStorage.setItem(animeKey + '_progress', JSON.stringify({ watched, total }));
    }
});

// Search
const searchInput = document.getElementById('searchInput');
const animeCards = document.querySelectorAll('.anime-item');

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.toLowerCase();
        const target = Array.from(animeCards).find(card =>
            card.querySelector('h2').textContent.toLowerCase().includes(query)
        );
        if (target) target.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
});

// Carousel + dots
const carousel = document.querySelector('.carousel');
const cards = carousel.querySelectorAll('.anime-item');
const dotsContainer = document.querySelector('.carousel-dots');

// create dots
cards.forEach((card, index) => {
    if (!dotsContainer) return;
    const dot = document.createElement('span');
    dot.classList.add('dot');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
        card.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    });
    dotsContainer.appendChild(dot);
});

// IntersectionObserver to track center card
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const index = Array.from(cards).indexOf(entry.target);
            localStorage.setItem('lastViewedCard', index);
            highlightCenterCard();
        }
    });
}, {
    root: carousel,
    threshold: 0.5
});

// Observe all cards
cards.forEach(card => observer.observe(card));

function highlightCenterCard() {
    const carouselRect = carousel.getBoundingClientRect();
    const carouselCenter = carouselRect.left + carouselRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(carouselCenter - cardCenter);

        card.classList.toggle('center', distance < cardRect.width / 2);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });

    localStorage.setItem('lastViewedCard', closestIndex);

    if (dotsContainer) {
        dotsContainer.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === closestIndex);
        });
    }
}

// Restore last viewed card after returning from notes
window.addEventListener('load', () => {
    setTimeout(() => {
        const lastIndex = parseInt(localStorage.getItem('lastViewedCard')) || 0;
        if (cards[lastIndex]) {
            observer.disconnect(); // temporarily stop observing
            const card = cards[lastIndex];
            const scrollLeft = card.offsetLeft - (carousel.offsetWidth / 2) + (card.offsetWidth / 2);
            carousel.scrollTo({ left: scrollLeft, behavior: 'auto' });
            highlightCenterCard();
            // resume observing
            cards.forEach(card => observer.observe(card));
        }
    }, 0);
});

carousel.addEventListener('scroll', () => {
    requestAnimationFrame(highlightCenterCard);
});

// Click on card to center
cards.forEach(card => {
    card.addEventListener('click', () => {
        card.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest'
        });
    });
});

// IMDb buttons
document.querySelectorAll('.imdb-button').forEach(button => {
    button.addEventListener('click', () => {
        const imdbUrl = button.getAttribute('data-url');
        if (imdbUrl) {
            window.open(imdbUrl, '_blank');
        }
    });
});

// Notes page functionality (if present)
const params = new URLSearchParams(window.location.search);
const animeName = params.get('anime');

const animeTitle = document.getElementById('anime-title');
if (animeTitle) {
    animeTitle.textContent = animeName;

    const savedNotes = localStorage.getItem('notes_' + animeName);
    if (savedNotes) {
        const notesArea = document.getElementById('notes');
        if (notesArea) notesArea.value = savedNotes;
    }

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const notesArea = document.getElementById('notes');
            if (notesArea) {
                const content = notesArea.value;
                localStorage.setItem('notes_' + animeName, content);
                alert('Notes saved!');
            }
        });
    }
}

// Completion checkboxes
const completionSections = document.querySelectorAll('.completion');

completionSections.forEach(section => {
    const checkbox = section.querySelector('.completion-checkbox');
    if (!checkbox) return;

    const animeKey = checkbox.dataset.anime; // unique key for each anime

    // Load saved state from localStorage
    const savedState = localStorage.getItem(animeKey);
    checkbox.checked = savedState === 'true';

    // Save state on change
    checkbox.addEventListener('change', () => {
        localStorage.setItem(animeKey, checkbox.checked);
    });
});