import { describe, it, expect } from 'vitest';
import {
  
} from './schema';

describe('FormSchemaBuilder', () => {
  // Test basic schema creation
  it('should create a basic schema with minimal configuration', () => {
    const schema = defineFormSchema('Test Schema', 'A test schema')
      .domain('Testing Domain', 'For testing purposes')
      .build();

    expect(schema.name).toBe('Test Schema');
    expect(schema.description).toBe('A test schema');
    expect(schema.domain.name).toBe('Testing Domain');
    expect(schema.domain.description).toBe('For testing purposes');
    expect(schema.meta.version).toBe('1.0.0');
    expect(schema.meta.created).toBeInstanceOf(Date);
  });

  // Test adding an entity
  it('should correctly add an entity to the schema', () => {
    const schema = defineFormSchema('Test Schema')
      .domain('Testing Domain')
      .entity('concept', {
        name: 'Concept',
        description: 'A philosophical concept',
        type: 'knowledge_entity',
        schema: {
          name: { type: 'string', required: true },
          definition: { type: 'string', required: true }
        },
        mapping: {
          storage: 'concepts',
          primaryKey: 'id',
          fields: {
            name: 'name',
            definition: 'definition'
          }
        }
      })
      .build();

    expect(schema.entities.concept).toBeDefined();
    expect(schema.entities.concept.name).toBe('Concept');
    expect(schema.entities.concept.mapping.storage).toBe('concepts');
  });

  // Test adding a form
  it('should correctly add a form to the schema', () => {
    const schema = defineFormSchema('Test Schema')
      .domain('Testing Domain')
      .form('concept_form', {
        title: 'Concept Form',
        description: 'A form for creating concepts',
        entity: 'concept',
        layout: {
          type: 'vertical',
          sections: [
            {
              title: 'Basic Information',
              fields: ['name', 'definition']
            }
          ]
        },
        fields: {
          name: {
            label: 'Name',
            type: 'text',
            required: true
          },
          definition: {
            label: 'Definition',
            type: 'textarea',
            required: true
          }
        }
      })
      .build();

    expect(schema.forms.concept_form).toBeDefined();
    expect(schema.forms.concept_form.title).toBe('Concept Form');
    expect(schema.forms.concept_form.fields.name.type).toBe('text');
  });

  // Test adding a relation
  it('should correctly add a relation to the schema', () => {
    const schema = defineFormSchema('Test Schema')
      .domain('Testing Domain')
      .relation('concept_hierarchy', {
        name: 'Concept Hierarchy',
        description: 'Hierarchical relationship between concepts',
        source: 'concept',
        target: 'concept',
        type: 'hierarchy',
        properties: {
          relation_type: { type: 'string', enum: ['broader', 'narrower'] }
        },
        mapping: {
          storage: 'concept_relations',
          sourceKey: 'parent_id',
          targetKey: 'child_id'
        }
      })
      .build();

    expect(schema.relations.concept_hierarchy).toBeDefined();
    expect(schema.relations.concept_hierarchy.source).toBe('concept');
    expect(schema.relations.concept_hierarchy.target).toBe('concept');
  });

  // Test validation error handling
  it('should throw an error if required fields are missing', () => {
    const builder = new FormSchemaBuilder('');
    expect(() => builder.build()).toThrow();
  });

  // Test creating a more complex schema
  it('should create a complex schema with multiple components', () => {
    const schema = defineFormSchema('Sanskrit Philosophy')
      .domain('Sanskrit Philosophy', 'Vedantic and related philosophical traditions')
      .entity('concept', {
        name: 'Concept',
        description: 'A philosophical concept',
        type: 'knowledge_entity',
        schema: {
          name: { type: 'string', required: true },
          sanskrit_term: { type: 'string', required: true }
        },
        mapping: {
          storage: 'concepts',
          primaryKey: 'id',
          fields: {
            name: 'name',
            sanskrit_term: 'original_term'
          }
        }
      })
      .form('concept_form', {
        title: 'Concept Form',
        description: 'A form for creating concepts',
        entity: 'concept',
        layout: {
          type: 'vertical',
          sections: [
            {
              title: 'Basic Information',
              fields: ['name', 'sanskrit_term']
            }
          ]
        },
        fields: {
          name: { label: 'Name', type: 'text', required: true },
          sanskrit_term: { label: 'Sanskrit Term', type: 'text', required: true }
        }
      })
      .card('concept_card', {
        title: 'Concept Card',
        entity: 'concept',
        layout: {
          type: 'vertical',
          sections: [
            {
              title: 'Concept',
              fields: ['name', 'sanskrit_term']
            }
          ]
        },
        actions: [
          { label: 'Edit', action: 'edit', target: 'concept_form' }
        ]
      })
      .build();

    // Test that all components were added
    expect(schema.entities.concept).toBeDefined();
    expect(schema.forms.concept_form).toBeDefined();
    expect(schema.cards.concept_card).toBeDefined();

    // Test relationships between components
    expect(schema.forms.concept_form.entity).toBe('concept');
    expect(schema.cards.concept_card.entity).toBe('concept');
    expect(schema.cards.concept_card.actions[0].target).toBe('concept_form');
  });

  // Test that all collections are initialized in build
  it('should initialize all collections even if empty', () => {
    const schema = defineFormSchema('Test Schema')
      .domain('Test Domain')
      .build();

    expect(schema.entities).toEqual({});
    expect(schema.relations).toEqual({});
    expect(schema.forms).toEqual({});
    expect(schema.cards).toEqual({});
    expect(schema.links).toEqual({});
    expect(schema.lists).toEqual({});
    expect(schema.tables).toEqual({});
    expect(schema.dashboards).toEqual({});
    expect(schema.paths).toEqual({});
    expect(schema.templates).toEqual({});
    expect(schema.rules).toEqual({});
  });
});
// Add these tests to the describe block

