import { SimpleMorph } from "../morph";
import { FormExecutionContext } from "../../schema/context";
import { FormShape } from "../../schema/form";
import { NeoContext } from "../mode";

/**
 * Core Cypher generation types and utilities
 * These serve as a general purpose substrate for Neo4j operations
 */

/**
 * Represents a Neo4j node or relationship property with proper typing
 */
export type CypherProperty = 
  | string 
  | number 
  | boolean 
  | null 
  | Date 
  | CypherProperty[] 
  | Record<string, CypherProperty>;

/**
 * Represents a Neo4j node structure
 */
export interface CypherNode {
  /** Variable name in the query */
  variable: string;
  /** Node labels (can be multiple) */
  labels: string[];
  /** Node properties */
  properties?: Record<string, CypherProperty>;
  /** Whether this node should be created (CREATE/MERGE) or matched (MATCH) */
  operation: 'CREATE' | 'MERGE' | 'MATCH';
}

/**
 * Represents a Neo4j relationship structure
 */
export interface CypherRelationship {
  /** Variable name in the query (optional) */
  variable?: string;
  /** Relationship type */
  type: string;
  /** Relationship direction */
  direction: 'OUTGOING' | 'INCOMING' | 'NONE';
  /** Relationship properties */
  properties?: Record<string, CypherProperty>;
  /** Source node variable */
  from: string;
  /** Target node variable */
  to: string;
  /** Whether this relationship should be created or matched */
  operation: 'CREATE' | 'MERGE' | 'MATCH';
}

/**
 * A pattern in a Cypher query (node or node-relationship-node)
 */
export type CypherPattern = CypherNode | [CypherNode, CypherRelationship, CypherNode];

/**
 * Represents a complete Cypher query
 */
export interface CypherQuery {
  /** Unique identifier for this query */
  id: string;
  /** Query name/description */
  name: string;
  /** Patterns to match or create */
  patterns: CypherPattern[];
  /** Conditions for WHERE clause */
  conditions?: CypherCondition[];
  /** Properties to SET */
  sets?: CypherSet[];
  /** Variables or expressions to RETURN */
  returns?: string[];
  /** Variables to DELETE */
  deletes?: string[];
  /** Whether to use DETACH DELETE */
  detachDelete?: boolean;
  /** Order of results */
  orderBy?: CypherOrderBy[];
  /** Limit results */
  limit?: number;
  /** Skip results */
  skip?: number;
  /** Parameters for the query */
  parameters?: Record<string, any>;
  /** Execution order hint */
  executionOrder?: number;
}

/**
 * Represents a condition for a WHERE clause
 */
export interface CypherCondition {
  left: string;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'IN' | 'CONTAINS' | 'STARTS WITH' | 'ENDS WITH';
  right: string | number | boolean | null | string[] | number[];
  /** Whether the right side is a parameter reference */
  parameterized?: boolean;
  /** Parameter name if parameterized */
  paramName?: string;
  /** Logical connection to next condition */
  connector?: 'AND' | 'OR';
}

/**
 * Represents a property assignment in a SET clause
 */
export interface CypherSet {
  target: string;
  property?: string;
  value: any;
  /** Whether to use += operator for maps */
  isMap?: boolean;
  /** Whether value is a parameter reference */
  parameterized?: boolean;
  /** Parameter name if parameterized */
  paramName?: string;
}

/**
 * Represents ordering in ORDER BY clause
 */
export interface CypherOrderBy {
  expression: string;
  descending?: boolean;
}

/**
 * Output from Cypher generation
 */
export interface CypherOutput {
  /** Unique identifier for this query set */
  id: string;
  /** Generated Cypher queries */
  queries: CypherQueryOutput[];
  /** Execution parameters */
  parameters: Record<string, any>;
  /** Additional metadata */
  meta: Record<string, any>;
}

/**
 * Generated query with text and metadata
 */
export interface CypherQueryOutput {
  /** Unique identifier for this query */
  id: string;
  /** Query name/description */
  name: string;
  /** The actual Cypher query text */
  query: string;
  /** Query purpose/type */
  purpose: string;
  /** Execution order */
  executionOrder: number;
  /** Dependencies on other queries */
  dependencies?: string[];
  /** Specific parameters for this query */
  parameters?: Record<string, any>;
}

