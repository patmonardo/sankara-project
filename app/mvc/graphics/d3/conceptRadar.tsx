import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { mdTokens } from '@/ui/theme/token/tokens';
import { kb } from '@/ui/theme/kb';

interface ConceptScore {
  concept: string;
  score: number; // 0-100 representing importance
}

interface SchoolData {
  name: string;
  color?: string;
  concepts: ConceptScore[];
}

interface ConceptRadarProps {
  schools: SchoolData[];
  className?: string;
  onConceptClick?: (concept: string) => void;
}

export function ConceptRadar({ schools, className = '', onConceptClick }: ConceptRadarProps) {
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
    if (!svgRef.current || !schools || schools.length === 0 || !dimensions.width) return;

    // Clear previous rendering
    d3.select(svgRef.current).selectAll('*').remove();

    // Get all unique concepts across all schools
    const allConcepts = Array.from(
      new Set(schools.flatMap(school => school.concepts.map(c => c.concept)))
    );

    const svg = d3.select(svgRef.current);
    const width = dimensions.width;
    const height = dimensions.height;
    const radius = Math.min(width, height) / 2 - 60;

    // Group centered in the SVG
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Create a scale for the angles (one for each concept)
    const angleScale = d3.scaleLinear()
      .domain([0, allConcepts.length])
      .range([0, 2 * Math.PI]);

    // Create a radial scale for the scores
    const radiusScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);

    // Create a color scale for the schools
    const colorScale = d3.scaleOrdinal()
      .domain(schools.map(s => s.name))
      .range(d3.schemeCategory10);

    // Draw the radar grid
    const levels = 5; // Number of concentric circles
    for (let i = 1; i <= levels; i++) {
      const levelRadius = radius * i / levels;
      g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', levelRadius)
        .attr('fill', 'none')
        .attr('stroke', '#ddd')
        .attr('stroke-width', 0.5);

      // Add score label at each level
      g.append('text')
        .attr('x', 0)
        .attr('y', -levelRadius)
        .attr('dy', -2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '8px')
        .attr('fill', '#999')
        .text(`${Math.round(i * 100 / levels)}`);
    }

    // Draw the axis lines for each concept
    allConcepts.forEach((concept, i) => {
      const angle = angleScale(i);
      const lineX = radius * Math.cos(angle - Math.PI / 2);
      const lineY = radius * Math.sin(angle - Math.PI / 2);

      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', lineX)
        .attr('y2', lineY)
        .attr('stroke', '#ddd')
        .attr('stroke-width', 0.5);

      // Add concept label
      const labelDistance = radius + 20;
      const labelX = labelDistance * Math.cos(angle - Math.PI / 2);
      const labelY = labelDistance * Math.sin(angle - Math.PI / 2);

      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', () => {
          if (Math.abs(labelX) < 10) return 'middle';
          return labelX > 0 ? 'start' : 'end';
        })
        .attr('dominant-baseline', () => {
          if (Math.abs(labelY) < 10) return 'middle';
          return labelY > 0 ? 'hanging' : 'auto';
        })
        .attr('font-size', '10px')
        .attr('fill', '#333')
        .attr('cursor', 'pointer')
        .text(concept)
        .on('click', () => {
          if (onConceptClick) onConceptClick(concept);
        });
    });

    // Draw the radar paths for each school
    schools.forEach(school => {
      // Map concept scores to coordinates
      const conceptScoreMap = new Map(
        school.concepts.map(c => [c.concept, c.score])
      );

      // Create points for the radar path
      const points = allConcepts.map((concept, i) => {
        const angle = angleScale(i) - Math.PI / 2; // Start from the top
        const score = conceptScoreMap.get(concept) || 0;
        const r = radiusScale(score);
        return {
          x: r * Math.cos(angle),
          y: r * Math.sin(angle)
        };
      });

      // Create a line generator for the radar
      const radarLine = d3.lineRadial()
        .angle((d, i) => angleScale(i))
        .radius(d => radiusScale(d))
        .curve(d3.curveLinearClosed);

      // Create the path
      const schoolColor = school.color || colorScale(school.name);

      // Draw the radar area
      const radarPath = g.append('path')
        .datum(school.concepts.map(c => c.score))
        .attr('d', radarLine)
        .attr('fill', schoolColor)
        .attr('fill-opacity', 0.2)
        .attr('stroke', schoolColor)
        .attr('stroke-width', 2);

      // Draw points at each concept score
      school.concepts.forEach(conceptScore => {
        const conceptIndex = allConcepts.indexOf(conceptScore.concept);
        if (conceptIndex === -1) return;

        const angle = angleScale(conceptIndex) - Math.PI / 2;
        const r = radiusScale(conceptScore.score);

        g.append('circle')
          .attr('cx', r * Math.cos(angle))
          .attr('cy', r * Math.sin(angle))
          .attr('r', 3)
          .attr('fill', schoolColor)
          .attr('stroke', 'white')
          .attr('stroke-width', 1);
      });
    });

    // Add a legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 100}, 20)`);

    schools.forEach((school, i) => {
      const schoolColor = school.color || colorScale(school.name);

      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', schoolColor);

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .attr('font-size', '12px')
        .attr('fill', '#333')
        .text(school.name);
    });

  }, [schools, dimensions, onConceptClick]);

  return (
    <div className={`w-full h-[600px] ${mdTokens.cards.concept} ${mdTokens.elevation.level1} p-4 ${className}`}>
      <h3 className={mdTokens.type.title}>Concept Importance by School</h3>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height - 30} // Account for the title
        className="w-full h-full"
      />
    </div>
  );
}
