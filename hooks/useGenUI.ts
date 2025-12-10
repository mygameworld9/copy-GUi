
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UINode, UserContext, UIAction, Message } from '../types';
import { INITIAL_CONTEXT } from '../constants';
import { generateUIStream, refineComponent, fixComponent } from '../services/geminiService';
import { generateTheme } from '../services/themeAgent';
import { parsePartialJson } from '../services/streamParser';
import { executeTool } from '../services/toolService';
import { telemetry } from '../services/telemetry';
import { ModelConfig, DEFAULT_CONFIG } from '../types/settings';
import { setByPath, getByPath } from '../components/ui/renderUtils';
import confetti from 'canvas-confetti';
import { useHistory } from './useHistory';
import { useToast } from '../components/ui/Toast';
import { DIAGNOSTIC_PAYLOAD } from '../services/diagnosticData';

const STORAGE_KEY = 'genui_model_config';

// Helper to crawl tree and collect input values
function collectFormData(node: any): Record<string, any> {
  let data: Record<string, any> = {};
  
  if (!node || typeof node !== 'object') return data;

  // Check if current node is an input with a label
  if (node.input && node.input.label) {
     const key = node.input.label;
     const value = node.input.value || "";
     data[key] = value;
  }
  
  // Check switch
  if (node.switch && node.switch.label) {
     data[node.switch.label] = node.switch.value;
  }
  
  // Check slider
  if (node.slider && node.slider.label) {
     data[node.slider.label] = node.slider.value;
  }

  // Recursive traversal
  Object.values(node).forEach(childValue => {
     if (Array.isArray(childValue)) {
         childValue.forEach(child => {
             data = { ...data, ...collectFormData(child) };
         })
     } else if (typeof childValue === 'object' && childValue !== null) {
         data = { ...data, ...collectFormData(childValue) };
     }
  });
  
  return data;
}

// Recursive function to clear form values
function clearFormValues(node: any): any {
  if (Array.isArray(node)) {
    return node.map(clearFormValues);
  }
  if (node && typeof node === 'object') {
    const newNode = { ...node };
    if (newNode.input) newNode.input.value = "";
    if (newNode.switch) newNode.switch.value = false;
    if (newNode.slider) newNode.slider.value = newNode.slider.min || 0;
    
    // Recurse keys
    Object.keys(newNode).forEach(key => {
        if (key !== 'input' && key !== 'switch' && key !== 'slider') {
             newNode[key] = clearFormValues(newNode[key]);
        }
    });
    return newNode;
  }
  return node;
}

