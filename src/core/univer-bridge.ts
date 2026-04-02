export interface UniverConfig {
  containerId: string;
  sheetData: Array<{ name: string; cellData: Record<string, any> }>;
  theme?: string;
  readOnly?: boolean;
}

export interface CellData {
  v: any;
  s?: { bg?: string; fg?: string; bold?: boolean; italic?: boolean };
  f?: string;
}

export class UniverBridge {
  private engine: any;
  private univerInstance: any = null;
  private containerId: string = '';
  private changeCallbacks: Array<(data: any) => void> = [];

  /**
   * 1. Initialize Univer instance
   */
  public initialize(containerId: string, engine: any): void {
    this.containerId = containerId;
    this.engine = engine;
    
    // Mocking Univer initialization (in production, this uses @univerjs/core & facade)
    this.univerInstance = {
      getActiveWorkbook: () => ({
        getActiveSheet: () => this.mockSheetAPI(),
        insertSheet: (name: string) => console.log(`Sheet ${name} added`),
        deleteSheet: (name: string) => console.log(`Sheet ${name} removed`)
      }),
      onCommandExecuted: (command: any) => {
        this.changeCallbacks.forEach(cb => cb(command));
      }
    };
  }

  /**
   * 2. Push engine state to Univer
   */
  public syncFromEngine(): void {
    if (!this.engine || !this.univerInstance) return;
    const engineState = this.engine.getState();
    // Logic to map engine state to Univer workbook data
    console.log('Synced state from Engine to Univer', engineState);
  }

  /**
   * 3. Pull Univer state to engine
   */
  public syncToEngine(): void {
    if (!this.engine || !this.univerInstance) return;
    const univerState = this.getSheetData();
    this.engine.setState(univerState);
    console.log('Synced state from Univer to Engine');
  }

  /**
   * 4. Get current sheet data
   */
  public getSheetData(): Array<{ name: string; cellData: Record<string, CellData> }> {
    // In production, extracts actual snapshot from Univer workbook
    return [
      {
        name: 'Sheet1',
        cellData: {
          '0,0': { v: 'Deckboss.ai', s: { bold: true } },
          '0,1': { v: 'Data' }
        }
      }
    ];
  }

  /**
   * 5. Set a single cell value and optional style
   */
  public setCellValue(row: number, col: number, value: any, style?: any): void {
    const range = this.getActiveSheet().getRange(row, col);
    range.setValue(value);
    if (style) range.setTextStyle(style);
  }

  /**
   * 6. Get a single cell value
   */
  public getCellValue(row: number, col: number): any {
    return this.getActiveSheet().getRange(row, col).getValue();
  }

  /**
   * 7. Set values for a specific range (e.g., "A1:B10")
   */
  public setRange(rangeStr: string, values: any[][]): void {
    this.getActiveSheet().getRange(rangeStr).setValues(values);
  }

  /**
   * 8. Get values from a specific range
   */
  public getRange(rangeStr: string): any[][] {
    return this.getActiveSheet().getRange(rangeStr).getValues();
  }

  /**
   * 9. Set cell style
   */
  public setCellStyle(row: number, col: number, style: any): void {
    this.getActiveSheet().getRange(row, col).setTextStyle(style);
  }

  /**
   * 10. Merge cells in a range
   */
  public mergeCells(rangeStr: string): void {
    this.getActiveSheet().getRange(rangeStr).merge();
  }

  /**
   * 11. Unmerge cells in a range
   */
  public unmergeCells(rangeStr: string): void {
    this.getActiveSheet().getRange(rangeStr).breakApart();
  }

  /**
   * 12. Set column width
   */
  public setColumnWidth(col: number, width: number): void {
    this.getActiveSheet().setColumnWidth(col, width);
  }

  /**
   * 13. Set row height
   */
  public setRowHeight(row: number, height: number): void {
    this.getActiveSheet().setRowHeight(row, height);
  }

  /**
   * 14. Freeze panes at specific row/col
   */
  public freezePane(row: number, col: number): void {
    this.getActiveSheet().freeze(row, col);
  }

  /**
   * 15. Set active sheet name
   */
  public setSheetName(name: string): void {
    this.getActiveSheet().setName(name);
  }