// ======= GENERAL PURPOSE CYPHER SUBSTRATE ========

/**
 * Generate a Cypher query from a structured definition
 */
export function generateCypherQuery(query: CypherQuery, config: { parameterized?: boolean } = {}): { cypher: string; parameters: Record<string, any> } {
  const parameters: Record<string, any> = { ...query.parameters };
  let cypher = '';
  
  // Add operation clauses (MATCH, CREATE, MERGE)
  const matchPatterns: CypherPattern[] = [];
  const createPatterns: CypherPattern[] = [];
  const mergePatterns: CypherPattern[] = [];
  
  for (const pattern of query.patterns) {
    if (Array.isArray(pattern)) {
      // This is a node-relationship-node pattern
      const [fromNode, relationship, toNode] = pattern;
      // Determine where to put this pattern based on components
      if (fromNode.operation === 'MATCH' && toNode.operation === 'MATCH' && relationship.operation === 'MATCH') {
        matchPatterns.push(pattern);
      } else if (fromNode.operation === 'MATCH' && toNode.operation === 'MATCH' && relationship.operation === 'CREATE') {
        // Match nodes, create relationship
        matchPatterns.push(fromNode);
        matchPatterns.push(toNode);
        createPatterns.push([fromNode, relationship, toNode]);
      } else if (relationship.operation === 'MERGE') {
        mergePatterns.push(pattern);
      } else {
        // Default: put it in create
        createPatterns.push(pattern);
      }
    } else {
      // This is a single node pattern
      if (pattern.operation === 'MATCH') {
        matchPatterns.push(pattern);
      } else if (pattern.operation === 'MERGE') {
        mergePatterns.push(pattern);
      } else {
        createPatterns.push(pattern);
      }
    }
  }
  
  // Generate MATCH clause
  if (matchPatterns.length > 0) {
    cypher += 'MATCH ' + matchPatterns
      .map(pattern => formatCypherPattern(pattern, parameters, config.parameterized))
      .join(', ');
    cypher += '\n';
  }
  
  // Generate WHERE clause if conditions exist
  if (query.conditions && query.conditions.length > 0) {
    cypher += 'WHERE ';
    cypher += query.conditions.map((condition, index) => {
      const condStr = formatCypherCondition(condition, parameters, config.parameterized);
      if (index < query.conditions!.length - 1 && condition.connector) {
        return condStr + ' ' + condition.connector;
      }
      return condStr;
    }).join(' ');
    cypher += '\n';
  }
  
  // Generate CREATE clause
  if (createPatterns.length > 0) {
    if (cypher) cypher += '\n';
    cypher += 'CREATE ' + createPatterns
      .map(pattern => formatCypherPattern(pattern, parameters, config.parameterized))
      .join(', ');
    cypher += '\n';
  }
  
  // Generate MERGE clause
  if (mergePatterns.length > 0) {
    if (cypher) cypher += '\n';
    cypher += 'MERGE ' + mergePatterns
      .map(pattern => formatCypherPattern(pattern, parameters, config.parameterized))
      .join(', ');
    cypher += '\n';
  }
  
  // Generate SET clause
  if (query.sets && query.sets.length > 0) {
    cypher += 'SET ';
    cypher += query.sets.map(set => formatCypherSet(set, parameters, config.parameterized)).join(', ');
    cypher += '\n';
  }
  
  // Generate DELETE/DETACH DELETE clause
  if (query.deletes && query.deletes.length > 0) {
    if (query.detachDelete) {
      cypher += 'DETACH DELETE ' + query.deletes.join(', ');
    } else {
      cypher += 'DELETE ' + query.deletes.join(', ');
    }
    cypher += '\n';
  }
  
  // Generate RETURN clause
  if (query.returns && query.returns.length > 0) {
    cypher += 'RETURN ' + query.returns.join(', ');
    
    // Add ORDER BY
    if (query.orderBy && query.orderBy.length > 0) {
      cypher += '\nORDER BY ' + query.orderBy.map(order => {
        return order.expression + (order.descending ? ' DESC' : '');
      }).join(', ');
    }
    
    // Add LIMIT and SKIP
    if (query.limit !== undefined) {
      cypher += '\nLIMIT ' + query.limit;
    }
    
    if (query.skip !== undefined) {
      cypher += '\nSKIP ' + query.skip;
    }
  }
  
  return { cypher, parameters };
}

