import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Database, AlertCircle, CheckCircle, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

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

interface ColumnInfo {
  dtype: string;
  nulls: number;
  null_percentage: number;
  is_numeric: boolean;
}

interface AnalysisResponse {
  dataset_id: string;
  total_rows: number;
  total_columns: number;
  columns_info: Record<string, ColumnInfo>;
  total_nulls: number;
  preview_data: any[];  // 🆕 Datos reales desde el backend
}

interface CleanResponse {
  message: string;
  cleaned_dataset_id: string;
  original_dataset_id: string;
  file_path: string;
  original_rows: number;
  cleaned_rows: number;
  columns_with_nulls: Record<string, any>;
  status_changes: Record<string, string>;
}

const CleanPage = () => {
  const { toast } = useToast();

  // Estados
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 5;

  // Datos del análisis
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = analysisData?.preview_data.slice(indexOfFirstRow, indexOfLastRow) || [];
  


  const getUserId = () => {
    let userId = localStorage.getItem("user_id");
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem("user_id", userId);
    }
    return userId;
  };

  // Cargar datasets al montar
  useEffect(() => {
    fetchUserDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      setCurrentPage(1); // Reinicia paginación
      analyzeDataset(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  // Analizar cuando se selecciona un dataset
  useEffect(() => {
    if (selectedDatasetId) {
      analyzeDataset(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const fetchUserDatasets = async () => {
    setIsLoadingDatasets(true);
    try {
      const userId = getUserId();
      const response = await fetch(`${BACKEND_URL}/datasets/${userId}`);

      if (!response.ok) throw new Error("Error al obtener datasets");

      const data = await response.json();
      setDatasets(data.datasets);

      // Seleccionar el primero automáticamente
      if (data.datasets.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(data.datasets[0].id);
      }
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

  const analyzeDataset = async (datasetId: string) => {
    setIsAnalyzing(true);

    // 🐛 DEBUG: Ver qué estamos enviando
    const payload = {
      user_id: getUserId(),
      dataset_id: datasetId
    };

    console.log("🔍 Analizando dataset...");
    console.log("📦 Payload:", payload);
    console.log("🌐 URL:", `${BACKEND_URL}/analyze`);

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // 🐛 DEBUG: Ver la respuesta
      console.log("📡 Response Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error Response:", errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data: AnalysisResponse = await response.json();
      console.log("✅ Analysis Data:", data);

      setAnalysisData(data);
      setColumnNames(Object.keys(data.columns_info));
      setPreviewData(data.preview_data);

      toast({
        title: "Análisis completado",
        description: `${data.total_rows} filas, ${data.total_columns} columnas, ${data.total_nulls} valores nulos`
      });
    } catch (error: any) {
      console.error("💥 Error completo:", error);
      toast({
        title: "Error al analizar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePreviewData = (analysis: AnalysisResponse) => {
    // Generar 10 filas de ejemplo
    const rows = [];
    for (let i = 0; i < Math.min(10, analysis.total_rows); i++) {
      const row: any = { _id: i + 1 };

      Object.entries(analysis.columns_info).forEach(([colName, colInfo]) => {
        // Simular algunos valores null según el porcentaje
        const hasNull = Math.random() * 100 < colInfo.null_percentage;

        if (hasNull) {
          row[colName] = null;
        } else {
          // Generar valor según tipo
          if (colInfo.is_numeric) {
            row[colName] = Math.floor(Math.random() * 100) + 1;
          } else {
            row[colName] = `Valor ${i + 1}`;
          }
        }
      });

      rows.push(row);
    }

    setPreviewData(rows);
  };

  const handleClean = async () => {
    if (!selectedDatasetId) {
      toast({
        title: "No hay dataset seleccionado",
        variant: "destructive"
      });
      return;
    }

    setIsCleaning(true);
    try {
      const response = await fetch(`${BACKEND_URL}/clean`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: getUserId(),
          dataset_id: selectedDatasetId,
          replace_nulls: true
        })
      });

      if (!response.ok) throw new Error("Error al limpiar dataset");

      const data: CleanResponse = await response.json();

      toast({
        title: "✅ Limpieza completada",
        description: `Dataset limpio creado: ${data.cleaned_dataset_id}`
      });

      // Reanalizar después de limpiar
      await analyzeDataset(selectedDatasetId);
    } catch (error: any) {
      toast({
        title: "Error al limpiar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const calculateStats = () => {
    if (!analysisData) return { totalRecords: 0, totalNulls: 0, qualityPercent: "0" };

    const totalCells = analysisData.total_rows * analysisData.total_columns;
    const qualityPercent = ((totalCells - analysisData.total_nulls) / totalCells * 100).toFixed(1);

    return {
      totalRecords: analysisData.total_rows,
      totalNulls: analysisData.total_nulls,
      qualityPercent
    };
  };

  const stats = calculateStats();

  const getRowStatus = (row: any) => {
    // Una fila es "inactive" si tiene NULL en alguna columna numérica
    for (const [colName, colInfo] of Object.entries(analysisData?.columns_info || {})) {
      if (colInfo.is_numeric && (row[colName] === null || row[colName] === "N/A")) {
        return "inactive";
      }
    }
    return "active";
  };

  if (isLoadingDatasets) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Database className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No hay datasets disponibles</h2>
        <p className="text-muted-foreground">Sube un archivo primero en la página de Upload</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Limpiar Datos</h1>
          <p className="text-muted-foreground">
            Analiza y limpia tu dataset usando pandas y numpy
          </p>
        </div>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Dataset Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="dataset-select">Seleccionar Dataset</Label>
              <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                <SelectTrigger id="dataset-select">
                  <SelectValue placeholder="Selecciona un dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name} ({dataset.num_rows} filas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {isAnalyzing ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : analysisData && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalRecords}</div>
                <p className="text-xs text-muted-foreground">{analysisData.total_columns} columnas detectadas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valores Nulos</CardTitle>
                <AlertCircle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{stats.totalNulls}</div>
                <p className="text-xs text-muted-foreground">
                  {((stats.totalNulls / (stats.totalRecords * analysisData.total_columns)) * 100).toFixed(1)}% del dataset
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calidad</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{stats.qualityPercent}%</div>
                <p className="text-xs text-muted-foreground">Datos válidos</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview">Vista Previa</TabsTrigger>
              <TabsTrigger value="quality">Calidad de Datos</TabsTrigger>
              <TabsTrigger value="operations">Operaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-6">
              <Card className="bg-gradient-card border-border shadow-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Muestra del Dataset</CardTitle>
                  <CardDescription>Mostrando primeras 10 filas de {stats.totalRecords} totales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>ID</TableHead>
                          {columnNames.map(col => (
                            <TableHead key={col}>{col}</TableHead>
                          ))}
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentRows.map((row) => {
                          const status = getRowStatus(row);
                          return (
                            <TableRow key={row._id} className={isCleaning ? "opacity-50 animate-pulse" : ""}>
                              <TableCell className="font-medium">{row._id}</TableCell>
                              {columnNames.map(col => (
                                <TableCell key={col}>
                                  {row[col] === null || row[col] === "N/A" ? (
                                    <Badge variant="outline" className="bg-warning/10 text-warning">
                                      {row[col] === "N/A" ? "N/A" : "NULL"}
                                    </Badge>
                                  ) : (
                                    row[col]
                                  )}
                                </TableCell>
                              ))}
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={status === "active"
                                    ? "bg-success/10 text-success border-success/20"
                                    : "bg-destructive/10 text-destructive border-destructive/20"}
                                >
                                  {status === "active" ? "Activo" : "Inactivo"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between items-center mt-2">
                        <Button
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Página {currentPage} de {Math.ceil(previewData.length / rowsPerPage)}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(previewData.length / rowsPerPage)))}
                          disabled={currentPage === Math.ceil(previewData.length / rowsPerPage)}
                        >
                          Siguiente
                        </Button>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality" className="mt-6">
              <Card className="bg-gradient-card border-border shadow-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Análisis de Columnas</CardTitle>
                  <CardDescription>Revisa la calidad de cada columna</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analysisData.columns_info).map(([colName, colInfo]) => (
                      <div key={colName} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{colName}</p>
                          <p className="text-sm text-muted-foreground">
                            Tipo: {colInfo.dtype} • {colInfo.nulls} valores nulos ({colInfo.null_percentage.toFixed(1)}%)
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            colInfo.null_percentage > 20
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : colInfo.null_percentage > 0
                                ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-success/10 text-success border-success/20"
                          }
                        >
                          {colInfo.null_percentage > 20 ? "Crítico" : colInfo.null_percentage > 0 ? "Advertencia" : "OK"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operations" className="mt-6">
              <Card className="bg-gradient-card border-border shadow-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Operaciones de Limpieza</CardTitle>
                  <CardDescription>Aplica transformaciones con pandas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start bg-gradient-primary hover:opacity-90 text-primary-foreground"
                    onClick={handleClean}
                    disabled={isCleaning}
                  >
                    {isCleaning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Limpiando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpiar valores nulos (Reemplazar con N/A)
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled={isCleaning}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Imputar con media/mediana
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled={isCleaning}>
                    <Database className="h-4 w-4 mr-2" />
                    Normalizar datos (StandardScaler)
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled={isCleaning}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Codificar variables categóricas
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default CleanPage;