import { firestore, storage, isFirebaseConfigured } from "./firebase"
import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore"
import { ref, uploadString, getDownloadURL } from "firebase/storage"

// Função para realizar backup automático
export const realizarBackupAutomatico = async () => {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase não configurado. Não é possível realizar backup.")
    return null
  }

  try {
    // Coletar todos os dados do localStorage
    const dados = {}
    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i)
      dados[chave] = localStorage.getItem(chave)
    }

    // Criar um objeto com metadados do backup
    const backup = {
      dados,
      timestamp: Date.now(),
      versao: "1.0",
      nomeCartorio: localStorage.getItem("config_nomeCartorio") || "Cartório",
    }

    // Converter para JSON
    const backupJSON = JSON.stringify(backup)

    // Salvar no Firestore
    const backupRef = await addDoc(collection(firestore, "backups"), {
      timestamp: backup.timestamp,
      nomeCartorio: backup.nomeCartorio,
      tamanho: backupJSON.length,
      versao: backup.versao,
    })

    // Salvar o conteúdo completo no Storage
    const storageRef = ref(storage, `backups/${backupRef.id}.json`)
    await uploadString(storageRef, backupJSON)

    // Obter URL de download
    const downloadURL = await getDownloadURL(storageRef)

    // Atualizar último backup no localStorage
    localStorage.setItem("ultimoBackup", new Date().toLocaleString())
    localStorage.setItem("ultimoBackupURL", downloadURL)

    return downloadURL
  } catch (error) {
    console.error("Erro ao realizar backup:", error)
    return null
  }
}

// Função para listar backups disponíveis
export const listarBackups = async () => {
  if (!isFirebaseConfigured()) {
    return []
  }

  try {
    const backupsQuery = query(collection(firestore, "backups"), orderBy("timestamp", "desc"), limit(10))

    const snapshot = await getDocs(backupsQuery)

    const backups = []
    for (const doc of snapshot.docs) {
      const data = doc.data()
      const storageRef = ref(storage, `backups/${doc.id}.json`)
      const url = await getDownloadURL(storageRef)

      backups.push({
        id: doc.id,
        nome: `Backup ${new Date(data.timestamp).toLocaleString()}`,
        data: new Date(data.timestamp).toLocaleString(),
        url,
        tamanho: data.tamanho,
      })
    }

    return backups
  } catch (error) {
    console.error("Erro ao listar backups:", error)
    return []
  }
}

// Variável para armazenar o intervalo de backup
let backupInterval = null

// Função para configurar backup automático
export const configurarBackupAutomatico = (intervaloMinutos = 60) => {
  // Limpar intervalo anterior se existir
  if (backupInterval) {
    clearInterval(backupInterval)
  }

  // Configurar novo intervalo
  backupInterval = setInterval(
    () => {
      realizarBackupAutomatico()
        .then((url) => {
          if (url) {
            console.log(`Backup automático realizado com sucesso: ${url}`)
          } else {
            console.warn("Falha ao realizar backup automático")
          }
        })
        .catch((error) => {
          console.error("Erro no backup automático:", error)
        })
    },
    intervaloMinutos * 60 * 1000,
  ) // Converter minutos para milissegundos

  return backupInterval
}

// Função para restaurar backup
export const restaurarBackup = async (url) => {
  try {
    // Buscar o conteúdo do backup
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Erro ao buscar backup: ${response.status}`)
    }

    const backupJSON = await response.text()
    const backup = JSON.parse(backupJSON)

    // Verificar se o backup é válido
    if (!backup.dados) {
      throw new Error("Formato de backup inválido")
    }

    // Restaurar dados no localStorage
    Object.entries(backup.dados).forEach(([chave, valor]) => {
      localStorage.setItem(chave, valor as string)
    })

    return true
  } catch (error) {
    console.error("Erro ao restaurar backup:", error)
    return false
  }
}
