import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, TrendingUp, Zap, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const TrainPage = () => {
  const { toast } = useToast();
  const [selectedDataset, setSelectedDataset] = useState("sales_2024.csv");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetVariable, setTargetVariable] = useState("");

  const datasets = ["sales_2024.csv", "customer_data.json", "product_inventory.xlsx"];
  const columns = ["age", "salary", "experience", "churn", "price", "category", "department", "location"];
  
  const confusionData = [
    { name: 'True Positive', value: 342 },
    { name: 'True Negative', value: 298 },
    { name: 'False Positive', value: 18 },
    { name: 'False Negative', value: 12 }
  ];

  const trainingData = [
    { epoch: 1, train: 0.65, val: 0.62 },
    { epoch: 20, train: 0.82, val: 0.79 },
    { epoch: 40, train: 0.91, val: 0.87 },
    { epoch: 60, train: 0.95, val: 0.92 },
    { epoch: 80, train: 0.97, val: 0.95 },
    { epoch: 100, train: 0.98, val: 0.968 }
  ];

  const featureImportance = [
    { feature: 'experience', importance: 0.35 },
    { feature: 'salary', importance: 0.28 },
    { feature: 'age', importance: 0.22 },
    { feature: 'department', importance: 0.15 }
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

  const handleTrain = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Entrenamiento iniciado",
      description: "Tu modelo se está entrenando con PyTorch/Scikit-learn en el backend.",
    });
  };

  const models = [
    { name: "Random Forest", library: "scikit-learn", accuracy: "94.2%", status: "active" },
    { name: "Neural Network", library: "pytorch", accuracy: "96.8%", status: "active" },
    { name: "Gradient Boosting", library: "scikit-learn", accuracy: "93.5%", status: "completed" },
  ];

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
            <div className="text-2xl font-bold text-foreground">8</div>
            <p className="text-xs text-muted-foreground">2 en entrenamiento</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mejor Precisión</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">96.8%</div>
            <p className="text-xs text-muted-foreground">Neural Network</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Zap className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">8.5 min</div>
            <p className="text-xs text-muted-foreground">Por epoch</p>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataset">Dataset (CSV Limpio)</Label>
                  <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                    <SelectTrigger id="dataset">
                      <SelectValue placeholder="Selecciona un dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((dataset) => (
                        <SelectItem key={dataset} value={dataset}>
                          {dataset}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="algorithm">Algoritmo</Label>
                  <select
                    id="algorithm"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <optgroup label="Scikit-learn">
                      <option>Random Forest</option>
                      <option>Gradient Boosting</option>
                      <option>SVM</option>
                      <option>Logistic Regression</option>
                    </optgroup>
                    <optgroup label="PyTorch">
                      <option>Neural Network</option>
                      <option>CNN</option>
                      <option>LSTM</option>
                    </optgroup>
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="epochs">Epochs</Label>
                    <Input id="epochs" type="number" defaultValue="100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-size">Batch Size</Label>
                    <Input id="batch-size" type="number" defaultValue="32" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="learning-rate">Learning Rate</Label>
                    <Input id="learning-rate" type="number" step="0.001" defaultValue="0.001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-split">Test Split (%)</Label>
                    <Input id="test-split" type="number" defaultValue="20" />
                  </div>
                </div>

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
                    {columns.filter(col => !selectedFeatures.includes(col) && col !== targetVariable).map((col) => (
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
                    {columns.filter(col => !selectedFeatures.includes(col)).map((col) => (
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

                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Iniciar Entrenamiento
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
              <div className="space-y-4">
                {models.map((model, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{model.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {model.library} • Precisión: {model.accuracy}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          model.status === "active"
                            ? "bg-accent/10 text-accent border-accent/20"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {model.status === "active" ? "Activo" : "Completado"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-foreground">Métricas Principales</CardTitle>
                <CardDescription>Accuracy, Precision, Recall y F1-Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Accuracy</span>
                      <span className="font-medium text-foreground">96.8%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-primary" style={{ width: "96.8%" }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Precision</span>
                      <span className="font-medium text-foreground">94.2%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-accent" style={{ width: "94.2%" }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Recall</span>
                      <span className="font-medium text-foreground">95.5%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-primary" style={{ width: "95.5%" }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">F1-Score</span>
                      <span className="font-medium text-foreground">94.8%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-accent" style={{ width: "94.8%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-foreground">Matriz de Confusión</CardTitle>
                <CardDescription>Distribución de predicciones</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={confusionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {confusionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-foreground">Curva de Aprendizaje</CardTitle>
                <CardDescription>Evolución del accuracy durante el entrenamiento</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trainingData}>
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
                    <Line type="monotone" dataKey="train" stroke="hsl(var(--primary))" strokeWidth={2} name="Train Accuracy" />
                    <Line type="monotone" dataKey="val" stroke="hsl(var(--accent))" strokeWidth={2} name="Validation Accuracy" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-foreground">Importancia de Features</CardTitle>
                <CardDescription>Contribución de cada variable al modelo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={featureImportance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="feature" type="category" stroke="hsl(var(--muted-foreground))" />
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainPage;
