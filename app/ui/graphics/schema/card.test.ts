import { describe, it, expect } from 'vitest';
import { defineCard, defineEntityCard, defineStatCard, defineContainerCard } from './card';

describe('CardSchemaBuilder', () => {
  it('should create a basic card', () => {
    const card = defineCard('Basic Card', 'A simple card')
      .value('Card value')
      .build();

    expect(card.title).toBe('Basic Card');
    expect(card.description).toBe('A simple card');
    expect(card.layout.value).toBe('Card value');
  });

  it('should create an entity card', () => {
    const card = defineEntityCard('concept', 'Brahman', 'The ultimate reality')
      .value('ब्रह्मन्')
      .build();

    expect(card.title).toBe('Brahman');
    expect(card.entity).toBe('concept');
    expect(card.layout.type).toBe('concept');
  });

  it('should create a stat card', () => {
    const card = defineStatCard('User Growth', 25, {
      label: 'percent',
      trend: 'up',
      change: 5
    }).build();

    expect(card.layout.value).toBe(25);
    expect(card.layout.label).toBe('percent');
    expect(card.layout.trend).toBe('up');
    expect(card.layout.change).toBe(5);
  });

  it('should add sections to organize fields', () => {
    const card = defineCard('Sectioned Card')
      .value('Card with sections')
      .section('Section 1', ['field1', 'field2'], 'First section')
      .section('Section 2', ['field3', 'field4'])
      .build();

    expect(card.layout.sections).toHaveLength(2);
    expect(card.layout.sections?.[0].title).toBe('Section 1');
    expect(card.layout.sections?.[0].description).toBe('First section');
    expect(card.layout.sections?.[0].fields).toEqual(['field1', 'field2']);
    expect(card.layout.sections?.[1].fields).toEqual(['field3', 'field4']);
  });

  it('should add actions to cards', () => {
    const card = defineCard('Action Card')
      .value('Card with actions')
      .action({
        label: 'Edit',
        action: 'edit',
        target: 'edit_form',
        icon: 'pencil',
        variant: 'primary'
      })
      .action({
        label: 'Delete',
        action: 'delete',
        icon: 'trash',
        variant: 'ghost'
      })
      .build();

    expect(card.actions).toHaveLength(2);
    expect(card.actions?.[0].label).toBe('Edit');
    expect(card.actions?.[0].target).toBe('edit_form');
    expect(card.layout.actions).toHaveLength(2);
    expect(card.layout.actions?.[1].label).toBe('Delete');
    expect(card.layout.actions?.[1].variant).toBe('ghost');
  });

  it('should create a container card', () => {
    const card = defineContainerCard('Dashboard Container', 'Analytics overview')
      .asContainer({
        elevated: true,
        bordered: true,
        padding: true
      })
      .build();

    expect(card.title).toBe('Dashboard Container');
    expect(card.layout.subtitle).toBe('Analytics overview');
    expect(card.layout.elevated).toBe(true);
    expect(card.layout.bordered).toBe(true);
    expect(card.layout.padding).toBe(true);
  });

  it('should throw an error when required fields are missing', () => {
    const builder = new CardSchemaBuilder('');
    expect(() => builder.build()).toThrow('Card title is required');
  });
});
