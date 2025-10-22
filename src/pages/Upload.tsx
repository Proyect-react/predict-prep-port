import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, Database, Link as LinkIcon, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

// Configuración del backend
const BACKEND_URL = "http://localhost:8000/api";

interface Dataset {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  file_size_mb: number;
  num_rows: number;
  num_columns: number;
  uploaded_at: string;
  file_path: string;
}

const UploadPage = () => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);

  // Generar un user_id único (en producción esto vendría del sistema de autenticación)
  const getUserId = () => {
    let userId = localStorage.getItem("user_id");
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem("user_id", userId);
    }
    return userId;
  };

  // Cargar datasets al montar el componente
  useEffect(() => {
    fetchUserDatasets();
  }, []);

  const fetchUserDatasets = async () => {
    setIsLoadingDatasets(true);
    try {
      const userId = getUserId();
      const response = await fetch(`${BACKEND_URL}/datasets/${userId}`);

      if (!response.ok) {
        throw new Error("Error al obtener datasets");
      }

      const data = await response.json();
      setDatasets(data.datasets);

      console.log("✅ Datasets cargados:", data);
    } catch (error: any) {
      console.error("❌ Error al cargar datasets:", error);
      toast({
        title: "Error al cargar datasets",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Archivo no válido",
          description: "Solo se permiten archivos CSV y Excel (.csv, .xlsx)",
          variant: "destructive"
        });
        return;
      }

      // Validar tamaño (50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo no debe superar los 50MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      toast({
        title: "Archivo seleccionado",
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      });
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: "No hay archivo",
        description: "Por favor selecciona un archivo primero",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("user_id", getUserId());

      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al subir archivo");
      }

      const data = await response.json();

      toast({
        title: "✅ Archivo cargado exitosamente",
        description: `${data.file_name} - ${data.rows} filas, ${data.columns} columnas`,
      });

      // Limpiar formulario
      setSelectedFile(null);

      // Recargar lista de datasets
      await fetchUserDatasets();

      console.log("✅ Upload Response:", data);

    } catch (error: any) {
      console.error("❌ Error:", error);
      toast({
        title: "Error al subir archivo",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDbConnect = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Conectado a base de datos",
      description: "La conexión se estableció exitosamente.",
    });
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;

    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'csv':
        return '📊';
      case 'xlsx':
      case 'xls':
        return '📈';
      case 'json':
        return '📋';
      default:
        return '📄';
    }
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
                Sube archivos CSV o Excel para procesarlos con pandas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="file">Selecciona un archivo</Label>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
                    onClick={() => document.getElementById('file')?.click()}  // abrir selector al click
                    onDragOver={(e) => e.preventDefault()}                   // permitir drop
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileSelect({ target: { files: [file] } } as any);
                    }}
                  >
                    {selectedFile ? (
                      <div className="space-y-3">
                        <CheckCircle className="h-12 w-12 mx-auto text-success" />
                        <div>
                          <p className="font-medium text-foreground">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          Cambiar archivo
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Arrastra archivos aquí o haz click para seleccionar
                        </p>
                        <Input
                          id="file"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('file')?.click()}
                        >
                          Seleccionar Archivo
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground"
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Cargar al Backend
                    </>
                  )}
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5" />
                Datasets Disponibles
              </CardTitle>
              <CardDescription>
                {datasets.length} dataset{datasets.length !== 1 ? 's' : ''} cargado{datasets.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUserDatasets}
              disabled={isLoadingDatasets}
            >
              {isLoadingDatasets ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Actualizar"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingDatasets ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No hay datasets disponibles</p>
              <p className="text-sm text-muted-foreground mt-2">Sube tu primer archivo para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                      {getFileIcon(dataset.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{dataset.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {dataset.num_rows.toLocaleString()} filas × {dataset.num_columns} columnas
                        </p>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                          {dataset.file_size_mb} MB
                        </p>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(dataset.uploaded_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      {dataset.file_type.toUpperCase()}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPage;