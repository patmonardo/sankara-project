import { BECStructure, MVCStructure, DashboardDefinition, DashboardComponent } from '@/bec/bec-mvc-adapter';
import BECMVCAdapter from '@/bec/bec-mvc-adapter';
import { createNeoNode } from '@/neo/entity';
import path from 'path';
import fs from 'fs';

/**
 * Dashboard Generator
 * 
 * A service that generates complete dashboards from BEC or MVC structures.
 * This is the main entry point for the dashboard generation system that
 * implements the reciprocating transpilation between BEC and MVC.
 */
export class DashboardGenerator {
  /**
   * Generate a dashboard from BEC structures
   * 
   * @param name Dashboard name
   * @param description Dashboard description
   * @param structures BEC structures to include in the dashboard
   */
  generateFromBEC(
    name: string, 
    description: string, 
    structures: BECStructure[]
  ): DashboardDefinition {
    return BECMVCAdapter.generateDashboardFromBec(name, description, structures);
  }
  
  /**
   * Generate a dashboard from MVC structures
   * 
   * @param name Dashboard name
   * @param description Dashboard description
   * @param structures MVC structures to include in the dashboard
   */
  generateFromMVC(
    name: string, 
    description: string, 
    structures: MVCStructure[]
  ): DashboardDefinition {
    return BECMVCAdapter.generateDashboardFromMvc(name, description, structures);
  }
  
  /**
   * Generate and write a complete dashboard to the filesystem
   * 
   * @param outputDir Directory to write dashboard files
   * @param dashboard Dashboard definition
   */
  async writeDashboard(outputDir: string, dashboard: DashboardDefinition): Promise<string[]> {
    const createdFiles: string[] = [];
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write dashboard definition
    const definitionPath = path.join(outputDir, 'dashboard.json');
    fs.writeFileSync(definitionPath, JSON.stringify(dashboard, null, 2));
    createdFiles.push(definitionPath);
    
    // Create components directory
    const componentsDir = path.join(outputDir, 'components');
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
    }
    
    // Generate component files
    for (const component of dashboard.components) {
      const componentCode = BECMVCAdapter.generateComponentCode(component);
      const fileName = `${component.name}.tsx`;
      const filePath = path.join(componentsDir, fileName);
      fs.writeFileSync(filePath, componentCode);
      createdFiles.push(filePath);
    }
    
    // Generate index file to export all components
    const indexContent = dashboard.components
      .map(c => `export { default as ${c.name} } from './components/${c.name}';`)
      .join('\n');
    const indexPath = path.join(outputDir, 'index.ts');
    fs.writeFileSync(indexPath, indexContent);
    createdFiles.push(indexPath);
    
    // Generate dashboard layout
    const layoutContent = this.generateDashboardLayout(dashboard);
    const layoutPath = path.join(outputDir, 'layout.tsx');
    fs.writeFileSync(layoutPath, layoutContent);
    createdFiles.push(layoutPath);
    
    // Generate dashboard page
    const pageContent = this.generateDashboardPage(dashboard);
    const pagePath = path.join(outputDir, 'page.tsx');
    fs.writeFileSync(pagePath, pageContent);
    createdFiles.push(pagePath);
    
