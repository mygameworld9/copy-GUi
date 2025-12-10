
import React, { useState, useEffect, useRef } from 'react';
import DynamicRenderer from './components/DynamicRenderer';
import { 
  User, Sparkles, Smartphone, Monitor, Shield, Zap, Settings, Terminal, 
  ArrowUp, Activity, Gauge, Code2, PenTool, MousePointer2, Palette,
  PanelLeftClose, PanelLeft, Share2, ZoomIn, ZoomOut, RotateCcw, X, Target,
  Wand2, Layout, Layers, Command, ChevronRight, ChevronLeft, Undo2, Redo2, Split, MessageSquare,
  RotateCw
} from 'lucide-react';
import { CodeViewer } from './components/CodeViewer';
import { SettingsDialog } from './components/SettingsDialog';
import { InspectorPanel } from './components/InspectorPanel';
import { TreeView } from './components/TreeView';
import { useGenUI } from './hooks/useGenUI';
import { EditorProvider } from './components/EditorContext';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { generateTheme } from './services/themeAgent';
import { UINode } from './types';
import { ModalRenderer } from './components/ModalRenderer';
import { useSound } from './hooks/useSound';

const App = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Workspace />
      </ToastProvider>
    </ThemeProvider>
  );
};

const Workspace = () => {
  const { state, actions, refs, history } = useGenUI();
  const { context, input, loading, streamingNode, messages, metrics, editMode, selectedPath, config, modalNode } = state;
  const { setTheme, isGenerating, setIsGenerating } = useTheme();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'layers'>('chat');
  
  // Audio Engine
  const { play } = useSound(config.soundEnabled);

  // Trigger sounds on state changes
  useEffect(() => {
    if (!loading && messages.length > 1) {
        // Just finished loading a message
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'assistant') {
            play('SUCCESS');
        }
    }
  }, [loading, messages, play]);
  
  // Calculate the active node to display on the stage
  const activeNode = streamingNode || (messages && messages.slice ? messages.slice().reverse().find(m => m.uiNode)?.uiNode : null) || null;

  // Intercept theme commands
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    play('ACTIVATE');
    if (input.startsWith('/theme')) {
       const themePrompt = input.replace('/theme', '').trim();
       if (!themePrompt) return;
       
       setIsGenerating(true);
       actions.setInput('');
       try {
          const newTheme = await generateTheme(themePrompt, config);
          setTheme(newTheme);
          actions.handleAction({ type: 'SYSTEM', payload: `Theme updated: ${themePrompt}` });
          play('SUCCESS');
       } catch (err) {
          console.error(err);
          play('ERROR');
       } finally {
          setIsGenerating(false);
       }
       return;
    }
    actions.handleSubmit(e);
  };

  const getBreadcrumbs = () => {
    if (!selectedPath) return [];
    return selectedPath.split('.').filter(p => isNaN(Number(p)) && p !== 'children' && p !== 'root');
  };

  const breadcrumbs = getBreadcrumbs();
  const selectedName = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : 'Component';

  return (
    <EditorProvider value={{ isEditing: editMode, selectedPath, onSelect: (p) => { actions.setSelectedPath(p); if(p) play('CLICK'); } }}>
      <div className="flex h-screen w-full bg-transparent text-slate-200 font-sans overflow-hidden selection:bg-indigo-500/30">
        
        {/* --- LEFT SIDEBAR (CHAT & INPUT) --- */}
        <div className={`${showSidebar ? 'w-[420px] border-r' : 'w-0'} flex flex-col border-white/10 bg-black/60 backdrop-blur-2xl transition-all duration-500 ease-[0.23,1,0.32,1] relative z-20 overflow-hidden shadow-2xl`}>
          <div className="flex-1 flex flex-col min-h-0 w-[420px]"> 
            
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-5 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 ${isGenerating ? 'animate-spin' : ''}`}>
                  <Zap className="w-4 h-4 text-white fill-current" />
                </div>
                <div>
                    <h1 className="font-bold text-sm text-white tracking-tight leading-tight">GenUI <span className="text-slate-500 font-light">Architect</span></h1>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span>v3.5 Neo-Glass</span>
                    </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowSettings(true); play('CLICK'); }} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-white/10 rounded-lg group relative">
                    <Settings className="w-4 h-4" />
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-indigo-500 scale-0 group-hover:scale-100 transition-transform" />
                </button>
              </div>
            </header>

            {/* Tab Bar */}
            <div className="px-5 pt-4 pb-2 flex gap-4 border-b border-white/5">
                <button 
                  onClick={() => { setSidebarTab('chat'); play('HOVER'); }}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors relative ${sidebarTab === 'chat' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Generator
                  </div>
                  {sidebarTab === 'chat' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-indigo-500 rounded-t-full shadow-[0_-2px_8px_rgba(99,102,241,0.5)]" />}
                </button>

                <button 
                  onClick={() => { setSidebarTab('layers'); play('HOVER'); }}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors relative ${sidebarTab === 'layers' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    Structure
                  </div>
                  {sidebarTab === 'layers' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-indigo-500 rounded-t-full shadow-[0_-2px_8px_rgba(99,102,241,0.5)]" />}
                </button>
            </div>

            {/* Main Sidebar Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
               
               {/* --- TAB: CHAT --- */}
               {sidebarTab === 'chat' && (
                 <div className="p-5 space-y-8 min-h-full flex flex-col">
                    {messages && messages.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 p-4 space-y-6">
                          <div className="relative group cursor-pointer" onClick={() => actions.setInput("Create a crypto dashboard")}>
                            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform duration-500 backdrop-blur-md">
                                <Sparkles className="w-8 h-8 text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                            </div>
                            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl group-hover:blur-3xl transition-all" />
                          </div>
                          <div>
                              <p className="text-base font-medium text-slate-200">Start Building</p>
                              <p className="text-sm text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">Describe any UI you can imagine. We'll handle the code.</p>
                          </div>
                      </div>
                    )}
                    
                    {messages && messages.map((msg, idx) => (
                        <div key={idx} className={`group flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-500 fade-in`}>
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                  {msg.role === 'user' ? 'You' : 'Architect'}
                                </span>
                            </div>
                            
                            {msg.role === 'system' ? (
                                <div className="w-full flex items-center gap-3 py-2.5 px-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-300">
                                  <Terminal className="w-3.5 h-3.5" />
                                  <span>{msg.content}</span>
                                </div>
                            ) : (
                              <div className={`max-w-[90%] px-5 py-4 rounded-2xl text-sm leading-7 shadow-lg backdrop-blur-md ${
                                  msg.role === 'user' 
                                    ? 'bg-zinc-800/80 text-slate-100 rounded-tr-sm border border-zinc-700' 
                                    : 'bg-black/40 text-slate-300 border border-white/10 rounded-tl-sm'
                              }`}>
                                  {msg.content || (msg.uiNode ? <span className="italic text-slate-500 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Generated UI Component</span> : null)}
                              </div>
                            )}
                        </div>
                    ))}
                    <div ref={refs.messagesEndRef} className="h-4" />
                 </div>
               )}

               {/* --- TAB: LAYERS --- */}
               {sidebarTab === 'layers' && (
                 <div className="p-4">
                    {activeNode ? (
                      <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                         <div className="mb-4 px-2 py-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">DOM Tree</span>
                            <div className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-zinc-400 font-mono">
                               ROOT
                            </div>
                         </div>
                         <TreeView node={activeNode} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                        <Layers className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs">No active component</span>
                      </div>
                    )}
                 </div>
               )}
            </div>

            {/* Input Area (Fixed Bottom) */}
            <div className="p-5 bg-black/60 backdrop-blur-2xl border-t border-white/5 relative z-10">
               
               {/* Refinement Context Bar */}
               <div className={`transition-all duration-300 ease-out transform origin-bottom ${selectedPath ? 'h-auto opacity-100 mb-3' : 'h-0 opacity-0 overflow-hidden'}`}>
                   <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-lg backdrop-blur-md">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-300">
                           <Target className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-indigo-200/60 overflow-hidden whitespace-nowrap">
                            {breadcrumbs.map((crumb, i) => (
                                <React.Fragment key={i}>
                                    <span className="hover:text-white transition-colors cursor-default capitalize">{crumb}</span>
                                    {i < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 opacity-50" />}
                                </React.Fragment>
                            ))}
                        </div>
                      </div>
                      <button onClick={() => actions.setSelectedPath(null)} className="text-indigo-400 hover:text-white p-1 hover:bg-indigo-500/20 rounded transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                   </div>
               </div>

               <form onSubmit={handleCustomSubmit} className="relative group">
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${editMode ? 'from-indigo-600 via-purple-600 to-pink-600' : 'from-indigo-500/50 via-purple-500/50 to-pink-500/50'} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-md`} />
                  <div className="relative flex items-center bg-zinc-900/90 border border-white/10 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-2xl">
                      <div className="pl-4 text-slate-500">
                          {editMode && selectedPath ? (
                              <Wand2 className="w-4 h-4 text-indigo-400 animate-pulse" />
                          ) : (
                              <Command className="w-4 h-4 text-zinc-500" />
                          )}
                      </div>
                      <input
                          type="text"
                          value={input}
                          onChange={(e) => { actions.setInput(e.target.value); play('TYPE'); }}
                          placeholder={editMode && selectedPath ? `Refine this ${selectedName}...` : "Describe your UI..."}
                          className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 py-4 px-3 focus:outline-none font-medium"
                          disabled={loading || isGenerating}
                      />
                      <button
                          type="submit"
                          disabled={!input.trim() || loading || isGenerating}
                          className={`mr-2 p-2 rounded-lg transition-all duration-300 ${
                              input.trim() 
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 translate-x-0 opacity-100' 
                              : 'bg-white/5 text-zinc-600 translate-x-2 opacity-50'
                          }`}
                      >
                          <ArrowUp className="w-4 h-4" />
                      </button>
                  </div>
               </form>

               {/* Mode Toggle & Metrics */}
               <div className="flex items-center justify-between mt-4 px-1">
                   <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500 tracking-wide">
                      <div className="flex items-center gap-2">
                          <Activity className={`w-3 h-3 ${metrics.active ? 'text-emerald-500 animate-pulse' : ''}`} />
                          <span className={metrics.active ? 'text-emerald-500' : ''}>{metrics.active ? 'GENERATING...' : 'IDLE'}</span>
                      </div>
                   </div>
                   
                   <button 
                    onClick={() => { actions.setEditMode(!editMode); play('CLICK'); }}
                    className={`text-[10px] flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-300 font-bold tracking-wider uppercase backdrop-blur-md ${
                        editMode 
                        ? 'bg-indigo-600/90 text-white border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                        : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/10'
                    }`}
                   >
                       {editMode ? <PenTool className="w-3 h-3" /> : <Layout className="w-3 h-3" />}
                       {editMode ? 'Design Mode' : 'View Mode'}
                   </button>
               </div>
            </div>
          </div>
        </div>

        {/* --- CENTER CANVAS --- */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent relative z-0">
           
           {/* Sidebar Toggle */}
           <button 
             onClick={() => setShowSidebar(!showSidebar)}
             className={`absolute left-5 top-5 z-40 p-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all hover:bg-white/10 shadow-xl ${!showSidebar ? 'translate-x-0' : '-translate-x-full opacity-0 pointer-events-none'}`}
           >
             <PanelLeft className="w-5 h-5" />
           </button>

           {/* Toolbar */}
           <div className="h-16 border-b border-white/5 bg-transparent flex items-center justify-center relative z-30 px-6 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 shadow-2xl backdrop-blur-md">
                  {/* View Toggles */}
                  <button 
                    onClick={() => { actions.setContext(p => ({ ...p, device: 'desktop' })); play('CLICK'); }}
                    className={`p-2 rounded-md transition-all ${context.device === 'desktop' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Desktop View"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { actions.setContext(p => ({ ...p, device: 'mobile' })); play('CLICK'); }}
                    className={`p-2 rounded-md transition-all ${context.device === 'mobile' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Mobile View"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-white/10 mx-2" />
                  
                  {/* History Controls */}
                  <button 
                    onClick={() => history.undo()}
                    disabled={!history.canUndo}
                    className={`p-2 rounded-md transition-all ${!history.canUndo ? 'text-zinc-700 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => history.redo()}
                    disabled={!history.canRedo}
                    className={`p-2 rounded-md transition-all ${!history.canRedo ? 'text-zinc-700 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                    title="Redo (Ctrl+Shift+Z)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-white/10 mx-2" />

                  {/* Role Toggle */}
                  <button 
                    onClick={() => actions.setContext(p => ({ ...p, role: context.role === 'admin' ? 'user' : 'admin' }))}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:bg-white/10 transition-all"
                  >
                     {context.role === 'admin' ? <Shield className="w-3.5 h-3.5 text-indigo-400" /> : <User className="w-3.5 h-3.5 text-emerald-400" />}
                     {context.role === 'admin' ? 'Admin' : 'User'}
                  </button>
              </div>

              {/* Action Buttons Right */}
              <div className="absolute right-6 flex items-center gap-3 pointer-events-auto">
                 {editMode && selectedPath && (
                   <button 
                      onClick={() => { actions.createVariation(); play('ACTIVATE'); }}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all animate-in fade-in"
                   >
                      <Split className="w-3.5 h-3.5" />
                      Make Variation
                   </button>
                 )}
                 
                 <button 
                    onClick={() => { setShowCode(!showCode); play('CLICK'); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all backdrop-blur-md ${showCode ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                 >
                    <Code2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Export Code</span>
                 </button>
              </div>
           </div>

           {/* Canvas Area */}
           <div className="flex-1 overflow-hidden relative flex items-center justify-center">
              {/* NOTE: We removed the opaque bg-[#050505] to let the aurora shine through */}
              
              <div className="relative z-10 w-full h-full overflow-y-auto custom-scrollbar flex items-start justify-center pt-12 pb-32">
                  {activeNode ? (
                    <DeviceWrapper 
                        context={context} 
                        node={activeNode} 
                        onAction={(a: any) => { actions.handleAction(a); play('CLICK'); }} 
                        onError={actions.fixNode} 
                        isStreaming={loading}
                        editMode={editMode}
                        history={history}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-500 mt-32 animate-in fade-in zoom-in-95 duration-700">
                        <div className="w-32 h-32 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-2xl rotate-3 ring-1 ring-white/5 relative group backdrop-blur-md">
                           <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                           <Palette className="w-12 h-12 opacity-50 text-indigo-400 relative z-10 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-300 tracking-tight">Ready to Architect</h3>
                        <p className="text-base text-slate-500 mt-3 max-w-md text-center font-light leading-relaxed">
                            Enter a prompt to generate a new UI. 
                            <br/>Try <span className="text-indigo-400">"Cyberpunk Dashboard"</span> or <span className="text-emerald-400">"Glassmorphism Finance App"</span>.
                        </p>
                    </div>
                  )}
              </div>
           </div>
        </div>

        {/* --- RIGHT SIDEBAR (INSPECTOR) --- */}
        {editMode && selectedPath && activeNode && (
            <div className="relative z-30 flex-shrink-0">
               <InspectorPanel 
                 rootNode={activeNode} 
                 selectedPath={selectedPath} 
                 onClose={() => actions.setSelectedPath(null)}
                 onAction={actions.handleAction}
               />
            </div>
        )}

        {/* Modals & Overlays */}
        <ModalRenderer node={modalNode} onClose={actions.closeModal} onAction={actions.handleAction} onError={actions.fixNode} />
        {showSettings && (
            <SettingsDialog 
                config={config} 
                onSave={actions.setConfig} 
                onClose={() => setShowSettings(false)} 
                onRunDiagnostics={actions.runDiagnostics}
            />
        )}
        {showCode && activeNode && <CodeViewer node={activeNode} onClose={() => setShowCode(false)} />}
        
      </div>
    </EditorProvider>
  );
};

// --- Sub-components ---

const DeviceWrapper = ({ context, node, onAction, isStreaming, onError, editMode, history }: any) => {
    const { canUndo, canRedo, undo, redo } = history || {};

    return (
        <div 
            className={`transition-all duration-700 ease-[0.23,1,0.32,1] relative flex-shrink-0 perspective-1000
                ${context.device === 'mobile' ? 'w-[400px]' : 'w-[1100px]'}
                ${isStreaming ? 'opacity-95' : 'opacity-100'}
            `}
        >
            <div className={`
                /* GLASS EFFECT: Increased Transparency & Blur */
                bg-black/40 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-500 
                ${context.device === 'mobile' 
                    ? 'min-h-[850px] border-[8px] border-zinc-900 rounded-[3.5rem] ring-2 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]' 
                    : 'h-[800px] border border-white/10 ring-1 ring-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)]'
                }
                ${editMode ? 'scale-[0.96] ring-offset-8 ring-offset-black/50 ring-2 ring-indigo-500/50' : ''}
            `}>
                {/* Desktop Browser Bar */}
                {context.device !== 'mobile' && (
                    <div className="h-11 bg-white/5 border-b border-white/5 flex items-center px-5 gap-4 sticky top-0 z-50 backdrop-blur-md">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 shadow-inner" />
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 shadow-inner" />
                            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 shadow-inner" />
                        </div>
                        
                        {/* Navigation Controls */}
                        <div className="flex items-center gap-2 text-zinc-400">
                             <button 
                                onClick={undo} 
                                disabled={!canUndo} 
                                className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Go Back (History)"
                             >
                                <ChevronLeft className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={redo} 
                                disabled={!canRedo} 
                                className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Go Forward"
                             >
                                <ChevronRight className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={() => {}} 
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                title="Refresh"
                             >
                                <RotateCw className="w-3.5 h-3.5" />
                             </button>
                        </div>

                        <div className="flex-1 max-w-2xl mx-auto h-7 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center text-[11px] text-zinc-400 font-mono group hover:border-white/10 transition-colors cursor-text shadow-inner">
                           <Shield className="w-3 h-3 mr-2 opacity-50" />
                           <span className="group-hover:text-zinc-300">https://genui.architect/preview</span>
                        </div>
                    </div>
                )}
                
                {/* Mobile Dynamic Island Notch */}
                {context.device === 'mobile' && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-50 flex items-center justify-center pointer-events-none">
                        <div className="w-20 h-4 bg-zinc-900/50 rounded-full blur-[0.5px]" />
                    </div>
                )}

                {/* SCROLLABLE CONTENT AREA */}
                <div className={`
                    /* Removed inner dark background to allow translucency */
                    w-full
                    overflow-y-auto custom-scrollbar
                    ${context.device === 'mobile' 
                        ? 'h-[850px] pt-12 pb-8 px-2' 
                        : 'h-[calc(100%-44px)]'
                    }
                `}>
                    <DynamicRenderer node={node} onAction={onAction} onError={onError} path="root" />
                </div>
                
                {/* Loading Indicator */}
                {isStreaming && (
                    <div className="absolute bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900/90 backdrop-blur px-4 py-2 rounded-full border border-white/10 shadow-xl pointer-events-none">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold text-white tracking-wide">STREAMING</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
