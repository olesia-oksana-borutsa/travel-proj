import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";


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
export const auth = getAuth(app); // Експортуємо auth для інших файлів

//  UI ---
const guestButtons = document.getElementById('guest-buttons');
const userInfoDiv = document.getElementById('user-info');
const profileBtn = document.getElementById('profile-btn');

// --- МОДАЛКА ---
const modal = document.getElementById('profile-modal');
const closeModal = document.getElementById('close-profile');
const profileNameInput = document.getElementById('profile-name');
const profileEmailDisplay = document.getElementById('profile-email');
const profileAvatar = document.getElementById('profile-avatar');
const saveBtn = document.getElementById('save-profile-btn');
const logoutBtnModal = document.getElementById('logout-btn-modal');
const avatarInput = document.getElementById('avatar-input');

// --- ПЕРЕВІРКА ВХОДУ ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Увійшов
        if (guestButtons) guestButtons.style.display = 'none';
        if (userInfoDiv) userInfoDiv.style.display = 'block';

        const displayName = user.displayName || user.email.split('@')[0];
        
        // Налаштування кнопки профілю
        if (profileBtn) {
            profileBtn.innerText = displayName;
            profileBtn.onclick = () => {
                if (modal) {
                    modal.style.display = 'flex';
                    profileNameInput.value = user.displayName || '';
                    profileEmailDisplay.textContent = user.email;
                    
                    const savedAvatar = localStorage.getItem(`avatar_${user.email}`);
                    if (savedAvatar) {
                        profileAvatar.src = savedAvatar;
                    } else {
                        profileAvatar.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                    }
                }
            };
        }

        // Автозаповнення імені у відгуках (якщо є поле)
        const reviewAuthor = document.getElementById('author_name');
        if (reviewAuthor) {
            reviewAuthor.value = displayName;
            reviewAuthor.readOnly = true; 
        }

    } else {
        // Гість
        if (guestButtons) guestButtons.style.display = 'flex';
        if (userInfoDiv) userInfoDiv.style.display = 'none';
        
        const reviewAuthor = document.getElementById('author_name');
        if (reviewAuthor) {
            reviewAuthor.value = '';
            reviewAuthor.readOnly = false;
        }
    }
});

// ФУНКЦІОНАЛ МОДАЛКИ 
if (closeModal) closeModal.onclick = () => { modal.style.display = 'none'; };
window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };

// Фото (Preview + Стиснення)
if (avatarInput) {
    avatarInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Фото занадто велике!"); 
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                // Стискаємо візуально (можна додати canvas, але для простоти поки так)
                profileAvatar.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    };
}

// Збереження
if (saveBtn) {
    saveBtn.onclick = () => {
        const user = auth.currentUser;
        if (!user) return;

        const newName = profileNameInput.value.trim();
        const newPhotoBase64 = profileAvatar.src; 

        if (!newName) {
            alert("Введіть ім'я!");
            return;
        }

        updateProfile(user, { displayName: newName })
        .then(() => {
            try {
                localStorage.setItem(`avatar_${user.email}`, newPhotoBase64);
                alert("Профіль збережено!");
                modal.style.display = 'none';
                if (profileBtn) profileBtn.innerText = newName;
                const reviewAuthor = document.getElementById('author_name');
                if (reviewAuthor) reviewAuthor.value = newName;
            } catch (e) {
                alert("Фото занадто велике для збереження, але ім'я оновлено.");
            }
        })
        .catch((error) => {
            console.error(error);
            alert(`Помилка: ${error.message}`);
        });
    };
}

// Вихід
if (logoutBtnModal) {
    logoutBtnModal.onclick = () => {
        signOut(auth).then(() => window.location.reload());
    };
}