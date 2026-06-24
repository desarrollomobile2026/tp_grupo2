// config.js - Puente de conexión real a Firebase (Formato Compat / UNPAZ)

const firebaseConfig = {
    apiKey: "AIzaSyClRkxdzb3chcpGATgxroZ5E5_ovf6FUDc",
    authDomain: "moniarquiaapp.firebaseapp.com",
    projectId: "moniarquiaapp",
    storageBucket: "moniarquiaapp.firebasestorage.app",
    messagingSenderId: "1091179201337",
    appId: "1:1091179201337:web:1656e5ce06b5c556639ee8",
    measurementId: "G-EQ8CVEP35Z"
};

// Inicializamos el núcleo de Firebase de forma global
firebase.initializeApp(firebaseConfig);

// Declaramos a "db" como nuestra base de datos NoSQL Firestore
const db = firebase.firestore();

console.log("🔗 Firebase inicializado correctamente en moniarquiaapp");