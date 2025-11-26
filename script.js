document.addEventListener('DOMContentLoaded', () => {
    
  
    const toursGrid = document.getElementById('tours-grid');
    const filterForm = document.getElementById('filter-form');
    const priceSlider = document.getElementById('price-max');
    const priceValue = document.getElementById('price-value');
    const resetFiltersBtn = document.getElementById('reset-filters');

    
    const filterInputs = document.querySelectorAll('#filter-form select, #filter-form input');


    const API_URL = 'http://127.0.0.1:5000/api/tours';

    async function fetchTours(url = API_URL) {
        try {
           
            toursGrid.innerHTML = '<div class="loader"></div>';

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Помилка HTTP: ${response.status}`);
            }

            const tours = await response.json();

            
            displayTours(tours);

        } catch (error) {
            console.error('Не вдалося завантажити тури:', error);
            toursGrid.innerHTML = '<p>Не вдалося завантажити тури. Перевірте з\'єднання з сервером.</p>';
        }
    }

    // відображення карток 
    function displayTours(tours) {
        toursGrid.innerHTML = ''; // Очищуємо контейнер

        if (tours.length === 0) {
            toursGrid.innerHTML = '<p>За вашими критеріями турів не знайдено.</p>';
            return;
        }

        tours.forEach(tour => {
            const card = document.createElement('div');
            card.className = 'tour-card';

           
            card.innerHTML = `
                <img src="${tour.image_url || 'https://via.placeholder.com/300'}" alt="${tour.title}">
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

    // Миттєві Фільтри

    
    const applyFilters = () => {
        const formData = new FormData(filterForm);
        const params = new URLSearchParams();

        formData.forEach((value, key) => {
            if (value) params.append(key, value);
        });

        const queryString = params.toString();
        const urlWithFilters = `${API_URL}?${queryString}`;
        
        console.log("Фільтруємо:", urlWithFilters);
        fetchTours(urlWithFilters);
    };

    // таймер затримки
    let timeout;

    // "Debounce" - чекає, поки  клацати/тягнути
    const debouncedApplyFilters = () => {
        // Якщо таймер вже був запущений - скасовуємо його
        clearTimeout(timeout);
        
        
        timeout = setTimeout(applyFilters, 500);
    };

   
    filterInputs.forEach(input => {
        input.addEventListener('input', debouncedApplyFilters);
        
        input.addEventListener('change', debouncedApplyFilters);
    });

    // цифра біля повзунка ціни 
    priceSlider.addEventListener('input', (event) => {
        priceValue.textContent = event.target.value;
    });

    // Скинути
    resetFiltersBtn.addEventListener('click', () => {
        filterForm.reset(); 
        
        priceValue.textContent = priceSlider.getAttribute('value') || priceSlider.max;
       
        fetchTours(API_URL);
    });


    fetchTours();

});