import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Button,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useNavigate } from "@remix-run/react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <Page>
      <TitleBar title="MattressAI Dashboard" />
      <div className="modern-dashboard">
        <style>{`
          .modern-dashboard {
            background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
            min-height: 100vh;
            padding: 3rem 2rem;
            margin: -1rem;
          }
          
          .hero-section {
            text-align: center;
            padding: 4rem 2rem;
            margin-bottom: 3rem;
          }
          
          .hero-title {
            font-size: 3.5rem;
            font-weight: 800;
            color: #ffffff;
            line-height: 1.2;
            margin-bottom: 1.5rem;
            letter-spacing: -0.02em;
          }
          
          .hero-subtitle {
            font-size: 1.125rem;
            color: #a0aec0;
            max-width: 800px;
            margin: 0 auto 2rem;
            line-height: 1.6;
          }
          
          .gradient-button {
            background: linear-gradient(135deg, #667eea 0%, #48bb78 100%);
            color: white;
            border: none;
            padding: 1rem 2.5rem;
            font-size: 1.125rem;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }
          
          .gradient-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
          }
          
          .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
          }
          
          .dashboard-card {
            background: rgba(30, 41, 59, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 2rem;
            transition: transform 0.2s, border-color 0.2s;
          }
          
          .dashboard-card:hover {
            transform: translateY(-4px);
            border-color: rgba(102, 126, 234, 0.5);
          }
          
          .card-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 0.75rem;
          }
          
          .card-description {
            color: #a0aec0;
            font-size: 0.975rem;
            margin-bottom: 1.5rem;
            line-height: 1.5;
          }
          
          .card-button {
            background: rgba(102, 126, 234, 0.2);
            color: #8b9eff;
            border: 1px solid rgba(102, 126, 234, 0.3);
            padding: 0.75rem 1.5rem;
            font-size: 0.975rem;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            transition: all 0.2s;
          }
          
          .card-button:hover {
            background: rgba(102, 126, 234, 0.3);
            border-color: rgba(102, 126, 234, 0.5);
            color: #a8b8ff;
          }
          
          .section-title {
            font-size: 1.875rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 1.5rem;
          }
        `}</style>

        <div className="hero-section">
          <h1 className="hero-title">
            Revolutionize Mattress Sales with Advanced AI Insights
          </h1>
          <p className="hero-subtitle">
            Deploy AI assistants across sales channels to engage shoppers, match their needs, and boost conversions beyond price-driven decisions.
          </p>
        </div>

        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 className="section-title">Quick Actions</h2>
          
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3 className="card-title">Catalog</h3>
              <p className="card-description">Index your products for AI recommendations</p>
              <button className="card-button" onClick={() => navigate("/app/admin/catalog-indexing")}>
                Manage Catalog
              </button>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">Prompts</h3>
              <p className="card-description">Customize AI behavior and responses</p>
              <button className="card-button" onClick={() => navigate("/app/admin/prompt-builder")}>
                Build Prompts
              </button>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">Analytics</h3>
              <p className="card-description">Track conversations and conversions</p>
              <button className="card-button" onClick={() => navigate("/app/admin/analytics-dashboard")}>
                View Analytics
              </button>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">Leads</h3>
              <p className="card-description">Manage customer inquiries</p>
              <button className="card-button" onClick={() => navigate("/app/admin/leads-management")}>
                View Leads
              </button>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">Experiments</h3>
              <p className="card-description">A/B test prompts and recommendations</p>
              <button className="card-button" onClick={() => navigate("/app/admin/experiments")}>
                Run Experiments
              </button>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">Plans</h3>
              <p className="card-description">View usage and upgrade options</p>
              <button className="card-button" onClick={() => navigate("/app/admin/plans")}>
                Manage Plan
              </button>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">Getting Started</h3>
              <div className="card-description">
                <div style={{ textAlign: 'left' }}>
                  <div style={{ marginBottom: '0.5rem' }}>1. Index your product catalog</div>
                  <div style={{ marginBottom: '0.5rem' }}>2. Customize your AI prompts</div>
                  <div style={{ marginBottom: '0.5rem' }}>3. Enable the theme extension</div>
                  <div style={{ marginBottom: '0.5rem' }}>4. Test on your storefront</div>
                </div>
              </div>
              <button className="card-button" onClick={() => window.open("https://docs.mattressai.com", "_blank")}>
                View Documentation
              </button>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">Alerts</h3>
              <p className="card-description">Monitor system health and notifications</p>
              <button className="card-button" onClick={() => navigate("/app/admin/alerts-management")}>
                View Alerts
              </button>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
