// Serviço para persistência local de dados
export class LocalStorageService {
  private static instance: LocalStorageService

  private constructor() {
    // Construtor privado para singleton
  }

  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService()
    }
    return LocalStorageService.instance
  }

  // Salvar dados no localStorage
  public saveData(key: string, data: any): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`Erro ao salvar dados para ${key}:`, error)
    }
  }

  // Carregar dados do localStorage
  public loadData<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") return defaultValue

    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : defaultValue
    } catch (error) {
      console.error(`Erro ao carregar dados para ${key}:`, error)
      return defaultValue
    }
  }

  // Remover dados do localStorage
  public removeData(key: string): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Erro ao remover dados para ${key}:`, error)
    }
  }

  // Verificar se há dados no localStorage
  public hasData(key: string): boolean {
    if (typeof window === "undefined") return false

    try {
      return localStorage.getItem(key) !== null
    } catch (error) {
      console.error(`Erro ao verificar dados para ${key}:`, error)
      return false
    }
  }

  // Limpar todos os dados do localStorage
  public clearAll(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.clear()
    } catch (error) {
      console.error("Erro ao limpar todos os dados:", error)
    }
  }

  // Obter todas as chaves do localStorage
  public getAllKeys(): string[] {
    if (typeof window === "undefined") return []

    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          keys.push(key)
        }
      }
      return keys
    } catch (error) {
      console.error("Erro ao obter todas as chaves:", error)
      return []
    }
  }

  // Obter o tamanho total do localStorage em bytes
  public getTotalSize(): number {
    if (typeof window === "undefined") return 0

    try {
      let totalSize = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          totalSize += (key.length + (localStorage.getItem(key) || "").length) * 2 // UTF-16 = 2 bytes por caractere
        }
      }
      return totalSize
    } catch (error) {
      console.error("Erro ao calcular o tamanho total:", error)
      return 0
    }
  }
}

// Exportar uma instância singleton
export const localStorageService = LocalStorageService.getInstance()
