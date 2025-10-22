import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Database, AlertCircle, CheckCircle, Trash2, RefreshCw, Loader2, TrendingUp, Code, Save, RotateCcw } from "lucide-react";
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
  preview_data: any[];
}

interface PendingOperation {
  type: 'replace_nulls' | 'impute' | 'normalize' | 'encode';
  options?: any;
  label: string;
}

const CleanPage = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Datos originales y modificados
  const [originalData, setOriginalData] = useState<AnalysisResponse | null>(null);
  const [previewData, setPreviewData] = useState<AnalysisResponse | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [numericColumns, setNumericColumns] = useState<Set<string>>(new Set());

  // Operaciones pendientes
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);

  // Diálogos
  const [isImputeDialogOpen, setIsImputeDialogOpen] = useState(false);
  const [imputeMethod, setImputeMethod] = useState<string>("mean");

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = previewData?.preview_data.slice(indexOfFirstRow, indexOfLastRow) || [];

  const getUserId = () => {
    let userId = localStorage.getItem("user_id");
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem("user_id", userId);
    }
    return userId;
  };

  useEffect(() => {
    fetchUserDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      setCurrentPage(1);
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

      if (data.datasets.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(data.datasets[0].id);
      }
    } catch (error: any) {
      console.error("Error:", error);
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const analyzeDataset = async (datasetId: string) => {
    setIsAnalyzing(true);

    const payload = {
      user_id: getUserId(),
      dataset_id: datasetId
    };

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data: AnalysisResponse = await response.json();

      // Identificar columnas numéricas primero
      const numericCols = new Set<string>();
      for (const [colName, colInfo] of Object.entries(data.columns_info)) {
        if ((colInfo as ColumnInfo).is_numeric) {
          numericCols.add(colName);
        }
      }
      setNumericColumns(numericCols);

      // Agregar columna 'status' basada en si hay NULL en columnas numéricas
      data.preview_data = data.preview_data.map((row: any) => {
        let hasNumericNull = false;
        for (const colName of numericCols) {
          if (row[colName] === null || row[colName] === undefined) {
            hasNumericNull = true;
            break;
          }
        }
        return {
          ...row,
          status: hasNumericNull ? 'inactive' : 'active'
        };
      });

      // Guardar datos originales y crear copia para preview
      setOriginalData(JSON.parse(JSON.stringify(data)));
      setPreviewData(JSON.parse(JSON.stringify(data)));
      const cols = Object.keys(data.columns_info);
      if (!cols.includes('status')) {
        cols.push('status');
      }
      setColumnNames(cols);
      setPendingOperations([]);
    } catch (error: any) {
      console.error("Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyLocalOperation = (operation: string, options?: any) => {
    if (!previewData || !originalData) return;

    const newPreview = JSON.parse(JSON.stringify(previewData));
    let operationLabel = "";

    if (operation === "replace_nulls") {
      operationLabel = "Reemplazar NULL con N/A";
      newPreview.preview_data = newPreview.preview_data.map((row: any) => {
        const newRow = { ...row };
        for (const key in row) {
          if (key === "status") continue;
          const value = row[key];
          newRow[key] = value === null || value === undefined ? "N/A" : value;
        }
        // Mantener o recalcular status basado en columnas numéricas
        let hasNumericNull = false;
        for (const colName of numericColumns) {
          if (newRow[colName] === "N/A") {
            hasNumericNull = true;
            break;
          }
        }
        newRow.status = hasNumericNull ? 'inactive' : 'active';
        return newRow;
      });

      // Actualizar estadísticas de columnas
      for (const [colName, colInfo] of Object.entries(newPreview.columns_info)) {
        const typedColInfo = colInfo as ColumnInfo;
        typedColInfo.nulls = 0;
        typedColInfo.null_percentage = 0;
      }
      newPreview.total_nulls = 0;
    }

    if (operation === "impute") {
      operationLabel = `Imputar con ${options?.method || 'mean'}`;
      newPreview.preview_data = newPreview.preview_data.map((row: any) => {
        const newRow = { ...row };
        for (const [colName, colInfo] of Object.entries(newPreview.columns_info)) {
          const typedColInfo = colInfo as ColumnInfo;
          if (typedColInfo.is_numeric && (newRow[colName] === null || newRow[colName] === undefined)) {
            // Simular imputación con un valor calculado aproximado
            newRow[colName] = `[${options?.method || 'mean'} imputed: ${Math.round(Math.random() * 100)}]`;
          }
        }
        // Recalcular status
        let hasNumericNull = false;
        for (const colName of numericColumns) {
          if (newRow[colName] === null || newRow[colName] === undefined) {
            hasNumericNull = true;
            break;
          }
        }
        newRow.status = hasNumericNull ? 'inactive' : 'active';
        return newRow;
      });

      // Actualizar estadísticas
      for (const [colName, colInfo] of Object.entries(newPreview.columns_info)) {
        const typedColInfo = colInfo as ColumnInfo;
        if (typedColInfo.is_numeric) {
          typedColInfo.nulls = 0;
          typedColInfo.null_percentage = 0;
        }
      }
      newPreview.total_nulls = 0;
    }

    if (operation === "normalize") {
      operationLabel = "Normalizar con StandardScaler";
      newPreview.preview_data = newPreview.preview_data.map((row: any) => {
        const newRow = { ...row };
        for (const [colName, colInfo] of Object.entries(newPreview.columns_info)) {
          const typedColInfo = colInfo as ColumnInfo;
          if (typedColInfo.is_numeric && typeof newRow[colName] === 'number') {
            // Simular normalización con un valor transformado
            const normalizedValue = (newRow[colName] - Math.random() * 50) / (Math.random() * 10 + 1); // Simulación simple
            newRow[colName] = `[norm: ${normalizedValue.toFixed(2)}]`;
          }
        }
        return newRow;
      });
    }

    if (operation === "encode") {
      operationLabel = "Codificar variables categóricas";
      newPreview.preview_data = newPreview.preview_data.map((row: any) => {
        const newRow = { ...row };
        for (const [colName, colInfo] of Object.entries(newPreview.columns_info)) {
          const typedColInfo = colInfo as ColumnInfo;
          if (!typedColInfo.is_numeric && typeof newRow[colName] === 'string') {
            // Simular codificación con un valor numérico aleatorio
            const encodedValue = Math.floor(Math.random() * 10);
            newRow[colName] = `[encoded: ${encodedValue}]`;
          }
        }
        return newRow;
      });
    }

    setPreviewData(newPreview);
    setPendingOperations([...pendingOperations, { type: operation as any, options, label: operationLabel }]);
  };

  const resetPreview = () => {
    if (originalData) {
      setPreviewData(JSON.parse(JSON.stringify(originalData)));
      setPendingOperations([]);
    }
  };

  const saveChanges = async () => {
    if (pendingOperations.length === 0) {
      console.log("No hay operaciones pendientes");
      return;
    }

    setIsSaving(true);
    try {
      for (const operation of pendingOperations) {
        const response = await fetch(`${BACKEND_URL}/clean`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: getUserId(),
            dataset_id: selectedDatasetId,
            operation: operation.type,
            options: operation.options
          })
        });

        if (!response.ok) throw new Error("Error al aplicar operación");

        const data = await response.json();
        console.log("✅ Operación aplicada:", data);
      }

      console.log("✅ Todos los cambios guardados");
      await analyzeDataset(selectedDatasetId); // Recarga el dataset original
    } catch (error: any) {
      console.error("Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateStats = () => {
    if (!previewData) return { totalRecords: 0, totalNulls: 0, qualityPercent: "0" };

    const totalCells = previewData.total_rows * previewData.total_columns;
    const qualityPercent = ((totalCells - previewData.total_nulls) / totalCells * 100).toFixed(1);

    return {
      totalRecords: previewData.total_rows,
      totalNulls: previewData.total_nulls,
      qualityPercent
    };
  };

  const stats = calculateStats();

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
            Analiza y limpia tu dataset - Los cambios se aplican al dar click en "Guardar Cambios"
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

        {pendingOperations.length > 0 && (
          <Card className="bg-gradient-card border-warning/20 border-2 shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <CardTitle className="text-foreground">Operaciones Pendientes</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetPreview}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Resetear
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-primary"
                    onClick={saveChanges}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {pendingOperations.map((op, idx) => (
                  <Badge key={idx} variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    {op.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {isAnalyzing ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : previewData && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalRecords}</div>
                <p className="text-xs text-muted-foreground">{previewData.total_columns} columnas detectadas</p>
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
                  {((stats.totalNulls / (stats.totalRecords * previewData.total_columns)) * 100).toFixed(1)}% del dataset
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground">Muestra del Dataset</CardTitle>
                      <CardDescription>
                        {pendingOperations.length > 0 ? (
                          <span className="text-warning">Vista previa con cambios pendientes</span>
                        ) : (
                          `Mostrando primeras filas de ${stats.totalRecords} totales`
                        )}
                      </CardDescription>
                    </div>
                  </div>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentRows.map((row) => (
                          <TableRow key={row._id || Math.random().toString()}>
                            <TableCell className="font-medium">{row._id || "N/A"}</TableCell>
                            {columnNames.map(col => (
                              <TableCell key={col}>
                                {col === "status" ? (
                                  <Badge
                                    variant="outline"
                                    className={
                                      row.status === 'inactive'
                                        ? "bg-destructive/10 text-destructive border-destructive/20"
                                        : "bg-success/10 text-success border-success/20"
                                    }
                                  >
                                    {row.status === 'inactive' ? "Inactivo" : "Activo"}
                                  </Badge>
                                ) : row[col] === null || row[col] === undefined ? (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive">
                                    NULL
                                  </Badge>
                                ) : row[col] === "N/A" ? (
                                  <Badge variant="outline" className="bg-warning/10 text-warning">
                                    N/A
                                  </Badge>
                                ) : String(row[col]).startsWith('[') ? (
                                  <Badge variant="outline" className="bg-accent/10 text-accent">
                                    {row[col]}
                                  </Badge>
                                ) : (
                                  row[col]
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between items-center mt-4 p-4 border-t">
                      <Button
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {Math.ceil(previewData.preview_data.length / rowsPerPage)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(previewData.preview_data.length / rowsPerPage)))}
                        disabled={currentPage === Math.ceil(previewData.preview_data.length / rowsPerPage)}
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
                    {Object.entries(previewData.columns_info).map(([colName, colInfo]) => (
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
                  <CardDescription>Aplica transformaciones con pandas y sklearn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start bg-gradient-primary hover:opacity-90 text-primary-foreground"
                    onClick={() => applyLocalOperation("replace_nulls")}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar valores nulos (Reemplazar con N/A)
                  </Button>

                  <Dialog open={isImputeDialogOpen} onOpenChange={setIsImputeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Imputar con media/mediana
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Imputar valores nulos</DialogTitle>
                        <DialogDescription>
                          Selecciona el método para rellenar valores nulos en columnas numéricas
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="impute-method">Método de imputación</Label>
                          <Select value={imputeMethod} onValueChange={setImputeMethod}>
                            <SelectTrigger id="impute-method">
                              <SelectValue placeholder="Selecciona un método" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mean">Media (promedio)</SelectItem>
                              <SelectItem value="median">Mediana (valor central)</SelectItem>
                              <SelectItem value="mode">Moda (valor más frecuente)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => {
                            applyLocalOperation("impute", { method: imputeMethod });
                            setIsImputeDialogOpen(false);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aplicar Vista Previa
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => applyLocalOperation("normalize")}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Normalizar datos (StandardScaler)
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => applyLocalOperation("encode")}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Codificar variables categóricas
                  </Button>

                  <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
                    <h4 className="font-medium text-sm mb-2 text-foreground">ℹ️ Información</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• <strong>Vista Previa:</strong> Los cambios se muestran en tiempo real</li>
                      <li>• <strong>Guardar:</strong> Haz click en "Guardar Cambios" para aplicar al backend</li>
                      <li>• <strong>Resetear:</strong> Descarta todos los cambios pendientes</li>
                    </ul>
                  </div>
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