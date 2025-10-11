import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Server, Database, Link as LinkIcon, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { toast } = useToast();

  const handleSaveBackend = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Configuración guardada",
      description: "La conexión al backend se actualizó correctamente.",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Configuración</h1>
        <p className="text-muted-foreground">
          Configura conexiones a backend y base de datos externas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Server className="h-5 w-5" />
              Backend Python
            </CardTitle>
            <CardDescription>
              Configura la URL de tu API Python (Flask/FastAPI)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveBackend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backend-url">URL del Backend</Label>
                <Input
                  id="backend-url"
                  placeholder="https://api.ejemplo.com"
                  defaultValue="http://localhost:8000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key (opcional)</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Tu clave de API"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm text-success">Conexión establecida</span>
              </div>

              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground">
                Guardar Configuración
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Database className="h-5 w-5" />
              Base de Datos Externa
            </CardTitle>
            <CardDescription>
              Configura tu base de datos para pandas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="db-connection">Connection String</Label>
                <Input
                  id="db-connection"
                  placeholder="postgresql://user:pass@host:5432/db"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="db-type-setting">Tipo</Label>
                <select
                  id="db-type-setting"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>PostgreSQL</option>
                  <option>MySQL</option>
                  <option>SQLite</option>
                  <option>MongoDB</option>
                </select>
              </div>

              <Button variant="outline" className="w-full">
                <LinkIcon className="h-4 w-4 mr-2" />
                Probar Conexión
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5" />
            Endpoints Disponibles
          </CardTitle>
          <CardDescription>APIs del backend Python configuradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { path: "/api/upload", method: "POST", description: "Cargar datasets" },
              { path: "/api/clean", method: "POST", description: "Limpiar datos con pandas" },
              { path: "/api/train", method: "POST", description: "Entrenar modelos ML" },
              { path: "/api/predict", method: "POST", description: "Realizar predicciones" },
              { path: "/api/models", method: "GET", description: "Listar modelos" },
            ].map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono">
                    {endpoint.method}
                  </Badge>
                  <div>
                    <p className="font-medium text-foreground font-mono text-sm">{endpoint.path}</p>
                    <p className="text-xs text-muted-foreground">{endpoint.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  Activo
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Librerías Requeridas</CardTitle>
          <CardDescription>Asegúrate de tener estas dependencias en tu backend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {["pandas", "numpy", "pytorch", "scikit-learn", "flask/fastapi", "sqlalchemy"].map((lib) => (
              <div key={lib} className="flex items-center gap-2 p-3 border border-border rounded-lg bg-muted/30">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="font-mono text-sm text-foreground">{lib}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