it('should allow updating domain information', () => {
  const schema = defineFormSchema('Test Schema')
    .domain('Initial Domain')
    .domain('Updated Domain', 'Updated description')
    .build();

  expect(schema.domain.name).toBe('Updated Domain');
  expect(schema.domain.description).toBe('Updated description');
});

it('should update timestamps when setting metadata', () => {
  const schema = defineFormSchema('Test Schema')
    .domain('Test Domain')
    .metadata({ author: 'Test Author' })
    .build();

  expect(schema.meta.author).toBe('Test Author');
  expect(schema.meta.updated).toBeInstanceOf(Date);

  // Timestamps should be recent
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  expect(schema.meta.updated > fiveMinutesAgo).toBe(true);
});

it('should support adding paths with steps', () => {
  const schema = defineFormSchema('Test Schema')
    .domain('Test Domain')
    .path('learning_path', {
      name: 'Learning Path',
      description: 'A path for learning Sanskrit philosophy',
      steps: [
        {
          target: 'concept_dashboard',
          type: 'dashboard',
          transition: {
            type: 'linear',
            properties: { duration: 500 }
          }
        },
        {
          target: 'concept_form',
          type: 'form'
        }
      ],
      context: {
        purpose: 'Learning Sanskrit philosophy concepts',
        audience: 'Philosophy students',
        prerequisites: ['Basic philosophy knowledge']
      }
    })
    .build();

  expect(schema.paths.learning_path).toBeDefined();
  expect(schema.paths.learning_path.steps.length).toBe(2);
  expect(schema.paths.learning_path.steps[0].target).toBe('concept_dashboard');
  expect(schema.paths.learning_path.context?.purpose).toBe('Learning Sanskrit philosophy concepts');
});

it('should support templates with parameters', () => {
  const schema = defineFormSchema('Test Schema')
    .domain('Test Domain')
    .template('concept_template', {
      name: 'Concept Template',
      description: 'A template for concept cards',
      type: 'card',
      definition: {
        title: '{{name}}',
        layout: {
          type: 'vertical',
          sections: [
            {
              title: '{{section_title}}',
              fields: ['name', 'definition']
            }
          ]
        }
      },
      parameters: {
        name: {
          type: 'string',
          description: 'The name to display',
          default: 'Concept'
        },
        section_title: {
          type: 'string',
          description: 'The section title',
          default: 'Details'
        }
      }
    })
    .build();

  expect(schema.templates.concept_template).toBeDefined();
  expect(schema.templates.concept_template.parameters?.name.default).toBe('Concept');
});

