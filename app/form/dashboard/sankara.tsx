import { Suspense } from 'react';
import { SankaraDashboardModel } from '@/lib/model/sankara/dashboard';
import { SankaraView } from '@/ui/view/sankara';
import StatCard from '@/form/card/stat-card';
import ConceptCloud from '@/form/visualization/concept-cloud';
import RecentExplorations from '@/form/list/recent-explorations';
import DashboardSkeleton from './loading';

export default async function SankaraDashboard() {
  // Fetch data for dashboard
  const stats = await SankaraDashboardModel.getCorpusStats();
  const conceptFrequency = await SankaraDashboardModel.getConceptFrequency(50);
  const recentExplorations = await SankaraDashboardModel.getRecentExplorations(5);

  // Format data for display
  const formattedStats = SankaraView.formatCorpusStats(stats);
  const formattedConcepts = SankaraView.formatConceptFrequency(conceptFrequency);

  return (
    <main className="sankara-dashboard">
      <h1 className="dashboard-title">Sankara Knowledge Explorer</h1>

      <div className="stats-container">
        <StatCard
          title="Texts"
          value={formattedStats.texts.value}
          label={formattedStats.texts.label}
          icon="document"
        />
        <StatCard
          title="Concepts"
          value={formattedStats.concepts.value}
          label={formattedStats.concepts.label}
          icon="lightbulb"
        />
        <StatCard
          title="Relations"
          value={formattedStats.relations.value}
          label={formattedStats.relations.label}
          icon="connection"
        />
        <StatCard
          title="Explorations"
          value={formattedStats.explorations.value}
          label={formattedStats.explorations.label}
          icon="search"
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-item concept-cloud-container">
          <Suspense fallback={<div className="loading-item">Loading concept cloud...</div>}>
            <ConceptCloud
              concepts={formattedConcepts}
              maxConcepts={50}
            />
          </Suspense>
        </div>

        <div className="dashboard-item recent-explorations-container">
          <RecentExplorations
            explorations={recentExplorations}
            maxItems={5}
          />
        </div>
      </div>

      <div className="dashboard-footer">
        <p>Sankara Knowledge Base - Spring 2025</p>
      </div>
    </main>
  );
}
