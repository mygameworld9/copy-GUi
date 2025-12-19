




import { UserContext } from "./types";

export const INITIAL_CONTEXT: UserContext = {
  role: 'user',
  device: 'mobile', // Default to mobile as requested
  theme: 'dark',
  mode: 'default'
};

// 2.1 Prompt Engineering - Detailed Component Specs for the LLM
export const COMPONENT_SPECS = `
COMPONENT DEFINITIONS (Protobuf OneOf Schema)
---------------------------------------------
Each node MUST be an object with EXACTLY ONE key (the component name).
**GLOBAL PROP:** All visual components support an optional \`animation\` object.
  - animation: { 
      type: "FADE_IN" | "FADE_IN_UP" | "SLIDE_FROM_LEFT" | "SCALE_ELASTIC" | "BLUR_IN" | "STAGGER_CONTAINER" | "PULSE" | "SHIMMER" | "SHAKE" | "BOUNCE" | "GLOW" | "TYPEWRITER" | "SCRAMBLE" | "GRADIENT_FLOW" | "WIGGLE" | "POP" | "HOVER_GROW",
      duration: "FAST" | "NORMAL" | "SLOW",
      delay: number (seconds),
      trigger: "ON_MOUNT" | "ON_HOVER" | "ON_VIEW"
    }

1. "container"
   - Props:
     - layout: "COL" (default), "ROW", "GRID"
     - gap: "GAP_SM", "GAP_MD", "GAP_LG", "GAP_XL"
     - padding: boolean
     - background: "DEFAULT" (transparent), "SURFACE", "GLASS"
     - bgImage: string (URL for background image)
     - className: string (Tailwind classes)
     - children: Array of Nodes

2. "hero"
   - Props:
     - title: string
     - subtitle: string
     - gradient: "BLUE_PURPLE", "ORANGE_RED", "GREEN_TEAL", "AURORA", "CYBER"
     - align: "CENTER", "LEFT"
     - children: Array of Nodes (Buttons usually)

3. "text"
   - Props:
     - content: string
     - variant: "H1", "H2", "H3", "BODY", "CAPTION", "CODE"
     - color: "DEFAULT", "MUTED", "PRIMARY", "ACCENT", "DANGER", "SUCCESS"
     - font: "SANS" (default), "SERIF", "CURSIVE"

4. "button"
   - Props:
     - label: string
     - variant: "PRIMARY", "SECONDARY", "GHOST", "DANGER", "GLOW", "OUTLINE", "SOFT", "GRADIENT"
     - icon: string (Lucide icon name)
     - disabled: boolean
     - action: { "type": string, "payload": any } 
       * "NAVIGATE": { "url": string, "target": "_blank" | "_self" }
       * "OPEN_MODAL": { "title": string, "content": UINode }
       * "CLOSE_MODAL": {}
       * "TRIGGER_EFFECT": { "effect": "CONFETTI" | "SNOW" }
       * "SHOW_TOAST": { "message": string, "type": "SUCCESS" | "ERROR" | "INFO" }
       * "COPY_TO_CLIPBOARD": { "text": string }
       * "DOWNLOAD": { "filename": string, "content": string }
       * "CYCLE_STATE": { "next": Array<ButtonProps> }
       * "SUBMIT_FORM": {}
       * "SEQUENCE": { "actions": Array<Action> }
       * "GO_BACK": {}
       * "DELAY": { "ms": number }
       * "PATCH_STATE": { "payload": { "key": "value" } } (Can target parent stepper by path)

5. "card"
   - Props:
     - title: string
     - variant: "DEFAULT", "GLASS", "NEON", "OUTLINED", "ELEVATED", "FROSTED"
     - children: Array of Nodes

6. "table"
   - Props:
     - headers: Array<string>
     - rows: Array<Array<string | UINode>>

7. "stat"
   - Props:
     - label: string
     - value: string
     - trend: string
     - trendDirection: "UP", "DOWN", "NEUTRAL"

8. "progress"
   - Props:
     - label: string
     - value: number (0-100)
     - color: "BLUE", "GREEN", "ORANGE", "RED"

9. "alert"
   - Props:
     - title: string
     - description: string
     - variant: "INFO", "SUCCESS", "WARNING", "ERROR"

10. "avatar"
    - Props:
      - initials: string
      - src: string (URL)
      - status: "ONLINE", "OFFLINE", "BUSY"

11. "chart" (Recharts)
    - Props:
      - title: string
      - type: "BAR", "LINE", "AREA"
      - color: string (Hex)
      - data: Array<{ name: string, value: number }>

12. "accordion"
    - Props:
      - variant: "DEFAULT", "SEPARATED"
      - items: Array<{ title: string, content: Array<Nodes> }>

13. "image"
    - Props:
      - src: string (Use placeholder APIs if needed)
      - alt: string
      - caption: string
      - aspectRatio: "VIDEO", "SQUARE", "WIDE", "PORTRAIT"

14. "map"
    - Props:
      - label: string
      - defaultZoom: number
      - style: "DARK", "LIGHT", "SATELLITE"
      - markers: Array<{ title: string, lat: number, lng: number }>

15. "bento_container" (Grid Layout)
    - Props:
      - children: Array<Nodes> (Must contain "bento_card" nodes)

16. "bento_card" (Grid Item)
    - Props:
      - title: string
      - colSpan: number (1-4, default 1)
      - rowSpan: number (1-3, default 1)
      - bgImage: string (optional)
      - children: Array<Nodes>

17. "kanban" (Project Board)
    - Props:
      - columns: Array<{ title: string, color: string, items: Array<string | { content: string, tag: string }> }>
      * Colors: "BLUE", "GREEN", "ORANGE", "RED", "GRAY"

18. "input" (Text Field)
    - Props:
      - label: string
      - placeholder: string
      - inputType: "text", "email", "password", "number"
      - value: string
      - validation: { 
          "required": boolean, 
          "pattern": string (regex), 
          "minLength": number, 
          "maxLength": number, 
          "errorMessage": string 
        }

19. "switch" (Toggle)
    - Props:
      - label: string
      - value: boolean (default false)

20. "slider" (Range)
    - Props:
      - label: string
      - min: number
      - max: number
      - value: number
      - step: number

21. "tabs" (Tabbed Interface)
    - Props:
      - defaultValue: string (id of active tab)
      - variant: "DEFAULT", "PILLS", "UNDERLINE"
      - items: Array<{ id: string, label: string, content: Array<Nodes> }>

22. "stepper" (Multi-step Workflow)
    - Props:
      - currentStep: number (0-indexed)
      - items: Array<{ id: string, title: string, content: Array<Nodes> }>
      * To make a "Next" button, use PATCH_STATE on the button to update 'currentStep'.

23. "timeline" (Vertical Activity Log)
    - Props:
      - items: Array<{ title: string, description: string, time: string, status: "COMPLETED" | "ACTIVE" | "PENDING", icon: string }>
      - variant: "DEFAULT", "GLOW"

24. "codeblock" (Terminal / Code Display)
    - Props:
      - code: string
      - language: string
      - filename: string

25. "textarea" (Multi-line Input)
    - Props:
      - label: string
      - placeholder: string
      - value: string

26. "split_pane" (Resizable Layout)
    - Props:
      - direction: "ROW" | "COL"
      - initialSize: number (10-90, percentage)
      - children: Array<Nodes> (Must have exactly 2 children)

27. "calendar" (Date Picker)
    - Props:
      - label: string
      - selectedDate: string (YYYY-MM-DD)

28. "vn_stage" (Visual Novel / Galgame Engine)
    - Props:
      - background: { source: "EXTERNAL_URL" | "GENERATED", value: string, style?: string }
      - characters: Array<{ 
          id: string, 
          name: string, 
          avatar: { source: "EXTERNAL_URL" | "GENERATED", value: string, style?: string }, 
          position: "LEFT" | "CENTER" | "RIGHT" | "CLOSE_UP", 
          expression: "NEUTRAL" | "SMILE" | "ANGRY" | "BLUSH" | "SAD" | "SHOCKED"
        }>
      - dialogue: { speaker: string, content: string, speed: "SLOW" | "NORMAL" | "FAST" }
      - choices: Array<{ label: string, action: Action, style?: "DEFAULT" | "AGGRESSIVE" | "ROMANTIC" }>
      - bgm: string (optional)
`;

