const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');


const app = express();
const PORT = 5000;


app.use(cors()); // запити з інших доменів
app.use(express.json()); 

//Firebase
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const db = admin.firestore();
console.log("Підключено до Firebase!");

// API Endpoints

// [GET] всі тури 
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

// [GET]  один тур за ID
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

// [GET] відгуки для туру
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
            //   час Firebase у читабельний формат
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


// [POST] новий відгук
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

    //   відгук у колекцію 'reviews'
    const docRef = await db.collection('reviews').add(newReview);

    res.status(201).json({ success: true, message: "Відгук додано", id: docRef.id });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.listen(PORT, () => {
  console.log(`Сервер запущено на http://127.0.0.1:${PORT}`);
});