    return createdFiles;
  }
  
  /**
   * Generate a complete example dashboard from predefined BEC structures
   * 
   * @param name Dashboard name
   * @param description Dashboard description
   */
  generateExampleDashboard(
    name: string = 'BEC Dashboard', 
    description: string = 'Auto-generated dashboard using BEC-MVC transpilation'
  ): DashboardDefinition {
    // Create sample BEC structures
    const usersBec: BECStructure = {
      being: {
        id: 'users',
        quality: 'identity-collection',
        determinate: true,
        immediate: true
      },
      essence: {
        id: 'users-table',
        reflective: false,
        appearance: 'table',
        mediated: true
      },
      concept: {
        id: 'users-management',
        universal: 'identity-management',
        particular: 'user-management',
        individual: 'users-controller'
      }
    };
    
    const analyticsBec: BECStructure = {
      being: {
        id: 'analytics',
        quality: 'metrics',
        determinate: true,
        immediate: false
      },
      essence: {
        id: 'analytics-chart',
        reflective: true,
        appearance: 'chart',
        mediated: true
      },
      concept: {
        id: 'analytics-insights',
        universal: 'data-analysis',
        particular: 'trend-analysis',
        individual: 'analytics-controller'
      }
    };
    
    const ordersBec: BECStructure = {
      being: {
        id: 'orders',
        quality: 'transaction-collection',
        determinate: true,
        immediate: true
      },
      essence: {
        id: 'orders-table',
        reflective: false,
        appearance: 'table',
        mediated: true
      },
      concept: {
        id: 'orders-management',
        universal: 'transaction-management',
        particular: 'order-management',
        individual: 'orders-controller'
      }
    };
    
    const settingsBec: BECStructure = {
      being: {
        id: 'settings',
        quality: 'configuration',
        determinate: true,
        immediate: false
      },
      essence: {
        id: 'settings-form',
        reflective: true,
        appearance: 'form',
        mediated: true
      },
      concept: {
        id: 'settings-management',
        universal: 'configuration-management',
        particular: 'app-configuration',
        individual: 'settings-controller'
      }
    };
    
    // Generate dashboard from BEC structures
    return this.generateFromBEC(
      name,
      description,
      [usersBec, analyticsBec, ordersBec, settingsBec]
    );
  }
  
  /**
   * Generate dashboard layout file content
   */
  private generateDashboardLayout(dashboard: DashboardDefinition): string {
    return `import { ReactNode } from 'react';
import { DashboardNav } from '@/form/dashboard/dashboard-nav';
import { DashboardHeader } from '@/form/dashboard/dashboard-header';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navItems = [
    ${dashboard.structure.sections.map(section => 
      `{ name: '${section.name}', href: '#${section.id}' }`
    ).join(',\n    ')}
  ];

  return (
    <div className="dashboard-container">
      <DashboardNav items={navItems} />
      <main className="dashboard-main">
        <DashboardHeader 
          title="${dashboard.name}" 
          description="${dashboard.description || ''}"
        />
        {children}
      </main>
    </div>
  );
}`;
  }
  
  /**
   * Generate dashboard page file content
   */
  private generateDashboardPage(dashboard: DashboardDefinition): string {
    const imports = dashboard.components
      .map(c => `import { ${c.name} } from './components/${c.name}';`)
      .join('\n');
      
    const sections = dashboard.structure.sections
      .map(section => {
        const componentRefs = section.content?.map(contentId => {
          const component = dashboard.components.find(c => c.id === contentId);
          if (!component) return '';
          
          return this.generateComponentJSX(component, dashboard);
        }).join('\n          ') || '';
        
        return `
        <section id="${section.id}" className="dashboard-section">
          <h2 className="section-title">${section.name}</h2>
          <div className="section-content ${dashboard.structure.layout === 'grid' ? 'grid-layout' : 'flex-layout'}">
            ${componentRefs}
          </div>
        </section>`;
      })
      .join('\n');
      
    return `"use client"

import { useEffect, useState } from 'react';
${imports}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="dashboard-content">
      ${sections}
    </div>
  );
}`;
  }
  
  /**
   * Generate JSX for a component
   */
  private generateComponentJSX(component: DashboardComponent, dashboard: DashboardDefinition): string {
    const dataSource = component.dataSource ? 
      dashboard.dataSources.find(ds => ds.id === component.dataSource)?.source || '' : 
      '';
    
    // Generate Cypher representation of this component transformation
    const cypherQuery = this.generateComponentCypherQuery(component, dashboard);
    
    switch (component.type) {
      case 'chart':
        return `<${component.name} 
            dataSource="${dataSource}"
            title="${component.properties.title || ''}"
          />`;
          
      case 'table':
        return `<${component.name}
            dataSource="${dataSource}"
            title="${component.properties.title || ''}"
          />`;
          
      case 'form':
        return `<${component.name}
            onSubmit={async (data) => {
              console.log('Form submitted:', data);
              // Implementation would connect to the controller
            }}
            title="${component.properties.title || ''}"
          />`;
          
      case 'card':
        return `<${component.name}
            title="${component.properties.title || ''}"
            subtitle="${component.properties.subtitle || ''}"
            content="${component.properties.content || ''}"
          />`;
          
      case 'list':
        return `<${component.name}
            dataSource="${dataSource}"
            title="${component.properties.title || ''}"
          />`;
          
      default:
        return `<${component.name}
            title="${component.name}"
          >
            Dashboard component
          </${component.name}>`;
    }
  }
  
  /**
   * Generate Cypher query for semantic capture of component transformation
   * 
   * This enables the transpilation process to be semantically captured in Neo4j,
   * creating a queryable knowledge graph of the BEC-MVC relationships.
   */
  private generateComponentCypherQuery(component: DashboardComponent, dashboard: DashboardDefinition): string {
    const { id, type, name, bec, mvc } = component;
    
    if (!bec || !mvc) {
      return '';
    }
    
    // Create Cypher query to represent the BEC-MVC-Component relationship
    return `
      // Create BEC nodes
      MERGE (being:Being {id: "${bec.being.id}"})
      SET being.quality = "${bec.being.quality || ''}",
          being.immediate = ${bec.being.immediate},
          being.determinate = ${bec.being.determinate}
          
      MERGE (essence:Essence {id: "${bec.essence.id}"})
      SET essence.appearance = "${bec.essence.appearance || ''}",
          essence.reflective = ${bec.essence.reflective},
          essence.mediated = ${bec.essence.mediated}
          
      MERGE (concept:Concept {id: "${bec.concept.id}"})
      SET concept.universal = "${bec.concept.universal || ''}",
          concept.particular = "${bec.concept.particular || ''}",
          concept.individual = "${bec.concept.individual || ''}"
          
      // Create MVC nodes
      MERGE (model:Model {id: "${mvc.model.id}"})
      SET model.name = "${mvc.model.name}"
      
      MERGE (view:View {id: "${mvc.view.id}"})
      SET view.name = "${mvc.view.name}"
      
      MERGE (controller:Controller {id: "${mvc.controller.id}"})
      SET controller.name = "${mvc.controller.name}"
      
      // Create Component node
      MERGE (component:Component:${type.charAt(0).toUpperCase() + type.slice(1)} {id: "${id}"})
      SET component.name = "${name}",
          component.type = "${type}",
          component.dashboardId = "${dashboard.id}"
          
      // Create relationships
      MERGE (being)-[:MANIFESTS_AS]->(model)
      MERGE (essence)-[:MANIFESTS_AS]->(view)
      MERGE (concept)-[:MANIFESTS_AS]->(controller)
      
      MERGE (model)-[:DETERMINES]->(component)
      MERGE (view)-[:PRESENTS]->(component)
      MERGE (controller)-[:MANAGES]->(component)
      
      MERGE (being)-[:CONSTITUTES {role: "being"}]->(component)
      MERGE (essence)-[:CONSTITUTES {role: "essence"}]->(component)
      MERGE (concept)-[:CONSTITUTES {role: "concept"}]->(component)
    `;
  }
  
  /**
   * Convert a dashboard to a Neo4j graph representation
   * 
   * This allows the dashboard to be stored and analyzed in the Neo4j graph
   * database, maintaining the connection to the BEC philosophical structure.
   */
  dashboardToNeoGraph(dashboard: DashboardDefinition) {
    // Create dashboard node
    const dashboardNode = createNeoNode({
      id: dashboard.id,
      type: 'Dashboard',
      being: { quality: 'dashboard', determinate: true, immediate: false },
      essence: { reflective: true, appearance: 'visualization', mediated: true },
      concept: { universal: 'visualization', particular: 'dashboard', individual: dashboard.id },
      properties: {
        name: dashboard.name,
        description: dashboard.description,
        layout: dashboard.structure.layout,
      }
    });
    
    // Create section nodes
    const sectionNodes = dashboard.structure.sections.map(section => {
      return createNeoNode({
        id: section.id,
        type: 'DashboardSection',
        being: { quality: 'container', determinate: true, immediate: false },
        essence: { reflective: false, appearance: 'section', mediated: true },
        concept: { universal: 'container', particular: 'section', individual: section.id },
        properties: {
          name: section.name,
          position: section.position,
        }
      });
    });
    
    // Create component nodes
    const componentNodes = dashboard.components.map(component => {
      // Get BEC structure 
      const bec = component.bec;
      const mvc = component.mvc;
      
      return createNeoNode({
        id: component.id,
        type: `DashboardComponent:${component.type.charAt(0).toUpperCase() + component.type.slice(1)}`,
        being: bec?.being || { quality: 'component', determinate: true, immediate: false },
        essence: bec?.essence || { reflective: true, appearance: component.type, mediated: true },
        concept: bec?.concept || { universal: 'component', particular: component.type, individual: component.id },
        properties: {
          name: component.name,
          type: component.type,
          ...component.properties,
        }
      });
    });
    
    // Create data source nodes
    const dataSourceNodes = dashboard.dataSources.map(source => {
      return createNeoNode({
        id: source.id,
        type: 'DataSource',
        being: { quality: 'data', determinate: true, immediate: true },
        essence: { reflective: false, appearance: 'data-source', mediated: false },
        concept: { universal: 'data', particular: source.type, individual: source.id },
        properties: {
          name: source.name,
          type: source.type,
          source: source.source,
          mapping: source.mapping,
        }
      });
    });
    
    // Return all nodes and their relationships
    return {
      nodes: {
        dashboard: dashboardNode,
        sections: sectionNodes,
        components: componentNodes,
        dataSources: dataSourceNodes
      },
      // Relationships would be defined when storing in Neo4j
    };
  }
}

export const dashboardGenerator = new DashboardGenerator();
export default dashboardGenerator;