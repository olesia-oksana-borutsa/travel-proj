 
document.addEventListener('DOMContentLoaded', () => {

    //  ID ТУРУ З URL-АДРЕСИ  
    
    
    const params = new URLSearchParams(window.location.search);
    
    
    const tourId = params.get('id');
 
    if (!tourId) {
        alert('Помилка: ID туру не знайдено!');
        window.location.href = 'index.html'; 
        return; 
    }
    
    const detailsContainer = document.getElementById('tour-details-container');
    const reviewsList = document.getElementById('reviews-list');
    const reviewForm = document.getElementById('review-form');

     
    const TOUR_API_URL = `http://127.0.0.1:5000/api/tours/${tourId}`;
    const REVIEWS_API_URL = `http://127.0.0.1:5000/api/tours/${tourId}/reviews`;
    
    //  ІНФОРМАЦІЯ ПРО ТУР  
    
    async function fetchTourDetails() {
        try {
            
            const response = await fetch(TOUR_API_URL);
            if (!response.ok) throw new Error('Не вдалося завантажити тур');
            
            const tour = await response.json();
       
            detailsContainer.innerHTML = `
                <img src="${tour.image_url}" alt="${tour.title}">
                <div id="tour-details-info">
                    <h2>${tour.title}</h2>
                    <p><strong>Країна:</strong> ${tour.country}</p>
                    <p><strong>Тип:</strong> ${tour.vacation_type}</p>
                    <h3 class="price">${tour.price} UAH</h3>
                    <p>${tour.description}</p>
                </div>
            `;
            
        } catch (error) {
            console.error(error);
            detailsContainer.innerHTML = '<p>Помилка завантаження деталей туру.</p>';
        }
    }
    
    // ВІДГУКИ 

    async function fetchReviews() {
        try {
            
            const response = await fetch(REVIEWS_API_URL);
            if (!response.ok) throw new Error('Не вдалося завантажити відгуки');

            const reviews = await response.json();
            
             
            reviewsList.innerHTML = '';
            
            if (reviews.length === 0) {
                reviewsList.innerHTML = '<p>Відгуків ще немає. Будьте першим!</p>';
                return;
            }

            //  HTML для кожного відгуку
            reviews.forEach(review => {
                const reviewElement = document.createElement('div');
                reviewElement.className = 'review-item';
                
                // зірковий рейтинг
                let ratingStars = '⭐'.repeat(review.rating); // '⭐' * 5 = '⭐⭐⭐⭐⭐'
                
                reviewElement.innerHTML = `
                    <p><strong>${review.author_name}</strong> 
                       <span class="rating">${ratingStars}</span></p>
                    <p>${review.comment}</p>
                    <small>${review.created_at || ''}</small>
                `;
                reviewsList.appendChild(reviewElement);
            });
            
        } catch (error) {
            console.error(error);
            reviewsList.innerHTML = '<p>Помилка завантаження відгуків.</p>';
        }
    }
    
    //   ФОРМИ ДЛЯ ВІДПРАВКИ ВІДГУКУ 

    reviewForm.addEventListener('submit', async (event) => {
         
        event.preventDefault(); 
       
        const newReview = {
            author_name: document.getElementById('author_name').value,
            rating: parseInt(document.getElementById('rating').value),
            comment: document.getElementById('comment').value
        };
        
        try {
            //   відправити дані на сервер
          
            const response = await fetch(REVIEWS_API_URL, {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json'  
                },
                body: JSON.stringify(newReview)  
            });

            if (!response.ok) throw new Error('Помилка відправки відгуку');
            
             
            reviewForm.reset();  
            fetchReviews();  
            
        } catch (error) {
            console.error(error);
            alert('Не вдалося додати ваш відгук.');
        }
    });

  
    fetchTourDetails(); 
    fetchReviews();      
    
});