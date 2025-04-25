"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveFirebaseConfig, isFirebaseConfigured } from "@/lib/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database, CloudUpload, Info } from "lucide-react"

export function FirebaseConfigForm() {
  const [config, setConfig] = useState({
    apiKey: localStorage.getItem("firebase_apiKey") || "",
    authDomain: localStorage.getItem("firebase_authDomain") || "",
    projectId: localStorage.getItem("firebase_projectId") || "",
    storageBucket: localStorage.getItem("firebase_storageBucket") || "",
    messagingSenderId: localStorage.getItem("firebase_messagingSenderId") || "",
    appId: localStorage.getItem("firebase_appId") || "",
    databaseURL: localStorage.getItem("firebase_databaseURL") || "",
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const handleChange = (campo: string, valor: string) => {
    setConfig((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const isValidDatabaseURL = (url: string): boolean => {
    if (!url) return true // URL é opcional
    return (
      url.startsWith("https://") &&
      (url.includes(".firebaseio.com") ||
        url.includes(".europe-west1.firebasedatabase.app") ||
        url.includes(".asia-southeast1.firebasedatabase.app") ||
        url.includes(".firebasedatabase.app"))
    )
  }

  const handleSalvar = () => {
    setSalvando(true)
    setErro(null)
    setSucesso(false)

    try {
      // Validar campos obrigatórios
      const camposObrigatorios = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"]
      const camposFaltantes = camposObrigatorios.filter((campo) => !config[campo])

      if (camposFaltantes.length > 0) {
        setErro(`Campos obrigatórios não preenchidos: ${camposFaltantes.join(", ")}`)
        setSalvando(false)
        return
      }

      // Validar URL do banco de dados se fornecida
      if (config.databaseURL && !isValidDatabaseURL(config.databaseURL)) {
        setErro(`URL do banco de dados inválida. Formato esperado: https://<SEU-PROJETO>.firebaseio.com`)
        setSalvando(false)
        return
      }

      // Salvar configuração
      saveFirebaseConfig(config)
      setSucesso(true)
    } catch (error) {
      setErro(`Erro ao salvar configuração: ${error.message}`)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Configuração do Firebase
        </CardTitle>
        <CardDescription>
          Configure o Firebase para armazenamento em nuvem e sincronização em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFirebaseConfigured() && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Firebase configurado</AlertTitle>
            <AlertDescription className="text-green-700">
              O Firebase está configurado e pronto para uso. Você pode editar as configurações abaixo se necessário.
            </AlertDescription>
          </Alert>
        )}

        {erro && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {sucesso && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Configuração salva</AlertTitle>
            <AlertDescription className="text-green-700">
              A configuração do Firebase foi salva com sucesso. A página será recarregada para aplicar as alterações.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <Input
              id="apiKey"
              value={config.apiKey}
              onChange={(e) => handleChange("apiKey", e.target.value)}
              placeholder="AIzaSyC..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authDomain">Auth Domain *</Label>
            <Input
              id="authDomain"
              value={config.authDomain}
              onChange={(e) => handleChange("authDomain", e.target.value)}
              placeholder="seu-projeto.firebaseapp.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId">Project ID *</Label>
            <Input
              id="projectId"
              value={config.projectId}
              onChange={(e) => handleChange("projectId", e.target.value)}
              placeholder="seu-projeto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storageBucket">Storage Bucket *</Label>
            <Input
              id="storageBucket"
              value={config.storageBucket}
              onChange={(e) => handleChange("storageBucket", e.target.value)}
              placeholder="seu-projeto.appspot.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="messagingSenderId">Messaging Sender ID *</Label>
            <Input
              id="messagingSenderId"
              value={config.messagingSenderId}
              onChange={(e) => handleChange("messagingSenderId", e.target.value)}
              placeholder="123456789012"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appId">App ID *</Label>
            <Input
              id="appId"
              value={config.appId}
              onChange={(e) => handleChange("appId", e.target.value)}
              placeholder="1:123456789012:web:abc123def456"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="databaseURL" className="flex items-center gap-1">
              Database URL <span className="text-gray-500 text-xs">(opcional)</span>
              <Info className="h-4 w-4 text-blue-500 ml-1" />
            </Label>
            <Input
              id="databaseURL"
              value={config.databaseURL}
              onChange={(e) => handleChange("databaseURL", e.target.value)}
              placeholder="https://seu-projeto-default-rtdb.firebaseio.com"
            />
            <p className="text-xs text-amber-600 mt-1">
              Formato correto: https://seu-projeto-default-rtdb.firebaseio.com
            </p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Como obter estas informações?</h4>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal pl-4">
            <li>
              Acesse o{" "}
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Console do Firebase
              </a>
            </li>
            <li>Crie um novo projeto ou selecione um existente</li>
            <li>No painel lateral, clique em "Configurações do projeto" (ícone de engrenagem)</li>
            <li>Na aba "Geral", role até "Seus aplicativos" e clique em "Adicionar app" se necessário</li>
            <li>Selecione a plataforma Web e siga as instruções</li>
            <li>Copie os valores do objeto firebaseConfig para os campos acima</li>
            <li>
              <strong>Para o Database URL:</strong>
              <ul className="list-disc pl-4 mt-1">
                <li>No console do Firebase, vá para "Realtime Database"</li>
                <li>Clique em "Criar banco de dados"</li>
                <li>Selecione o modo (teste ou produção) e a região</li>
                <li>
                  Após a criação, copie a URL que aparece no topo da página (ex:
                  https://seu-projeto-default-rtdb.firebaseio.com)
                </li>
              </ul>
            </li>
          </ol>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSalvar} disabled={salvando} className="w-full flex items-center gap-2">
          <CloudUpload className="h-4 w-4" />
          {salvando ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </CardFooter>
    </Card>
  )
}
