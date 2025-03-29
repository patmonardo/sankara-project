import { md } from "./token";
import { sanskrit } from "./token/sanskrit";

export const kb = {
  // Card helpers for different knowledge entity types
  card: {
    // Base card styling
    base: `bg-white overflow-hidden transition-all duration-200`,

    // Concept card
    concept: (elevation: keyof typeof md.elevation = "level2") => `
      ${md.elevation[elevation]}
      ${md.shape.medium}
      ${md.card.concept}
    `,

    // Text card (for Sanskrit texts)
    text: (elevation: keyof typeof md.elevation = "level1") => `
      ${md.elevation[elevation]}
      ${md.shape.medium}
      ${md.card.text}
    `,

    // Relation card (showing connections between concepts)
    relation: (elevation: keyof typeof md.elevation = "level1") => `
      ${md.elevation[elevation]}
      ${md.shape.medium}
      ${md.card.relation}
    `,

    // Exploration card (for user-guided exploration)
    exploration: (elevation: keyof typeof md.elevation = "level2") => `
      ${md.elevation[elevation]}
      ${md.shape.medium}
      ${md.card.exploration}
    `,
  },

  // Sanskrit text display helpers
  sanskrit: {
    // Container for Sanskrit text
    container: `
      ${sanskrit.backgrounds.parchment}
      ${sanskrit.borders.manuscript}
      px-4 py-3 my-4 text-center
    `,

    // Primary Sanskrit text
    primary: `${md.type.sanskrit} text-[#6750A4] mb-1`,

    // Transliteration of Sanskrit
    transliteration: `${md.type.transliteration} text-[#625B71] mb-2`,

    // Citation or reference
    citation: `${md.type.reference} text-right mt-2 italic`,

    // Formatting for sutras (aphorisms)
    sutra: sanskrit.containers.sutra,

    // Formatting for bhashyas (commentaries)
    bhashya: sanskrit.containers.bhashya,

    // Formatting for tikas (sub-commentaries)
    tika: sanskrit.containers.tika,
  },

  // Connection visualization helpers
  connection: {
    // Container for showing relationships
    container: `${md.pattern.knowledge.connection} my-4 bg-gray-50`,

    // Relationship types
    contains: `border-[${md.color.relation.contains}]`,
    defines: `border-[${md.color.relation.defines}]`,
    opposes: `border-[${md.color.relation.opposes}]`,
    enhances: `border-[${md.color.relation.enhances}]`,

    // Labels for connections
    label: `text-xs font-medium px-2 py-1 rounded-full`,
  },

  // Badge styles for different entity types
  badge: {
    concept: `bg-[${md.color.knowledge.concept}]/20 text-[${md.color.primary.main}] ${md.shape.full} px-2 py-1 text-xs`,
    text: `bg-[${md.color.knowledge.text}]/20 text-[${md.color.secondary.main}] ${md.shape.full} px-2 py-1 text-xs`,
    relation: `bg-[${md.color.knowledge.relation}]/20 text-emerald-700 ${md.shape.full} px-2 py-1 text-xs`,
    exploration: `bg-[${md.color.knowledge.exploration}]/20 text-amber-700 ${md.shape.full} px-2 py-1 text-xs`,
  },

  // Section formatting
  section: {
    // Standard section
    standard: `mb-6`,

    // Section title
    title: `${md.type.label} mb-2 text-[${md.color.primary.main}]`,

    // Field layout
    field: `flex mb-2`,

    // Field label
    label: `w-1/3 text-sm font-medium text-[${md.color.outline}]`,

    // Field value
    value: `w-2/3 text-sm`,
  },
  // Add button helpers
  button: {
    base: `px-4 py-1.5 text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors`,
    primary: `bg-[${md.color.primary.main}] text-white hover:bg-[${md.color.primary.main}]/90`,
    secondary: `border border-[${md.color.outline}] text-[${md.color.primary.main}] hover:bg-[${md.color.primary.container}]/10`,
    text: `text-[${md.color.primary.main}] hover:bg-[${md.color.primary.container}]/10`,
  },
};
