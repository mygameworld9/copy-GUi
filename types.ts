


// 3.1 Recursive Data Structure & 3.2 Action Protocol
export interface UIAction {
  type: string;
  payload?: any;
  // For local state updates
  path?: string; // Dot notation path e.g. "0.children.1.input.value"
}

// The Node is a loose object where the KEY is the component type
// e.g. { "container": { ...props } }
export type UINode = {
  [key: string]: any;
};

// Allowed component types in our Registry
export type ComponentType = 
  | 'container'
  | 'text'
  | 'button'
  | 'card'
  | 'input'
  | 'textarea'
  | 'stat'
  | 'chart'
  | 'separator'
  | 'badge'
  | 'hero'     
  | 'table'    
  | 'progress' 
  | 'alert'    
  | 'avatar'   
  | 'image'
  | 'map'
  | 'accordion'
  | 'switch'
  | 'slider'
  | 'tabs'     
  | 'stepper'
  | 'timeline'
  | 'codeblock'
  | 'split_pane'
  | 'calendar'
  | 'vn_stage'; // NEW: Visual Novel Stage

// User Context for 1.1 Implicit Input
export interface UserContext {
  role: 'admin' | 'user';
  device: 'desktop' | 'mobile';
  theme: 'dark' | 'light';
  mode?: 'default' | 'galgame'; // NEW: App Mode
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  uiNode?: UINode; // The structured UI payload
}

// --- GALGAME TYPES ---

export type ImageSource = "EXTERNAL_URL" | "GENERATED";

export interface ImageAsset {
  source: ImageSource;
  value: string; // URL prompt or GenAI prompt
  style?: string; // "ANIME", "REALISTIC", etc.
}

export interface VNCharacter {
  id: string;
  name: string;
  avatar: ImageAsset;
  position: "LEFT" | "CENTER" | "RIGHT" | "CLOSE_UP";
  expression: "NEUTRAL" | "SMILE" | "ANGRY" | "BLUSH" | "SAD" | "SHOCKED";
  animation?: {
    type: string; // AnimationType
    delay?: number;
  }
}

export interface VNDialogue {
  speaker: string;
  content: string;
  voice_id?: string;
  speed?: "SLOW" | "NORMAL" | "FAST";
}

export interface VNChoice {
  label: string;
  action: UIAction;
  style?: "DEFAULT" | "AGGRESSIVE" | "ROMANTIC";
}

export interface VNStageNode {
  vn_stage: {
    background: ImageAsset;
    characters?: VNCharacter[];
    dialogue: VNDialogue;
    choices?: VNChoice[];
    bgm?: string;
    sfx?: string;
  }
}
