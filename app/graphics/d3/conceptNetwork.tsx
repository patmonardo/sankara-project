import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export function ConceptNetwork({ data }) {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle responsive sizing
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

    // Create D3 visualization
    const svg = d3.select(svgRef.current);

    // Set up force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2));

    // Draw links
    const link = svg.append('g')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6);

    // Draw nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', 5)
      .attr('fill', d => d.type === 'concept' ? '#6750A4' : '#625B71')
      .call(drag(simulation));

    // Node labels
    const text = svg.append('g')
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .text(d => d.name)
      .attr('font-size', 10)
      .attr('dx', 8)
      .attr('dy', 3);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      text
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    // Drag behavior function
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [data, dimensions]);

  return (
    <div className="w-full h-[400px] bg-white rounded-lg p-4">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full overflow-visible"
      />
    </div>
  );
}
