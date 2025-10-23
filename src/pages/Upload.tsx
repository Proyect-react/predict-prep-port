// src/pages/Upload.tsx - REFACTORIZADO

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, Database, Link as LinkIcon, FileText, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import api from "@/config/api"; // ✅ IMPORT API SERVICE

interface Dataset {
  id: string;
  name: string;
  file_type: string;
  file_size_mb: number;
  num_rows: number;
  num_columns: number;
  uploaded_at: string;
}

const UploadPage = () => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);

  useEffect(() => {
    fetchUserDatasets();
  }, []);

  // ✅ Usar API Service
  const fetchUserDatasets = async () => {
    setIsLoadingDatasets(true);
    try {
      const data = await api.upload.getUserDatasets();
      setDatasets(data.datasets);
    } catch (error: any) {
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
      const allowedTypes = ["text/csv", "application/vnd.ms-excel", 
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Archivo no válido",
          description: "Solo se permiten archivos CSV y Excel",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo no debe superar los 50MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  // ✅ Usar API Service
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: "No hay archivo",
        description: "Selecciona un archivo primero",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const data = await api.upload.uploadDataset(selectedFile);

      toast({
        title: "✅ Archivo cargado exitosamente",
        description: `${data.file_name} - ${data.rows} filas, ${data.columns} columnas`,
      });

      setSelectedFile(null);
      await fetchUserDatasets();

    } catch (error: any) {
      toast({
        title: "Error al subir archivo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Cargar Datos</h1>
        <p className="text-muted-foreground">
          Sube archivos o conéctate a una base de datos
        </p>
      </div>

      <Tabs defaultValue="file">
        <TabsList>
          <TabsTrigger value="file">Subir Archivo</TabsTrigger>
          <TabsTrigger value="database">Base de Datos</TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Cargar Dataset
              </CardTitle>
              <CardDescription>
                Sube archivos CSV o Excel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-6">
                <div className="space-y-2">
                  <Label>Archivo</Label>
                  <div className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer"
                       onClick={() => document.getElementById('file')?.click()}>
                    {selectedFile ? (
                      <div className="space-y-3">
                        <CheckCircle className="h-12 w-12 mx-auto text-success" />
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Arrastra archivos o haz click
                        </p>
                      </>
                    )}
                  </div>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={!selectedFile || isUploading}>
                  {isUploading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Subiendo...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" />Cargar</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Conectar Base de Datos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Próximamente...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Datasets ({datasets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDatasets ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : datasets.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No hay datasets
            </p>
          ) : (
            <div className="space-y-3">
              {datasets.map((dataset) => (
                <div key={dataset.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{dataset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {dataset.num_rows} filas × {dataset.num_columns} columnas • 
                      {dataset.file_size_mb} MB • {formatDate(dataset.uploaded_at)}
                    </p>
                  </div>
                  <Badge>{dataset.file_type.toUpperCase()}</Badge>
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