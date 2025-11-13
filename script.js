
document.addEventListener('DOMContentLoaded', () => {
    
   
    const toursGrid = document.getElementById('tours-grid');
    const filterForm = document.getElementById('filter-form');
    const priceSlider = document.getElementById('price-max');
    const priceValue = document.getElementById('price-value');
    const resetFiltersBtn = document.getElementById('reset-filters');

  
    const API_URL = 'http://127.0.0.1:5000/api/tours';

    /**
     
      @param {string} url 
     */
    async function fetchTours(url = API_URL) {
        try {
           
            toursGrid.innerHTML = '<p>Завантаження турів...</p>';

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Помилка HTTP: ${response.status}`);
            }

            const tours = await response.json();

          
            displayTours(tours);

        } catch (error) {
            console.error('Не вдалося завантажити тури:', error);
            toursGrid.innerHTML = '<p>Не вдалося завантажити тури. Спробуйте оновити сторінку.</p>';
        }
    }

    /**
     * масив турів на сторінці
     * @param {Array} tours 
     */
    function displayTours(tours) {
        
        toursGrid.innerHTML = '';

        if (tours.length === 0) {
            toursGrid.innerHTML = '<p>За вашими фільтрами турів не знайдено.</p>';
            return;
        }

        // HTML для кожного туру
        tours.forEach(tour => {
            const card = document.createElement('div');
            card.className = 'tour-card'; 

          
            card.innerHTML = `
                <img src="${tour.image_url || 'placeholder.jpg'}" alt="${tour.title}">
                <div class="tour-card-content">
                    <h3>${tour.title}</h3>
                    <p><strong>Країна:</strong> ${tour.country}</p>
                    <p><strong>Тип:</strong> ${tour.vacation_type}</p>
                    <p class="price">${tour.price} €</p>
                    
                    <a href="tour.html?id=${tour.id}" class="details-link">Детальніше</a>
                </div>
            `;
            
         
            toursGrid.appendChild(card);
        });
    }

    //фільтри

    //  повзунок ціни
    priceSlider.addEventListener('input', (event) => {
        // Оновлення тексту
        priceValue.textContent = event.target.value;
    });

    // Застосувати
    filterForm.addEventListener('submit', (event) => {
        // Заборона формі перезавантажувати сторінку
        event.preventDefault(); 
        
        
        const formData = new FormData(filterForm);
        const params = new URLSearchParams(); 

        formData.forEach((value, key) => {
           
            if (value) {
                
                params.append(key, value);
            }
        });

      
        const queryString = params.toString();
        const urlWithFilters = `${API_URL}?${queryString}`;

        console.log('Запит з фільтрами:', urlWithFilters);
        
        
        fetchTours(urlWithFilters);
    });

    // Скинути
    resetFiltersBtn.addEventListener('click', () => {
        
        filterForm.reset(); 
        
        priceValue.textContent = priceSlider.max; 
        
        
        fetchTours(API_URL);
    });


    fetchTours();

});