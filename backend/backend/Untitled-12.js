import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

export function LoginPageExample() {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Sua lógica de login aqui...
    console.log('Tentativa de login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Bem-vindo!</CardTitle>
          <CardDescription>Acesse sua conta para agendar salas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="username">Usuário</Label><Input id="username" placeholder="seu.usuario" required /></div>
            <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" required /></div>
            <Button type="submit" className="w-full mt-2">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}