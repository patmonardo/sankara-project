// /app/test/cards/page.tsx
import React from 'react';
import CardForm from '@/ui/graphics/card/card';
import StatCardForm from '@/ui/graphics/card/stat';
import ContainerCardForm from '@/ui/graphics/card/container';
import { md } from '@/ui/theme/token';

export default function TestCardsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className={md.type.display}>Card Component Tests</h1>

      <section className="mt-8">
        <h2 className={md.type.headline}>Basic Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          <CardForm
            layout={{
              title: "Basic Card",
              description: "This is a simple card with just text content",
              type: "default",
            }}
          />

          <CardForm
            layout={{
              title: "Primary Card",
              description: "This card uses the primary color scheme",
              type: "primary",
              icon: "concept",
            }}
          />

          <CardForm
            layout={{
              title: "Interactive Card",
              description: "Click me to trigger an action",
              type: "secondary",
              onClick: () => alert("Card clicked!"),
            }}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className={md.type.headline}>Stat Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <StatCardForm
            layout={{
              title: "Total Users",
              value: "1,234",
              type: "primary",
              trend: "up",
              change: 12,
              description: "from previous month",
            }}
            stats={{
              previousValue: "1,102",
              timeframe: "Jan 2025",
            }}
          />

          <StatCardForm
            layout={{
              title: "Completion Rate",
              value: "68%",
              type: "success",
              highlighted: true,
            }}
            stats={{
              goalValue: "80%",
              goalProgress: 68,
            }}
          />

          <StatCardForm
            layout={{
              title: "Active Sessions",
              value: "42",
              type: "info",
              compact: true,
              trend: "down",
              change: 8,
            }}
            stats={{
              showSparkline: true,
            }}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className={md.type.headline}>Container Cards</h2>
        <div className="mt-4">
          <ContainerCardForm
            layout={{
              title: "Grid Container",
              description: "A grid of cards in a container",
            }}
            container={{
              items: [
                <CardForm key="1" layout={{ title: "Card 1", description: "Description 1" }} />,
                <CardForm key="2" layout={{ title: "Card 2", description: "Description 2" }} />,
                <CardForm key="3" layout={{ title: "Card 3", description: "Description 3" }} />,
                <CardForm key="4" layout={{ title: "Card 4", description: "Description 4" }} />,
              ],
              layout: "grid",
              columns: 2,
              gap: 4,
            }}
          />
        </div>
      </section>
    </div>
  );
}
