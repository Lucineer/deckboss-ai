export interface Env {
  // Environment variables can be added here
}

const HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deckboss.ai - Design Your Robot Brain</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>">
  <style>
    :root {
      --navy: #0a1628;
      --navy-light: #1a2a3a;
      --amber: #f59e0b;
      --amber-dark: #d97706;
      --amber-light: #fbbf24;
      --white: #ffffff;
      --gray: #9ca3af;
      --gray-light: #e5e7eb;
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
      --radius: 12px;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: var(--navy);
      color: var(--white);
      line-height: 1.6;
      overflow-x: hidden;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Header & Navigation */
    header {
      padding: 24px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      top: 0;
      background: rgba(10, 22, 40, 0.95);
      backdrop-filter: blur(10px);
      z-index: 100;
    }

    .logo {
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(135deg, var(--amber), var(--amber-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-decoration: none;
      transition: var(--transition);
    }

    .logo:hover {
      transform: scale(1.05);
    }

    /* Hero Section */
    .hero {
      padding: 120px 0 80px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%);
      z-index: -1;
    }

    .hero h1 {
      font-size: 4rem;
      font-weight: 900;
      margin-bottom: 24px;
      background: linear-gradient(135deg, var(--white), var(--amber-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.1;
    }

    .hero-subtitle {
      font-size: 1.5rem;
      color: var(--gray-light);
      max-width: 800px;
      margin: 0 auto 48px;
    }

    /* Cards & Sections */
    .section {
      padding: 80px 0;
    }

    .section-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 48px;
      text-align: center;
      position: relative;
    }

    .section-title::after {
      content: '';
      position: absolute;
      bottom: -12px;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, var(--amber), var(--amber-dark));
      border-radius: 2px;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 32px;
      margin-top: 48px;
    }

    .card {
      background: var(--navy-light);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius);
      padding: 32px;
      transition: var(--transition);
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--amber), var(--amber-dark));
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }

    .card:hover {
      transform: translateY(-8px);
      box-shadow: var(--shadow);
      border-color: var(--amber);
    }

    .card:hover::before {
      transform: scaleX(1);
    }

    .card h3 {
      font-size: 1.5rem;
      margin-bottom: 16px;
      color: var(--amber);
    }

    /* Quick Start Steps */
    .steps {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .step {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      padding: 24px;
      background: var(--navy-light);
      border-radius: var(--radius);
      border-left: 4px solid var(--amber);
      transition: var(--transition);
    }

    .step:hover {
      transform: translateX(8px);
      background: rgba(245, 158, 11, 0.05);
    }

    .step-number {
      background: var(--amber);
      color: var(--navy);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      flex-shrink: 0;
    }

    /* Ecosystem Layers */
    .layers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 32px;
      margin-top: 48px;
    }

    .layer {
      text-align: center;
      padding: 40px 24px;
      background: linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(10, 22, 40, 0.3));
      border-radius: var(--radius);
      border: 1px solid rgba(245, 158, 11, 0.2);
      transition: var(--transition);
    }

    .layer:hover {
      transform: translateY(-4px);
      border-color: var(--amber);
      box-shadow: 0 20px 40px rgba(245, 158, 11, 0.1);
    }

    .layer h3 {
      font-size: 1.8rem;
      margin-bottom: 16px;
      color: var(--amber);
    }

    .layer-tag {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(245, 158, 11, 0.2);
      color: var(--amber-light);
      border-radius: 20px;
      font-size: 0.9rem;
      margin-bottom: 20px;
    }

    /* Hardware Grid */
    .hardware-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-top: 48px;
    }

    .hardware-card {
      background: linear-gradient(145deg, var(--navy-light), rgba(26, 42, 58, 0.8));
      border-radius: var(--radius);
      padding: 32px 24px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: var(--transition);
    }

    .hardware-card:hover {
      border-color: var(--amber);
      transform: scale(1.02);
    }

    .hardware-card h4 {
      font-size: 1.5rem;
      color: var(--amber);
      margin-bottom: 8px;
    }

    .price {
      font-size: 2rem;
      font-weight: bold;
      color: var(--white);
      margin: 16px 0;
    }

    /* Footer */
    footer {
      padding: 60px 0 40px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 80px;
    }

    .footer-links {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 32px;
      margin-bottom: 40px;
    }

    .footer-link {
      color: var(--gray);
      text-decoration: none;
      transition: var(--transition);
      position: relative;
    }

    .footer-link::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 0;
      height: 2px;
      background: var(--amber);
      transition: width 0.3s ease;
    }

    .footer-link:hover {
      color: var(--amber);
    }

    .footer-link:hover::after {
      width: 100%;
    }

    .attribution {
      text-align: center;
      color: var(--gray);
      font-size: 0.9rem;
      padding-top: 32px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2.5rem;
      }
      
      .hero-subtitle {
        font-size: 1.2rem;
      }
      
      .section-title {
        font-size: 2rem;
      }
      
      .card-grid {
        grid-template-columns: 1fr;
      }
      
      .layers {
        grid-template-columns: 1fr;
      }
      
      .hardware-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .footer-links {
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }
    }

    @media (max-width: 480px) {
      .hardware-grid {
        grid-template-columns: 1fr;
      }
      
      .hero {
        padding: 80px 0 40px;
      }
      
      .section {
        padding: 60px 0;
      }
    }

    /* Code Blocks */
    .code-block {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 16px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.9rem;
      margin: 16px 0;
      overflow-x: auto;
      border-left: 3px solid var(--amber);
    }

    /* Highlight Box */
    .highlight {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), transparent);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: var(--radius);
      padding: 32px;
      margin: 40px 0;
    }

    /* Utility Classes */
    .text-center { text-align: center; }
    .mt-4 { margin-top: 16px; }
    .mt-8 { margin-top: 32px; }
    .mb-4 { margin-bottom: 16px; }
    .mb-8 { margin-bottom: 32px; }
    .text-amber { color: var(--amber); }
    .text-gray { color: var(--gray); }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <a href="#" class="logo">🤖 deckboss.ai</a>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <h1>Design Your Robot Brain</h1>
        <p class="hero-subtitle">
          Deckboss is the build-phase AI assistant for edge robotics and IoT.
          Clone the repo. Boot on Jetson or RPi. Start talking to your hardware.
        </p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2 class="section-title">Quick Start</h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div>
              <h3>Clone the Repository</h3>
              <div class="code-block">git clone https://github.com/Lucineer/deckboss.git</div>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div>
              <h3>Run Setup Script</h3>
              <div class="code-block">cd deckboss && bash setup.sh</div>
              <p class="text-gray mt-4">Automatically configures your environment and dependencies</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div>
              <h3>Start Building</h3>
              <div class="code-block">deckboss init --project my-robot</div>
              <div class="code-block">deckboss design "autonomous delivery bot with 4 cameras"</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section" style="background: rgba(0, 0, 0, 0.2);">
      <div class="container">
        <h2 class="section-title">What Deckboss Does</h2>
        <div class="card-grid">
          <div class="card">
            <h3>System Design</h3>
            <p>Describe what you need in plain English, get complete wiring diagrams, component specifications, and bill of materials.</p>
          </div>
          <div class="card">
            <h3>Photo to Wiring</h3>
            <p>Photograph your hardware setup, receive annotated connection diagrams and compatibility analysis.</p>
          </div>
          <div class="card">
            <h3>IoT Architecture</h3>
            <p>Design sensor networks, compute topologies, and communication protocols for distributed systems.</p>
          </div>
          <div class="card">
            <h3>Git-Agent Fleet</h3>
            <p>Every component becomes a git repo you can fork, share, and version control. True hardware-as-code.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2 class="section-title">The 3-Layer Ecosystem</h2>
        <div class="layers">
          <div class="layer">
            <div class="layer-tag">Layer 1 Touch</div>
            <h3>studylog.ai<br>activelog.ai<br>dmlog.ai</h3>
            <p>"It just works" – Ready-to-deploy solutions for common robotics applications.</p>
          </div>
          <div class="layer">
            <div class="layer-tag">Layer 2 Operate</div>
            <h3>cocapn.ai<br>cocapn.com</h3>
            <p>"Customize and manage" – Operational tools for fleet management and customization.</p>
          </div>
          <div class="layer">
            <div class="layer-tag">Layer 3 Build</div>
            <h3>deckboss.ai<br>deckboss.net<br>capitaine.ai</h3>
            <p>"Design systems, open the hood" – Full-stack development tools for creating new robotics systems.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section" style="background: rgba(0, 0, 0, 0.2);">
      <div class="container">
        <div class="highlight">
          <h2 class="section-title">Character Sheet System</h2>
          <p class="text-center mb-8" style="max-width: 800px; margin: 0 auto;">
            Hardware detection creates a detailed resource plan. Jetson with cameras generates a different plan than text-only ideation.
            The character sheet makes resource tradeoffs explicit – compute vs power vs cost vs capability.
          </p>
          <div class="card-grid">
            <div class="card">
              <h3>Resource Mapping</h3>
              <p>Automatically profiles your hardware and creates optimal resource allocation plans.</p>
            </div>
            <div class="card">
              <h3>Tradeoff Analysis</h3>
              <p>Visualizes the engineering tradeoffs between different hardware configurations.</p>
            </div>
            <div class="card">
              <h3>Optimization Paths</h3>
              <p>Suggests upgrade paths and optimization strategies based on your goals.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2 class="section-title">Built for Technicians</h2>
        <div class="card-grid">
          <div class="card">
            <h3>Peer-to-Peer Training</h3>
            <p>Technician-teaches-technician model creates authentic, practical knowledge transfer.</p>
          </div>
          <div class="card">
            <h3>Reputation Economy</h3>
            <p>Verified installation scores and performance metrics build trust across the ecosystem.</p>
          </div>
          <div class="card">
            <h3>Career Pathways</h3>
            <p>People make a living as installers, servicers, product designers, and micro-manufacturers.</p>
          </div>
        </div>
        <div class="text-center mt-8">
          <p class="text-amber" style="font-size: 1.2rem;">
            The Flywheel: More installs → More profiles → More manufacturers → Cheaper units → More installs
          </p>
        </div>
      </div>
    </section>

    <section class="section" style="background: rgba(0, 0, 0, 0.2);">
      <div class="container">
        <h2 class="section-title">Hardware Units</h2>
        <p class="text-center mb-8">Preloaded and ready to deploy. Available at <a href="https://deckboss.net" class="text-amber" style="text-decoration: none;">deckboss.net</a></p>
        <div class="hardware-grid">
          <div class="hardware-card">
            <h4>Nano</h4>
            <p>Entry-level development</p>
            <div class="price">$299</div>
          </div>
          <div class="hardware-card">
            <h4>Standard</h4>
            <p>Production ready</p>
            <div class="price">$599</div>
          </div>
          <div class="hardware-card">
            <h4>Pro</h4>
            <p>Multi-sensor systems</p>
            <div class="price">$1199</div>
          </div>
          <div class="hardware-card">
            <h4>Enterprise</h4>
            <p>Fleet deployment</p>
            <div class="price">$1499</div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="container">
      <div class="footer-links">
        <a href="https://github.com/Lucineer/deckboss" class="footer-link">GitHub</a>
        <a href="https://cocapn.ai" class="footer-link">CoCapn</a>
        <a href="https://deckboss.net" class="footer-link">Hardware</a>
        <a href="https://capitaine.ai" class="footer-link">Capitaine</a>
        <a href="https://the-fleet.ai" class="footer-link">The Fleet</a>
      </div>
      <div class="attribution">
        Built by Superinstance & Lucineer (DiGennaro et al.)<br>
        © ${new Date().getFullYear()} Deckboss AI. All systems operational.
      </div>
    </div>
  </footer>

    <div style="max-width:700px;margin:2rem auto;padding:1.5rem;background:rgba(255,255,255,0.05);border-radius:12px;text-align:center">
      <p style="margin:0 0 0.5rem;font-size:0.8rem;color:#888">Part of the Lucineer Ecosystem</p>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.5rem;font-size:0.75rem">
        <a href="https://github.com/Lucineer/cocapn-ai" style="color:#60a5fa;text-decoration:none">cocapn.ai</a>
        <a href="https://github.com/Lucineer/deckboss" style="color:#60a5fa;text-decoration:none">deckboss.ai</a>
        <a href="https://github.com/Lucineer/deckboss-hardware" style="color:#60a5fa;text-decoration:none">deckboss.net</a>
        <a href="https://github.com/Lucineer/capitaine-ai" style="color:#60a5fa;text-decoration:none">capitaine.ai</a>
        <a href="https://github.com/Lucineer/the-fleet" style="color:#60a5fa;text-decoration:none">the-fleet</a>
      </div>
      <p style="margin:0.5rem 0 0;font-size:0.65rem;color:#666">Built by Superinstance &amp; Lucineer (DiGennaro et al.)</p>
    </div>
</body>
</html>
`;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Health endpoint
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({ 
          status: "ok", 
          vessel: "deckboss",
          timestamp: new Date().toISOString()
        }), 
        {
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    }
    
    // Main landing page
    const headers = {
      'Content-Type': 'text/html;charset=UTF-8',
      'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'public, max-age=3600'
    };
    
    return new Response(HTML, { headers });
  }
} satisfies ExportedHandler<Env>;


export default { fetch };