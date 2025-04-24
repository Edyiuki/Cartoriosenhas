"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, RefreshCw } from "lucide-react"
import { obterTodosUsuarios, atualizarStatusUsuario, removerUsuario } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

export function AdminUserManagement() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState("todos")
  const [busca, setBusca] = useState("")
  const [dialogRemoverAberto, setDialogRemoverAberto] = useState(false)
  const [usuarioParaRemover, setUsuarioParaRemover] = useState<any>(null)
  const [dialogAdicionarAberto, setDialogAdicionarAberto] = useState(false)
  const [novoUsuario, setNovoUsuario] = useState({
    nome: "",
    tipo: "atendente",
    guiche: "1",
  })

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    setCarregando(true)
    try {
      const users = await obterTodosUsuarios()
      setUsuarios(users)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    } finally {
      setCarregando(false)
    }
  }

  const handleAtualizarStatus = async (id: string, status: string) => {
    try {
      await atualizarStatusUsuario(id, status)
      carregarUsuarios()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  const handleRemoverUsuario = async () => {
    if (!usuarioParaRemover) return

    try {
      await removerUsuario(usuarioParaRemover.id)
      carregarUsuarios()
      setDialogRemoverAberto(false)
    } catch (error) {
      console.error("Erro ao remover usuário:", error)
    }
  }

  const handleAdicionarUsuario = async () => {
    // Em um sistema real, isso adicionaria o usuário ao banco de dados
    // Aqui estamos apenas simulando

    if (!novoUsuario.nome.trim()) return

    try {
      // Simular adição ao histórico de atendentes
      const historicoAtendentes = localStorage.getItem("historicoAtendentes")
      const historico = historicoAtendentes ? JSON.parse(historicoAtendentes) : []

      historico.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        nome: novoUsuario.nome,
        tipo: novoUsuario.tipo,
        guiche: novoUsuario.tipo === "atendente" ? novoUsuario.guiche : undefined,
        dataEntrada: Date.now(),
        status: "ativo",
      })

      localStorage.setItem("historicoAtendentes", JSON.stringify(historico))

      carregarUsuarios()
      setDialogAdicionarAberto(false)
      setNovoUsuario({
        nome: "",
        tipo: "atendente",
        guiche: "1",
      })
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error)
    }
  }

  const usuariosFiltrados = usuarios.filter((user) => {
    // Filtrar por tipo
    if (filtro !== "todos" && user.tipo !== filtro) return false

    // Filtrar por busca
    if (busca && !user.nome.toLowerCase().includes(busca.toLowerCase())) return false

    return true
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>Gerencie os usuários do sistema</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={carregarUsuarios}
                disabled={carregando}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button size="sm" onClick={() => setDialogAdicionarAberto(true)} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Adicionar Usuário
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input placeholder="Buscar por nome..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div>
              <Select value={filtro} onValueChange={setFiltro}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="atendente">Atendentes</SelectItem>
                  <SelectItem value="recepcao">Recepção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Guichê</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carregando ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Carregando usuários...
                    </TableCell>
                  </TableRow>
                ) : usuariosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  usuariosFiltrados.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.tipo}</Badge>
                      </TableCell>
                      <TableCell>{user.guiche || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.status === "ativo"
                              ? "bg-green-500"
                              : user.status === "inativo"
                                ? "bg-gray-500"
                                : "bg-amber-500"
                          }
                        >
                          {user.status || "ativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleAtualizarStatus(user.id, user.status === "ativo" ? "inativo" : "ativo")
                            }
                          >
                            {user.status === "ativo" ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setUsuarioParaRemover(user)
                              setDialogRemoverAberto(true)
                            }}
                          >
                            Remover
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para adicionar usuário */}
      {dialogAdicionarAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Adicionar Novo Usuário</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={novoUsuario.nome}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={novoUsuario.tipo}
                  onValueChange={(valor) => setNovoUsuario({ ...novoUsuario, tipo: valor })}
                >
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atendente">Atendente</SelectItem>
                    <SelectItem value="recepcao">Recepção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {novoUsuario.tipo === "atendente" && (
                <div className="space-y-2">
                  <Label htmlFor="guiche">Guichê</Label>
                  <Select
                    value={novoUsuario.guiche}
                    onValueChange={(valor) => setNovoUsuario({ ...novoUsuario, guiche: valor })}
                  >
                    <SelectTrigger id="guiche">
                      <SelectValue placeholder="Selecione o guichê" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Guichê 01</SelectItem>
                      <SelectItem value="2">Guichê 02</SelectItem>
                      <SelectItem value="3">Guichê 03</SelectItem>
                      <SelectItem value="4">Guichê 04</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogAdicionarAberto(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAdicionarUsuario}>Adicionar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog para remover usuário */}
      {dialogRemoverAberto && usuarioParaRemover && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Confirmar Remoção</h3>
            <p>
              Tem certeza que deseja remover o usuário <strong>{usuarioParaRemover.nome}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogRemoverAberto(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleRemoverUsuario}>
                Remover
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
