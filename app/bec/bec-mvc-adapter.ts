import { NeoNode, createNeoNode } from '@/neo/entity';
import { Being } from './being/being.cypher';
import { Concept } from './concept/concept.cypher';
import { Essence } from './essence/essence.cypher';

/**
 * BEC-MVC Adapter
 * 
 * A bidirectional transpilation system between Being-Essence-Concept (BEC)
 * and Model-View-Controller (MVC) patterns. This implements an isomorphic
 * mapping between Hegelian dialectical structures and software architecture.
 * 
 * Core mappings:
 * - Being → Model (immediate reality, data structures)
 * - Essence → View (appearance, representation)
 * - Concept → Controller (unification, logic)
 */

// =========================================================
// TYPES
// =========================================================

/**
 * BEC Structure
 */
export interface BECStructure {
  being: {
    id: string;
    quality?: string;
    determinate: boolean;
    immediate: boolean;
  };
  essence: {
    id: string;
    reflective: boolean;
    appearance?: string;
    mediated: boolean;
  };
  concept: {
    id: string;
    universal?: string;
    particular?: string;
    individual?: string;
  };
}

/**
 * MVC Structure
 */
export interface MVCStructure {
  model: {
    id: string;
    name: string;
    schema?: any;
    properties?: Record<string, any>;
  };
  view: {
    id: string;
    name: string;
    template?: string; 
    components?: any[];
  };
  controller: {
    id: string;
    name: string;
    actions?: string[];
    handlers?: Record<string, any>;
  };
}

/**
 * Dashboard Definition
 */
export interface DashboardDefinition {
  id: string;
  name: string;
  description?: string;
  
  // Structure
  structure: {
    layout: 'grid' | 'flex' | 'flow';
    sections: {
      id: string;
      name: string;
      position: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      content?: DashboardComponent[];
    }[];
  };
  
  // Components
  components: DashboardComponent[];
  
  // Data sources
  dataSources: {
    id: string;
    name: string;
    type: 'api' | 'database' | 'static';
    source: string;
    mapping?: Record<string, string>;
  }[];
  
  // Theme
  theme?: {
    colors: Record<string, string>;
    typography: Record<string, any>;
    spacing: Record<string, any>;
  };
}

/**
 * Dashboard Component
 */
export interface DashboardComponent {
  id: string;
  type: 'chart' | 'table' | 'card' | 'form' | 'list' | 'text' | 'custom';
  name: string;
  dataSource?: string;
  
  // Specific properties
  properties: {
    [key: string]: any;
  };
  
  // MVC structure linked to the component
  mvc?: MVCStructure;
  
  // BEC structure linked to the component
  bec?: BECStructure;
}

// =========================================================
// BEC TO MVC TRANSPILATION
// =========================================================

/**
 * Transform BEC to MVC
 * 
 * Maps Being-Essence-Concept to Model-View-Controller
 * following Hegel's dialectical method
 */
