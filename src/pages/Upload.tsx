import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Database, Link as LinkIcon, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UploadPage = () => {
  const { toast } = useToast();

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Archivo cargado",
      description: "Tu dataset se ha subido correctamente al backend.",
    });
  };

  const handleDbConnect = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Conectado a base de datos",
      description: "La conexión se estableció exitosamente.",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Cargar Datos</h1>
        <p className="text-muted-foreground">
          Sube archivos o conéctate a una base de datos externa
        </p>
      </div>

      <Tabs defaultValue="file" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="file">Subir Archivo</TabsTrigger>
          <TabsTrigger value="database">Base de Datos</TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="mt-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Upload className="h-5 w-5" />
                Cargar Dataset
              </CardTitle>
              <CardDescription>
                Sube archivos CSV, Excel o JSON para procesarlos con pandas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="file">Selecciona un archivo</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/30">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Arrastra archivos aquí o haz click para seleccionar
                    </p>
                    <Input
                      id="file"
                      type="file"
                      accept=".csv,.xlsx,.json"
                      className="hidden"
                    />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('file')?.click()}>
                      Seleccionar Archivo
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataset-name">Nombre del Dataset</Label>
                  <Input
                    id="dataset-name"
                    placeholder="Ej: ventas_2024"
                  />
                </div>

                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground">
                  <Upload className="h-4 w-4 mr-2" />
                  Cargar al Backend
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="mt-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Database className="h-5 w-5" />
                Conectar Base de Datos
              </CardTitle>
              <CardDescription>
                Conecta a PostgreSQL, MySQL, MongoDB u otras bases de datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDbConnect} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="db-type">Tipo de Base de Datos</Label>
                  <select
                    id="db-type"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option>PostgreSQL</option>
                    <option>MySQL</option>
                    <option>MongoDB</option>
                    <option>SQLite</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="db-host">Host</Label>
                  <Input
                    id="db-host"
                    placeholder="localhost:5432"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="db-user">Usuario</Label>
                    <Input id="db-user" placeholder="admin" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="db-password">Contraseña</Label>
                    <Input id="db-password" type="password" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="db-name">Nombre de la Base de Datos</Label>
                  <Input id="db-name" placeholder="mi_database" />
                </div>

                <Button type="submit" className="w-full bg-gradient-accent hover:opacity-90 text-accent-foreground">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Conectar
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5" />
            Datasets Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["sales_2024.csv", "customer_data.json", "product_inventory.xlsx"].map((file) => (
              <div key={file} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{file}</p>
                    <p className="text-xs text-muted-foreground">Subido hace 2 horas</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Ver Detalles
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPage;
