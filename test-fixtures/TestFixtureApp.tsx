import React, { useState } from 'react';
import { SankaraProvider } from '../lib/context';
import { ExampleSelector } from './components/ExampleSelector';
import { FixtureRenderer } from './components/FixtureRenderer';
import { CodeViewer } from './components/CodeViewer';
import { fixtures } from './fixtures';

export function TestFixtureApp() {
  const [selectedFixture, setSelectedFixture] = useState<string>(
    Object.keys(fixtures)[0]
  );

  return (
    <SankaraProvider>
      <div className="test-fixture-app">
        <header className="fixture-header">
          <h1>Sankara Test Fixtures</h1>
          <ExampleSelector
            fixtures={fixtures}
            selected={selectedFixture}
            onSelect={setSelectedFixture}
          />
        </header>

        <main className="fixture-content">
          <section className="fixture-preview">
            <FixtureRenderer fixture={fixtures[selectedFixture]} />
          </section>

          <section className="fixture-code">
            <CodeViewer fixture={fixtures[selectedFixture]} />
          </section>
        </main>
      </div>
    </SankaraProvider>
  );
}