export function becToMvc(bec: BECStructure): MVCStructure {
  // Extract identifiers
  const beingId = bec.being.id;
  const essenceId = bec.essence.id;
  const conceptId = bec.concept.id;
  
  // Derive names from identifiers
  const modelName = beingId.split(':').pop() || 'Model';
  const viewName = essenceId.split(':').pop() || 'View';
  const controllerName = conceptId.split(':').pop() || 'Controller';
  
  // Create MVC structure
  const mvc: MVCStructure = {
    model: {
      id: `model:${beingId}`,
      name: `${capitalizeFirstLetter(modelName)}Model`,
      properties: {
        immediate: bec.being.immediate,
        qualities: bec.being.quality ? [bec.being.quality] : [],
        determinate: bec.being.determinate
      }
    },
    view: {
      id: `view:${essenceId}`,
      name: `${capitalizeFirstLetter(viewName)}View`,
      components: []
    },
    controller: {
      id: `controller:${conceptId}`,
      name: `${capitalizeFirstLetter(controllerName)}Controller`,
      actions: []
    }
  };
  
  // Model properties based on Being qualities
  if (bec.being.immediate) {
    mvc.model.properties = {
      ...mvc.model.properties,
      // Immediate beings are represented as direct data models
      isDirectDataModel: true,
      generatesTableSchema: true
    };
  }
  
  // View components based on Essence appearance
  if (bec.essence.appearance) {
    mvc.view.components = [{
      type: 'component',
      name: `${capitalizeFirstLetter(bec.essence.appearance)}Component`,
      reflective: bec.essence.reflective,
      mediated: bec.essence.mediated
    }];
    
    // Add template based on reflective/mediated properties
    if (bec.essence.reflective) {
      mvc.view.template = `<${mvc.view.name} data={model} onChange={handleChange} />`;
    } else if (bec.essence.mediated) {
      mvc.view.template = `<${mvc.view.name} data={model} />`;
    } else {
      mvc.view.template = `<${mvc.view.name} />`;
    }
  }
  
  // Controller actions based on Concept universality
  if (bec.concept.universal) {
    mvc.controller.actions = [
      'get', 
      'create', 
      'update', 
      'delete'
    ];
    
    mvc.controller.handlers = {
      handleGet: `async (id) => get${mvc.model.name}(id)`,
      handleCreate: `async (data) => create${mvc.model.name}(data)`,
      handleUpdate: `async (id, data) => update${mvc.model.name}(id, data)`,
      handleDelete: `async (id) => delete${mvc.model.name}(id)`
    };
  }
  
  return mvc;
}

// =========================================================
// MVC TO BEC TRANSPILATION
// =========================================================

/**
 * Transform MVC to BEC
 * 
 * Maps Model-View-Controller to Being-Essence-Concept
 * following the inverse of Hegel's dialectical method
 */
export function mvcToBec(mvc: MVCStructure): BECStructure {
  // Extract identifiers
  const modelId = mvc.model.id;
  const viewId = mvc.view.id;
  const controllerId = mvc.controller.id;
  
  // Determine qualities from names
  const modelQuality = determineQualityFromName(mvc.model.name);
  const viewAppearance = determineAppearanceFromName(mvc.view.name);
  const conceptUniversal = determineUniversalFromName(mvc.controller.name);
  
  // Create BEC structure
  const bec: BECStructure = {
    being: {
      id: modelId.startsWith('model:') ? modelId.substring(6) : `being:${modelId}`,
      quality: modelQuality,
      immediate: mvc.model.properties?.isDirectDataModel ?? true,
      determinate: mvc.model.properties?.determinate ?? true
    },
    essence: {
      id: viewId.startsWith('view:') ? viewId.substring(5) : `essence:${viewId}`,
      appearance: viewAppearance,
      reflective: mvc.view.components?.some(c => c.reflective) ?? false,
      mediated: mvc.view.components?.some(c => c.mediated) ?? true
    },
    concept: {
      id: controllerId.startsWith('controller:') ? controllerId.substring(11) : `concept:${controllerId}`,
      universal: conceptUniversal,
      particular: mvc.controller.name.toLowerCase(),
      individual: mvc.controller.id
    }
  };
  
  return bec;
}

// =========================================================
// DASHBOARD GENERATION
// =========================================================

/**
 * Generate Dashboard from BEC Structure
 * 
 * Creates a dashboard definition based on a BEC structure,
 * using the reciprocating transpilation to MVC
 */
export function generateDashboardFromBec(
  name: string,
  description: string,
  becStructures: BECStructure[]
): DashboardDefinition {
  // Create initial dashboard
  const dashboard: DashboardDefinition = {
    id: `dashboard:${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    description,
    structure: {
      layout: 'grid',
      sections: []
    },
    components: [],
    dataSources: []
  };
  
  // Add sections and components based on BEC structures
  becStructures.forEach((bec, index) => {
    // Convert BEC to MVC
    const mvc = becToMvc(bec);
    
    // Determine component type based on BEC characteristics
    let componentType: 'chart' | 'table' | 'card' | 'form' | 'list' | 'text' | 'custom' = 'card';
    
    if (bec.being.quality?.includes('collection')) {
      componentType = 'table';
    } else if (bec.essence.appearance?.includes('chart') || bec.essence.appearance?.includes('graph')) {
      componentType = 'chart';
    } else if (bec.essence.appearance?.includes('form')) {
      componentType = 'form';
    } else if (bec.essence.appearance?.includes('list')) {
      componentType = 'list';
    } else if (bec.essence.mediated === false && bec.essence.reflective === false) {
      componentType = 'text';
    }
    
    // Create component
    const component: DashboardComponent = {
      id: `component:${bec.being.id}`,
      type: componentType,
      name: mvc.view.name,
      properties: {},
      dataSource: `datasource:${bec.being.id}`,
      mvc,
      bec
    };
    
    // Customize properties based on component type
    switch (componentType) {
      case 'chart':
        component.properties = {
          chartType: 'bar',
          title: mvc.view.name,
          xAxis: 'category',
          yAxis: 'value'
        };
        break;
        
      case 'table':
        component.properties = {
          columns: ['id', 'name', 'description'],
          pagination: true,
          sorting: true
        };
        break;
        
      case 'form':
        component.properties = {
          fields: [
            { name: 'name', type: 'text', label: 'Name' },
            { name: 'description', type: 'textarea', label: 'Description' }
          ],
          submitAction: mvc.controller.handlers?.handleCreate
        };
        break;
        
      case 'card':
        component.properties = {
          title: mvc.view.name,
          subtitle: mvc.model.name,
          content: 'Card content'
        };
        break;
    }
    
    // Add to dashboard components
    dashboard.components.push(component);
    
    // Create data source
    dashboard.dataSources.push({
      id: `datasource:${bec.being.id}`,
      name: `${mvc.model.name} Data`,
      type: 'api',
      source: `/api/${mvc.model.name.toLowerCase()}`
    });
    
    // Create section (arrange in grid)
    dashboard.structure.sections.push({
      id: `section:${bec.being.id}`,
      name: mvc.view.name,
      position: {
        x: (index % 2) * 6,
        y: Math.floor(index / 2) * 6,
        width: 6,
        height: 6
      },
      content: [component.id]
    });
  });
  
  return dashboard;
}

/**
 * Generate Dashboard from MVC Structure
 * 
 * Creates a dashboard definition based on MVC structures,
 * using the reciprocating transpilation to BEC
 */
export function generateDashboardFromMvc(
  name: string,
  description: string,
  mvcStructures: MVCStructure[]
): DashboardDefinition {
  // First convert MVC to BEC
  const becStructures = mvcStructures.map(mvc => mvcToBec(mvc));
  
  // Then generate dashboard from BEC
  return generateDashboardFromBec(name, description, becStructures);
}

// =========================================================
// DASHBOARD COMPONENT GENERATION
// =========================================================

/**
 * Generate Component Code from Dashboard Component
 * 
 * Creates the actual code for a dashboard component
 * based on its MVC and BEC definitions
 */
export function generateComponentCode(component: DashboardComponent): string {
  if (!component.mvc) {
    throw new Error('Component missing MVC structure');
  }
  
  const { model, view, controller } = component.mvc;
  
  // Choose template based on component type
  switch (component.type) {
    case 'chart': 
      return generateChartComponent(component);
    case 'table': 
      return generateTableComponent(component);
    case 'form': 
      return generateFormComponent(component);
    case 'card': 
      return generateCardComponent(component);
    case 'list':
      return generateListComponent(component);
    default:
      return generateDefaultComponent(component);
  }
}

/**
 * Generate Chart Component
 */
function generateChartComponent(component: DashboardComponent): string {
  const { mvc, properties } = component;
  const chartType = properties.chartType || 'bar';
  
  return `import { FC, useEffect, useState } from 'react';
import { ${capitalizeFirstLetter(chartType)}Chart } from '@/form/chart/${chartType.toLowerCase()}-chart';

interface ${mvc!.view.name}Props {
  dataSource: string;
  title?: string;
}

const ${mvc!.view.name}: FC<${mvc!.view.name}Props> = ({ 
  dataSource, 
  title = '${properties.title || mvc!.view.name}'
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(dataSource);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [dataSource]);
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      {loading ? (
        <div className="loading">Loading chart data...</div>
      ) : (
        <${capitalizeFirstLetter(chartType)}Chart 
          data={data} 
          xAxisKey="${properties.xAxis || 'category'}"
          yAxisKey="${properties.yAxis || 'value'}"
        />
      )}
    </div>
  );
};

export default ${mvc!.view.name};`;
}

/**
 * Generate Table Component
 */
function generateTableComponent(component: DashboardComponent): string {
  const { mvc, properties } = component;
  const columns = properties.columns || ['id', 'name', 'description'];
  
  return `import { FC, useEffect, useState } from 'react';
import { Table } from '@/form/table/table';

interface ${mvc!.view.name}Props {
  dataSource: string;
  title?: string;
}

const ${mvc!.view.name}: FC<${mvc!.view.name}Props> = ({ 
  dataSource, 
  title = '${properties.title || mvc!.view.name}' 
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const columns = [
    ${columns.map(col => `{ key: '${col}', header: '${capitalizeFirstLetter(col)}' }`).join(',\n    ')}
  ];
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(dataSource);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching table data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [dataSource]);
  
  return (
    <div className="table-container">
      <h3 className="table-title">{title}</h3>
      {loading ? (
        <div className="loading">Loading data...</div>
      ) : (
        <Table 
          data={data} 
          columns={columns}
          pagination=${properties.pagination || true}
          sorting=${properties.sorting || true}
        />
      )}
    </div>
  );
};

export default ${mvc!.view.name};`;
}

/**
 * Generate Form Component
 */
function generateFormComponent(component: DashboardComponent): string {
  const { mvc, properties } = component;
  const fields = properties.fields || [
    { name: 'name', type: 'text', label: 'Name' },
    { name: 'description', type: 'textarea', label: 'Description' }
  ];
  
  return `import { FC, useState } from 'react';
import { Form, Field, Button } from '@/form/form';

interface ${mvc!.view.name}Props {
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  title?: string;
}

const ${mvc!.view.name}: FC<${mvc!.view.name}Props> = ({ 
  onSubmit, 
  initialData = {}, 
  title = '${properties.title || mvc!.view.name}' 
}) => {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="form-container">
      <h3 className="form-title">{title}</h3>
      {error && <div className="error">{error}</div>}
      
      <Form onSubmit={handleSubmit}>
        ${fields.map(field => `<Field
          type="${field.type}"
          name="${field.name}"
          label="${field.label}"
          value={formData.${field.name} || ''}
          onChange={value => handleChange('${field.name}', value)}
          required={${field.required || false}}
        />`).join('\n        ')}
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </Button>
      </Form>
    </div>
  );
};

