import { initializeApp } from "firebase/app"
import { getDatabase } from "firebase/database"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAuth } from "firebase/auth"

// Função para validar URL do Firebase Database
const isValidDatabaseURL = (url: string | null | undefined): boolean => {
  if (!url) return false
  try {
    // Verificar se a URL tem o formato correto para o Firebase Realtime Database
    return (
      url.startsWith("https://") &&
      (url.includes(".firebaseio.com") ||
        url.includes(".europe-west1.firebasedatabase.app") ||
        url.includes(".asia-southeast1.firebasedatabase.app") ||
        url.includes(".firebasedatabase.app"))
    )
  } catch (e) {
    return false
  }
}

// Obter configuração do Firebase
const getFirebaseConfig = () => {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || localStorage.getItem("firebase_apiKey") || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || localStorage.getItem("firebase_authDomain") || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || localStorage.getItem("firebase_projectId") || "",
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || localStorage.getItem("firebase_storageBucket") || "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || localStorage.getItem("firebase_messagingSenderId") || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || localStorage.getItem("firebase_appId") || "",
  }

  // Adicionar databaseURL apenas se for válida
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || localStorage.getItem("firebase_databaseURL")
  if (isValidDatabaseURL(databaseURL)) {
    config.databaseURL = databaseURL
  }

  return config
}

// Inicializar Firebase apenas no cliente
let app
let db
let firestore
let storage
let auth
let firebaseInitialized = false

if (typeof window !== "undefined") {
  try {
    const firebaseConfig = getFirebaseConfig()

    // Verificar se temos as configurações mínimas necessárias
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      app = initializeApp(firebaseConfig)
      firebaseInitialized = true

      // Inicializar Firestore (não requer databaseURL)
      firestore = getFirestore(app)
      storage = getStorage(app)
      auth = getAuth(app)

      // Inicializar Realtime Database apenas se tivermos uma URL válida
      if (firebaseConfig.databaseURL) {
        try {
          db = getDatabase(app)
          console.log("Firebase Realtime Database inicializado com sucesso")
        } catch (dbError) {
          console.error("Erro ao inicializar Firebase Realtime Database:", dbError)
          // Não impede o uso de outros serviços do Firebase
        }
      } else {
        console.warn("URL do Firebase Realtime Database não fornecida. O Realtime Database não estará disponível.")
      }
    } else {
      console.warn("Configuração do Firebase incompleta. Alguns serviços podem não funcionar corretamente.")
    }
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error)
  }
}

// Verificar se o Firebase está configurado
export const isFirebaseConfigured = () => {
  return firebaseInitialized
}

// Verificar se o Realtime Database está disponível
export const isRealtimeDatabaseAvailable = () => {
  return !!db
}

// Salvar configuração do Firebase no localStorage
export const saveFirebaseConfig = (config) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("firebase_apiKey", config.apiKey || "")
    localStorage.setItem("firebase_authDomain", config.authDomain || "")
    localStorage.setItem("firebase_projectId", config.projectId || "")
    localStorage.setItem("firebase_storageBucket", config.storageBucket || "")
    localStorage.setItem("firebase_messagingSenderId", config.messagingSenderId || "")
    localStorage.setItem("firebase_appId", config.appId || "")

    // Validar e salvar a URL do database
    if (isValidDatabaseURL(config.databaseURL)) {
      localStorage.setItem("firebase_databaseURL", config.databaseURL)
    } else {
      localStorage.removeItem("firebase_databaseURL")
      console.warn("URL do Firebase Database inválida. Formato esperado: https://<SEU-PROJETO>.firebaseio.com")
    }

    // Recarregar a página para aplicar as novas configurações
    window.location.reload()
  }
}

export { app, db, firestore, storage, auth }
