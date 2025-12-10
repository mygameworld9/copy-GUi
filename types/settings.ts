
export interface ModelConfig {
  model: string;
  soundEnabled: boolean; // NEW
}

export const DEFAULT_CONFIG: ModelConfig = {
  model: "gemini-2.5-flash",
  soundEnabled: true
};