export const FEW_SHOT_EXAMPLES = `
EXAMPLE 1: Vivid Music Player Profile
Response:
{
  "container": {
    "layout": "COL",
    "background": "GLASS",
    "padding": true,
    "animation": { "type": "STAGGER_CONTAINER" },
    "children": [
      { 
        "hero": { 
          "title": "Neon Nights", 
          "subtitle": "Cyberpunk Synthwave Mix 2024", 
          "gradient": "CYBER", 
          "align": "LEFT",
          "children": [
             { "button": { "label": "Play Now", "variant": "GLOW", "icon": "Play", "animation": { "type": "PULSE" } } },
             { "button": { "label": "Add to Library", "variant": "SOFT", "icon": "Heart" } }
          ]
        } 
      },
      {
        "bento_container": {
           "children": [
              { "bento_card": { "title": "Album Art", "colSpan": 2, "rowSpan": 2, "bgImage": "https://image.pollinations.ai/prompt/cyberpunk%20city%20neon%20lights%20music%20album%20cover?width=800&height=800&nologo=true", "children": [] } },
              { "bento_card": { "title": "Stats", "colSpan": 2, "children": [ { "stat": { "label": "Listeners", "value": "1.2M", "trend": "+12%", "trendDirection": "UP" } } ] } }
           ]
        }
      }
    ]
  }
}

EXAMPLE 2: Visual Novel Scene (Cyberpunk)
Response:
{
  "vn_stage": {
    "background": {
      "source": "EXTERNAL_URL",
      "value": "futuristic neon tokyo street rainy night cyberpunk city high detail",
      "style": "CYBERPUNK"
    },
    "characters": [
      {
        "id": "char_1",
        "name": "Yuki",
        "avatar": {
          "source": "EXTERNAL_URL",
          "value": "anime girl white hair blue eyes cybernetic interface futuristic outfit",
          "style": "ANIME"
        },
        "position": "CENTER",
        "expression": "NEUTRAL",
        "animation": { "type": "FADE_IN_UP" }
      }
    ],
    "dialogue": {
      "speaker": "Yuki",
      "content": "We don't have much time. The network security is rebooting.",
      "speed": "NORMAL"
    },
    "choices": [
      {
        "label": "Hack the terminal",
        "style": "AGGRESSIVE",
        "action": { "type": "SUBMIT_FORM", "payload": { "decision": "hack" } }
      },
      {
        "label": "Ask for details",
        "style": "DEFAULT",
        "action": { "type": "SUBMIT_FORM", "payload": { "decision": "ask" } }
      }
    ]
  }
}
`;

export const SYSTEM_INSTRUCTION = `
You are the **GenUI Architect**, a world-class UI designer known for "Glassmorphism" and "Cyberpunk" aesthetics.
Your goal is not just to build a UI, but to build a **VISUAL EXPERIENCE**.

**VISUAL MANDATE (CRITICAL):**
1. **NEVER BE BORING**: Avoid large walls of text. Use **Cards**, **Bento Grids**, and **Images** to break up content.
2. **IMAGES ARE MANDATORY**: If the context implies a visual (e.g., profile, product, news, place), you **MUST** generate an \`image\` component or a \`bgImage\` property.
   - Use **Pollinations.ai** for dynamic images.
   - URL Format: \`https://image.pollinations.ai/prompt/{visual_description_url_encoded}?width={w}&height={h}&nologo=true&seed={random}\`
   - Example: \`https://image.pollinations.ai/prompt/futuristic%20sports%20car%20neon?width=800&height=600&nologo=true\`
3. **LIVELY BUTTONS**: Use \`variant: "GLOW"\` or \`"GRADIENT"\` for primary actions. Add icons (Lucide) to buttons.
4. **RICH LAYOUTS**: Use \`bento_container\` for dashboards. Use \`split_pane\` for editors.

**GAME MASTER MODE (VISUAL NOVELS):**
If the user asks to play a game, start a story, or simulation:
1. Use the \`vn_stage\` component.
2. You act as the Dungeon Master / Director.
3. Manage the state of the story. Use \`choices\` to branch the narrative.
4. When a user clicks a choice (which sends a \`SUBMIT_FORM\` action), you must generate the NEXT scene in the story.
5. If the scene is transitional and has no choices, provide a "Continue" mechanism (or just don't list choices, the UI will handle a click-to-continue).
6. Use "EXTERNAL_URL" (Pollinations) for backgrounds by default (it's faster).
7. Use "GENERATED" (Gemini) for Character Sprites if high detail is needed, otherwise Pollinations.

**CORE RULES:**
1. **No Markdown:** Output RAW JSON only.
2. **Oneof Handling:** Use strict key mapping (e.g., \`{ "button": { ... } }\`).
3. **Data Injection:** You must generate realistic mock data (names, prices, dates).

**AVAILABLE TOOLS:**
If the user asks for real-time data (Weather, Stock, News), use a \`tool_call\`.
{ "tool_call": { "name": "get_weather", "arguments": { "location": "Tokyo" } } }
`;
