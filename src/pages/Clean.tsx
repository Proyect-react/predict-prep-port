import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Database, AlertCircle, CheckCircle, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const CleanPage = () => {
  const { toast } = useToast();
  const [selectedDataset, setSelectedDataset] = useState("ventas.csv");
  const [currentData, setCurrentData] = useState<Array<{
    id: number;
    name: string | null | "N/A";
    age: number | null | "N/A";
    email: string | null | "N/A";
    salary: number | null | "N/A";
  }>>([
    { id: 1, name: "Juan Pérez", age: 28, email: "juan@example.com", salary: 50000 },
    { id: 2, name: "María García", age: null, email: "maria@example.com", salary: 65000 },
    { id: 3, name: null, age: 35, email: "invalid-email", salary: 55000 },
    { id: 4, name: "Carlos López", age: 42, email: "carlos@example.com", salary: null },
    { id: 5, name: "Ana Martínez", age: null, email: "ana@example.com", salary: null },
    { id: 6, name: null, age: null, email: "correo-invalido", salary: 48000 },
    { id: 7, name: "Pedro Sánchez", age: 31, email: "pedro@example.com", salary: 72000 },
    { id: 8, name: "Laura Torres", age: 29, email: null, salary: null },
    { id: 9, name: null, age: 38, email: "sofia@example.com", salary: 61000 },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const datasets = ["ventas.csv", "sales_2024.csv", "customer_data.json", "product_inventory.xlsx"];

  const calculateStats = () => {
    const totalRecords = currentData.length;
    const nullCounts = {
      name: currentData.filter(r => r.name === null || r.name === "N/A").length,
      age: currentData.filter(r => r.age === null || r.age === "N/A").length,
      email: currentData.filter(r => r.email === null || r.email === "N/A").length,
      salary: currentData.filter(r => r.salary === null || r.salary === "N/A").length,
    };
    const totalNulls = Object.values(nullCounts).reduce((a, b) => a + b, 0);
    const totalCells = totalRecords * 4;
    const qualityPercent = ((totalCells - totalNulls) / totalCells * 100).toFixed(1);
    
    return { totalRecords, nullCounts, totalNulls, qualityPercent };
  };

  const stats = calculateStats();

  const dataQuality = [
    { column: "name", nulls: stats.nullCounts.name, type: "string", status: stats.nullCounts.name > 0 ? "warning" : "success" },
    { column: "age", nulls: stats.nullCounts.age, type: "integer", status: stats.nullCounts.age > 0 ? "warning" : "success" },
    { column: "email", nulls: stats.nullCounts.email, type: "string", status: "error" },
    { column: "salary", nulls: stats.nullCounts.salary, type: "float", status: stats.nullCounts.salary > 0 ? "warning" : "success" },
  ];

  const handleRemoveNulls = () => {
    setIsProcessing(true);
    toast({
      title: "Limpiando valores nulos",
      description: "Procesando dataset...",
    });

    setTimeout(() => {
      const cleanedData = currentData.map(row => ({
        ...row,
        name: (row.name === null ? "N/A" : row.name) as string | "N/A",
        age: (row.age === null ? "N/A" : row.age) as number | "N/A",
        email: (row.email === null ? "N/A" : row.email) as string | "N/A",
        salary: (row.salary === null ? "N/A" : row.salary) as number | "N/A",
      }));
      setCurrentData(cleanedData);
      setIsProcessing(false);
      toast({
        title: "Limpieza completada",
        description: "Valores nulos reemplazados con N/A.",
      });
    }, 1500);
  };

  const handleImputeMean = () => {
    setIsProcessing(true);
    toast({
      title: "Imputando valores",
      description: "Calculando media/mediana...",
    });

    setTimeout(() => {
      const ages = currentData.filter(r => typeof r.age === 'number').map(r => r.age as number);
      const salaries = currentData.filter(r => typeof r.salary === 'number').map(r => r.salary as number);
      
      const avgAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
      const avgSalary = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);

      const imputedData = currentData.map(row => ({
        ...row,
        age: typeof row.age === 'number' ? row.age : avgAge,
        salary: typeof row.salary === 'number' ? row.salary : avgSalary,
        name: row.name === null || row.name === "N/A" ? "Desconocido" : row.name,
        email: row.email === null || row.email === "N/A" ? "sin-email@example.com" : row.email
      }));

      setCurrentData(imputedData);
      setIsProcessing(false);
      toast({
        title: "Imputación completada",
        description: "Valores nulos reemplazados con media/mediana.",
      });
    }, 1500);
  };

  const handleReset = () => {
    setCurrentData([
      { id: 1, name: "Juan Pérez", age: 28, email: "juan@example.com", salary: 50000 },
      { id: 2, name: "María García", age: null, email: "maria@example.com", salary: 65000 },
      { id: 3, name: null, age: 35, email: "invalid-email", salary: 55000 },
      { id: 4, name: "Carlos López", age: 42, email: "carlos@example.com", salary: null },
      { id: 5, name: "Ana Martínez", age: null, email: "ana@example.com", salary: null },
      { id: 6, name: null, age: null, email: "correo-invalido", salary: 48000 },
      { id: 7, name: "Pedro Sánchez", age: 31, email: "pedro@example.com", salary: 72000 },
      { id: 8, name: "Laura Torres", age: 29, email: null, salary: null },
      { id: 9, name: null, age: 38, email: "sofia@example.com", salary: 61000 },
    ]);
    toast({
      title: "Dataset reiniciado",
      description: "Se restauraron los datos originales.",
    });
  };

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
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger id="dataset-select">
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
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalRecords}</div>
            <p className="text-xs text-muted-foreground">5 columnas detectadas</p>
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
              {((stats.totalNulls / (stats.totalRecords * 4)) * 100).toFixed(1)}% del dataset
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
              <CardDescription>Mostrando {stats.totalRecords} filas • Actualización en tiempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Salario</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((row) => {
                      const isActive = row.age !== null && row.age !== "N/A" && row.salary !== null && row.salary !== "N/A";
                      return (
                        <TableRow key={row.id} className={isProcessing ? "opacity-50 animate-pulse" : ""}>
                          <TableCell className="font-medium">{row.id}</TableCell>
                          <TableCell>
                            {row.name && row.name !== "N/A" ? row.name : <Badge variant="outline" className="bg-warning/10 text-warning">{row.name === "N/A" ? "N/A" : "NULL"}</Badge>}
                          </TableCell>
                          <TableCell>
                            {row.age && row.age !== "N/A" ? row.age : <Badge variant="outline" className="bg-warning/10 text-warning">{row.age === "N/A" ? "N/A" : "NULL"}</Badge>}
                          </TableCell>
                          <TableCell>{row.email && row.email !== "N/A" ? row.email : <Badge variant="outline" className="bg-warning/10 text-warning">{row.email === "N/A" ? "N/A" : "NULL"}</Badge>}</TableCell>
                          <TableCell>
                            {row.salary && row.salary !== "N/A" ? `$${typeof row.salary === 'number' ? row.salary.toLocaleString() : row.salary}` : <Badge variant="outline" className="bg-warning/10 text-warning">{row.salary === "N/A" ? "N/A" : "NULL"}</Badge>}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={isActive ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}
                            >
                              {isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
                {dataQuality.map((col) => (
                  <div key={col.column} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{col.column}</p>
                      <p className="text-sm text-muted-foreground">
                        Tipo: {col.type} • {col.nulls} valores nulos
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        col.status === "error"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-warning/10 text-warning border-warning/20"
                      }
                    >
                      {col.status === "error" ? "Requiere atención" : "Advertencia"}
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
                variant="outline"
                className="w-full justify-start"
                onClick={handleRemoveNulls}
                disabled={isProcessing}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar valores nulos
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleImputeMean}
                disabled={isProcessing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Imputar con media/mediana
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled={isProcessing}>
                <Database className="h-4 w-4 mr-2" />
                Normalizar datos (StandardScaler)
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled={isProcessing}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Codificar variables categóricas
              </Button>
              <Button 
                className="w-full mt-4 bg-gradient-primary hover:opacity-90 text-primary-foreground"
                onClick={handleReset}
                disabled={isProcessing}
              >
                Reiniciar Dataset Original
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CleanPage;
