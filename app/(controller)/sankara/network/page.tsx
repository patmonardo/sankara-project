import { Suspense } from 'react';
import { SankaraModel } from '@/lib/model/sankara';
import { SankaraView } from '@/ui/view/sankara';
import ConceptNetwork from '@/ui/graphics/concept/network';

export default async function ConceptNetworkPage() {
  // Controller fetches data
  const networkData = await SankaraModel.getConceptNetwork();

  // View formats data for presentation
  const formattedNetwork = SankaraView.formatConceptNetwork(networkData);

  return (
    <div className="concept-network-page">
      <h2>Sankara Corpus Concept Network</h2>

      <Suspense fallback={<div>Loading network visualization...</div>}>
        <ConceptNetwork
          nodes={formattedNetwork.nodes}
          links={formattedNetwork.links}
          width={900}
          height={700}
          onNodeSelect={(nodeId) => {
            // This will be handled client-side with a useCallback
            console.log(`Selected node: ${nodeId}`);
          }}
        />
      </Suspense>
    </div>
  );
}
