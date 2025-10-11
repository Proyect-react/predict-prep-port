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
  const [selectedDataset, setSelectedDataset] = useState("sales_2024.csv");

  const datasets = ["sales_2024.csv", "customer_data.json", "product_inventory.xlsx"];

  const sampleData = [
    { id: 1, name: "Juan Pérez", age: 28, email: "juan@example.com", salary: 50000 },
    { id: 2, name: "María García", age: null, email: "maria@example.com", salary: 65000 },
    { id: 3, name: null, age: 35, email: "invalid-email", salary: 55000 },
    { id: 4, name: "Carlos López", age: 42, email: "carlos@example.com", salary: null },
  ];

  const dataQuality = [
    { column: "name", nulls: 1, type: "string", status: "warning" },
    { column: "age", nulls: 1, type: "integer", status: "warning" },
    { column: "email", nulls: 0, type: "string", status: "error" },
    { column: "salary", nulls: 1, type: "float", status: "warning" },
  ];

  const handleClean = () => {
    toast({
      title: "Limpieza en proceso",
      description: "Pandas está procesando tu dataset en el backend.",
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
            <div className="text-2xl font-bold text-foreground">1,234</div>
            <p className="text-xs text-muted-foreground">4 columnas detectadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valores Nulos</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">3</div>
            <p className="text-xs text-muted-foreground">0.24% del dataset</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calidad</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">97.6%</div>
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
              <CardDescription>Primeras 4 filas del archivo</CardDescription>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.id}</TableCell>
                        <TableCell>
                          {row.name ? row.name : <Badge variant="outline" className="bg-warning/10 text-warning">NULL</Badge>}
                        </TableCell>
                        <TableCell>
                          {row.age ?? <Badge variant="outline" className="bg-warning/10 text-warning">NULL</Badge>}
                        </TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>
                          {row.salary ? `$${row.salary.toLocaleString()}` : <Badge variant="outline" className="bg-warning/10 text-warning">NULL</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
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
                onClick={handleClean}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar valores nulos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <RefreshCw className="h-4 w-4 mr-2" />
                Imputar con media/mediana
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                Normalizar datos (StandardScaler)
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                Codificar variables categóricas
              </Button>
              <Button className="w-full mt-4 bg-gradient-primary hover:opacity-90 text-primary-foreground">
                Aplicar y Guardar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CleanPage;
