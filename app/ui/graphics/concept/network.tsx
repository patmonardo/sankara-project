//@/ui/graphics/concept/network.tsx'
"use client"

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  ConceptNetworkSchema,
  type ConceptNode,
  type ConceptLink
} from '@/ui/graphics/schema/concept';

interface ConceptNetworkProps {
  nodes: ConceptNode[];
  links: ConceptLink[];
  width?: number;
  height?: number;
  onNodeSelect?: (nodeId: string) => void;
}

export default function ConceptNetwork({
  nodes,
  links,
  width = 800,
  height = 600,
  onNodeSelect
}: ConceptNetworkProps) {
  // Validate data against schema
  try {
    ConceptNetworkSchema.parse({
      nodes,
      links,
      config: { width, height }
    });
  } catch (error) {
    console.error('Invalid network data:', error);
    return (
      <div className="concept-network-error">
        <h3>Network Visualization Error</h3>
        <p>The provided data is not valid for visualization.</p>
      </div>
    );
  }

  const svgRef = useRef<SVGSVGElement>(null);

  // D3 visualization effect
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear SVG first
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create container for zoom/pan
    const container = svg.append('g');

    // Set up the simulation with validated data
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Add links
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => Math.sqrt(d.strength));

    // Define category colors
    const categoryColors: Record<string, string> = {
      metaphysical: '#e41a1c',
      epistemological: '#377eb8',
      ethical: '#4daf4a',
      theological: '#984ea3',
      methodological: '#ff7f00'
    };

    // Add nodes
    const node = container.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d) => 5 + Math.sqrt(d.count) * 2)
      .attr('fill', (d) => categoryColors[d.category || ''] || '#999')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (onNodeSelect) onNodeSelect(d.id);
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Add labels
    const label = container.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text((d) => d.name)
      .attr('font-size', 12)
      .attr('dx', 15)
      .attr('dy', 4)
      .style('pointer-events', 'none'); // Let clicks pass through to nodes

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Add zoom/pan behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Return cleanup function
    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, onNodeSelect]);

  return (
    <div className="concept-network-container">
      <h3>Concept Network</h3>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="concept-network"
      />
    </div>
  );
}
