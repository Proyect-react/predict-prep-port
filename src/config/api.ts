// src/config/api.ts

// 🔹 Obtener URL del backend desde variables de entorno
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// 🔹 Helper para manejar errores HTTP
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(errorData.detail || `Error ${response.status}`);
  }
  return response.json();
};

// 🔹 Helper para obtener user_id
const getUserId = (): string => {
  let userId = localStorage.getItem("user_id");
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("user_id", userId);
  }
  return userId;
};

// ============================================
// 📤 UPLOAD SERVICE
// ============================================

export const uploadService = {
  /**
   * Subir un dataset (CSV/Excel)
   */
  uploadDataset: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", getUserId());

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    return handleResponse(response);
  },

  /**
   * Obtener lista de datasets del usuario
   */
  getUserDatasets: async () => {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/datasets/${userId}`);
    return handleResponse(response);
  },
};

// ============================================
// 🧹 CLEAN SERVICE
// ============================================

export const cleanService = {
  /**
   * Analizar un dataset (obtener columnas, nulls, preview)
   */
  analyzeDataset: async (datasetId: number) => {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getUserId(),
        dataset_id: datasetId,
      }),
    });

    return handleResponse(response);
  },

  /**
   * Analizar un dataset limpio
   */
  analyzeCleanedDataset: async (datasetId: number) => {
    const response = await fetch(`${API_BASE_URL}/analyze-cleaned`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getUserId(),
        dataset_id: datasetId,
      }),
    });

    return handleResponse(response);
  },

  /**
   * Aplicar operaciones de limpieza
   */
  cleanDataset: async (
    datasetId: number,
    operations: string[],
    options?: Record<string, any>
  ) => {
    const response = await fetch(`${API_BASE_URL}/clean`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getUserId(),
        dataset_id: datasetId,
        operation: operations,
        options: options || {},
      }),
    });

    return handleResponse(response);
  },

  /**
   * Obtener datasets limpios del usuario
   */
  getCleanedDatasets: async () => {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/cleaned-datasets/${userId}`);
    return handleResponse(response);
  },
};

// ============================================
// 🎯 TRAIN SERVICE
// ============================================

export const trainService = {
  /**
   * Entrenar un modelo ML
   */
  trainModel: async (config: {
    dataset_id: number;
    name: string;
    algorithm: string;
    target_variable: string;
    hyperparameters?: Record<string, any>;
    test_size?: number;
    random_state?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getUserId(),
        ...config,
      }),
    });

    return handleResponse(response);
  },

  /**
   * Obtener modelos entrenados del usuario
   */
  getUserModels: async () => {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/models/${userId}`);
    return handleResponse(response);
  },
};

// ============================================
// 📊 HEALTH CHECK
// ============================================

export const healthService = {
  /**
   * Verificar estado del backend
   */
  checkHealth: async () => {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return handleResponse(response);
  },
};

// ============================================
// 🛠️ UTILITY FUNCTIONS
// ============================================

export const apiUtils = {
  /**
   * Obtener URL base de la API
   */
  getBaseUrl: () => API_BASE_URL,

  /**
   * Obtener user_id actual
   */
  getUserId,

  /**
   * Resetear user_id (útil para testing)
   */
  resetUserId: () => {
    localStorage.removeItem("user_id");
  },
};

// ============================================
// 📦 EXPORT DEFAULT
// ============================================

export default {
  upload: uploadService,
  clean: cleanService,
  train: trainService,
  health: healthService,
  utils: apiUtils,
};