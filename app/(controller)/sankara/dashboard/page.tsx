import { SankaraModel } from '@/lib/model/sankara';
import StatCard from '@/ui/graphics/card/stat';
import ContainerCard from '@/ui/graphics/card/container';
import { DEFAULT_DASHBOARD } from '@/ui/graphics/schema/dashboard';
import Link from 'next/link';

export default async function SankaraDashboardPage() {
  // Get corpus statistics
  const stats = await SankaraModel.getCorpusStats();

  // Update the default dashboard with real stats
  const dashboard = {
    ...DEFAULT_DASHBOARD,
    components: DEFAULT_DASHBOARD.components.map(component => {
      if (component.type === 'stat-card') {
        if (component.id === 'texts-stat') {
          return { ...component, value: stats.textCount };
        } else if (component.id === 'concepts-stat') {
          return { ...component, value: stats.conceptCount };
        } else if (component.id === 'relations-stat') {
          return { ...component, value: stats.relationCount };
        } else if (component.id === 'explorations-stat') {
          return { ...component, value: stats.explorationCount };
        }
      }
      return component;
    })
  };

  // Get concepts for concept cloud
  const concepts = await SankaraModel.getConceptFrequency(100);

  // Get explorations for list
  const explorations = await SankaraModel.getRecentExplorations(5);

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{dashboard.title}</h1>
        {dashboard.description && (
          <p className="text-gray-600 mt-2">{dashboard.description}</p>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {dashboard.components
          .filter(component => component.type === 'stat-card')
          .map(component => (
            <StatCard
              key={component.id}
              title={component.title || ''}
              value={component.value}
              label={component.label}
              icon={component.icon}
              type={component.color as any}
              highlighted
            />
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <ContainerCard
          title="Key Concepts"
          className="lg:col-span-2"
          headerAction={
            <Link href="/sankara/concepts" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          }
        >
          <div className="h-80 flex items-center justify-center bg-gray-100 rounded-lg">
            {concepts.length === 0 ? (
              <p>No concepts found</p>
            ) : (
              <p>Concept Cloud: {concepts.length} concepts available</p>
              // We'll implement the actual visualization later
            )}
          </div>
        </ContainerCard>

        <ContainerCard
          title="Recent Explorations"
          headerAction={
            <Link href="/sankara/explorations" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          }
        >
          {explorations.length === 0 ? (
            <div className="h-80 flex items-center justify-center bg-gray-100 rounded-lg">
              <p>No explorations found</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {explorations.map(exploration => (
                <li key={exploration.id} className="py-3">
                  <Link href={`/sankara/exploration/${exploration.id}`} className="block hover:bg-gray-50 -m-3 p-3 rounded">
                    <h3 className="font-medium text-gray-900">{exploration.title}</h3>
                    {exploration.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{exploration.description}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ContainerCard>
      </div>
    </main>
  );
}
