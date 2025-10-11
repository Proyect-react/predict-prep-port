import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Upload, Sparkles, TrendingUp, FileText, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const stats = [
    { label: "Datasets Cargados", value: "12", icon: Database, color: "bg-gradient-primary" },
    { label: "Modelos Entrenados", value: "8", icon: Sparkles, color: "bg-gradient-accent" },
    { label: "Precisión Promedio", value: "94.2%", icon: TrendingUp, color: "bg-gradient-primary" },
    { label: "Procesos Activos", value: "3", icon: Activity, color: "bg-gradient-accent" },
  ];

  const recentActivity = [
    { action: "Dataset 'sales_2024.csv' cargado", time: "Hace 5 min", status: "success" },
    { action: "Modelo RandomForest entrenado", time: "Hace 15 min", status: "success" },
    { action: "Limpieza de datos completada", time: "Hace 1 hora", status: "success" },
    { action: "Conexión a base de datos establecida", time: "Hace 2 horas", status: "success" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Gestiona tus datos, entrena modelos y visualiza resultados
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-gradient-card border-border shadow-card hover:shadow-hover transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={cn("rounded-lg p-2", stat.color)}>
                  <Icon className="h-4 w-4 text-primary-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en tu pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                    <Activity className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    Éxito
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Acciones Rápidas</CardTitle>
            <CardDescription>Inicia un nuevo proceso</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link to="/upload">
              <Button className="w-full justify-start gap-3 bg-gradient-primary hover:opacity-90 text-primary-foreground">
                <Upload className="h-4 w-4" />
                Cargar Nuevo Dataset
              </Button>
            </Link>
            <Link to="/train">
              <Button className="w-full justify-start gap-3 bg-gradient-accent hover:opacity-90 text-accent-foreground">
                <Sparkles className="h-4 w-4" />
                Entrenar Modelo
              </Button>
            </Link>
            <Link to="/clean">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Database className="h-4 w-4" />
                Limpiar Datos
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="outline" className="w-full justify-start gap-3">
                <FileText className="h-4 w-4" />
                Configurar Conexión
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

export default Dashboard;