/**
 * Format a Cypher pattern (node or relationship)
 */
function formatCypherPattern(
  pattern: CypherPattern, 
  parameters: Record<string, any>,
  parameterized = true
): string {
  if (Array.isArray(pattern)) {
    // Node-relationship-node pattern
    const [fromNode, relationship, toNode] = pattern;
    const fromStr = formatCypherNode(fromNode, parameters, parameterized);
    const relStr = formatCypherRelationship(relationship, parameters, parameterized);
    const toStr = formatCypherNode(toNode, parameters, parameterized);
    
    if (relationship.direction === 'OUTGOING') {
      return `${fromStr}-${relStr}->${toStr}`;
    } else if (relationship.direction === 'INCOMING') {
      return `${fromStr}<-${relStr}-${toStr}`;
    } else {
      return `${fromStr}-${relStr}-${toStr}`;
    }
  } else {
    // Single node pattern
    return formatCypherNode(pattern, parameters, parameterized);
  }
}

/**
 * Format a Cypher node
 */
function formatCypherNode(
  node: CypherNode, 
  parameters: Record<string, any>,
  parameterized = true
): string {
  let result = `(${node.variable}`;
  
  // Add labels
  if (node.labels && node.labels.length > 0) {
    result += ':' + node.labels.join(':');
  }
  
  // Add properties
  if (node.properties && Object.keys(node.properties).length > 0) {
    if (parameterized) {
      // Use parameters
      const paramName = `${node.variable}Props`;
      parameters[paramName] = node.properties;
      result += ` $${paramName}`;
    } else {
      // Inline properties
      result += ' ' + formatPropertiesMap(node.properties);
    }
  }
  
  result += ')';
  return result;
}

/**
 * Format a Cypher relationship
 */
function formatCypherRelationship(
  rel: CypherRelationship, 
  parameters: Record<string, any>,
  parameterized = true
): string {
  let result = '[';
  
  // Add variable if provided
  if (rel.variable) {
    result += rel.variable;
  }
  
  // Add type
  result += `:${rel.type}`;
  
  // Add properties
  if (rel.properties && Object.keys(rel.properties).length > 0) {
    if (parameterized) {
      // Use parameters
      const paramName = rel.variable ? `${rel.variable}Props` : `${rel.from}_${rel.type}_${rel.to}Props`;
      parameters[paramName] = rel.properties;
      result += ` $${paramName}`;
    } else {
      // Inline properties
      result += ' ' + formatPropertiesMap(rel.properties);
    }
  }
  
  result += ']';
  return result;
}

/**
 * Format a properties map
 */
function formatPropertiesMap(props: Record<string, any>): string {
  if (Object.keys(props).length === 0) {
    return '{}';
  }
  
  const pairs = Object.entries(props).map(([key, value]) => {
    return `${key}: ${formatCypherValue(value)}`;
  });
  
  return `{${pairs.join(', ')}}`;
}

/**
 * Format a WHERE condition
 */
function formatCypherCondition(
  condition: CypherCondition, 
  parameters: Record<string, any>,
  parameterized = true
): string {
  const { left, operator, right, parameterized: isParamterized = parameterized, paramName } = condition;
  
  // Handle different operators
  if (isParamterized) {
    // Use parameters
    const actualParamName = paramName || `where_${left.replace(/\./g, '_')}`;
    parameters[actualParamName] = right;
    
    if (operator === 'IN') {
      return `${left} ${operator} $${actualParamName}`;
    } else if (operator === 'CONTAINS' || operator === 'STARTS WITH' || operator === 'ENDS WITH') {
      return `${left} ${operator} $${actualParamName}`;
    } else {
      return `${left} ${operator} $${actualParamName}`;
    }
  } else {
    // Inline values
    return `${left} ${operator} ${formatCypherValue(right)}`;
  }
}

/**
 * Format a SET operation
 */