it('should create a comprehensive Sanskrit philosophy schema', () => {
  const schema = defineFormSchema(
    'Sanskrit Philosophy Knowledge Graph',
    'A comprehensive schema for exploring Sanskrit philosophical texts and concepts'
  )
    .domain(
      'Sanskrit Philosophy',
      'Vedantic and related philosophical traditions'
    )
    .metadata({
      version: '1.0.0',
      author: 'Sankara Project',
      license: 'MIT'
    })
    .entity('concept', {
      name: 'Concept',
      description: 'A philosophical concept or term',
      type: 'knowledge_entity',
      schema: {
        name: { type: 'string', required: true },
        sanskrit_term: { type: 'string', required: true },
        definition: { type: 'string', required: true },
        category: { type: 'string', required: false },
      },
      mapping: {
        storage: 'concepts',
        primaryKey: 'id',
        fields: {
          name: 'name',
          sanskrit_term: 'original_term',
          definition: 'definition',
          category: 'category',
        },
      },
    })
    .entity('text', {
      name: 'Text',
      description: 'A philosophical text or scripture',
      type: 'knowledge_entity',
      schema: {
        title: { type: 'string', required: true },
        sanskrit_title: { type: 'string', required: true },
        description: { type: 'string', required: true },
        period: { type: 'string', required: false },
      },
      mapping: {
        storage: 'texts',
        primaryKey: 'id',
        fields: {
          title: 'title',
          sanskrit_title: 'original_title',
          description: 'description',
          period: 'time_period',
        },
      },
    })
    .relation('text_concept', {
      name: 'Text-Concept Relation',
      description: 'Relationship between texts and concepts',
      source: 'text',
      target: 'concept',
      type: 'reference',
      properties: {
        context: { type: 'string' },
        importance: { type: 'number' },
      },
      mapping: {
        storage: 'text_concept_relations',
        sourceKey: 'text_id',
        targetKey: 'concept_id',
      },
    })
    .form('concept_form', {
      title: 'Concept Form',
      description: 'Form for creating and editing philosophical concepts',
      entity: 'concept',
      layout: {
        type: 'vertical',
        sections: [
          {
            title: 'Basic Information',
            fields: ['name', 'sanskrit_term', 'category'],
          },
          {
            title: 'Description',
            fields: ['definition'],
          },
        ],
      },
      fields: {
        name: {
          label: 'Name',
          type: 'text',
          required: true,
          help: 'Enter the English name of the concept',
        },
        sanskrit_term: {
          label: 'Sanskrit Term',
          type: 'text',
          required: true,
          help: 'Enter the original Sanskrit term',
        },
        category: {
          label: 'Category',
          type: 'select',
          options: [
            { value: 'metaphysics', label: 'Metaphysics' },
            { value: 'epistemology', label: 'Epistemology' },
            { value: 'ethics', label: 'Ethics' },
            { value: 'logic', label: 'Logic' },
            { value: 'soteriology', label: 'Soteriology' },
          ],
          help: 'Select the philosophical category',
        },
        definition: {
          label: 'Definition',
          type: 'textarea',
          required: true,
          help: 'Provide a comprehensive definition',
        },
      },
    })
    .card('concept_card', {
      title: 'Concept Card',
      entity: 'concept',
      layout: {
        type: 'vertical',
        sections: [
          {
            title: 'Term',
            fields: ['name', 'sanskrit_term', 'category'],
          },
          {
            title: 'Meaning',
            fields: ['definition'],
          },
        ],
      },
      actions: [
        { label: 'Edit', action: 'edit', target: 'concept_form' },
        { label: 'View Texts', action: 'navigate', target: 'concept_texts_list' },
      ],
    })
    .list('concept_list', {
      title: 'Sanskrit Philosophical Concepts',
      entity: 'concept',
      layout: {
        type: 'grid',
        itemComponent: 'concept_card',
        filters: ['category'],
        sorting: [
          { field: 'name', label: 'Name (A-Z)' },
          { field: 'category', label: 'Category' },
        ],
      },
      actions: [
        { label: 'New Concept', action: 'create', target: 'concept_form' },
      ],
    })
    .dashboard('philosophy_dashboard', {
      title: 'Sanskrit Philosophy Explorer',
      description: 'Explore Sanskrit philosophical concepts and texts',
      layout: {
        type: 'responsive',
        panels: [
          {
            title: 'Concepts',
            component: 'concept_list',
            width: 'half',
            position: { x: 0, y: 0 },
          },
          {
            title: 'Texts by Period',
            component: 'texts_by_period_chart',
            width: 'half',
            position: { x: 1, y: 0 },
          },
          {
            title: 'Concept Network',
            component: 'concept_network_graph',
            width: 'full',
            position: { x: 0, y: 1 },
          },
        ],
      },
    })
    .build();

  // Comprehensive validation
  expect(schema.name).toBe('Sanskrit Philosophy Knowledge Graph');
  expect(Object.keys(schema.entities).length).toBe(2);
  expect(Object.keys(schema.relations).length).toBe(1);
  expect(Object.keys(schema.forms).length).toBe(1);
  expect(Object.keys(schema.cards).length).toBe(1);
  expect(Object.keys(schema.lists).length).toBe(1);
  expect(Object.keys(schema.dashboards).length).toBe(1);

  // Validate relationships
  expect(schema.relations.text_concept.source).toBe('text');
  expect(schema.relations.text_concept.target).toBe('concept');

  // Validate dashboard structure
  expect(schema.dashboards.philosophy_dashboard.layout.panels.length).toBe(3);

  // Validate form fields
  expect(Object.keys(schema.forms.concept_form.fields).length).toBe(4);
  expect(schema.forms.concept_form.fields.category.type).toBe('select');
  expect(schema.forms.concept_form.fields.category.options?.length).toBe(5);
});
