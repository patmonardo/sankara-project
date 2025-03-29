import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as cloud from 'd3-cloud';
import { mdTokens } from '@/ui/theme/token/tokens';
import { kb } from '@/ui/theme/kb';

interface WordCloudProps {
  words: Array<{text: string, value: number, type?: string}>;
  className?: string;
  onWordClick?: (word: string) => void;
}

export function SanskritWordCloud({ words, className = '', onWordClick }: WordCloudProps) {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Responsive sizing
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

  // D3 rendering
  useEffect(() => {
    if (!svgRef.current || !words || words.length === 0 || !dimensions.width) return;

    // Clear previous rendering
    d3.select(svgRef.current).selectAll('*').remove();

    // Word cloud layout
    const layout = cloud()
      .size([dimensions.width, dimensions.height])
      .words(words.map(d => ({ ...d, size: Math.sqrt(d.value) * 10 + 10 })))
      .padding(5)
      .rotate(() => ~~(Math.random() * 2) * 90)
      .font('Sanskrit2003')
      .fontSize(d => d.size)
      .on('end', draw);

    layout.start();

    // Draw the word cloud
    function draw(words) {
      const svg = d3.select(svgRef.current);

      const wordElements = svg
        .append('g')
        .attr('transform', `translate(${dimensions.width / 2},${dimensions.height / 2})`)
        .selectAll('text')
        .data(words)
        .enter()
        .append('text')
        .style('font-size', d => `${d.size}px`)
        .style('font-family', d => d.font)
        .style('fill', d => {
          switch(d.type) {
            case 'concept': return mdTokens.colors.knowledge.concept;
            case 'text': return mdTokens.colors.knowledge.text;
            default: return mdTokens.colors.primary.main;
          }
        })
        .attr('text-anchor', 'middle')
        .attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
        .text(d => d.text)
        .style('cursor', 'pointer');

      if (onWordClick) {
        wordElements.on('click', (event, d) => {
          onWordClick(d.text);
        });
      }
    }
  }, [words, dimensions, onWordClick]);

  return (
    <div className={`w-full h-[400px] ${mdTokens.cards.concept} ${mdTokens.elevation.level1} p-4 ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
}
