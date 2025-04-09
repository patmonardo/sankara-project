//@/ui/view/sankara.ts
import { Concept, Commentary, Reference, SankaraText } from '@/schema/sankara';

export class SankaraView {
  static formatCorpusStats(stats) {
    // Format the corpus statistics for display
    return {
      texts: { value: stats.textCount, label: 'works' },
      concepts: { value: stats.conceptCount, label: 'mapped' },
      relations: { value: stats.relationCount, label: 'links' },
      contexts: { value: stats.contextCount, label: 'defined' }
    };
  }

  static formatConceptNetwork(network) {
    // Transform concept network for D3 or other visualization library
    return {
      nodes: network.concepts.map(c => ({
        id: c.id,
        label: c.name,
        size: c.connectionCount,
        group: c.category
      })),
      links: network.relations.map(r => ({
        source: r.sourceConcept,
        target: r.targetConcept,
        value: r.strength,
        type: r.type
      }))
    };

  /**
   * Formats core concept data for dashboard display
   */
  static formatConceptData(concepts: Concept[]) {
    return concepts.map(concept => ({
      id: concept.id,
      name: concept.name,
      sanskritTerm: concept.sanskritTerm,
      description: concept.description.substring(0, 120) + '...',
      importance: concept.importance,
      frequency: concept.frequency,
      color: this.getConceptColor(concept.category),
      icon: this.getConceptIcon(concept.category),
    }));
  }

  /**
   * Formats commentary data for listing
   */
  static formatCommentaryData(commentaries: Commentary[]) {
    return commentaries.map(commentary => ({
      id: commentary.id,
      title: commentary.title,
      excerpt: commentary.content.substring(0, 150) + '...',
      author: commentary.author.name,
      date: new Date(commentary.date).toLocaleDateString(),
      textTitle: commentary.text.title,
      textId: commentary.text.id,
    }));
  }

  /**
   * Formats concept relationship data for knowledge graph
   */
  static formatNetworkData(references: Reference[]) {
    const nodes = new Set();
    const links = references.map(ref => {
      nodes.add(ref.sourceConcept.id);
      nodes.add(ref.targetConcept.id);

      return {
        source: ref.sourceConcept.id,
        target: ref.targetConcept.id,
        value: ref.strength,
        label: ref.relationType,
      };
    });

    return {
      nodes: Array.from(nodes).map(id => {
        const concept = references.find(r =>
          r.sourceConcept.id === id || r.targetConcept.id === id
        );
        const conceptData = concept?.sourceConcept.id === id
          ? concept.sourceConcept
          : concept?.targetConcept;

        return {
          id,
          name: conceptData?.name || '',
          category: conceptData?.category || '',
          group: this.getCategoryGroup(conceptData?.category || ''),
        };
      }),
      links
    };
  }

  /**
   * Formats text passages for display
   */
  static formatTextData(texts: SankaraText[]) {
    return texts.map(text => ({
      id: text.id,
      title: text.title,
      excerpt: text.content.substring(0, 200) + '...',
      concepts: text.concepts.map(c => c.name).join(', '),
      work: text.work,
      chapter: text.chapter,
      verse: text.verse,
      commentaryCount: text.commentaries.length,
    }));
  }

  /**
   * Helper method to assign colors based on concept category
   */
  private static getConceptColor(category: string): string {
    const colorMap: Record<string, string> = {
      'metaphysics': '#8884d8',
      'epistemology': '#82ca9d',
      'ethics': '#ffc658',
      'soteriology': '#ff8042',
      'ontology': '#a4de6c',
    };
    return colorMap[category.toLowerCase()] || '#cccccc';
  }

  /**
   * Helper method to assign icons based on concept category
   */
  private static getConceptIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'metaphysics': 'cosmology',
      'epistemology': 'knowledge',
      'ethics': 'ethics',
      'soteriology': 'liberation',
      'ontology': 'being',
    };
    return iconMap[category.toLowerCase()] || 'concept';
  }

  /**
   * Helper method to group categories for visualization
   */
  private static getCategoryGroup(category: string): number {
    const groupMap: Record<string, number> = {
      'metaphysics': 1,
      'epistemology': 2,
      'ethics': 3,
      'soteriology': 4,
      'ontology': 5,
    };
    return groupMap[category.toLowerCase()] || 0;
  }
}
