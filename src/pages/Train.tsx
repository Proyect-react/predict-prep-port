import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Zap, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TrainPage = () => {
  const { toast } = useToast();

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
                  <Label htmlFor="features">Features (columnas)</Label>
                  <Input
                    id="features"
                    placeholder="Ej: age, salary, experience"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">Target Variable</Label>
                  <Input
                    id="target"
                    placeholder="Ej: churn, price, category"
                  />
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
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Métricas de Rendimiento</CardTitle>
              <CardDescription>Análisis del mejor modelo</CardDescription>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainPage;
