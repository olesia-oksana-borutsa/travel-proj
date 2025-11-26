
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyCLenh2y3jfKUTckNlgkVLVv5Xo5lDNi1o",
  authDomain: "travel-agency-project-6f61e.firebaseapp.com",
  projectId: "travel-agency-project-6f61e",
  storageBucket: "travel-agency-project-6f61e.firebasestorage.app",
  messagingSenderId: "944478590163",
  appId: "1:944478590163:web:9eeda966fc09f5cef1b026",
  measurementId: "G-RW9DSN1W63"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('btn-login');
const registerBtn = document.getElementById('btn-register');
const msgBox = document.getElementById('message');


if (registerBtn) {
    registerBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value;
        const password = passwordInput.value;

        if (password.length < 6) {
            showMessage("Пароль має бути мінімум 6 символів!", "red");
            return;
        }

        showMessage("Створюємо акаунт...", "blue");

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
          
            showMessage(`Успішно! Вітаємо, ${user.email}. Переходимо до каталогу...`, "green");
            
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } catch (error) {
            console.error(error.code);
            
            //  ПОВІДОМЛЕННЯ ДЛЯ ПОМИЛОК РЕЄСТРАЦІЇ 
            if (error.code === 'auth/email-already-in-use') {
                showMessage("Такий користувач вже існує! Будь ласка, увійдіть.", "red");
            } else if (error.code === 'auth/invalid-email') {
                showMessage("Некоректна пошта.", "red");
            } else {
                showMessage("Помилка: " + error.message, "red");
            }
        }
    });
}


if (loginBtn) {
    loginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value;
        const password = passwordInput.value;

        showMessage("Перевіряємо дані...", "blue");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Успішний вхід
            showMessage(`З поверненням, ${user.email}!`, "green");
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            console.error(error.code);

            
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
                showMessage("Користувача не знайдено або невірний пароль. Спробуйте зареєструватись.", "red");
            } else if (error.code === 'auth/wrong-password') {
                 showMessage("Невірний пароль.", "red");
            } else if (error.code === 'auth/invalid-email') {
                showMessage("Некоректна пошта.", "red");
            } else {
                showMessage("Помилка входу.", "red");
            }
        }
    });
}


function showMessage(text, color) {
    msgBox.textContent = text;
    msgBox.style.color = color;
    msgBox.style.fontWeight = "bold";
}