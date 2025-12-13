import { auth } from "./check-auth.js"; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Отримуємо ID туру з URL
    const params = new URLSearchParams(window.location.search);
    const tourId = params.get('id');
 
    // Якщо ID немає, повертаємось в каталог
    if (!tourId) { window.location.href = 'catalog.html'; return; }
    
    // Константи API та елементи
    const detailsContainer = document.getElementById('tour-details-container');
    const API_URL = `http://127.0.0.1:5000/api/tours/${tourId}`;
    const REVIEWS_API_URL = `http://127.0.0.1:5000/api/tours/${tourId}/reviews`;
    const BOOKING_API_URL = `http://127.0.0.1:5000/api/bookings`; // Endpoint для бронювання
    
    let currentTourData = null;

    // --- ЕЛЕМЕНТИ МОДАЛКИ БРОНЮВАННЯ ---
    const bookingModal = document.getElementById('booking-modal');
    const closeBookingBtn = document.getElementById('close-booking');
    const bookingForm = document.getElementById('booking-form');
    const bookingTitle = document.getElementById('booking-tour-title');
    
    // Поля дат
    const startDateInput = document.getElementById('book-date');
    const endDateInput = document.getElementById('book-date-end');

    // --- ЛОГІКА ЗАКРИТТЯ МОДАЛКИ ---
    if (closeBookingBtn) {
        closeBookingBtn.onclick = () => bookingModal.style.display = 'none';
    }
    window.onclick = (event) => {
        // Закриваємо модалку бронювання або профілю, якщо клікнули за їх межами
        if (event.target == bookingModal) bookingModal.style.display = 'none';
        const profileModal = document.getElementById('profile-modal');
        if (event.target == profileModal) profileModal.style.display = 'none';
    };

    // --- ЛОГІКА ДАТ (Валідація діапазону) ---
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', function() {
            // Мінімальна дата завершення = обрана дата початку
            endDateInput.min = this.value;
            
            // Якщо поточна кінцева дата менша за нову початкову, скидаємо її
            if (endDateInput.value && endDateInput.value < this.value) {
                endDateInput.value = this.value;
            }
        });
    }

    // --- ГЛОБАЛЬНА ФУНКЦІЯ ВИДАЛЕННЯ ВІДГУКУ ---
    window.deleteReview = async function(reviewId) {
        if (!confirm("Ви точно хочете видалити цей відгук?")) return;

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/reviews/${reviewId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchReviews();
            } else {
                alert("Не вдалося видалити відгук");
            }
        } catch (err) {
            console.error(err);
            alert("Помилка сервера");
        }
    };

    // --- ЗАВАНТАЖЕННЯ ДЕТАЛЕЙ ТУРУ ---
    async function fetchTourDetails() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Помилка завантаження туру');
            currentTourData = await response.json();
            
            renderTourPage(currentTourData); 
            fetchReviews(); 

        } catch (error) {
            console.error(error);
            detailsContainer.innerHTML = '<p style="text-align:center;">Помилка завантаження деталей туру.</p>';
        }
    }

    // --- ВІДОБРАЖЕННЯ СТОРІНКИ ---
    function renderTourPage(tour) {
        // SVG іконка серця
        const heartSvg = `
            <svg id="big-heart-icon" width="30" height="30" viewBox="0 0 24 24" 
                    fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
        `;
    
        // Вставка HTML в контейнер
        detailsContainer.innerHTML = `
            <button class="fav-btn" id="fav-btn-action" style="background: rgba(255,255,255,0.8); z-index: 10;">
                ${heartSvg}
            </button>
            <div class="tour-header-section">
                <img src="${tour.image_url}" alt="${tour.title}" class="tour-image-large">
                <div class="tour-info-column">
                    <h1 class="tour-title-large">${tour.title}</h1>
                    <div class="tour-specs">
                        <span class="spec-label">країна:</span><span class="spec-value">${tour.country}</span>
                        <span class="spec-label">тип:</span><span class="spec-value">${tour.vacation_type}</span>
                        <span class="spec-label">ціна:</span><span class="spec-price spec-value">${tour.price}€</span>
                    </div>
                    <div class="tour-description-text">${tour.description || "Опис завантажується..."}</div>
                    
                    <button class="book-btn" id="open-booking-btn">забронювати</button>
                </div>
            </div>
            
            <div class="reviews-wrapper">
                <div class="review-section-title">Відгуки:</div>
                
                <div id="reviews-list" style="margin-bottom: 40px;">
                    <div class="loader" style="margin: 0 auto;"></div>
                </div>

                <div class="review-section-title">Залишити відгук:</div>
                <form id="review-form-element">
                    
                    <div style="margin-bottom: 15px;">
                        <span id="review-author-name" style="font-size: 22px; font-weight: bold; color: #380404;">Гість</span>
                    </div>
                    
                    <select id="rating" class="review-box" 
                            style="height: 55px; padding: 0 20px; margin-bottom: 15px; color: #000; font-style: normal; cursor: pointer;">
                        <option value="5" selected>5 - Чудово</option>
                        <option value="4">4 - Добре</option>
                        <option value="3">3 - Нормально</option>
                        <option value="2">2 - Погано</option>
                        <option value="1">1 - Жахливо</option>
                    </select>
                    
                    <textarea id="comment" class="review-input" placeholder="Написати відгук..." required></textarea>
                    <button type="submit" class="btn" style="margin-top:10px; width: 100%;">Надіслати</button>
                </form>
            </div>
        `;

        // 1. Додаємо обробник для відгуків
        const formElem = document.getElementById('review-form-element');
        if (formElem) formElem.addEventListener('submit', handleReviewSubmit);
        
        // 2. Додаємо обробник для кнопки "В обране"
        document.getElementById('fav-btn-action').addEventListener('click', () => {
            const user = auth.currentUser; 
            toggleBigHeart(tourId, user);
        });

        // 3. Додаємо обробник для кнопки "Забронювати" (Відкриття модалки)
        const openBtn = document.getElementById('open-booking-btn');
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                bookingModal.style.display = 'flex';
                bookingTitle.innerText = `Тур: ${tour.title}`;
                
                // Встановлюємо мінімальну дату = сьогодні
                const today = new Date().toISOString().split('T')[0];
                if (startDateInput) {
                    startDateInput.min = today;
                    startDateInput.value = ''; // Скидаємо значення
                }
                if (endDateInput) {
                    endDateInput.min = today;
                    endDateInput.value = ''; // Скидаємо значення
                }

                // Автозаповнення імені, якщо користувач авторизований
                const user = auth.currentUser;
                const nameField = document.getElementById('book-name');
                if (user && user.displayName && nameField) {
                    nameField.value = user.displayName;
                }
            });
        }
    }

    // --- ОБРОБКА ВІДПРАВКИ ФОРМИ БРОНЮВАННЯ ---
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerText = "Обробка...";

            const user = auth.currentUser;
            
            // Збираємо дані з форми
            const bookingData = {
                tour_id: tourId,
                tour_title: currentTourData ? currentTourData.title : "Невідомий тур",
                name: document.getElementById('book-name').value,
                phone: document.getElementById('book-phone').value,
                date: startDateInput.value,     // Дата початку
                dateEnd: endDateInput.value,    // Дата завершення (НОВЕ)
                people: document.getElementById('book-people').value,
                user_email: user ? user.email : "guest"
            };

            try {
                const response = await fetch(BOOKING_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                });

                if (response.ok) {
                    alert("Дякуємо! Ваша заявка прийнята. Менеджер зв'яжеться з вами.");
                    bookingModal.style.display = 'none';
                    bookingForm.reset();
                } else {
                    const err = await response.json();
                    alert("Помилка: " + (err.error || "Невідома помилка"));
                }
            } catch (error) {
                console.error(error);
                alert("Помилка з'єднання з сервером");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = "Підтвердити";
            }
        });
    }

    // --- ФУНКЦІЇ ДЛЯ ВІДГУКІВ ---
    async function fetchReviews() {
        const list = document.getElementById('reviews-list');
        if (!list) return;

        try {
            const response = await fetch(REVIEWS_API_URL);
            if (!response.ok) {
                const errText = await response.text(); 
                throw new Error(errText || 'Помилка сервера');
            }
            
            const reviews = await response.json();
            list.innerHTML = ''; 
            
            if (reviews.length === 0) {
                list.innerHTML = '<p style="text-align:center; color:#777; font-style:italic;">Поки що немає відгуків. Будьте першим!</p>';
                return;
            }

            const currentUser = auth.currentUser;
            const currentUserName = currentUser ? (currentUser.displayName || currentUser.email.split('@')[0]) : null;

            reviews.forEach(review => {
                const item = document.createElement('div');
                item.className = 'review-box';
                item.style.padding = '20px';
                item.style.display = 'flex';
                item.style.flexDirection = 'column';
                item.style.gap = '10px';
                item.style.marginBottom = '20px';

                let avatarSrc = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';
                if (currentUserName && review.author_name === currentUserName) {
                    const myAvatar = localStorage.getItem(`avatar_${currentUser.email}`);
                    if (myAvatar) avatarSrc = myAvatar;
                }

                const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

                let deleteButtonHTML = '';
                if (currentUserName && review.author_name === currentUserName) {
                    deleteButtonHTML = `
                        <button onclick="deleteReview('${review.id}')" 
                                style="color: #e74c3c; background: none; border: none; cursor: pointer; font-size: 14px; text-decoration: underline; margin-left: 10px;">
                            (видалити)
                        </button>
                    `;
                }

                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:15px; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 10px;">
                        <img src="${avatarSrc}" style="width:50px; height:50px; border-radius:50%; object-fit: cover; border: 2px solid #E6842E;">
                        <div style="flex:1;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <span style="font-weight:bold; font-size: 20px; color:#380404;">${review.author_name}</span>
                                    ${deleteButtonHTML}
                                </div>
                                <span style="font-size: 14px; color:#999;">${review.created_at || 'щойно'}</span>
                            </div>
                            <div style="font-size: 16px; color:#e6842e;">${stars}</div>
                        </div>
                    </div>
                    <div style="font-size: 18px; color: #333; line-height: 1.4;">
                        ${review.comment}
                    </div>
                `;
                list.appendChild(item);
            });

        } catch (error) {
            console.error("Fetch Reviews Error:", error);
            list.innerHTML = `<div style="color:red; text-align:center; padding: 10px;">
                <p>Не вдалося завантажити відгуки: ${error.message}</p>
            </div>`;
        }
    }
    
    async function handleReviewSubmit(event) {
        event.preventDefault(); 
        const user = auth.currentUser;
        if (!user) {
            alert("Увійдіть, щоб залишити відгук!");
            window.location.href = 'login.html';
            return;
        }

        const ratingVal = document.getElementById('rating').value;
        const commentVal = document.getElementById('comment').value;
        const authorVal = user.displayName || user.email.split('@')[0];

        if (!commentVal.trim()) { alert("Напишіть текст відгуку!"); return; }

        const newReview = {
            author_name: authorVal,
            rating: parseInt(ratingVal),
            comment: commentVal
        };
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = "Відправка...";

        try {
            const response = await fetch(REVIEWS_API_URL, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReview)  
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Помилка');
            }
            
            document.getElementById('comment').value = ''; 
            await fetchReviews();  
            
        } catch (error) {
            console.error(error);
            alert('Помилка при відправці: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "Надіслати";
        }
    }

    // --- ФУНКЦІОНАЛ ВИБРАНОГО (Favorites) ---
    function updateHeartVisual(isFav) {
        const svg = document.getElementById('big-heart-icon');
        if (!svg) return;
        if (isFav) {
            svg.setAttribute('fill', '#e74c3c');
            svg.setAttribute('stroke', '#e74c3c');
        } else {
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', '#333');
        }
    }

    function toggleBigHeart(id, user) {
        if (!user) { alert("Увійдіть, щоб додавати у вибране!"); return; }
        const storageKey = `favorites_${user.email}`;
        let favorites = JSON.parse(localStorage.getItem(storageKey)) || [];
        
        if (favorites.includes(id)) {
            favorites = favorites.filter(favId => favId !== id);
        } else {
            favorites.push(id);
        }
        localStorage.setItem(storageKey, JSON.stringify(favorites));
        updateHeartVisual(favorites.includes(id));
    }

    // --- ПЕРЕВІРКА СТАНУ АВТОРИЗАЦІЇ ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const nameSpan = document.getElementById('review-author-name');
            if(nameSpan) nameSpan.innerText = user.displayName || user.email.split('@')[0];

            const favorites = JSON.parse(localStorage.getItem(`favorites_${user.email}`)) || [];
            updateHeartVisual(favorites.includes(tourId));
            
            fetchReviews();
        } else {
             const nameSpan = document.getElementById('review-author-name');
             if(nameSpan) nameSpan.innerText = "Гість (увійдіть)";
        }
    });

    
    fetchTourDetails();    
});