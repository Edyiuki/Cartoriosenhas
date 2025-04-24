import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Ticket, Users, LayoutDashboard, HeadphonesIcon, ShieldCheck } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-blue-800 mb-4">Sistema de Senhas para Cartório</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Gerenciamento completo de senhas e atendimentos para cartórios
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-blue-600" />
                <span>Retirar Senha</span>
              </CardTitle>
              <CardDescription>Área pública para retirada de senhas</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600">Retire sua senha de atendimento de acordo com o serviço desejado.</p>
            </CardContent>
            <CardFooter>
              <Link href="/publico/retirar-senha" className="w-full">
                <Button className="w-full group">
                  Acessar
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <HeadphonesIcon className="h-5 w-5 text-blue-600" />
                <span>Recepção</span>
              </CardTitle>
              <CardDescription>Gerenciamento central de senhas</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600">Gerencie senhas, monitore guichês e coordene o atendimento.</p>
            </CardContent>
            <CardFooter>
              <Link href="/recepcao/login" className="w-full">
                <Button className="w-full group">
                  Acessar
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Área do Atendente</span>
              </CardTitle>
              <CardDescription>Acesso para funcionários do cartório</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600">Gerencie chamadas, visualize filas e comunique-se com outros atendentes.</p>
            </CardContent>
            <CardFooter>
              <Link href="/atendente/login" className="w-full">
                <Button className="w-full group">
                  Acessar
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-blue-600" />
                <span>Painel de Senhas</span>
              </CardTitle>
              <CardDescription>Visualização das senhas chamadas</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600">Painel para exibição em telão com as senhas chamadas e em espera.</p>
            </CardContent>
            <CardFooter>
              <Link href="/painel" className="w-full">
                <Button className="w-full group">
                  Acessar
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <span>Administrador</span>
              </CardTitle>
              <CardDescription>Área restrita de administração</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600">Acesse estatísticas, configure o sistema e utilize o suporte da IA Thoth.</p>
            </CardContent>
            <CardFooter>
              <Link href="/admin/login" className="w-full">
                <Button className="w-full group">
                  Acessar
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