export default ${mvc!.view.name};`;
}

/**
 * Generate Card Component
 */
function generateCardComponent(component: DashboardComponent): string {
  const { mvc, properties } = component;
  
  return `import { FC } from 'react';
import { Card } from '@/form/card/card';

interface ${mvc!.view.name}Props {
  title?: string;
  subtitle?: string;
  content?: string;
  footer?: React.ReactNode;
}

const ${mvc!.view.name}: FC<${mvc!.view.name}Props> = ({ 
  title = '${properties.title || mvc!.view.name}',
  subtitle = '${properties.subtitle || ''}',
  content = '${properties.content || 'Content goes here'}',
  footer
}) => {
  return (
    <Card
      title={title}
      subtitle={subtitle}
      className="dashboard-card"
    >
      <div className="card-content">
        {content}
      </div>
      {footer && <div className="card-footer">{footer}</div>}
    </Card>
  );
};

export default ${mvc!.view.name};`;
}

/**
 * Generate List Component
 */
function generateListComponent(component: DashboardComponent): string {
  const { mvc, properties } = component;
  
  return `import { FC, useEffect, useState } from 'react';
import { List, ListItem } from '@/form/list/list';

interface ${mvc!.view.name}Props {
  dataSource: string;
  title?: string;
  renderItem?: (item: any) => React.ReactNode;
}

const ${mvc!.view.name}: FC<${mvc!.view.name}Props> = ({ 
  dataSource, 
  title = '${properties.title || mvc!.view.name}',
  renderItem
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(dataSource);
        const result = await response.json();
        setItems(result);
      } catch (error) {
        console.error('Error fetching list data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [dataSource]);
  
  const defaultRenderItem = (item: any) => (
    <div className="list-item-content">
      <h4>{item.name || item.title}</h4>
      {item.description && <p>{item.description}</p>}
    </div>
  );
  
  return (
    <div className="list-container">
      <h3 className="list-title">{title}</h3>
      {loading ? (
        <div className="loading">Loading items...</div>
      ) : (
        <List>
          {items.map((item, index) => (
            <ListItem key={item.id || index}>
              {renderItem ? renderItem(item) : defaultRenderItem(item)}
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
};

export default ${mvc!.view.name};`;
}

/**
 * Generate Default Component
 */
function generateDefaultComponent(component: DashboardComponent): string {
  const { mvc } = component;
  
  return `import { FC } from 'react';

interface ${mvc!.view.name}Props {
  title?: string;
  children?: React.ReactNode;
}

const ${mvc!.view.name}: FC<${mvc!.view.name}Props> = ({ 
  title = '${component.name}',
  children
}) => {
  return (
    <div className="component-container">
      <h3 className="component-title">{title}</h3>
      <div className="component-content">
        {children || 'No content provided'}
      </div>
    </div>
  );
};

export default ${mvc!.view.name};`;
}

// =========================================================
// HELPER FUNCTIONS
// =========================================================

/**
 * Capitalize first letter of a string
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Determine quality from model name
 */
function determineQualityFromName(name: string): string {
  name = name.toLowerCase();
  
  if (name.includes('user')) return 'identity';
  if (name.includes('product')) return 'entity';
  if (name.includes('order')) return 'transaction';
  if (name.includes('setting')) return 'configuration';
  if (name.includes('list') || name.includes('collection')) return 'collection';
  
  return 'entity';
}

/**
 * Determine appearance from view name
 */
function determineAppearanceFromName(name: string): string {
  name = name.toLowerCase();
  
  if (name.includes('chart') || name.includes('graph')) return 'visualization';
  if (name.includes('table')) return 'tabular';
  if (name.includes('form')) return 'input';
  if (name.includes('card')) return 'card';
  if (name.includes('list')) return 'list';
  if (name.includes('detail')) return 'detail';
  
  return 'component';
}

/**
 * Determine universal from controller name
 */
function determineUniversalFromName(name: string): string {
  name = name.toLowerCase();
  
  if (name.includes('user')) return 'identity-management';
  if (name.includes('product')) return 'product-management';
  if (name.includes('order')) return 'order-processing';
  if (name.includes('setting')) return 'configuration';
  if (name.includes('auth')) return 'authentication';
  
  return 'entity-management';
}

// Export all the necessary functions
export const BECMVCAdapter = {
  becToMvc,
  mvcToBec,
  generateDashboardFromBec,
  generateDashboardFromMvc,
  generateComponentCode
};

export default BECMVCAdapter;