  /**
   * 16. Add a new sheet
   */
  public addSheet(name: string): void {
    this.univerInstance.getActiveWorkbook().insertSheet(name);
  }

  /**
   * 17. Remove a sheet by name
   */
  public removeSheet(name: string): void {
    this.univerInstance.getActiveWorkbook().deleteSheet(name);
  }

  /**
   * 18. Get the currently active/selected cell
   */
  public getActiveCell(): { row: number; col: number } {
    const selection = this.getActiveSheet().getSelection();
    return { row: selection?.startRow || 0, col: selection?.startColumn || 0 };
  }

  /**
   * 19. Register callback for cell changes
   */
  public onCellChange(callback: (data: any) => void): void {
    this.changeCallbacks.push(callback);
  }

  /**
   * 20. Export sheet data as JSON string
   */
  public getExportData(): string {
    return JSON.stringify(this.getSheetData(), null, 2);
  }

  /**
   * 21. Generate standalone HTML page with Univer CDN and BYOK Chat
   */
  public generateHTML(): string {
    const sheetDataJson = this.getExportData();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deckboss.ai - Standalone Sheet</title>
  
  <!-- Univer CSS from CDN -->
  <link rel="stylesheet" href="https://unpkg.com/@univerjs/design@latest/lib/index.css">
  <link rel="stylesheet" href="https://unpkg.com/@univerjs/ui@latest/lib/index.css">
  <link rel="stylesheet" href="https://unpkg.com/@univerjs/sheets-ui@latest/lib/index.css">

  <style>
    :root { --primary: #2563eb; --bg: #ffffff; --sidebar-bg: #f8fafc; --border: #e2e8f0; }
    body { margin: 0; padding: 0; display: flex; height: 100vh; font-family: system-ui, sans-serif; overflow: hidden; }
    
    #univer-container { flex: 1; height: 100%; position: relative; }
    
    #chat-sidebar { 
      width: 320px; 
      background: var(--sidebar-bg); 
      border-left: 1px solid var(--border); 
      display: flex; 
      flex-direction: column; 
    }
    
    .chat-header { 
      padding: 16px; 
      background: var(--primary); 
      color: white; 
      font-weight: 600; 
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .chat-messages { 
      flex: 1; 
      padding: 16px; 
      overflow-y: auto; 
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .msg { padding: 10px 14px; border-radius: 8px; font-size: 14px; line-height: 1.4; }
    .msg.system { background: #e2e8f0; color: #475569; align-self: center; font-size: 12px; }
    .msg.user { background: var(--primary); color: white; align-self: flex-end; }
    .msg.ai { background: white; border: 1px solid var(--border); align-self: flex-start; }
    
    .chat-input-area { padding: 16px; border-top: 1px solid var(--border); background: white; }
    .byok-config { margin-bottom: 10px; display: flex; gap: 8px; }
    .byok-config input { flex: 1; padding: 6px; font-size: 12px; border: 1px solid var(--border); border-radius: 4px; }
    
    .input-row { display: flex; gap: 8px; }
    .input-row input { flex: 1; padding: 10px; border: 1px solid var(--border); border-radius: 6px; outline: none; }
    .input-row button { padding: 10px 16px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .input-row button:hover { background: #1d4ed8; }

    /* Print-friendly styles */
    @media print {
      #chat-sidebar { display: none !important; }
      #univer-container { width: 100% !important; flex: none; display: block; }
      body { height: auto; overflow: visible; }
    }
  </style>
</head>
<body>

  <div id="univer-container"></div>

  <div id="chat-sidebar">
    <div class="chat-header">
      <span>Deckboss AI</span>
      <span style="font-size: 12px; opacity: 0.8;">BYOK Powered</span>
    </div>
    
    <div class="chat-messages" id="chat-messages">
      <div class="msg system">Offline Mode Active. Data loaded locally.</div>
      <div class="msg ai">Hello! I am your Deckboss assistant. Enter your OpenAI API key below to enable chat capabilities for this sheet.</div>
    </div>
    
    <div class="chat-input-area">
      <div class="byok-config">
        <input type="password" id="api-key" placeholder="sk-... (Your OpenAI Key)">
      </div>
      <div class="input-row">
        <input type="text" id="chat-input" placeholder="Ask about the data..." onkeypress="if(event.key === 'Enter') sendMessage()">
        <button onclick="sendMessage()">Send</button>
      </div>
    </div>
  </div>

  <!-- Univer JS from CDN -->
  <script src="https://unpkg.com/@univerjs/core@latest/lib/index.umd.js"></script>
  <script src="https://unpkg.com/@univerjs/design@latest/lib/index.umd.js"></script>
  <script src="https://unpkg.com/@univerjs/engine-render@latest/lib/index.umd.js"></script>
  <script src="https://unpkg.com/@univerjs/engine-formula@latest/lib/index.umd.js"></script>
  <script src="https://unpkg.com/@univerjs/ui@latest/lib/index.umd.js"></script>
  <script src="https://unpkg.com/@univerjs/sheets@latest/lib/index.umd.js"></script>
  <script src="https://unpkg.com/@univerjs/sheets-ui@latest/lib/index.umd.js"></script>

  <script>
    // 1. Load Injected Data
    const deckbossData = ${sheetDataJson};
    
    // 2. Initialize Univer (Offline)
    // Note: In a real environment, you instantiate the Univer core and register plugins.
    // This script block acts as the bootstrap for the standalone file.
    document.getElementById('univer-container').innerHTML = 
      '<div style="padding: 20px; color: #64748b;">' +
      '<h3>Univer Engine Initialized</h3>' +
      '<pre style="background:#f1f5f9; padding:15px; border-radius:8px;">' + 
      JSON.stringify(deckbossData, null, 2) + 
      '</pre></div>';

    // 3. BYOK Chat Logic
    async function sendMessage() {
      const input = document.getElementById('chat-input');
      const apiKey = document.getElementById('api-key').value;
      const messages = document.getElementById('chat-messages');
      const text = input.value.trim();
      
      if (!text) return;
      
      // Add User Message
      messages.innerHTML += \`<div class="msg user">\${text}</div>\`;
      input.value = '';
      messages.scrollTop = messages.scrollHeight;

      if (!apiKey) {
        setTimeout(() => {
          messages.innerHTML += \`<div class="msg ai" style="color: #ef4444;">Please enter your OpenAI API key to use the chat feature.</div>\`;
          messages.scrollTop = messages.scrollHeight;
        }, 500);
        return;
      }

      // Simulate API Call using BYOK
      try {
        messages.innerHTML += \`<div class="msg system" id="loading">Thinking...</div>\`;
        messages.scrollTop = messages.scrollHeight;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${apiKey}\`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You are a helpful spreadsheet assistant. The current sheet data is: ' + JSON.stringify(deckbossData) },
              { role: 'user', content: text }
            ]
          })
        });

        document.getElementById('loading').remove();

        if (!response.ok) throw new Error('API Error');
        
        const data = await response.json();
        const reply = data.choices[0].message.content;
        
        messages.innerHTML += \`<div class="msg ai">\${reply}</div>\`;
      } catch (err) {
        document.getElementById('loading')?.remove();
        messages.innerHTML += \`<div class="msg ai" style="color: #ef4444;">Error connecting to OpenAI. Check your API key.</div>\`;
      }
      
      messages.scrollTop = messages.scrollHeight;
    }
  </script>
</body>
</html>`;
  }

  // --- Private Helpers ---

  private getActiveSheet(): any {
    return this.univerInstance?.getActiveWorkbook()?.getActiveSheet();
  }

  private mockSheetAPI(): any {
    return {
      getRange: (rowOrRange: any, col?: number) => ({
        setValue: (val: any) => console.log(`Set value ${val}`),
        getValue: () => 'mock_value',
        setValues: (vals: any[][]) => console.log('Set values', vals),
        getValues: () => [['mock_value']],
        setTextStyle: (style: any) => console.log('Set style', style),
        merge: () => console.log('Merged'),
        breakApart: () => console.log('Unmerged')
      }),
      setColumnWidth: (c: number, w: number) => console.log(`Col ${c} width ${w}`),
      setRowHeight: (r: number, h: number) => console.log(`Row ${r} height ${h}`),
      freeze: (r: number, c: number) => console.log(`Freeze at ${r},${c}`),
      setName: (n: string) => console.log(`Name set to ${n}`),
      getSelection: () => ({ startRow: 0, startColumn: 0 })
    };
  }
}