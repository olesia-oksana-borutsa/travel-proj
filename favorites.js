import { auth } from "./check-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('favorites-grid');
    const API_URL = 'http://127.0.0.1:5000/api/tours';

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            grid.innerHTML = '<p style="text-align:center; width:100%; font-size: 20px;">Увійдіть, щоб побачити збережені тури.</p>';
            return;
        }

        const storageKey = `favorites_${user.email}`;
        const favorites = JSON.parse(localStorage.getItem(storageKey)) || [];

        if (favorites.length === 0) {
            grid.innerHTML = '<p style="text-align:center; width:100%; font-size: 20px;">Ваш список вибраного порожній.</p>';
            return;
        }

        try {
            grid.innerHTML = '<div class="loader"></div>';
            const response = await fetch(API_URL);
            const allTours = await response.json();
            
            const favTours = allTours.filter(tour => favorites.includes(tour.id));
            grid.innerHTML = ''; 

            if (favTours.length === 0) {
                 grid.innerHTML = '<p style="text-align:center; width:100%;">Тури не знайдено.</p>';
                 return;
            }

            favTours.forEach(tour => {
                 const card = document.createElement('div');
                 card.className = 'tour-card';
                 card.innerHTML = `
                    <div class="card-image-wrapper">
                        <img src="${tour.image_url}" alt="${tour.title}">
                        <button class="card-fav-btn active" onclick="removeFromFavorites(event, '${tour.id}', this, '${user.email}')">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#e74c3c" stroke="#e74c3c" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        </button>
                    </div>
                    <h3>${tour.title}</h3>
                    <div class="tour-info-row"><strong>країна:</strong> <span>${tour.country}</span></div>
                    <div class="tour-info-row"><strong>тип:</strong> <span>${tour.vacation_type}</span></div>
                    <p class="price">${tour.price} €</p>
                    <a href="tour.html?id=${tour.id}" class="details-link">детальніше</a>
                 `;
                 grid.appendChild(card);
            });
        } catch (error) {
            console.error(error);
            grid.innerHTML = '<p>Помилка завантаження.</p>';
        }
    });
});

window.removeFromFavorites = function(event, id, btn, userEmail) {
    event.preventDefault();
    const storageKey = `favorites_${userEmail}`;
    let favorites = JSON.parse(localStorage.getItem(storageKey)) || [];
    favorites = favorites.filter(favId => favId !== id);
    localStorage.setItem(storageKey, JSON.stringify(favorites));
    btn.closest('.tour-card').remove();
    if (favorites.length === 0) {
        document.getElementById('favorites-grid').innerHTML = '<p style="text-align:center; width:100%; font-size: 20px;">Ваш список вибраного порожній.</p>';
    }
};