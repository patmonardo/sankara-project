import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { mdTokens } from '@/ui/theme/token/tokens';
import { kb } from '@/ui/theme/kb';

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  type?: 'concept' | 'text' | 'category';
}

interface ConceptTreeProps {
  data: TreeNode;
  className?: string;
  onNodeClick?: (id: string) => void;
}

export function ConceptTree({ data, className = '', onNodeClick }: ConceptTreeProps) {
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
    if (!svgRef.current || !data || !dimensions.width) return;

    // Clear previous rendering
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up the tree layout
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Create the tree layout
    const treeLayout = d3.tree().size([height, width]);

    // Convert the data to D3 hierarchy
    const root = d3.hierarchy(data);

    // Assign x,y positions to nodes
    const treeData = treeLayout(root);

    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add links between nodes
    svg.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)  // Note: x and y are swapped to make the tree horizontal
        .y(d => d.x)
      )
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1.5);

    // Create node groups
    const nodes = svg.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', d => `node ${d.children ? 'node--internal' : 'node--leaf'}`)
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        if (onNodeClick) onNodeClick(d.data.id);
      });

    // Add node circles
    nodes.append('circle')
      .attr('r', 8)
      .attr('fill', d => {
        const type = d.data.type || 'category';
        switch(type) {
          case 'concept': return mdTokens.colors.knowledge.concept;
          case 'text': return mdTokens.colors.knowledge.text;
          default: return mdTokens.colors.primary.main;
        }
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add node labels
    nodes.append('text')
      .attr('dy', '.31em')
      .attr('x', d => d.children ? -12 : 12)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name)
      .attr('font-size', '12px')
      .attr('fill', '#333');

    // Add hover effects
    nodes.on('mouseover', function() {
      d3.select(this).select('circle').attr('stroke', '#000');
    }).on('mouseout', function() {
      d3.select(this).select('circle').attr('stroke', '#fff');
    });

  }, [data, dimensions, onNodeClick]);

  return (
    <div className={`w-full h-[500px] ${mdTokens.cards.concept} ${mdTokens.elevation.level1} p-4 ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
}
