import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { mdTokens } from '@/ui/theme/token/tokens';
import { kb } from '@/ui/theme/kb';

interface Entity {
  id: string;
  name: string;
  type: 'concept' | 'text' | 'person' | 'school';
  group?: string;
}

interface Relationship {
  source: string; // Entity id
  target: string; // Entity id
  type: string;   // Type of relationship
  strength: number; // 1-10 representing strength of connection
}

interface RelationshipCirclesProps {
  entities: Entity[];
  relationships: Relationship[];
  className?: string;
  onEntityClick?: (id: string) => void;
}

export function RelationshipCircles({
  entities,
  relationships,
  className = '',
  onEntityClick
}: RelationshipCirclesProps) {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Responsive sizing effect
  useEffect(() => {
    if (!svgRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    resizeObserver.observe(svgRef.current.parentElement);
    return () => resizeObserver.disconnect();
  }, []);

  // D3 rendering effect
  useEffect(() => {
    if (!svgRef.current || !entities || !relationships || !dimensions.width) return;

    // Clear previous rendering
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const width = dimensions.width;
    const height = dimensions.height;
    const radius = Math.min(width, height) / 2 - 120;

    // Create a map of entity IDs to their objects for easy lookup
    const entityMap = new Map(entities.map(e => [e.id, e]));

    // Group entities by their group property
    const groupedEntities = d3.group(entities, d => d.group || 'default');

    // Create a color scale for groups
    const groupColors = d3.scaleOrdinal()
      .domain(Array.from(groupedEntities.keys()))
      .range(d3.schemeCategory10);

    // Create fixed positions in a circle for each entity
    const angle = d3.scaleLinear()
      .domain([0, entities.length])
      .range([0, 2 * Math.PI]);

    const nodePositions = {};
    entities.forEach((entity, i) => {
      nodePositions[entity.id] = {
        x: width / 2 + radius * Math.cos(angle(i)),
        y: height / 2 + radius * Math.sin(angle(i))
      };
    });

    // Create SVG group centered in the available space
    const g = svg.append('g');

    // Draw relationships as curved lines
    relationships.forEach(rel => {
      const sourcePos = nodePositions[rel.source];
      const targetPos = nodePositions[rel.target];

      if (!sourcePos || !targetPos) return;

      // Calculate a curved path
      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2;

      // Add curvature based on relationship strength
      const curveFactor = rel.strength / 5; // Normalize to 0-2 range
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const controlX = midX - dy * curveFactor / 10;
      const controlY = midY + dx * curveFactor / 10;

      // Draw the path
      g.append('path')
        .attr('d', `M${sourcePos.x},${sourcePos.y} Q${controlX},${controlY} ${targetPos.x},${targetPos.y}`)
        .attr('fill', 'none')
        .attr('stroke', d => {
          switch (rel.type) {
            case 'defines': return mdTokens.colors.relation.defines;
            case 'opposes': return mdTokens.colors.relation.opposes;
            case 'enhances': return mdTokens.colors.relation.enhances;
            case 'contains': return mdTokens.colors.relation.contains;
            default: return '#999';
          }
        })
        .attr('stroke-width', rel.strength / 2)
        .attr('opacity', 0.6)
        .attr('marker-end', 'url(#arrowhead)');

      // Add relationship type label at the midpoint
      g.append('text')
        .attr('x', controlX)
        .attr('y', controlY)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#555')
        .attr('dy', -5)
        .text(rel.type);
    });

    // Add arrow marker definition
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#999');

    // Draw entity nodes
    entities.forEach(entity => {
      const pos = nodePositions[entity.id];
      if (!pos) return;

      const color = (() => {
        switch(entity.type) {
          case 'concept': return mdTokens.colors.knowledge.concept;
          case 'text': return mdTokens.colors.knowledge.text;
          case 'person': return mdTokens.colors.knowledge.relation;
          case 'school': return mdTokens.colors.knowledge.exploration;
          default: return mdTokens.colors.primary.main;
        }
      })();

      // Node group
      const nodeGroup = g.append('g')
        .attr('transform', `translate(${pos.x}, ${pos.y})`)
        .attr('cursor', 'pointer')
        .on('click', () => {
          if (onEntityClick) onEntityClick(entity.id);
        });

      // Circle
      nodeGroup.append('circle')
        .attr('r', 12)
        .attr('fill', color)
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Entity name
      nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 25)
        .attr('font-size', '12px')
        .attr('fill', '#333')
        .text(entity.name);

      // Visual effects on hover
      nodeGroup.on('mouseover', function() {
        d3.select(this).select('circle')
          .attr('r', 15)
          .attr('stroke', '#000');
      }).on('mouseout', function() {
        d3.select(this).select('circle')
          .attr('r', 12)
          .attr('stroke', 'white');
      });
    });

  }, [entities, relationships, dimensions, onEntityClick]);

  return (
    <div className={`w-full h-[600px] ${mdTokens.cards.concept} ${mdTokens.elevation.level1} p-4 ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
}