function formatCypherSet(
  set: CypherSet, 
  parameters: Record<string, any>,
  parameterized = true
): string {
  const { target, property, value, isMap = false, parameterized: isParameterized = parameterized, paramName } = set;
  
  if (property) {
    // Setting a specific property
    if (isParameterized) {
      const actualParamName = paramName || `set_${target}_${property}`;
      parameters[actualParamName] = value;
      return `${target}.${property} = $${actualParamName}`;
    } else {
      return `${target}.${property} = ${formatCypherValue(value)}`;
    }
  } else {
    // Setting multiple properties at once
    if (isParameterized) {
      const actualParamName = paramName || `set_${target}_props`;
      parameters[actualParamName] = value;
      return isMap ? `${target} += $${actualParamName}` : `${target} = $${actualParamName}`;
    } else {
      return isMap ? `${target} += ${formatPropertiesMap(value)}` : `${target} = ${formatPropertiesMap(value)}`;
    }
  }
}

/**
 * Format a Cypher value based on its type
 */
function formatCypherValue(value: any): string {
  if (value === null) {
    return 'null';
  }
  
  if (typeof value === 'string') {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (value instanceof Date) {
    return `datetime("${value.toISOString()}")`;
  }
  
  if (Array.isArray(value)) {
    const items = value.map(formatCypherValue);
    return `[${items.join(', ')}]`;
  }
  
  if (typeof value === 'object') {
    return formatPropertiesMap(value);
  }
  
  // Default fallback
  return `"${String(value)}"`;
}

/**
 * Convert a form ID to a Neo4j node label with proper casing
 */
export function toNodeLabel(formId: string, prefix?: string): string {
  // Remove common prefixes/suffixes
  let label = formId
    .replace(/Form$/, '')
    .replace(/^form/, '');
  
  // Convert to PascalCase
  label = label
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
  
  // Add custom prefix if specified
  if (prefix) {
    label = prefix + label;
  }
  
  return label;
}

// ======= SPECIALIZED FORM MORPHISMS ========

/**
 * Configuration for form-to-cypher generation
 */
export interface FormToCypherConfig {
  /** Whether to generate parameterized queries (default: true) */
  parameterized?: boolean;
  /** Prefix for node labels (default: none) */
  labelPrefix?: string;
  /** Whether to include metadata properties (default: false) */
  includeMetadata?: boolean;
  /** Default node label when not specified */
  defaultNodeLabel?: string;
  /** Operation to perform (default: create) */
  operation?: 'create' | 'match' | 'update' | 'delete';
  /** Property keys to use as identifiers when matching */
  identifierProperties?: string[];
}

/**
 * Transforms a form shape and data into Cypher queries
 */
export const FormToCypherMorph = new SimpleMorph<FormShape, CypherOutput>(
  "FormToCypherMorph",
  (form, context) => {
    // Validate form input
    if (!form || !form.id) {
      throw new Error("Invalid form provided to FormToCypherMorph");
    }

    // Convert context to NeoContext
    const neoContext = context as NeoContext;
    const config = neoContext.cypher || {};
    
    // Get form data from context
    const formData = neoContext.sthiti || {};
    
    // Generate a default node label from the form id
    const nodeLabel = config.defaultNodeLabel || toNodeLabel(form.id, config.labelPrefix);
    
    // Initialize result
    const result: CypherOutput = {
      id: `cypher-${form.id}-${Date.now()}`,
      queries: [],
      parameters: {},
      meta: {
        generatedAt: new Date().toISOString(),
        sourceFormId: form.id,
        queryCount: 0,
      }
    };

    // Determine operation type
    const operation = config.operation || 'create';
    
    // Generate appropriate query based on operation
    switch (operation) {
      case 'create':
        generateCreateCypher(form, formData, nodeLabel, result, config);
        break;
      case 'match':
        generateMatchCypher(form, formData, nodeLabel, result, config);
        break;
      case 'update':
        generateUpdateCypher(form, formData, nodeLabel, result, config);
        break;
      case 'delete':
        generateDeleteCypher(form, formData, nodeLabel, result, config);
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    // Update meta information
    result.meta.queryCount = result.queries.length;
    
    return result;
  },
  {
    pure: false,
    fusible: true,
    cost: 3,
    memoizable: false
  }
);

/**
 * Generate CREATE query for a form
 */
function generateCreateCypher(
  form: FormShape, 
  formData: Record<string, any>, 
  nodeLabel: string,
  result: CypherOutput,
  config: FormToCypherConfig
): void {
  // Build properties object based on form fields
  const properties: Record<string, any> = {};
  
  form.fields.forEach(field => {
    // Skip fields that shouldn't be included in graph
    if (field.meta?.excludeFromGraph) return;
    
    const value = formData[field.id];
    if (value !== undefined) {
      properties[field.id] = value;
    }
  });
  
  // Add metadata if configured
  if (config.includeMetadata) {
    properties._formId = form.id;
    properties._createdAt = new Date().toISOString();
  }
  
  // Create a query definition using our substrate
  const createQuery: CypherQuery = {
    id: `create-${form.id}`,
    name: `Create ${nodeLabel} node`,
    patterns: [
      {
        variable: 'n',
        labels: [nodeLabel],
        properties,
        operation: 'CREATE'
      }
    ],
    returns: ['n'],
    executionOrder: 1
  };
  
  // Generate the Cypher text
  const { cypher, parameters } = generateCypherQuery(createQuery, { 
    parameterized: config.parameterized !== false 
  });
  
  // Add to result
  result.queries.push({
    id: createQuery.id,
    name: createQuery.name,
    query: cypher,
    purpose: 'create',
    executionOrder: createQuery.executionOrder || 1
  });
  
  // Add parameters to result
  Object.assign(result.parameters, parameters);
  
  // Generate relationship queries if needed
  generateRelationshipCypher(form, formData, nodeLabel, result, config);
}

/**
 * Generate relationship queries for a form
 */
function generateRelationshipCypher(
  form: FormShape, 
  formData: Record<string, any>, 
  nodeLabel: string,
  result: CypherOutput,
  config: FormToCypherConfig
): void {
  // Check for relationship definitions
  const relationships = form.meta?.relationships || [];
  
  if (!Array.isArray(relationships) || relationships.length === 0) {
    return;
  }
  
  relationships.forEach((rel, index) => {
    if (!rel.field || !rel.type || !rel.target) return;
    
    const fieldValue = formData[rel.field];
    if (fieldValue === undefined || fieldValue === null) return;
    
    const targetLabel = rel.targetLabel || rel.target;
    
    // Determine identifier properties for the source node
    const identifiers = config.identifierProperties || 
      Object.keys(formData)
        .filter(key => !Array.isArray(formData[key]) && typeof formData[key] !== 'object')
        .slice(0, 3);
    
    // Create conditions to identify the source node
    const conditions: CypherCondition[] = identifiers
      .filter(prop => formData[prop] !== undefined)
      .map(prop => ({
        left: 'source.' + prop,
        operator: '=',
        right: formData[prop],
        parameterized: true
      }));
    
    if (conditions.length === 0) {
      // Can't identify source node
      return;
    }
    
    // Handle different types of relationship values
    if (Array.isArray(fieldValue)) {
      // Create a relationship to multiple target nodes
      const unwindQuery: CypherQuery = {
        id: `rel-${form.id}-${rel.field}`,
        name: `Create ${rel.type.toUpperCase()} relationships from ${nodeLabel} to ${targetLabel}`,
        patterns: [
          {
            variable: 'source',
            labels: [nodeLabel],
            operation: 'MATCH'
          }
        ],
        conditions,
        executionOrder: 2 + index,
        parameters: {
          values: fieldValue
        }
      };
      
      // Add UNWIND clause - can't use our substrate directly, need to customize
      let cypher = `MATCH (source:${nodeLabel})\n`;
      
      // Add WHERE conditions
      if (conditions.length > 0) {
        cypher += 'WHERE ' + conditions.map(c => {
          const paramName = `source_${c.left.replace('source.', '')}`;
          result.parameters[paramName] = c.right;
          return `${c.left} = $${paramName}`;
        }).join(' AND ') + '\n';
      }
      
      // Add UNWIND and target node handling
      const valuesParam = `values_${rel.field}`;
      result.parameters[valuesParam] = fieldValue;
      
      cypher += `WITH source\n`;
      cypher += `UNWIND $${valuesParam} AS value\n`;
      
      // Match or merge target nodes
      if (rel.createTargets) {
        cypher += `MERGE (target:${targetLabel} {${rel.targetProperty || 'id'}: value})\n`;
      } else {
        cypher += `MATCH (target:${targetLabel} {${rel.targetProperty || 'id'}: value})\n`;
      }
      
      // Create relationship
      cypher += `CREATE (source)-[:${rel.type.toUpperCase()}`;
      
      // Add relationship properties
      if (rel.properties) {
        const relPropsParam = `rel_props_${rel.field}`;
        result.parameters[relPropsParam] = rel.properties;
        cypher += ` $${relPropsParam}`;
      }
      
      cypher += `]->(target)\n`;
      cypher += `RETURN source, target`;
      
      // Add to result
      result.queries.push({
        id: unwindQuery.id,
        name: unwindQuery.name,
        query: cypher,
        purpose: 'create',
        executionOrder: unwindQuery.executionOrder || 1,
        dependencies: [`create-${form.id}`]
      });
    } else {
      // Create a relationship to a single target node
      const relQuery: CypherQuery = {
        id: `rel-${form.id}-${rel.field}`,
        name: `Create ${rel.type.toUpperCase()} relationship from ${nodeLabel} to ${targetLabel}`,
        patterns: [
          {
            variable: 'source',
            labels: [nodeLabel],
            operation: 'MATCH'
          }
        ],
        conditions,
        executionOrder: 2 + index,
        parameters: {
          targetValue: fieldValue
        }
      };
      
      // Build Cypher
      let cypher = `MATCH (source:${nodeLabel})\n`;
      
      // Add WHERE conditions
      if (conditions.length > 0) {
        cypher += 'WHERE ' + conditions.map(c => {
          const paramName = `source_${c.left.replace('source.', '')}`;
          result.parameters[paramName] = c.right;
          return `${c.left} = $${paramName}`;
        }).join(' AND ') + '\n';
      }
      
      // Target node handling
      const valueParam = `value_${rel.field}`;
      result.parameters[valueParam] = fieldValue;
      
      if (rel.createTargets) {
        cypher += `MERGE (target:${targetLabel} {${rel.targetProperty || 'id'}: $${valueParam}})\n`;
      } else {
        cypher += `MATCH (target:${targetLabel} {${rel.targetProperty || 'id'}: $${valueParam}})\n`;
      }
      
      // Create relationship
      cypher += `CREATE (source)-[:${rel.type.toUpperCase()}`;
      
      // Add relationship properties
      if (rel.properties) {
        const relPropsParam = `rel_props_${rel.field}`;
        result.parameters[relPropsParam] = rel.properties;
        cypher += ` $${relPropsParam}`;
      }
      
      cypher += `]->(target)\n`;
      cypher += `RETURN source, target`;
      
      // Add to result
      result.queries.push({
        id: relQuery.id,
        name: relQuery.name,
        query: cypher,
        purpose: 'create',
        executionOrder: relQuery.executionOrder || 1,
        dependencies: [`create-${form.id}`]
      });
    }
  });
}

/**
 * Generate MATCH query for a form
 */
function generateMatchCypher(
  form: FormShape, 
  formData: Record<string, any>, 
  nodeLabel: string,
  result: CypherOutput,
  config: FormToCypherConfig
): void {
  // Determine which properties to use for matching
  const matchProps = config.identifierProperties || 
    form.fields
      .filter(f => f.meta?.identifier || f.id === 'id')
      .map(f => f.id);
  
  if (matchProps.length === 0) {
    throw new Error("No identifier properties found for matching");
  }
  
  // Create conditions for each match property
  const conditions: CypherCondition[] = matchProps
    .filter(prop => formData[prop] !== undefined)
    .map(prop => ({
      left: 'n.' + prop,
      operator: '=',
      right: formData[prop],
      parameterized: config.parameterized !== false
    }));
  
  if (conditions.length === 0) {
    throw new Error("No values provided for matching properties");
  }
  
  // Create a query definition
  const matchQuery: CypherQuery = {
    id: `match-${form.id}`,
    name: `Match ${nodeLabel} node`,
    patterns: [
      {
        variable: 'n',
        labels: [nodeLabel],
        operation: 'MATCH'
      }
    ],
    conditions,
    returns: ['n'],
    executionOrder: 1
  };
  
  // Generate Cypher
  const { cypher, parameters } = generateCypherQuery(matchQuery, {
    parameterized: config.parameterized !== false
  });
  
  // Add to result
  result.queries.push({
    id: matchQuery.id,
    name: matchQuery.name,
    query: cypher,
    purpose: 'match',
    executionOrder: matchQuery.executionOrder || 1
  });
  
  // Add parameters
  Object.assign(result.parameters, parameters);
}

/**
 * Generate UPDATE query for a form
 */
function generateUpdateCypher(
  form: FormShape, 
  formData: Record<string, any>, 
  nodeLabel: string,
  result: CypherOutput,
  config: FormToCypherConfig
): void {
  // Similar implementation to previous, but using our substrate...
  
  // Determine which properties to use for matching
  const matchProps = config.identifierProperties || 
    form.fields
      .filter(f => f.meta?.identifier || f.id === 'id')
      .map(f => f.id);
  
  if (matchProps.length === 0) {
    throw new Error("No identifier properties found for updating");
  }
  
  // Create conditions
  const conditions: CypherCondition[] = matchProps
    .filter(prop => formData[prop] !== undefined)
    .map(prop => ({
      left: 'n.' + prop,
      operator: '=',
      right: formData[prop],
      parameterized: config.parameterized !== false
    }));
  
  if (conditions.length === 0) {
    throw new Error("No values provided for matching properties");
  }
  
  // Collect properties to update
  const updateProps: Record<string, any> = {};
  form.fields.forEach(field => {
    // Skip fields used for matching
    if (matchProps.includes(field.id)) return;
    
    // Skip fields that shouldn't be included in graph
    if (field.meta?.excludeFromGraph) return;
    
    const value = formData[field.id];
    if (value !== undefined) {
      updateProps[field.id] = value;
    }
  });
  
  // Add metadata
  if (config.includeMetadata) {
    updateProps._updatedAt = new Date().toISOString();
  }
  
  if (Object.keys(updateProps).length === 0) {
    throw new Error("No properties to update");
  }
  
  // Create query definition
  const updateQuery: CypherQuery = {
    id: `update-${form.id}`,
    name: `Update ${nodeLabel} node`,
    patterns: [
      {
        variable: 'n',
        labels: [nodeLabel],
        operation: 'MATCH'
      }
    ],
    conditions,
    sets: [
      {
        target: 'n',
        value: updateProps,
        isMap: true,
        parameterized: config.parameterized !== false
      }
    ],
    returns: ['n'],
    executionOrder: 1
  };
  
  // Generate Cypher
  const { cypher, parameters } = generateCypherQuery(updateQuery, {
    parameterized: config.parameterized !== false
  });
  
  // Add to result
  result.queries.push({
    id: updateQuery.id,
    name: updateQuery.name,
    query: cypher,
    purpose: 'update',
    executionOrder: updateQuery.executionOrder || 1
  });
  
  // Add parameters
  Object.assign(result.parameters, parameters);
}

/**
 * Generate DELETE query for a form
 */
function generateDeleteCypher(
  form: FormShape, 
  formData: Record<string, any>, 
  nodeLabel: string,
  result: CypherOutput,
  config: FormToCypherConfig
): void {
  // Determine which properties to use for matching
  const matchProps = config.identifierProperties || 
    form.fields
      .filter(f => f.meta?.identifier || f.id === 'id')
      .map(f => f.id);
  
  if (matchProps.length === 0) {
    throw new Error("No identifier properties found for deletion");
  }
  
  // Create conditions
  const conditions: CypherCondition[] = matchProps
    .filter(prop => formData[prop] !== undefined)
    .map(prop => ({
      left: 'n.' + prop,
      operator: '=',
      right: formData[prop],
      parameterized: config.parameterized !== false
    }));
  
  if (conditions.length === 0) {
    throw new Error("No values provided for matching properties");
  }
  
  // Create query definition
  const deleteQuery: CypherQuery = {
    id: `delete-${form.id}`,
    name: `Delete ${nodeLabel} node`,
    patterns: [
      {
        variable: 'n',
        labels: [nodeLabel],
        operation: 'MATCH'
      }
    ],
    conditions,
    deletes: ['n'],
    detachDelete: true, // Typically safer to use DETACH DELETE
    executionOrder: 1
  };
  
  // Generate Cypher
  const { cypher, parameters } = generateCypherQuery(deleteQuery, {
    parameterized: config.parameterized !== false
  });
  
  // Add to result
  result.queries.push({
    id: deleteQuery.id,
    name: deleteQuery.name,
    query: cypher,
    purpose: 'delete',
    executionOrder: deleteQuery.executionOrder || 1
  });
  
  // Add parameters
  Object.assign(result.parameters, parameters);
}