
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, TrendingUp, Zap, Target, Loader2, AlertCircle, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const BACKEND_URL = "http://localhost:8000/api";

interface CleanedDataset {
  id: number;
  name: string;
  num_rows: number;
  num_columns: number;
  created_at: string;
  file_path: string;
}

interface TrainedModel {
  id: number;
  name: string;
  algorithm: string;
  accuracy: number;
  metrics: any;
  trained_at: string;
  status: string;
  training_time: number;
}

const TrainPage = () => {
  const { toast } = useToast();
  
  const [cleanedDatasets, setCleanedDatasets] = useState<CleanedDataset[]>([]);
  const [trainedModels, setTrainedModels] = useState<TrainedModel[]>([]);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  
  const [modelName, setModelName] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("random_forest");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetVariable, setTargetVariable] = useState("");
  
  // Hiperparámetros
  const [epochs, setEpochs] = useState(100);
  const [batchSize, setBatchSize] = useState(32);
  const [learningRate, setLearningRate] = useState(0.001);
  const [testSplit, setTestSplit] = useState(0.2);
  
  const [selectedModel, setSelectedModel] = useState<TrainedModel | null>(null);

  const getUserId = () => {
    let userId = localStorage.getItem("user_id");
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem("user_id", userId);
    }
    return userId;
  };

  useEffect(() => {
    fetchCleanedDatasets();
    fetchTrainedModels();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      fetchDatasetColumns(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const fetchCleanedDatasets = async () => {
    setIsLoadingDatasets(true);
    try {
      const userId = getUserId();
      const response = await fetch(`${BACKEND_URL}/cleaned-datasets/${userId}`);
      if (!response.ok) throw new Error("Error al obtener datasets limpios");
      
      const data = await response.json();
      setCleanedDatasets(data.datasets);
      
      if (data.datasets.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(data.datasets[0].id);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datasets limpios",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const fetchDatasetColumns = async (datasetId: number) => {
    setIsLoadingColumns(true);
    try {
      const userId = getUserId();
      
      const response = await fetch(`${BACKEND_URL}/analyze-cleaned`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          dataset_id: datasetId
        })
      });
      
      if (!response.ok) throw new Error("Error al analizar dataset");
      
      const data = await response.json();
      
      // ✅ CAMBIO: usar data.columns en vez de Object.keys(data.columns_info)
      const columns = data.columns || [];
      
      setColumnNames(columns);
      setSelectedFeatures([]);
      setTargetVariable("");
      
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudieron obtener las columnas del dataset",
        variant: "destructive"
      });
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const fetchTrainedModels = async () => {
    setIsLoadingModels(true);
    try {
      const userId = getUserId();
      const response = await fetch(`${BACKEND_URL}/models/${userId}`);
      if (!response.ok) throw new Error("Error al obtener modelos");
      
      const data = await response.json();
      setTrainedModels(data.models);
    } catch (error: any) {
      console.error("Error:", error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!modelName || !selectedDatasetId || !targetVariable || selectedFeatures.length === 0) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }
    
    setIsTraining(true);
    
    try {
      // Construir hiperparámetros según el algoritmo
      let hyperparameters: any = {};
      
      const pytorchAlgos = ["neural_network", "cnn", "lstm"];
      if (pytorchAlgos.includes(selectedAlgorithm)) {
        hyperparameters = {
          epochs: epochs,
          batch_size: batchSize,
          learning_rate: learningRate,
          hidden_layers: [128, 64, 32],
          dropout: 0.2
        };
      } else if (selectedAlgorithm === "random_forest") {
        hyperparameters = {
          n_estimators: 100,
          random_state: 42
        };
      } else if (selectedAlgorithm === "logistic_regression") {
        hyperparameters = {
          max_iter: 1000,
          random_state: 42
        };
      }
      
      const response = await fetch(`${BACKEND_URL}/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: getUserId(),
          dataset_id: selectedDatasetId,
          name: modelName,
          algorithm: selectedAlgorithm,
          target_variable: targetVariable,
          hyperparameters: hyperparameters,
          test_size: testSplit,
          random_state: 42
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al entrenar modelo");
      }
      
      const data = await response.json();
      
      toast({
        title: "✅ Modelo entrenado exitosamente",
        description: `${data.name} - Precisión: ${(data.metrics.accuracy * 100).toFixed(2)}%`
      });
      
      // Recargar modelos
      await fetchTrainedModels();
      
      // Limpiar formulario
      setModelName("");
      setSelectedFeatures([]);
      setTargetVariable("");
      
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error al entrenar modelo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  };

  const algorithmOptions = {
    "Scikit-learn": [
      { value: "random_forest", label: "Random Forest" },
      { value: "linear_regression", label: "Linear Regression" },
      { value: "logistic_regression", label: "Logistic Regression" },
      { value: "svm", label: "SVM" }
    ],
    "PyTorch": [
      { value: "neural_network", label: "Neural Network (MLP)" },
      { value: "cnn", label: "CNN (Convolutional)" },
      { value: "lstm", label: "LSTM (Recurrent)" }
    ]
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoadingDatasets) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cleanedDatasets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-16 w-16 text-warning mb-4" />
        <h2 className="text-2xl font-bold mb-2">No hay datasets limpios</h2>
        <p className="text-muted-foreground">Primero debes limpiar un dataset en la página Clean</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Entrenar Modelo</h1>
        <p className="text-muted-foreground">
          Configura y entrena modelos con PyTorch y Scikit-learn
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modelos Activos</CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{trainedModels.filter(m => m.status === 'ready').length}</div>
            <p className="text-xs text-muted-foreground">{trainedModels.filter(m => m.status === 'training').length} en entrenamiento</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mejor Precisión</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {trainedModels.length > 0 
                ? `${(Math.max(...trainedModels.map(m => m.accuracy || 0)) * 100).toFixed(1)}%`
                : "0%"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {trainedModels.length > 0 
                ? trainedModels.reduce((best, m) => (m.accuracy || 0) > (best.accuracy || 0) ? m : best).algorithm
                : "N/A"
              }
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datasets Limpios</CardTitle>
            <Zap className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{cleanedDatasets.length}</div>
            <p className="text-xs text-muted-foreground">Disponibles para entrenar</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="configure" className="w-full">
        <TabsList>
          <TabsTrigger value="configure">Configurar</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="mt-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Target className="h-5 w-5" />
                Configuración del Modelo
              </CardTitle>
              <CardDescription>
                Selecciona algoritmo y parámetros de entrenamiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrain} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="model-name">Nombre del Modelo</Label>
                  <Input
                    id="model-name"
                    placeholder="Ej: predictor_ventas_v1"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataset">Dataset (CSV Limpio)</Label>
                  <Select 
                    value={selectedDatasetId?.toString()} 
                    onValueChange={(value) => setSelectedDatasetId(parseInt(value))}
                  >
                    <SelectTrigger id="dataset">
                      <SelectValue placeholder="Selecciona un dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {cleanedDatasets.map((dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id.toString()}>
                          {dataset.name} ({dataset.num_rows} filas)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="algorithm">Algoritmo</Label>
                  <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                    <SelectTrigger id="algorithm">
                      <SelectValue placeholder="Selecciona un algoritmo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(algorithmOptions).map(([groupName, algorithms]) => (
                        <div key={groupName}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {groupName}
                          </div>
                          {algorithms.map((algo) => (
                            <SelectItem key={algo.value} value={algo.value}>
                              {algo.label}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="epochs">Epochs</Label>
                    <Input 
                      id="epochs" 
                      type="number" 
                      value={epochs}
                      onChange={(e) => setEpochs(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-size">Batch Size</Label>
                    <Input 
                      id="batch-size" 
                      type="number" 
                      value={batchSize}
                      onChange={(e) => setBatchSize(parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="learning-rate">Learning Rate</Label>
                    <Input 
                      id="learning-rate" 
                      type="number" 
                      step="0.001" 
                      value={learningRate}
                      onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-split">Test Split (%)</Label>
                    <Input 
                      id="test-split" 
                      type="number" 
                      value={testSplit * 100}
                      onChange={(e) => setTestSplit(parseFloat(e.target.value) / 100)}
                    />
                  </div>
                </div>

                {isLoadingColumns ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Cargando columnas...</span>
                  </div>
                ) : columnNames.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      <Label>Features (columnas)</Label>
                      <div className="flex flex-wrap gap-2 p-3 border border-input rounded-md bg-background min-h-[60px]">
                        {selectedFeatures.length > 0 ? (
                          selectedFeatures.map((feature) => (
                            <Badge
                              key={feature}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => setSelectedFeatures(selectedFeatures.filter(f => f !== feature))}
                            >
                              {feature} ✕
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Selecciona columnas abajo</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {columnNames.filter(col => !selectedFeatures.includes(col) && col !== targetVariable).map((col) => (
                          <Badge
                            key={col}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => setSelectedFeatures([...selectedFeatures, col])}
                          >
                            + {col}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Target Variable</Label>
                      <div className="flex flex-wrap gap-2">
                        {columnNames.filter(col => !selectedFeatures.includes(col)).map((col) => (
                          <Badge
                            key={col}
                            variant={targetVariable === col ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setTargetVariable(col)}
                          >
                            {col}
                          </Badge>
                        ))}
                      </div>
                      {targetVariable && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Seleccionado: <span className="font-medium text-foreground">{targetVariable}</span>
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Selecciona un dataset para ver sus columnas</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground"
                  disabled={isTraining || !modelName || !selectedDatasetId || !targetVariable || selectedFeatures.length === 0}
                >
                  {isTraining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Entrenando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Iniciar Entrenamiento
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Modelos Entrenados</CardTitle>
              <CardDescription>Historial de modelos y resultados</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingModels ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : trainedModels.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No hay modelos entrenados todavía</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trainedModels.map((model) => (
                    <div 
                      key={model.id} 
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedModel(model)}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{model.name}</p>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {model.algorithm}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Precisión: {(model.accuracy * 100).toFixed(2)}% • 
                          Tiempo: {model.training_time}s • 
                          {formatDate(model.trained_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            model.status === "ready"
                              ? "bg-success/10 text-success border-success/20"
                              : model.status === "training"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          }
                        >
                          {model.status === "ready" ? "Listo" : model.status === "training" ? "Entrenando" : "Error"}
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
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          {selectedModel ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-gradient-card border-border shadow-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Métricas Principales</CardTitle>
                  <CardDescription>{selectedModel.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedModel.metrics.task_type === "classification" ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Accuracy</span>
                            <span className="font-medium text-foreground">
                              {(selectedModel.metrics.accuracy * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-primary" 
                              style={{ width: `${selectedModel.metrics.accuracy * 100}%` }} 
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Precision</span>
                            <span className="font-medium text-foreground">
                              {(selectedModel.metrics.precision * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-accent" 
                              style={{ width: `${selectedModel.metrics.precision * 100}%` }} 
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Recall</span>
                            <span className="font-medium text-foreground">
                              {(selectedModel.metrics.recall * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-primary" 
                              style={{ width: `${selectedModel.metrics.recall * 100}%` }} 
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">F1-Score</span>
                            <span className="font-medium text-foreground">
                              {(selectedModel.metrics.f1_score * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-accent" 
                              style={{ width: `${selectedModel.metrics.f1_score * 100}%` }} 
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">R² Score</span>
                            <span className="font-medium text-foreground">
                              {selectedModel.metrics.r2_score.toFixed(4)}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-primary" 
                              style={{ width: `${Math.max(0, selectedModel.metrics.r2_score * 100)}%` }} 
                            />
                          </div>
                        </div>

                        <div className="p-4 bg-muted/30 rounded-lg border border-border">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">MSE</p>
                              <p className="text-lg font-bold text-foreground">
                                {selectedModel.metrics.mse.toFixed(4)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">MAE</p>
                              <p className="text-lg font-bold text-foreground">
                                {selectedModel.metrics.mae.toFixed(4)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {selectedModel.metrics.confusion_matrix && (
                <Card className="bg-gradient-card border-border shadow-card">
                  <CardHeader>
                    <CardTitle className="text-foreground">Matriz de Confusión</CardTitle>
                    <CardDescription>Distribución de predicciones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedModel.metrics.confusion_matrix.flat().map((value: number, idx: number) => (
                        <div 
                          key={idx}
                          className="p-6 bg-primary/10 rounded-lg border border-primary/20 text-center"
                        >
                          <p className="text-2xl font-bold text-foreground">{value}</p>
                          <p className="text-xs text-muted-foreground">
                            {idx === 0 ? "True Positive" : idx === 1 ? "False Positive" : idx === 2 ? "False Negative" : "True Negative"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedModel.metrics.training_history && (
                <Card className="bg-gradient-card border-border shadow-card lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-foreground">Curva de Aprendizaje (PyTorch)</CardTitle>
                    <CardDescription>
                      Evolución durante {selectedModel.metrics.total_epochs} epochs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={
                        selectedModel.metrics.training_history.train_loss.map((loss: number, idx: number) => ({
                          epoch: idx + 1,
                          train_loss: loss,
                          val_loss: selectedModel.metrics.training_history.val_loss[idx],
                          train_acc: selectedModel.metrics.training_history.train_acc?.[idx],
                          val_acc: selectedModel.metrics.training_history.val_acc?.[idx]
                        }))
                      }>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="epoch" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="train_loss" stroke="hsl(var(--primary))" strokeWidth={2} name="Train Loss" />
                        <Line type="monotone" dataKey="val_loss" stroke="hsl(var(--accent))" strokeWidth={2} name="Val Loss" />
                        {selectedModel.metrics.training_history.train_acc && (
                          <Line type="monotone" dataKey="train_acc" stroke="hsl(var(--success))" strokeWidth={2} name="Train Acc" />
                        )}
                        {selectedModel.metrics.training_history.val_acc && (
                          <Line type="monotone" dataKey="val_acc" stroke="hsl(var(--warning))" strokeWidth={2} name="Val Acc" />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {selectedModel.metrics.feature_importance && (
                <Card className="bg-gradient-card border-border shadow-card lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-foreground">Importancia de Features</CardTitle>
                    <CardDescription>Contribución de cada variable (Random Forest)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={Object.entries(selectedModel.metrics.feature_importance)
                          .map(([feature, importance]) => ({ feature, importance }))
                          .sort((a, b) => b.importance - a.importance)
                          .slice(0, 10)
                        } 
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="feature" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="importance" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="bg-gradient-card border-border shadow-card">
              <CardContent className="py-12">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Selecciona un modelo en la pestaña "Modelos" para ver sus métricas</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainPage;