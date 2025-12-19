
import { z } from "zod";

// ----------------------------------------------------------------------
// HELPER SCHEMAS
// ----------------------------------------------------------------------

// Action Schema for buttons, clickable areas, etc.
const ActionSchema = z.object({
  type: z.string(),
  payload: z.any().optional(),
  path: z.string().optional(),
}).passthrough();

// Animation Schema
const AnimationSchema = z.object({
  type: z.enum([
    'FADE_IN', 'FADE_IN_UP', 'SLIDE_FROM_LEFT', 'SLIDE_FROM_RIGHT', 'SCALE_IN', 
    'SCALE_ELASTIC', 'BLUR_IN', 'STAGGER_CONTAINER', 'PULSE', 'SHIMMER', 
    'SHAKE', 'GLOW', 'BOUNCE', 
    'TYPEWRITER', 'SCRAMBLE', 'GRADIENT_FLOW', 
    'WIGGLE', 'POP', 'HOVER_GROW',
    'NONE'
  ]).optional(),
  duration: z.enum(['FAST', 'NORMAL', 'SLOW']).optional(),
  delay: z.number().optional(),
  trigger: z.enum(['ON_MOUNT', 'ON_HOVER', 'ON_VIEW']).optional(),
}).passthrough();

// Recursive definition wrapper
// We use z.lazy because UINode contains UINodes (children)
export const UINodeSchema: z.ZodType<any> = z.lazy(() => 
  z.union([
    ContainerNode,
    HeroNode,
    TextNode,
    ButtonNode,
    CardNode,
    TableNode,
    StatNode,
    ProgressNode,
    AlertNode,
    AvatarNode,
    ChartNode,
    AccordionNode,
    ImageNode,
    MapNode,
    InputNode,
    TextareaNode, 
    BadgeNode,
    SeparatorNode,
    BentoContainerNode,
    BentoCardNode,
    KanbanNode,
    SwitchNode,
    SliderNode,
    TabsNode,
    StepperNode,
    TimelineNode,
    CodeBlockNode,
    SplitPaneNode,
    CalendarNode,
    VNStageNode // NEW
  ])
);

// ----------------------------------------------------------------------
// COMPONENT PROPS SCHEMAS
// ----------------------------------------------------------------------

const NodeArray = z.array(UINodeSchema).optional().default([]);

// 1. Container
const ContainerProps = z.object({
  layout: z.string().optional(),
  gap: z.string().optional(),
  padding: z.boolean().optional(),
  background: z.string().optional(),
  bgImage: z.string().optional(),
  className: z.string().optional(),
  animation: AnimationSchema.optional(),
  children: NodeArray,
}).passthrough();
const ContainerNode = z.object({ container: ContainerProps });

// 2. Hero
const HeroProps = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  gradient: z.string().optional(),
  align: z.string().optional(),
  animation: AnimationSchema.optional(),
  children: NodeArray,
}).passthrough();
const HeroNode = z.object({ hero: HeroProps });

// 3. Text
const TextProps = z.object({
  content: z.string().optional().default(""),
  variant: z.string().optional(),
  color: z.string().optional(),
  font: z.string().optional(),
  animation: AnimationSchema.optional(),
}).passthrough();
const TextNode = z.object({ text: TextProps });

// 4. Button
const ButtonProps = z.object({
  label: z.string().optional(),
  variant: z.string().optional(),
  icon: z.string().optional(),
  disabled: z.boolean().optional(),
  action: ActionSchema.optional(),
  animation: AnimationSchema.optional(),
}).passthrough();
const ButtonNode = z.object({ button: ButtonProps });

// 5. Card
const CardProps = z.object({
  title: z.string().optional(),
  variant: z.string().optional(),
  animation: AnimationSchema.optional(),
  children: NodeArray,
}).passthrough();
const CardNode = z.object({ card: CardProps });

// 6. Table
const TableCell = z.union([z.string(), z.number(), UINodeSchema, z.null()]);
const TableProps = z.object({
  headers: z.array(z.string()).optional(),
  rows: z.array(z.array(TableCell)).optional(),
  animation: AnimationSchema.optional(),
}).passthrough();
const TableNode = z.object({ table: TableProps });

// 7. Stat
const StatProps = z.object({
  label: z.string().optional(),
  value: z.string().optional(),
  trend: z.string().optional(),
  trendDirection: z.enum(['UP', 'DOWN', 'NEUTRAL']).optional(),
  animation: AnimationSchema.optional(),
}).passthrough();
const StatNode = z.object({ stat: StatProps });

// 8. Progress
const ProgressProps = z.object({
  label: z.string().optional(),
  value: z.number().optional().default(0),
  color: z.string().optional(),
  animation: AnimationSchema.optional(),
}).passthrough();
const ProgressNode = z.object({ progress: ProgressProps });

// 9. Alert
const AlertProps = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  variant: z.string().optional(),
  animation: AnimationSchema.optional(),
}).passthrough();
const AlertNode = z.object({ alert: AlertProps });

// 10. Avatar
const AvatarProps = z.object({
  initials: z.string().optional(),
  src: z.string().optional(),
  status: z.string().optional(),
  animation: AnimationSchema.optional(),
}).passthrough();
const AvatarNode = z.object({ avatar: AvatarProps });

// 11. Chart
const ChartDataPoint = z.object({
  name: z.string(),
  value: z.number(),
}).passthrough();
const ChartProps = z.object({
  title: z.string().optional(),
  type: z.string().optional(),
  color: z.string().optional(),
  data: z.array(ChartDataPoint).optional().default([]),
  animation: AnimationSchema.optional(),
}).passthrough();
const ChartNode = z.object({ chart: ChartProps });

// 12. Accordion
const AccordionItem = z.object({
  title: z.string(),
  content: NodeArray,
}).passthrough();
const AccordionProps = z.object({
  variant: z.string().optional(),
  items: z.array(AccordionItem).optional().default([]),
  animation: AnimationSchema.optional(),
}).passthrough();
const AccordionNode = z.object({ accordion: AccordionProps });

// 13. Image
const ImageProps = z.object({
  src: z.string().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  aspectRatio: z.string().optional(),
  animation: AnimationSchema.optional(),
}).passthrough();
const ImageNode = z.object({ image: ImageProps });

// 14. Map
const MapMarker = z.object({
  title: z.string(),
  lat: z.number(),
  lng: z.number(),
}).passthrough();
const MapProps = z.object({
  label: z.string().optional(),
  defaultZoom: z.number().optional(),
  style: z.string().optional(),
  markers: z.array(MapMarker).optional().default([]),
  animation: AnimationSchema.optional(),
}).passthrough();
const MapNode = z.object({ map: MapProps });

// 15. Input
const ValidationSchema = z.object({
  required: z.boolean().optional(),
  pattern: z.string().optional(), // Regex string
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  errorMessage: z.string().optional(),
}).passthrough();

const InputProps = z.object({
  label: z.string().optional(),
  placeholder: z.string().optional(),
  inputType: z.string().optional(),
  value: z.string().optional(),
  validation: ValidationSchema.optional(), 
  animation: AnimationSchema.optional(),
}).passthrough();
const InputNode = z.object({ input: InputProps });

// 16. Textarea
const TextareaProps = z.object({
  label: z.string().optional(),
  placeholder: z.string().optional(),
  value: z.string().optional(),
  animation: AnimationSchema.optional(),
}).passthrough();
const TextareaNode = z.object({ textarea: TextareaProps });

// 17. Badge
const BadgeProps = z.object({
  label: z.string().optional(),
  color: z.string().optional(),
  animation: AnimationSchema.optional(),
}).passthrough();
const BadgeNode = z.object({ badge: BadgeProps });

// 18. Separator
// FIX: Was .optional(), which caused Zod to match empty objects (swallowing other keys in union)
const SeparatorNode = z.object({ separator: z.object({}).passthrough() });

// 19. Bento Grid
const BentoContainerProps = z.object({
  children: NodeArray,
  animation: AnimationSchema.optional(),
}).passthrough();
const BentoContainerNode = z.object({ bento_container: BentoContainerProps });

const BentoCardProps = z.object({
  title: z.string().optional(),
  colSpan: z.number().optional(), // 1, 2, 3, 4
  rowSpan: z.number().optional(), // 1, 2, 3
  bgImage: z.string().optional(),
  children: NodeArray,
  animation: AnimationSchema.optional(),
}).passthrough();
const BentoCardNode = z.object({ bento_card: BentoCardProps });

// 20. Kanban
const KanbanItemSchema = z.union([
  z.string(),
  z.object({ id: z.string().optional(), content: z.string(), tag: z.string().optional() }).passthrough()
]);

const KanbanColumnSchema = z.object({
  title: z.string(),
  color: z.string().optional(), // "BLUE", "GREEN", etc
  items: z.array(KanbanItemSchema).optional().default([]),
}).passthrough();

const KanbanProps = z.object({
  columns: z.array(KanbanColumnSchema).optional().default([]),
  animation: AnimationSchema.optional(),
}).passthrough();
const KanbanNode = z.object({ kanban: KanbanProps });

// 21. Switch
const SwitchProps = z.object({
  label: z.string().optional(),
  value: z.boolean().optional().default(false),
  animation: AnimationSchema.optional(),
}).passthrough();
const SwitchNode = z.object({ switch: SwitchProps });

// 22. Slider
const SliderProps = z.object({
  label: z.string().optional(),
  min: z.number().optional().default(0),
  max: z.number().optional().default(100),
  value: z.number().optional().default(50),
  step: z.number().optional().default(1),
  animation: AnimationSchema.optional(),
}).passthrough();
const SliderNode = z.object({ slider: SliderProps });

// 23. Tabs
const TabItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  content: NodeArray
}).passthrough();

const TabsProps = z.object({
  defaultValue: z.string().optional(),
  variant: z.string().optional(), // "DEFAULT", "PILLS", "UNDERLINE"
  items: z.array(TabItemSchema).optional().default([]),
  animation: AnimationSchema.optional(),
}).passthrough();
const TabsNode = z.object({ tabs: TabsProps });

// 24. Stepper
const StepperItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: NodeArray
}).passthrough();

const StepperProps = z.object({
  currentStep: z.number().optional().default(0),
  items: z.array(StepperItemSchema).optional().default([]),
  animation: AnimationSchema.optional(),
}).passthrough();
const StepperNode = z.object({ stepper: StepperProps });

// 25. Timeline
const TimelineItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  time: z.string().optional(),
  status: z.enum(['COMPLETED', 'ACTIVE', 'PENDING']).optional(),
  icon: z.string().optional(),
}).passthrough();

const TimelineProps = z.object({
  items: z.array(TimelineItemSchema).optional().default([]),
  variant: z.string().optional(),
  animation: AnimationSchema.optional(),
}).passthrough();
const TimelineNode = z.object({ timeline: TimelineProps });

// 26. CodeBlock
const CodeBlockProps = z.object({
  code: z.string(),
  language: z.string().optional(),
  filename: z.string().optional(),
  animation: AnimationSchema.optional(),
}).passthrough();
const CodeBlockNode = z.object({ codeblock: CodeBlockProps });

// 27. SplitPane
const SplitPaneProps = z.object({
  direction: z.enum(['ROW', 'COL']).optional(),
  initialSize: z.number().optional(),
  children: NodeArray, // Expect exactly 2 items usually
  animation: AnimationSchema.optional(),
}).passthrough();
const SplitPaneNode = z.object({ split_pane: SplitPaneProps });

// 28. Calendar
const CalendarProps = z.object({
  label: z.string().optional(),
  selectedDate: z.string().optional(), // YYYY-MM-DD
  animation: AnimationSchema.optional(),
}).passthrough();
const CalendarNode = z.object({ calendar: CalendarProps });

// 29. Visual Novel Stage (Galgame)
const ImageAssetSchema = z.object({
  source: z.enum(['EXTERNAL_URL', 'GENERATED']),
  value: z.string(),
  style: z.string().optional(),
});

const VNCharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: ImageAssetSchema,
  position: z.enum(['LEFT', 'CENTER', 'RIGHT', 'CLOSE_UP']),
  expression: z.enum(['NEUTRAL', 'SMILE', 'ANGRY', 'BLUSH', 'SAD', 'SHOCKED']),
  animation: z.object({
    type: z.string(),
    delay: z.number().optional()
  }).optional()
});

const VNDialogueSchema = z.object({
  speaker: z.string(),
  content: z.string(),
  voice_id: z.string().optional(),
  speed: z.enum(['SLOW', 'NORMAL', 'FAST']).optional()
});

const VNChoiceSchema = z.object({
  label: z.string(),
  action: ActionSchema,
  style: z.string().optional()
});

const VNStageProps = z.object({
  background: ImageAssetSchema,
  bgm: z.string().optional(),
  sfx: z.string().optional(),
  characters: z.array(VNCharacterSchema).optional().default([]),
  dialogue: VNDialogueSchema,
  choices: z.array(VNChoiceSchema).optional(),
}).passthrough();

const VNStageNode = z.object({ vn_stage: VNStageProps });

// ----------------------------------------------------------------------
// EXPORTED VALIDATOR
// ----------------------------------------------------------------------

export const validateNode = (node: any) => {
  if (!node) return { success: false, error: "Node is null" };

  const result = UINodeSchema.safeParse(node);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
};
