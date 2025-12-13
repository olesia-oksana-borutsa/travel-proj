import { auth } from "./check-auth.js"; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const toursGrid = document.getElementById('tours-grid');
    const filterForm = document.getElementById('filter-form');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const filterInputs = document.querySelectorAll('#filter-form select, #filter-form input');
    const API_URL = 'http://127.0.0.1:5000/api/tours';
    let loadedTours = [];

    async function fetchTours(url = API_URL) {
        try {
            toursGrid.innerHTML = '<div class="loader"></div>';
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            
            loadedTours = await response.json();
            
            onAuthStateChanged(auth, (user) => {
                displayTours(loadedTours, user);
            });
        } catch (error) {
            console.error('Error:', error);
            toursGrid.innerHTML = '<p>Не вдалося завантажити тури.</p>';
        }
    }

    function displayTours(tours, user) {
        toursGrid.innerHTML = ''; 
        if (tours.length === 0) {
            toursGrid.innerHTML = '<p>За вашими критеріями турів не знайдено.</p>';
            return;
        }
        let favorites = [];
        if (user) {
            favorites = JSON.parse(localStorage.getItem(`favorites_${user.email}`)) || [];
        }

        tours.forEach(tour => {
            const card = document.createElement('div');
            card.className = 'tour-card';
            const isFav = favorites.includes(tour.id);
            const fill = isFav ? '#e74c3c' : 'none';
            const stroke = isFav ? '#e74c3c' : 'currentColor';
            const heartSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${tour.image_url || 'https://via.placeholder.com/300'}" alt="${tour.title}">
                    <button class="card-fav-btn ${isFav ? 'active' : ''}" onclick="toggleHeart(event, '${tour.id}')">
                        ${heartSvg}
                    </button>
                </div>
                <h3>${tour.title}</h3>
                <div class="tour-info-row"><strong>країна:</strong> <span>${tour.country}</span></div>
                <div class="tour-info-row"><strong>тип:</strong> <span>${tour.vacation_type}</span></div>
                <p class="price">${tour.price} €</p>
                <a href="tour.html?id=${tour.id}" class="details-link">детальніше</a>
            `;
            toursGrid.appendChild(card);
        });
    }

    window.toggleHeart = function(event, id) {
        event.preventDefault();
        const user = auth.currentUser;
        if (!user) { alert("Будь ласка, увійдіть!"); return; }
        const storageKey = `favorites_${user.email}`;
        let favorites = JSON.parse(localStorage.getItem(storageKey)) || [];
        const btn = event.currentTarget;
        const svg = btn.querySelector('svg');

        if (favorites.includes(id)) {
            favorites = favorites.filter(favId => favId !== id);
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            btn.classList.remove('active');
        } else {
            favorites.push(id);
            svg.setAttribute('fill', '#e74c3c');
            svg.setAttribute('stroke', '#e74c3c');
            btn.classList.add('active');
        }
        localStorage.setItem(storageKey, JSON.stringify(favorites));
    };

    const applyFilters = () => {
        const formData = new FormData(filterForm);
        const params = new URLSearchParams();
        formData.forEach((value, key) => { if (value) params.append(key, value); });
        fetchTours(`${API_URL}?${params.toString()}`);
    };

    let timeout;
    const debouncedApplyFilters = () => { clearTimeout(timeout); timeout = setTimeout(applyFilters, 500); };
    filterInputs.forEach(input => { input.addEventListener('input', debouncedApplyFilters); input.addEventListener('change', debouncedApplyFilters); });
    if (resetFiltersBtn) { resetFiltersBtn.addEventListener('click', () => { filterForm.reset(); fetchTours(API_URL); }); }

    fetchTours();
});