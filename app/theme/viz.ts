// /ui/theme/viz.ts
import { md } from './token';

export const viz = {
  // Base visualization container styles
  container: {
    base: `w-full bg-white ${md.elevation.level1} ${md.shape.medium} p-4 overflow-hidden`,
    small: 'h-[300px]',
    medium: 'h-[400px]',
    large: 'h-[600px]',
    full: 'h-full min-h-[500px]',
  },

  // Color scales for different visualization types
  colors: {
    sequential: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    diverging: ['#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'],
    categorical: ['#6750A4', '#625B71', '#7D5260', '#9A82DB', '#B58392', '#7A7289'],
  },

  // Text styling for visualization elements
  text: {
    title: `${md.type.title} mb-4`,
    axisLabel: 'text-xs font-medium fill-gray-600',
    dataLabel: 'text-xs font-medium fill-gray-800',
    tooltip: 'text-sm font-medium bg-gray-800 text-white px-2 py-1 rounded shadow-lg',
  },

  // Knowledge domain-specific visualization elements
  knowledge: {
    conceptNode: `fill-[${md.color.knowledge.concept}]`,
    textNode: `fill-[${md.color.knowledge.text}]`,
    relationEdge: `stroke-[${md.color.knowledge.relation}]`,
    definitionEdge: `stroke-[${md.color.relation.defines}]`,
    containmentEdge: `stroke-[${md.color.relation.contains}]`,
  },

  // Responsive sizing helpers
  responsive: {
    svgContainer: 'w-full h-full',
    preserveAspect: 'overflow-visible',
    fullWidth: 'w-full',
  },

  // Animation and transition effects
  animation: {
    fadeIn: 'transition-opacity duration-500 ease-in-out',
    grow: 'transition-all duration-300 ease-out',
    highlight: 'transition-colors duration-200',
  },
};
