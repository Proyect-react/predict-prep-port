// src/pages/Clean.tsx - REFACTORIZADO con API Service

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
import { useToast } from "@/hooks/use-toast";
import api from "@/config/api"; // ✅ IMPORT API SERVICE

interface Dataset {
  id: string;
  name: string;
  num_rows: number;
  num_columns: number;
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
  const { toast } = useToast();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const [originalData, setOriginalData] = useState<AnalysisResponse | null>(null);
  const [previewData, setPreviewData] = useState<AnalysisResponse | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [numericColumns, setNumericColumns] = useState<Set<string>>(new Set());
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);

  const [isImputeDialogOpen, setIsImputeDialogOpen] = useState(false);
  const [imputeMethod, setImputeMethod] = useState<string>("mean");

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = previewData?.preview_data.slice(indexOfFirstRow, indexOfLastRow) || [];

  useEffect(() => {
    fetchUserDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      setCurrentPage(1);
      analyzeDataset(parseInt(selectedDatasetId));
    }
  }, [selectedDatasetId]);

  // Obtener datasets del usuario
  const fetchUserDatasets = async () => {
    setIsLoadingDatasets(true);
    try {
      const data = await api.upload.getUserDatasets();
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

  // Analizar dataset
  const analyzeDataset = async (datasetId: number) => {
    setIsAnalyzing(true);

    try {
      const data = await api.clean.analyzeDataset(datasetId);

      const numericCols = new Set<string>();
      for (const [colName, colInfo] of Object.entries(data.columns_info)) {
        if ((colInfo as ColumnInfo).is_numeric) {
          numericCols.add(colName);
        }
      }
      setNumericColumns(numericCols);

      data.preview_data = data.preview_data.map((row: any) => {
        let hasNumericNull = false;
        for (const colName of numericCols) {
          if (row[colName] === null || row[colName] === undefined) {
            hasNumericNull = true;
            break;
          }
        }
        return { ...row, status: hasNumericNull ? 'inactive' : 'active' };
      });

      setOriginalData(JSON.parse(JSON.stringify(data)));
      setPreviewData(JSON.parse(JSON.stringify(data)));
      const cols = Object.keys(data.columns_info);
      if (!cols.includes('status')) cols.push('status');
      setColumnNames(cols);
      setPendingOperations([]);
    } catch (error: any) {
      console.error("Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateImputedValue = (columnName: string, method: string, allRows: any[]) => {
    const values = allRows
      .map(row => row[columnName])
      .filter(val => val !== null && val !== undefined && typeof val === 'number');

    if (values.length === 0) return 0;

    if (method === 'mean') {
      return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    } else if (method === 'median') {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[mid];
    } else if (method === 'mode') {
      const freq: Record<number, number> = {};
      values.forEach(v => freq[v] = (freq[v] || 0) + 1);
      return Number(Object.keys(freq).reduce((a, b) => freq[Number(a)] > freq[Number(b)] ? a : b));
    }
    return 0;
  };

  // Aplica una operación localmente en la vista previa
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

      for (const [colName, colInfo] of Object.entries(newPreview.columns_info)) {
        const typedColInfo = colInfo as ColumnInfo;
        typedColInfo.nulls = 0;
        typedColInfo.null_percentage = 0;
      }
      newPreview.total_nulls = 0;
    }

    if (operation === "impute") {
      const method = options?.method || 'mean';
      operationLabel = `Imputar con ${method}`;

      const imputedValues: Record<string, number> = {};
      for (const [colName, colInfo] of Object.entries(newPreview.columns_info)) {
        const typedColInfo = colInfo as ColumnInfo;
        if (typedColInfo.is_numeric) {
          imputedValues[colName] = calculateImputedValue(colName, method, newPreview.preview_data);
        }
      }

      newPreview.preview_data = newPreview.preview_data.map((row: any) => {
        const newRow = { ...row };
        for (const [colName, colInfo] of Object.entries(newPreview.columns_info)) {
          const typedColInfo = colInfo as ColumnInfo;
          if (typedColInfo.is_numeric && (newRow[colName] === null || newRow[colName] === undefined)) {
            newRow[colName] = imputedValues[colName];
          }
        }
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

      const stats: Record<string, { mean: number; std: number }> = {};
      for (const [colName, colInfo] of Object.entries(newPreview.columns_info)) {
        const typedColInfo = colInfo as ColumnInfo;
        if (typedColInfo.is_numeric) {
          const values = newPreview.preview_data
            .map((row: any) => row[colName])
            .filter((val: any) => val !== null && val !== undefined && typeof val === 'number');

          if (values.length > 0) {
            const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
            const variance = values.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / values.length;
            const std = Math.sqrt(variance);
            stats[colName] = { mean, std: std || 1 };
          }
        }
      }

      newPreview.preview_data = newPreview.preview_data.map((row: any) => {
        const newRow = { ...row };
        for (const [colName, colInfo] of Object.entries(newPreview.columns_info)) {
          const typedColInfo = colInfo as ColumnInfo;
          if (typedColInfo.is_numeric && typeof newRow[colName] === 'number' && stats[colName]) {
            const normalized = (newRow[colName] - stats[colName].mean) / stats[colName].std;
            newRow[colName] = Math.round(normalized * 100) / 100;
          }
        }
        return newRow;
      });
    }

    if (operation === "encode") {
      operationLabel = "Codificar variables categóricas";

      const encodings: Record<string, Record<string, number>> = {};
      for (const [colName, colInfo] of Object.entries(newPreview.columns_info)) {
        const typedColInfo = colInfo as ColumnInfo;
        if (!typedColInfo.is_numeric) {
          const uniqueValues = [...new Set(
            newPreview.preview_data
              .map((row: any) => row[colName])
              .filter((val: any) => val !== null && val !== undefined)
          )];
          encodings[colName] = {};
          uniqueValues.forEach((val: any, idx: number) => {
            encodings[colName][String(val)] = idx;
          });
        }
      }

      newPreview.preview_data = newPreview.preview_data.map((row: any) => {
        const newRow = { ...row };
        for (const [colName, colInfo] of Object.entries(newPreview.columns_info)) {
          const typedColInfo = colInfo as ColumnInfo;
          if (!typedColInfo.is_numeric && typeof newRow[colName] === 'string' && encodings[colName]) {
            newRow[colName] = encodings[colName][newRow[colName]] ?? 0;
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

  // Guardar cambios con API
  const saveChanges = async () => {
    if (pendingOperations.length === 0) {
      toast({
        title: "No hay cambios",
        description: "No hay operaciones pendientes",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const operationTypes = pendingOperations.map(op => op.type);
      const operationOptions = pendingOperations.find(op => op.options)?.options || {};

      const data = await api.clean.cleanDataset(
        parseInt(selectedDatasetId),
        operationTypes,
        operationOptions
      );

      toast({
        title: "✅ Cambios guardados",
        description: `${data.operations_applied.length} operaciones aplicadas`
      });

      setPendingOperations([]);
      await analyzeDataset(parseInt(selectedDatasetId));

    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateStats = () => {
    if (!previewData) return { totalRecords: 0, totalNulls: 0, qualityPercent: 0 };

    const totalCells = previewData.total_rows * previewData.total_columns;
    const qualityPercent = parseFloat(((totalCells - previewData.total_nulls) / totalCells * 100).toFixed(1));

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
        <h2 className="text-2xl font-bold mb-2">No hay datasets</h2>
        <p className="text-muted-foreground">Sube un archivo en Upload</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Limpiar Datos</h1>
        <p className="text-muted-foreground">Analiza y limpia tu dataset</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dataset Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Seleccionar Dataset</Label>
            <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
              <SelectTrigger>
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
        <Card className="border-warning/20 border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                <CardTitle>Operaciones Pendientes</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetPreview}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetear
                </Button>
                <Button size="sm" onClick={saveChanges} disabled={isSaving}>
                  {isSaving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Guardar</>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pendingOperations.map((op, idx) => (
                <Badge key={idx} variant="outline">{op.label}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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