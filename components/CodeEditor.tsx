import React, { useState, useRef, useEffect, useCallback } from 'react';
import { APP_CONFIG } from '../config';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange?: (lang: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

interface HistoryState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  timestamp: number;
}

const TAB_SIZE = 2;
const PAIRS: Record<string, string> = {
  '(': ')',
  '{': '}',
  '[': ']',
  '"': '"',
  "'": "'",
  '`': '`',
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  onChange, 
  language, 
  onLanguageChange,
  placeholder, 
  className = '',
  readOnly = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [highlightedCode, setHighlightedCode] = useState('');
  
  // --- History Management (Robust) ---
  const [history, setHistory] = useState<HistoryState[]>([{ 
      value, 
      selectionStart: 0, 
      selectionEnd: 0, 
      timestamp: Date.now() 
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoAction = useRef(false);
  const lastTypingTime = useRef(0);

  const saveHistory = useCallback((newValue: string, selectionStart: number, selectionEnd: number, forceNew: boolean = false) => {
    if (isUndoRedoAction.current) return;

    const now = Date.now();
    const isSequentialTyping = !forceNew && (now - lastTypingTime.current < 1000);
    
    setHistory(prev => {
        const currentHistory = prev.slice(0, historyIndex + 1);
        
        if (isSequentialTyping && currentHistory.length > 0) {
            // Replace last entry (merge typing)
            const updated = [...currentHistory];
            updated[updated.length - 1] = { value: newValue, selectionStart, selectionEnd, timestamp: now };
            return updated;
        } else {
            // Push new entry
            const newHistory = [...currentHistory, { value: newValue, selectionStart, selectionEnd, timestamp: now }];
            if (newHistory.length > 100) newHistory.shift(); // Limit history
            return newHistory;
        }
    });
    
    if (!isSequentialTyping || historyIndex === 0) {
        setHistoryIndex(prev => {
             const next = prev + 1;
             return next > 100 ? 100 : next;
        });
    }

    lastTypingTime.current = now;
  }, [historyIndex]);

  const restoreState = (state: HistoryState) => {
    isUndoRedoAction.current = true;
    onChange(state.value);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = state.selectionStart;
        textareaRef.current.selectionEnd = state.selectionEnd;
        // Keep focus
        textareaRef.current.focus();
      }
      isUndoRedoAction.current = false;
      lastTypingTime.current = 0; // Reset typing timer on undo/redo
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      restoreState(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      restoreState(history[historyIndex + 1]);
    }
  };

  // --- Helpers ---
  
  const getCommentConfig = () => {
      const l = APP_CONFIG.SUPPORTED_LANGUAGES.find(sl => sl.value === language);
      return l?.comment || '//';
  };

  const updateValue = (newValue: string, newCursor: number, forceHistory = false) => {
      saveHistory(newValue, newCursor, newCursor, forceHistory);
      onChange(newValue);
      requestAnimationFrame(() => {
          if (textareaRef.current) {
              textareaRef.current.selectionStart = newCursor;
              textareaRef.current.selectionEnd = newCursor;
          }
      });
  };

  // --- Handlers ---

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value: currVal } = target;

    // Undo/Redo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) handleRedo();
      else handleUndo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
    }

    // Toggle Comment (Ctrl+/)
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        const comment = getCommentConfig();
        if (!comment) return;

        // Escape regex special characters in the comment symbol (e.g. for C++ "/*")
        const escapedComment = comment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Matches: Start -> Group 1 (whitespace) -> Comment -> Optional Space
        const commentRegex = new RegExp(`^(\\s*)${escapedComment}\\s?`);

        const startLineIdx = currVal.lastIndexOf('\n', selectionStart - 1) + 1;
        const endLineIdx = currVal.indexOf('\n', selectionEnd);
        const actualEnd = endLineIdx === -1 ? currVal.length : endLineIdx;

        const selectedText = currVal.substring(startLineIdx, actualEnd);
        const lines = selectedText.split('\n');
        
        // Check if all non-empty lines are already commented
        const nonEmptyLines = lines.filter(l => l.trim().length > 0);
        const allCommented = nonEmptyLines.length > 0 && nonEmptyLines.every(line => commentRegex.test(line));
        
        const newLines = lines.map(line => {
            if (line.trim().length === 0) return line;

            if (allCommented) {
                // Uncomment: Remove comment char and optional following space, keep indentation ($1)
                return line.replace(commentRegex, '$1');
            } else {
                // Comment: Insert comment char after indentation ($1)
                return line.replace(/^(\s*)(.*)/, `$1${comment} $2`);
            }
        });

        const newValue = currVal.substring(0, startLineIdx) + newLines.join('\n') + currVal.substring(actualEnd);
        
        // Calculate length difference to adjust selection
        const lengthDiff = newValue.length - currVal.length;

        saveHistory(newValue, selectionStart, selectionEnd + lengthDiff, true);
        onChange(newValue);
        
        requestAnimationFrame(() => {
            target.selectionStart = selectionStart;
            // Expand selection to cover new length
            target.selectionEnd = selectionEnd + lengthDiff;
        });
        return;
    }

    // Move Line (Alt+Up/Down) & Duplicate (Shift+Alt+Up/Down)
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const startLineIdx = currVal.lastIndexOf('\n', selectionStart - 1) + 1;
        const endLineIdx = currVal.indexOf('\n', selectionEnd);
        const actualEnd = endLineIdx === -1 ? currVal.length : endLineIdx;
        
        const selectedBlock = currVal.substring(startLineIdx, actualEnd);
        
        if (e.shiftKey) {
            // Duplicate
            const insertion = '\n' + selectedBlock;
            const newValue = currVal.substring(0, actualEnd) + insertion + currVal.substring(actualEnd);
            saveHistory(newValue, selectionStart, selectionEnd, true);
            onChange(newValue);
        } else {
            // Move Up
            if (e.key === 'ArrowUp' && startLineIdx > 0) {
                 const prevLineStart = currVal.lastIndexOf('\n', startLineIdx - 2) + 1;
                 const prevLine = currVal.substring(prevLineStart, startLineIdx - 1);
                 // Swap
                 const newValue = currVal.substring(0, prevLineStart) + selectedBlock + '\n' + prevLine + currVal.substring(actualEnd);
                 const moveAmount = -(prevLine.length + 1);
                 saveHistory(newValue, selectionStart + moveAmount, selectionEnd + moveAmount, true);
                 onChange(newValue);
                 requestAnimationFrame(() => {
                    target.selectionStart = selectionStart + moveAmount;
                    target.selectionEnd = selectionEnd + moveAmount;
                 });
            }
            // Move Down
             if (e.key === 'ArrowDown' && actualEnd < currVal.length) {
                 const nextLineEnd = currVal.indexOf('\n', actualEnd + 1);
                 const actualNextEnd = nextLineEnd === -1 ? currVal.length : nextLineEnd;
                 const nextLine = currVal.substring(actualEnd + 1, actualNextEnd);
                 
                 const newValue = currVal.substring(0, startLineIdx) + nextLine + '\n' + selectedBlock + currVal.substring(actualNextEnd);
                 const moveAmount = nextLine.length + 1;
                 saveHistory(newValue, selectionStart + moveAmount, selectionEnd + moveAmount, true);
                 onChange(newValue);
                 requestAnimationFrame(() => {
                    target.selectionStart = selectionStart + moveAmount;
                    target.selectionEnd = selectionEnd + moveAmount;
                 });
            }
        }
        return;
    }

    // Tab (Indent)
    if (e.key === 'Tab') {
      e.preventDefault();
      const isMultiLine = selectionStart !== selectionEnd && currVal.substring(selectionStart, selectionEnd).includes('\n');
      
      if (e.shiftKey) {
          // Unindent
          const startLine = currVal.lastIndexOf('\n', selectionStart - 1) + 1;
          const endLine = currVal.indexOf('\n', selectionEnd);
          const actualEnd = endLine === -1 ? currVal.length : endLine;
          
          if (isMultiLine || actualEnd > startLine) {
              const text = currVal.substring(startLine, actualEnd);
              const lines = text.split('\n');
              const newLines = lines.map(line => line.startsWith('  ') ? line.substring(2) : line);
              const newValue = currVal.substring(0, startLine) + newLines.join('\n') + currVal.substring(actualEnd);
              
              const diff = newValue.length - currVal.length;
              saveHistory(newValue, startLine, selectionEnd + diff, true);
              onChange(newValue);
              requestAnimationFrame(() => {
                  target.selectionStart = startLine;
                  target.selectionEnd = Math.max(startLine, selectionEnd + diff);
              });
          }
      } else {
          // Indent
          if (isMultiLine) {
             const startLine = currVal.lastIndexOf('\n', selectionStart - 1) + 1;
             const endLine = currVal.indexOf('\n', selectionEnd);
             const actualEnd = endLine === -1 ? currVal.length : endLine;
             
             const text = currVal.substring(startLine, actualEnd);
             const lines = text.split('\n');
             const newLines = lines.map(l => '  ' + l);
             const newValue = currVal.substring(0, startLine) + newLines.join('\n') + currVal.substring(actualEnd);
             
             const diff = newLines.length * 2;
             saveHistory(newValue, startLine, selectionEnd + diff, true);
             onChange(newValue);
              requestAnimationFrame(() => {
                  target.selectionStart = startLine;
                  target.selectionEnd = selectionEnd + diff;
              });
          } else {
             const newValue = currVal.substring(0, selectionStart) + '  ' + currVal.substring(selectionEnd);
             updateValue(newValue, selectionStart + 2, true);
          }
      }
      return;
    }

    // Enter (Smart Indent)
    if (e.key === 'Enter') {
        e.preventDefault();
        const lines = currVal.substring(0, selectionStart).split('\n');
        const currentLine = lines[lines.length - 1];
        const match = currentLine.match(/^(\s*)/);
        let indent = match ? match[1] : '';
        
        const trimmed = currentLine.trim();
        const lastChar = trimmed[trimmed.length - 1];
        if ([':', '{', '(', '['].includes(lastChar)) indent += '  ';
        
        const nextChar = currVal[selectionEnd];
        let insertion = '\n' + indent;
        let cursorOffset = insertion.length;

        if (lastChar === '{' && nextChar === '}') {
            const closingIndent = indent.substring(0, Math.max(0, indent.length - 2));
            insertion += '\n' + closingIndent;
        }

        const newValue = currVal.substring(0, selectionStart) + insertion + currVal.substring(selectionEnd);
        updateValue(newValue, selectionStart + cursorOffset, true);
        return;
    }

    // Auto-Close / Wrap
    if (PAIRS[e.key]) {
        e.preventDefault();
        const closeChar = PAIRS[e.key];
        
        if (selectionStart !== selectionEnd) {
            // Wrap selection
            const text = currVal.substring(selectionStart, selectionEnd);
            const newValue = currVal.substring(0, selectionStart) + e.key + text + closeChar + currVal.substring(selectionEnd);
            saveHistory(newValue, selectionStart, selectionEnd + 2, true);
            onChange(newValue);
            requestAnimationFrame(() => {
                target.selectionStart = selectionStart + 1;
                target.selectionEnd = selectionEnd + 1;
            });
        } else {
            // Auto close
            const newValue = currVal.substring(0, selectionStart) + e.key + closeChar + currVal.substring(selectionEnd);
            updateValue(newValue, selectionStart + 1, true);
        }
        return;
    }

    // Skip closing char
    if (Object.values(PAIRS).includes(e.key) && currVal[selectionStart] === e.key) {
        e.preventDefault();
        requestAnimationFrame(() => {
            target.selectionStart = selectionStart + 1;
            target.selectionEnd = selectionStart + 1;
        });
        return;
    }

    // Backspace Pair
    if (e.key === 'Backspace' && selectionStart === selectionEnd) {
        const prev = currVal[selectionStart - 1];
        const next = currVal[selectionStart];
        if (prev && PAIRS[prev] === next) {
            e.preventDefault();
            const newValue = currVal.substring(0, selectionStart - 1) + currVal.substring(selectionStart + 1);
            updateValue(newValue, selectionStart - 1, true);
            return;
        }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      const val = e.currentTarget.value;
      if (val !== value) {
          saveHistory(val, e.currentTarget.selectionStart, e.currentTarget.selectionEnd);
          onChange(val);
      }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      const { selectionStart, selectionEnd } = textareaRef.current!;
      const currVal = textareaRef.current!.value;
      
      let newText = text;
      const lines = text.split('\n');

      // Smart Indent for Multi-line Paste
      if (lines.length > 1) {
          // 1. Get current line indentation (whitespace at start of the line where cursor is)
          const lineStart = currVal.lastIndexOf('\n', selectionStart - 1) + 1;
          const linePrefix = currVal.substring(lineStart, selectionStart);
          const indentMatch = linePrefix.match(/^(\s*)/);
          const currentIndent = indentMatch ? indentMatch[1] : '';

          // 2. Detect common indentation in the pasted content (minIndent)
          // We ignore purely whitespace lines for this calculation
          const nonEmptyLines = lines.filter(l => l.trim().length > 0);
          
          if (nonEmptyLines.length > 0) {
              const minIndent = Math.min(...nonEmptyLines.map(line => {
                  const match = line.match(/^(\s*)/);
                  return match ? match[1].length : 0;
              }));

              // 3. Process lines
              newText = lines.map((line, i) => {
                  // If line is empty or whitespace only, return empty string (cleaner)
                  if (line.trim().length === 0) return '';
                  
                  // Strip the common indentation (safely)
                  const stripLen = Math.min(line.length, minIndent);
                  const stripped = line.substring(stripLen);

                  // First line: Appended to cursor, so it adopts current visual indentation automatically.
                  // We just need to strip its own leading indent.
                  if (i === 0) return stripped;

                  // Subsequent lines: Need explicit currentIndent prefix + remaining content
                  return currentIndent + stripped;
              }).join('\n');
          }
      }

      // Insert text
      const newValue = currVal.substring(0, selectionStart) + newText + currVal.substring(selectionEnd);
      const newCursorPos = selectionStart + newText.length;

      saveHistory(newValue, newCursorPos, newCursorPos, true);
      onChange(newValue);
      
      requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = newCursorPos;
            textareaRef.current.selectionEnd = newCursorPos;
            // Ensure focus and scroll
            textareaRef.current.blur(); 
            textareaRef.current.focus(); 
          }
      });
  };

  // --- Auto Detect ---
  useEffect(() => {
    if (language === 'text' && onLanguageChange && value.length > 20) {
      const timer = setTimeout(() => {
        if ((window as any).hljs) {
          try {
             const result = (window as any).hljs.highlightAuto(value);
             const detected = result.language;
             const supported = APP_CONFIG.SUPPORTED_LANGUAGES.find(l => 
                l.value === detected || (l.aliases && l.aliases.includes(detected))
             );
             
             let mapTo = supported?.value;
             // Manual fallbacks for common highlight.js outputs
             if (!mapTo) {
                 if (['js', 'jsx'].includes(detected)) mapTo = 'javascript';
                 if (['ts', 'tsx'].includes(detected)) mapTo = 'typescript';
                 if (['py'].includes(detected)) mapTo = 'python';
             }

             if (mapTo && mapTo !== 'text') onLanguageChange(mapTo);
          } catch (e) {}
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [value, language, onLanguageChange]);

  // --- Highlighting ---
  useEffect(() => {
    if ((window as any).hljs) {
      try {
         const validLang = (window as any).hljs.getLanguage(language) ? language : 'plaintext';
         const res = (window as any).hljs.highlight(value || ' ', { language: validLang });
         setHighlightedCode(res.value);
      } catch (e) {
         setHighlightedCode(value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      }
    }
  }, [value, language]);

  // --- Scroll Sync ---
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const lineNumbers = value.split('\n').length;

  return (
    <div className={`relative flex border border-line bg-white focus-within:border-ink overflow-hidden rounded-sm group shadow-sm transition-all duration-200 ${className}`}>
      
      <div 
        className="hidden md:block bg-gray-50 border-r border-line py-4 px-2 text-right select-none text-xs text-gray-400 font-mono leading-relaxed overflow-hidden"
        style={{ minWidth: '3.5rem' }}
      >
        <div style={{ transform: `translateY(-${textareaRef.current?.scrollTop || 0}px)` }}>
            {Array.from({ length: lineNumbers }, (_, i) => (
                <div key={i} style={{ height: '1.625rem' }}>{i + 1}</div>
            ))}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden h-full">
        <pre 
            ref={preRef}
            className="absolute inset-0 m-0 p-4 pointer-events-none font-mono text-sm leading-relaxed overflow-hidden whitespace-pre w-full h-full"
            style={{ tabSize: TAB_SIZE }}
        >
            <code 
                className={`language-${language} bg-transparent p-0 block font-mono text-sm leading-relaxed`} 
                dangerouslySetInnerHTML={{ __html: highlightedCode + (value.endsWith('\n') ? '<br/>' : '') }} 
            />
        </pre>

        <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onScroll={handleScroll}
            placeholder={placeholder}
            readOnly={readOnly}
            className="relative z-10 w-full h-full p-4 bg-transparent caret-ink outline-none font-mono text-sm leading-relaxed resize-none whitespace-pre overflow-auto text-transparent"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            style={{ tabSize: TAB_SIZE }}
        />
      </div>
    </div>
  );
};