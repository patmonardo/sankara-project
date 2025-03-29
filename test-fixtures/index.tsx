import React from 'react';
import { createRoot } from 'react-dom/client';
import { TestFixtureApp } from './TestFixtureApp';

}
import React from 'react';
import { Dashboard } from '../../ui/graphics/dashboard/Dashboard';
import { Form } from '../../ui/graphics/form/Form';
import { Card } from '../../ui/graphics/card/Card';
import { List } from '../../ui/graphics/list/List';

// Only mount in development or test environments
if (process.env.NODE_ENV !== 'production') {
  const container = document.getElementById('test-fixture-root');
  if (container) {
    const root = createRoot(container);
    root.render(<TestFixtureApp />);
  }

interface FixtureRendererProps {
  fixture: any; // Type this properly based on your fixture structure
}

export function FixtureRenderer({ fixture }: FixtureRendererProps) {
  const { schema, data, demos } = fixture;

  return (
    <div className="fixture-renderer">
      <h2>{fixture.name}</h2>
      <p>{fixture.description}</p>

      <div className="demo-components">
        {demos.dashboard?.active && (
          <div className="demo-section">
            <h3>Dashboard Demo</h3>
            <Dashboard
              schema={schema.dashboards['philosophy_dashboard']}
              data={data}
              initialState={demos.dashboard.initialState}
            />
          </div>
        )}

        {demos.form?.active && (
          <div className="demo-section">
            <h3>Form Demo</h3>
            <Form
              schema={schema.forms[`${demos.form.entityType}_form`]}
              initialValues={demos.form.initialValues}
            />
          </div>
        )}

        {/* Add more component demos as needed */}
      </div>
    </div>
  );
}
