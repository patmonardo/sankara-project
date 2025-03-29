'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3'; // Import d3 for manipulation
import cloud from 'd3-cloud';

interface ConceptData {
  name: string;
  frequency: number;
  category?: string;
}

interface ConceptCloudProps {
  concepts: ConceptData[];
  maxConcepts?: number;
  width?: number;
  height?: number;
}

export default function ConceptCloud({
  concepts,
  maxConcepts = 100,
  width = 800,
  height = 500
}: ConceptCloudProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || concepts.length === 0) return;

    // Clear any existing visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Filter to maxConcepts
    const filteredConcepts = concepts
      .slice(0, maxConcepts)
      .map(d => ({
        text: d.name,
        size: 10 + Math.sqrt(d.frequency) * 5,
        category: d.category || 'unknown'
      }));

    // Set up the layout
    const layout = cloud()
      .size([width, height])
      .words(filteredConcepts)
      .padding(5)
      .rotate(() => 0)
      .fontSize(d => (d as any).size)
      .on('end', draw);

    layout.start();

    // Draw the word cloud
    function draw(words: any) {
      const svg = d3.select(svgRef.current);

      const categoryColors = {
        metaphysical: '#e41a1c',
        epistemological: '#377eb8',
        ethical: '#4daf4a',
        theological: '#984ea3',
        methodological: '#ff7f00',
        unknown: '#999'
      };

      svg
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`)
        .selectAll('text')
        .data(words)
        .enter()
        .append('text')
        .style('font-size', d => `${d.size}px`)
        .style('fill', d => (categoryColors as any)[d.category] || '#999')
        .attr('text-anchor', 'middle')
        .attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
        .text(d => d.text)
        .on('mouseover', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .style('font-size', d => `${d.size * 1.2}px`)
            .style('cursor', 'pointer');
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .style('font-size', d => `${d.size}px`);
        })
        .on('click', (_, d) => {
          // Handle concept selection - can expand with your navigation/detail logic
          console.log('Selected concept:', d.text);
          // window.location.href = `/sankara/concept/${d.text}`;
        });
    }
  }, [concepts, maxConcepts, width, height]);

  return (
    <div className="concept-cloud">
      <h3>Key Concepts</h3>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="concept-cloud-svg"
      />
    </div>
  );
}
