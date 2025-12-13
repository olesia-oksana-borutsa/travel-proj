const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors()); 
app.use(express.json()); 

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
console.log("Підключено до Firebase!");

//  Endpoints

//  всі тури (з фільтрацією)
app.get('/api/tours', async (req, res) => {
  try {
    let query = db.collection('tours');
    const { country, price_max, type } = req.query;

    if (country) {
      query = query.where('country', '==', country);
    }
    if (price_max) {
      query = query.where('price', '<=', parseFloat(price_max));
    }
    if (type) {
      query = query.where('vacation_type', '==', type);
    }
   
    const snapshot = await query.get();
    const toursList = [];
    snapshot.forEach(doc => {
      toursList.push({
        id: doc.id,          
        ...doc.data()       
      });
    });

    res.json(toursList);

  } catch (error) {
    console.error("ПОМИЛКА:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Отримати один тур за ID
app.get('/api/tours/:tour_id', async (req, res) => {
  try {
    const { tour_id } = req.params;  
    const docRef = db.collection('tours').doc(tour_id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Тур не знайдено" });
    }

    res.json({
      id: doc.id,
      ...doc.data()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  Отримати відгуки для туру
app.get('/api/tours/:tour_id/reviews', async (req, res) => {
    try {
        const { tour_id } = req.params;

        const reviewsList = [];
      
        const query = db.collection('reviews')
            .where('tour_id', '==', tour_id)
            .orderBy('created_at', 'desc'); 

        const snapshot = await query.get();

        snapshot.forEach(doc => {
            const data = doc.data();
        
            if (data.created_at) {
                data.created_at = data.created_at.toDate().toLocaleString('uk-UA');
            }
            reviewsList.push({
                id: doc.id, 
                ...data
            });
        });

        res.json(reviewsList);

    } catch (error) {
        console.error("ПОМИЛКА (reviews):", error.message);
        res.status(500).json({ error: error.message });
    }
});


// Додати новий відгук
app.post('/api/tours/:tour_id/reviews', async (req, res) => {
  try {
    const { tour_id } = req.params;
    const { author_name, rating, comment } = req.body;

    if (!author_name || !rating || !comment) {
      return res.status(400).json({ error: "Потрібні всі поля: author_name, rating, comment" });
    }
    
    const newReview = {
      tour_id: tour_id,
      author_name: author_name,
      rating: parseInt(rating), 
      comment: comment,
      created_at: admin.firestore.FieldValue.serverTimestamp() 
    };

    const docRef = await db.collection('reviews').add(newReview);
    res.status(201).json({ success: true, message: "Відгук додано", id: docRef.id });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//  Створити бронювання
app.post('/api/bookings', async (req, res) => {
    try {
       
        const { tour_id, tour_title, name, phone, date, dateEnd, people, user_email } = req.body;

        if (!tour_id || !name || !phone || !date || !dateEnd) {
            return res.status(400).json({ error: "Заповніть всі обов'язкові поля" });
        }

        const newBooking = {
            tour_id,
            tour_title,
            name,
            phone,
            date,       
            dateEnd,   
            people: parseInt(people),
            user_email: user_email || "Гість",
            status: "new",
            created_at: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('bookings').add(newBooking);
        res.status(201).json({ success: true, message: "Бронювання успішне!" });

    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ error: error.message });
    }
});



// Видалити відгук
app.delete('/api/reviews/:review_id', async (req, res) => {
    try {
        const { review_id } = req.params;
        await db.collection('reviews').doc(review_id).delete();
        res.json({ success: true, message: "Відгук видалено" });
    } catch (error) {
        console.error("Помилка видалення:", error);
        res.status(500).json({ error: error.message });
    }
});


app.listen(PORT, () => {
  console.log(`Сервер запущено на http://127.0.0.1:${PORT}`);
});