export const useGenUI = () => {
  // --- State ---
  const [context, setContext] = useState<UserContext>(INITIAL_CONTEXT);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingNode, setStreamingNode] = useState<UINode | null>(null);
  
  // Modal State
  const [modalNode, setModalNode] = useState<{ title?: string, content: UINode } | null>(null);
  
  const { showToast } = useToast();

  // Settings State
  const [config, setConfigState] = useState<ModelConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const setConfig = (newConfig: ModelConfig) => {
    setConfigState(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  };

  // Editor State
  const [editMode, setEditMode] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  
  // --- History Management (Time Travel) ---
  const { 
    state: messages, 
    setState: setMessages, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useHistory<Message[]>([
    { role: 'system', content: 'GenUI Studio is ready. Describe a UI component, dashboard, or layout to generate it instantly.' }
  ]);
  
  const [metrics, setMetrics] = useState({
    ttft: 0,
    latency: 0,
    active: false,
    hallucinations: 0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      }
      // Standard Redo (Ctrl+Y)
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  useEffect(() => {
    const unsubscribe = telemetry.subscribe((event) => {
      setMetrics(prev => {
        if (event.name === 'STREAM_START') return { ...prev, active: true, latency: 0, ttft: 0 };
        if (event.name === 'STREAM_COMPLETE') return { ...prev, active: false, latency: event.value };
        if (event.name === 'TTFT') return { ...prev, ttft: event.value };
        if (event.name === 'HALLUCINATION') return { ...prev, hallucinations: prev.hallucinations + 1 };
        return prev;
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!editMode) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, streamingNode, editMode]);

  // --- Actions ---

  // DIAGNOSTICS FEATURE
  const runDiagnostics = useCallback(() => {
    setMessages(prev => [
        ...prev, 
        { role: 'user', content: '/system_diagnostics' },
        { role: 'system', content: 'Initializing System Diagnostics...' },
        { role: 'assistant', content: 'Generating Test Suite...', uiNode: DIAGNOSTIC_PAYLOAD }
    ]);
    showToast({ type: 'SUCCESS', title: 'Diagnostics Started', description: 'Rendering full component suite.' });
  }, [setMessages, showToast]);

  const handleGeneration = useCallback(async (prompt: string, originalUserMsg: string) => {
    let rawAccumulated = "";
    let isToolCallDetected = false;
    
    // Logic Fix: Retrieve the current UI state to pass as context
    const lastUiMsg = [...messages].reverse().find(m => m.uiNode);
    const previousState = lastUiMsg ? lastUiMsg.uiNode : null;

    try {
        // Pass previousState to the service
        const stream = generateUIStream(prompt, context, config, previousState);
        
        for await (const chunk of stream) {
            rawAccumulated += chunk;
            const partialUI = parsePartialJson(rawAccumulated);
            if (partialUI?.tool_call) {
                isToolCallDetected = true;
                continue;
            }
            if (partialUI && typeof partialUI === 'object' && !isToolCallDetected) {
                setStreamingNode(partialUI);
            }
        }

        const finalResponse = parsePartialJson(rawAccumulated);

        if (finalResponse?.tool_call) {
             const { name, arguments: args } = finalResponse.tool_call;
             setMessages(prev => [...prev, { role: 'system', content: `⚡ Orchestrating: ${name} with args ${JSON.stringify(args)}` }]);
             const toolResult = await executeTool(name, args);
             const nextPrompt = `ORIGINAL REQUEST: ${originalUserMsg}\nTOOL RESULT (${name}): ${JSON.stringify(toolResult)}\nINSTRUCTIONS: Generate UI.`;
             await handleGeneration(nextPrompt, originalUserMsg);
             return;
        }

        if (!isToolCallDetected && (finalResponse || rawAccumulated.trim())) {
             // Push new message to history
             setMessages(prev => [...prev, { role: 'assistant', content: '', uiNode: finalResponse || streamingNode }]);
        }

    } catch (e) {
        console.error("Streaming failed", e);
        setMessages(prev => [...prev, { role: 'system', content: 'Error rendering stream. Check settings.' }]);
    }
  }, [context, streamingNode, config, messages, setMessages]); 

  const fixNode = useCallback(async (error: Error, node: UINode, path: string) => {
    console.log("Attempting to fix node at path:", path);
    
    // Use setState callback to ensure we are working on latest history
    // But since this is async (await fixComponent), we can't do it all inside one atomic setState call easily.
    // However, the node fixing is less latency-sensitive than UI interactions.
    // We will find the index at the moment of completion.

    try {
      const fixedNode = await fixComponent(error.message, node, config);
      const relativePath = path.startsWith('root.') ? path.substring(5) : (path === 'root' ? '' : path);

      setMessages(prev => {
        const lastUiMsgIndex = [...prev].reverse().findIndex(m => m.uiNode);
        const actualIndex = lastUiMsgIndex >= 0 ? prev.length - 1 - lastUiMsgIndex : -1;
        
        if (actualIndex === -1) return prev;

        const next = [...prev];
        const oldUi = next[actualIndex].uiNode;
        let newUi;
        
        if (!relativePath) {
           newUi = fixedNode;
        } else {
           newUi = setByPath(oldUi, relativePath, fixedNode);
        }
        
        next[actualIndex] = { ...next[actualIndex], uiNode: newUi };
        next.push({ role: 'system', content: `🔧 Auto-Healed component at ${path}` });
        return next;
      });

    } catch (err) {
      console.error("Failed to heal:", err);
      setMessages(prev => [...prev, { role: 'system', content: `❌ Auto-Healing failed: ${err}` }]);
    }
  }, [config, setMessages]);

  const handleAction = useCallback(async (action: UIAction) => {
    console.log("Handling Action:", action);

    // 0. SEQUENCE (Chaining)
    if (action.type === 'SEQUENCE') {
        const actions = action.payload?.actions;
        if (Array.isArray(actions)) {
            for (const subAction of actions) {
                // Recursive call for each action in sequence
                await handleAction(subAction);
            }
        }
        return;
    }

    // 0.1 DELAY
    if (action.type === 'DELAY') {
        const ms = action.payload?.ms || 500;
        await new Promise(resolve => setTimeout(resolve, ms));
        return;
    }
    
    // 0.2 NAVIGATION HISTORY
    if (action.type === 'GO_BACK') {
        if (canUndo) undo();
        else showToast({ type: 'INFO', title: 'Start of History', description: 'Cannot go back further.' });
        return;
    }

    // 0.3 TOASTS
    if (action.type === 'SHOW_TOAST' && action.payload) {
        showToast({
            title: action.payload.title || action.payload.message || 'Notification',
            type: action.payload.type || 'INFO',
            description: action.payload.description
        });
        return;
    }

    // 1. VISUAL EFFECTS
    if (action.type === 'TRIGGER_EFFECT') {
        const effect = action.payload?.effect;
        if (effect === 'CONFETTI') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        if (effect === 'SNOW') confetti({ particleCount: 100, spread: 360, ticks: 200, gravity: 0.4, decay: 0.94, startVelocity: 30, origin: { y: 0 }, colors: ['#ffffff', '#e0f2fe'] });
        return;
    }

    // 2. CLIPBOARD
    if (action.type === 'COPY_TO_CLIPBOARD') {
        const text = action.payload?.text;
        if (text) {
            await navigator.clipboard.writeText(text);
            showToast({
                title: 'Copied to Clipboard',
                type: 'SUCCESS',
                description: text.length > 30 ? `"${text.substring(0, 30)}..."` : `"${text}"`
            });
        }
        return;
    }

    // 3. DOWNLOAD
    if (action.type === 'DOWNLOAD') {
        const { filename, content } = action.payload || {};
        const blob = new Blob([content || ''], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'download.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast({
            title: 'Download Started',
            type: 'SUCCESS',
            description: `Saving ${filename || 'file'}...`
        });
        return;
    }

    // 4. NAVIGATION
    if (action.type === 'NAVIGATE') {
        const { url } = action.payload || {};
        if (url) {
            // CRITICAL FIX: Always force _blank for external navigation to prevent users from
            // losing the app context. Even if the AI suggests _self.
            window.open(url, '_blank', 'noopener,noreferrer');
        }
        return;
    }

    // 5. MODALS
    if (action.type === 'OPEN_MODAL') {
        const { title, content } = action.payload || {};
        setModalNode({ title, content: content || action.payload });
        return;
    }

    if (action.type === 'CLOSE_MODAL') {
        setModalNode(null);
        return;
    }

    // 6. STATE PATCHING & CYCLING
    if ((action.type === 'PATCH_STATE' || action.type === 'CYCLE_STATE') && action.path) {
        
        // IMPORTANT: We perform the index lookup INSIDE the setMessages callback.
        // This ensures that if this action is part of a SEQUENCE with delays,
        // we are always patching the *latest* version of the history stack,
        // preventing stale closure bugs.
        
        setMessages(prev => {
            const lastUiMsgIndex = [...prev].reverse().findIndex(m => m.uiNode);
            const actualIndex = lastUiMsgIndex >= 0 ? prev.length - 1 - lastUiMsgIndex : -1;

            if (actualIndex === -1) {
                console.warn("PATCH_STATE: No UI node found in history.");
                return prev;
            }

            const relativePath = action.path.startsWith('root.') ? action.path.substring(5) : action.path;
            const next = [...prev];
            const oldUi = next[actualIndex].uiNode;
            
            // Retrieve the current properties at the path
            const currentProps = getByPath(oldUi, relativePath);
            
            if (!currentProps) {
                console.warn(`[PATCH_STATE] Path not found: ${relativePath}`);
                return prev;
            }

            let newProps = { ...currentProps };

            // Logic for Recursive State Cycling
            if (action.type === 'CYCLE_STATE') {
                 const { next: nextStates } = action.payload;
                 if (Array.isArray(nextStates) && nextStates.length > 0) {
                     const nextState = nextStates[0];
                     const remainingStates = nextStates.slice(1);
                     
                     // Prepare the new Action for the NEXT click
                     let newAction;
                     if (remainingStates.length > 0) {
                        newAction = {
                            type: 'CYCLE_STATE',
                            path: action.path, // Preserve absolute path
                            payload: { next: remainingStates }
                        };
                     } else {
                        // End of cycle: if the next state has an action (e.g. submit), allow it
                        newAction = nextState.action;
                     }
                     
                     newProps = {
                        ...currentProps,
                        ...nextState,
                        action: newAction
                     };
                 }
            } else if (action.type === 'PATCH_STATE') {
                // Merge partial update into props
                newProps = {
                    ...currentProps,
                    ...action.payload
                };
            }

            // Replace the props object in the tree
            next[actualIndex] = { ...next[actualIndex], uiNode: setByPath(oldUi, relativePath, newProps) };
            return next;
        });
        return;
    }
    
    // 7. RESET FORM
    if (action.type === 'RESET_FORM') {
        setMessages(prev => {
           const lastUiMsgIndex = [...prev].reverse().findIndex(m => m.uiNode);
           const actualIndex = lastUiMsgIndex >= 0 ? prev.length - 1 - lastUiMsgIndex : -1;
           if (actualIndex === -1) return prev;
           
           const next = [...prev];
           const oldUi = next[actualIndex].uiNode;
           const newUi = clearFormValues(oldUi);
           
           next[actualIndex] = { ...next[actualIndex], uiNode: newUi };
           return next;
        });
        showToast({ type: 'INFO', title: 'Reset', description: 'Form fields cleared.' });
        return;
    }

    // 8. FORM SUBMISSION
    if (action.type === 'SUBMIT_FORM') {
        setLoading(true);
        // We need to access the LATEST state to submit valid data.
        // Since we are inside a callback, we can't 'await' setState.
        // We will optimistically use 'messages' from closure, but for 100% accuracy,
        // we should probably refactor this to be cleaner. For now, this is acceptable for prototypes.
        const lastUiMsg = [...messages].reverse().find(m => m.uiNode);
        if (!lastUiMsg || !lastUiMsg.uiNode) {
            setLoading(false);
            return;
        }

        const formData = collectFormData(lastUiMsg.uiNode);
        const submissionText = `User Submitted Form Data: ${JSON.stringify(formData, null, 2)}`;
        
        setMessages(prev => [...prev, { role: 'system', content: 'Submitting form data...' }]);
        await handleGeneration(submissionText, "Form Submission");
        setLoading(false);
        return;
    }

  }, [messages, handleGeneration, setMessages, showToast, canUndo, undo]);

  // New: Create Variation
  const createVariation = useCallback(async () => {
    if (!selectedPath) return;
    
    setLoading(true);
    
    // We cannot use setMessages callback for async work that needs the state immediately.
    // So we rely on closure 'messages' here.
    const lastUiMsgIndex = [...messages].reverse().findIndex(m => m.uiNode);
    const actualIndex = lastUiMsgIndex >= 0 ? messages.length - 1 - lastUiMsgIndex : -1;
    
    if (actualIndex === -1) {
         setLoading(false);
         return;
    }

    const rootNode = messages[actualIndex].uiNode;
    const relativePath = selectedPath.startsWith('root.') ? selectedPath.substring(5) : selectedPath;
    const subProps = relativePath ? getByPath(rootNode, relativePath) : rootNode;

    if (!subProps) {
        setLoading(false);
        return;
    }
    
    const pathSegments = relativePath.split('.');
    const componentType = pathSegments[pathSegments.length - 1];
    const wrappedNode = { [componentType]: subProps };

    setMessages(prev => [...prev, { role: 'system', content: '🎨 Generating variation...' }]);

    try {
        const variationConfig = { ...config }; 
        const variationPrompt = "Create a distinct visual variation of this component. Change the style, layout, or colors while keeping the functionality. Make it look fresh.";
        
        const refinedJson = await refineComponent(variationPrompt, wrappedNode, variationConfig);
        
        setMessages(prev => {
            const next = [...prev];
            const oldUi = next[actualIndex].uiNode;
            
            const responseKey = Object.keys(refinedJson)[0];
            const newProps = refinedJson[responseKey];

            if (!relativePath) {
                next[actualIndex] = { ...next[actualIndex], uiNode: refinedJson };
            } else {
                 const newUi = setByPath(oldUi, relativePath, newProps);
                 next[actualIndex] = { ...next[actualIndex], uiNode: newUi };
            }
            
            return next;
        });

    } catch (err) {
        setMessages(prev => [...prev, { role: 'system', content: 'Failed to create variation.' }]);
    } finally {
        setLoading(false);
    }

  }, [selectedPath, messages, config, setMessages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    
    // REFINEMENT LOGIC
    if (editMode && selectedPath) {
        setLoading(true);
        const lastUiMsgIndex = [...messages].reverse().findIndex(m => m.uiNode);
        const actualIndex = lastUiMsgIndex >= 0 ? messages.length - 1 - lastUiMsgIndex : -1;
        
        if (actualIndex === -1) {
             setLoading(false);
             return;
        }

        const rootNode = messages[actualIndex].uiNode;
        const relativePath = selectedPath.startsWith('root.') ? selectedPath.substring(5) : selectedPath;
        const subProps = relativePath ? getByPath(rootNode, relativePath) : rootNode;
        
        if (subProps) {
            const pathSegments = relativePath.split('.');
            const componentType = pathSegments[pathSegments.length - 1];
            const wrappedNode = { [componentType]: subProps };

            setMessages(prev => [...prev, { role: 'user', content: `Refine selected component: ${userMsg}` }]);
            
            try {
                const refinedJson = await refineComponent(userMsg, wrappedNode, config);
                
                setMessages(prev => {
                    const next = [...prev];
                    const oldUi = next[actualIndex].uiNode;
                    
                    const responseKey = Object.keys(refinedJson)[0];
                    const newProps = refinedJson[responseKey];

                    let newUi;
                    if (!relativePath) {
                         newUi = refinedJson;
                    } else {
                         newUi = setByPath(oldUi, relativePath, newProps);
                    }
                    next[actualIndex] = { ...next[actualIndex], uiNode: newUi };
                    return next;
                 });
                setMessages(prev => [...prev, { role: 'system', content: 'Component updated successfully.' }]);
            } catch (err) {
                setMessages(prev => [...prev, { role: 'system', content: 'Failed to refine component.' }]);
            }
        }
        setLoading(false);
        return;
    }

    setLoading(true);
    setStreamingNode(null);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    await handleGeneration(userMsg, userMsg);
    setLoading(false);
    setStreamingNode(null);
  }, [input, loading, handleGeneration, editMode, selectedPath, messages, config, setMessages]);

  const closeModal = useCallback(() => setModalNode(null), []);

  return {
    state: { context, input, loading, streamingNode, messages, metrics, editMode, selectedPath, config, modalNode },
    refs: { messagesEndRef },
    actions: { 
        setContext, 
        setInput, 
        handleSubmit, 
        handleAction, 
        setEditMode, 
        setSelectedPath, 
        setConfig, 
        fixNode,
        createVariation,
        closeModal,
        runDiagnostics 
    },
    history: { undo, redo, canUndo, canRedo } 
  };
};
