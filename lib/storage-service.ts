// Serviço de armazenamento aprimorado com suporte a IndexedDB e fallback para localStorage
import { toast } from "@/components/ui/use-toast"

// Interface para operações de armazenamento
interface StorageInterface {
  getItem(key: string): Promise<any>
  setItem(key: string, value: any): Promise<void>
  removeItem(key: string): Promise<void>
  getAllKeys(): Promise<string[]>
  clear(): Promise<void>
}

// Implementação usando IndexedDB
class IndexedDBStorage implements StorageInterface {
  private dbName = "cartorio-sistema-senhas"
  private dbVersion = 1
  private storeName = "dados"
  private db: IDBDatabase | null = null
  private dbReady: Promise<IDBDatabase>

  constructor() {
    this.dbReady = this.initDB()
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db)
        return
      }

      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = (event) => {
        console.error("Erro ao abrir IndexedDB:", event)
        reject(new Error("Não foi possível abrir o banco de dados IndexedDB"))
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
    })
  }

  private async getStore(mode: IDBTransactionMode = "readonly"): Promise<IDBObjectStore> {
    const db = await this.dbReady
    const transaction = db.transaction(this.storeName, mode)
    return transaction.objectStore(this.storeName)
  }

  async getItem(key: string): Promise<any> {
    try {
      const store = await this.getStore()
      return new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(new Error(`Erro ao obter item: ${key}`))
      })
    } catch (error) {
      console.error("Erro ao acessar IndexedDB:", error)
      return null
    }
  }

  async setItem(key: string, value: any): Promise<void> {
    try {
      const store = await this.getStore("readwrite")
      return new Promise((resolve, reject) => {
        const request = store.put(value, key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error(`Erro ao salvar item: ${key}`))
      })
    } catch (error) {
      console.error("Erro ao salvar no IndexedDB:", error)
      throw error
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const store = await this.getStore("readwrite")
      return new Promise((resolve, reject) => {
        const request = store.delete(key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error(`Erro ao remover item: ${key}`))
      })
    } catch (error) {
      console.error("Erro ao remover do IndexedDB:", error)
      throw error
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const store = await this.getStore()
      return new Promise((resolve, reject) => {
        const request = store.getAllKeys()
        request.onsuccess = () => resolve(Array.from(request.result as IDBValidKey[]).map((key) => String(key)))
        request.onerror = () => reject(new Error("Erro ao obter todas as chaves"))
      })
    } catch (error) {
      console.error("Erro ao obter chaves do IndexedDB:", error)
      return []
    }
  }

  async clear(): Promise<void> {
    try {
      const store = await this.getStore("readwrite")
      return new Promise((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error("Erro ao limpar armazenamento"))
      })
    } catch (error) {
      console.error("Erro ao limpar IndexedDB:", error)
      throw error
    }
  }
}

// Implementação usando localStorage (fallback)
class LocalStorageAdapter implements StorageInterface {
  async getItem(key: string): Promise<any> {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error("Erro ao ler do localStorage:", error)
      return null
    }
  }

  async setItem(key: string, value: any): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error("Erro ao salvar no localStorage:", error)
      // Verificar se é erro de cota excedida
      if (
        error instanceof DOMException &&
        (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
      ) {
        toast({
          title: "Armazenamento cheio",
          description: "O armazenamento do navegador está cheio. Alguns dados podem ser perdidos.",
          variant: "destructive",
        })
      }
      throw error
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error("Erro ao remover do localStorage:", error)
      throw error
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage)
    } catch (error) {
      console.error("Erro ao obter chaves do localStorage:", error)
      return []
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear()
    } catch (error) {
      console.error("Erro ao limpar localStorage:", error)
      throw error
    }
  }
}

// Classe principal do serviço de armazenamento
class StorageService {
  private static instance: StorageService
  private storage: StorageInterface
  private storageType: "indexeddb" | "localstorage"

  private constructor() {
    // Verificar se IndexedDB está disponível
    if (typeof window !== "undefined" && window.indexedDB) {
      try {
        this.storage = new IndexedDBStorage()
        this.storageType = "indexeddb"
        console.log("Usando IndexedDB para armazenamento")
      } catch (error) {
        console.warn("Erro ao inicializar IndexedDB, usando localStorage como fallback:", error)
        this.storage = new LocalStorageAdapter()
        this.storageType = "localstorage"
      }
    } else {
      this.storage = new LocalStorageAdapter()
      this.storageType = "localstorage"
      console.log("IndexedDB não disponível, usando localStorage")
    }
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  // Métodos públicos
  public async loadData<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const data = await this.storage.getItem(key)
      return data !== null ? data : defaultValue
    } catch (error) {
      console.error(`Erro ao carregar dados (${key}):`, error)
      return defaultValue
    }
  }

  public async saveData<T>(key: string, data: T): Promise<void> {
    try {
      await this.storage.setItem(key, data)
    } catch (error) {
      console.error(`Erro ao salvar dados (${key}):`, error)
      toast({
        title: "Erro ao salvar dados",
        description: "Não foi possível salvar os dados. Verifique o espaço disponível.",
        variant: "destructive",
      })
      throw error
    }
  }

  public async removeData(key: string): Promise<void> {
    try {
      await this.storage.removeItem(key)
    } catch (error) {
      console.error(`Erro ao remover dados (${key}):`, error)
      throw error
    }
  }

  public async getAllKeys(): Promise<string[]> {
    try {
      return await this.storage.getAllKeys()
    } catch (error) {
      console.error("Erro ao obter todas as chaves:", error)
      return []
    }
  }

  public getStorageType(): string {
    return this.storageType
  }

  // Método para limpar dados antigos
  public async cleanupOldData(olderThanDays = 30): Promise<number> {
    try {
      const keys = await this.getAllKeys()
      const now = Date.now()
      const cutoffTime = now - olderThanDays * 24 * 60 * 60 * 1000
      let removedCount = 0

      for (const key of keys) {
        // Verificar se é um ticket ou histórico
        if (key.startsWith("ticket_") || key.startsWith("historico_")) {
          const data = await this.loadData(key, null)
          if (data && data.timestamp && data.timestamp < cutoffTime) {
            await this.removeData(key)
            removedCount++
          }
        }
      }

      return removedCount
    } catch (error) {
      console.error("Erro ao limpar dados antigos:", error)
      return 0
    }
  }
}

// Exportar uma instância singleton
export const storageService = StorageService.getInstance()
