
/**
 * Example usage - Sanskrit Philosophy Knowledge Schema
 */
/*
export const EXAMPLE_SCHEMA = defineFormSchema(
  "Sanskrit Philosophy Knowledge Graph",
  "A comprehensive schema for exploring Sanskrit philosophical texts and concepts"
)
  .domain(
    "Sanskrit Philosophy",
    "Vedantic and related philosophical traditions"
  )
  .entity("concept", {
    name: "Concept",
    description: "A philosophical concept or term",
    type: "knowledge_entity",
    schema: {
      name: { type: "string", required: true },
      sanskrit_term: { type: "string", required: true },
      definition: { type: "string", required: true },
      category: { type: "string", required: false },
    },
    mapping: {
      storage: "concepts",
      primaryKey: "id",
      fields: {
        name: "name",
        sanskrit_term: "original_term",
        definition: "definition",
        category: "category",
      },
    },
  })
  .entity("text", {
    name: "Text",
    description: "A philosophical text or scripture",
    type: "knowledge_entity",
    schema: {
      title: { type: "string", required: true },
      author: { type: "string", required: false },
      period: { type: "string", required: false },
      tradition: { type: "string", required: false },
      language: { type: "string", required: false },
    },
    mapping: {
      storage: "texts",
      primaryKey: "id",
    },
  })
  .relation("defines", {
    name: "Defines",
    description: "A text defines a concept",
    source: "text",
    target: "concept",
    type: "semantic",
    properties: {
      clarity: { type: "number", min: 0, max: 5 },
      context: { type: "string" },
    },
    mapping: {
      storage: "text_concept_relations",
      sourceKey: "text_id",
      targetKey: "concept_id",
    },
  })
  .form("concept_form", {
    fields: [
      {
        id: "name",
        type: "text",
        label: "Concept Name",
        required: true,
      },
      {
        id: "sanskrit_term",
        type: "text",
        label: "Sanskrit Term",
        required: true,
      },
      {
        id: "definition",
        type: "textarea",
        label: "Definition",
        required: true,
      },
      {
        id: "category",
        type: "select",
        label: "Category",
        required: false,
        options: [
          { label: "Metaphysics", value: "metaphysics" },
          { label: "Epistemology", value: "epistemology" },
          { label: "Ethics", value: "ethics" },
        ],
      },
    ],
    layout: {
      title: "Concept Definition",
      columns: "single",
      actions: [
        {
          id: "submit",
          type: "submit",
          label: "Save Concept",
          variant: "primary",
        },
        {
          id: "reset",
          type: "reset",
          label: "Reset",
          variant: "secondary",
        },
      ],
    },
    state: {
      status: "idle",
    },
  })
  .card("concept_card", {
    type: "card",
    fields: [
      {
        id: "name",
        type: "text",
        label: "Name",
        required: true,
      },
      {
        id: "sanskrit_term",
        type: "text",
        label: "Sanskrit Term",
        required: true,
      },
      {
        id: "definition",
        type: "textarea",
        label: "Definition",
        required: true,
      },
    ],
    layout: {
      title: "Concept",
      headerField: "name",
      subheaderField: "sanskrit_term",
      bodyField: "definition",
    },
    state: {
      status: "idle",
    },
  })
  .list("concepts_list", {
    type: "list",
    layout: {
      title: "Philosophical Concepts",
      columns: "single",
      actions: [],
    },
    items: [],
    navigation: {
      search: true,
      pagination: true,
      filter: true,
      sort: true,
    },
  })
  .dashboard("philosophy_dashboard", {
    type: "dashboard",
    layout: {
      title: "Sanskrit Philosophy Explorer",
      description: "Explore the key concepts and texts of Sanskrit philosophy",
      gridColumns: 12,
    },
    components: [
      {
        id: "concepts-count",
        type: "stat-card",
        title: "Concepts",
        position: { x: 0, y: 0, w: 3, h: 1 },
        value: 0,
        label: "philosophical concepts",
        icon: "concept",
      },
      {
        id: "texts-count",
        type: "stat-card",
        title: "Texts",
        position: { x: 3, y: 0, w: 3, h: 1 },
        value: 0,
        label: "philosophical texts",
        icon: "text",
      },
      {
        id: "concept-cloud",
        type: "concept-cloud",
        title: "Concept Cloud",
        position: { x: 0, y: 1, w: 8, h: 2 },
      },
      {
        id: "recent-texts",
        type: "container",
        title: "Recent Texts",
        position: { x: 8, y: 1, w: 4, h: 2 },
      },
    ],
  })
  .path({
    name: "Journey Through Vedanta",
    description: "A guided exploration of key Vedantic concepts",
    steps: [
      {
        target: "brahman_card",
        type: "card",
        transition: {
          type: "slide",
          properties: { direction: "right" },
        },
      },
      {
        target: "atman_card",
        type: "card",
        transition: {
          type: "fade",
        },
      },
      {
        target: "brahman_atman_relation",
        type: "link",
        transition: {
          type: "zoom",
        },
      },
      {
        target: "vedanta_concepts_list",
        type: "list",
      },
    ],
    context: {
      purpose: "To understand the core metaphysical principles of Vedanta",
      audience: "Philosophy students",
      prerequisites: ["Basic understanding of Hindu philosophy"],
    },
  })
  .template({
    name: "Philosophical Concept",
    description: "Template for creating philosophical concept cards",
    type: "card",
    definition: {
      type: "card",
      fields: [
        {
          id: "name",
          type: "text",
          label: "Name",
          required: true,
        },
        {
          id: "sanskrit_term",
          type: "text",
          label: "Sanskrit Term",
          required: true,
        },
        {
          id: "definition",
          type: "textarea",
          label: "Definition",
          required: true,
        },
      ],
      layout: {
        title: "{{params.title}}",
        headerField: "name",
        subheaderField: "sanskrit_term",
        bodyField: "definition",
      },
      state: {
        status: "idle",
      },
    },
    parameters: {
      title: {
        type: "string",
        description: "Card title",
        default: "Philosophical Concept",
      },
    },
  })
  .rule({
    name: "Brahman-Atman Identity Rule",
    description: "In Advaita Vedanta, Brahman and Atman are identical",
    condition:
      'entity.type === "concept" && (entity.name === "Brahman" || entity.name === "Atman")',
    action:
      'highlight("This concept is part of the fundamental non-duality principle")',
    priority: 10,
  })
  .metadata({
    version: "1.0.0",
    author: "Sanskrit Knowledge Explorer Team",
    license: "MIT",
    dependencies: {
      zod: "^3.0.0",
    },
  })
  .build();

// Export utilities and types
export {
  FormMatterSchema,
  FormFieldSchema,
  FormShapeSchema,
  CardShapeSchema,
  ListShapeSchema,
  LinkShapeSchema,
  TableShapeSchema,
  DashboardShapeSchema,
};
*/
