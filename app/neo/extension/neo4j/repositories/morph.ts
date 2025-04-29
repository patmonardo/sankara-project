import { Neo4jConnection } from "../connection";
import {
  FormMorph,
  FormMorphPipeline,
  FormMorphSchema,
} from "@/form/schema/morph";
import { Record as Neo4jRecord } from "neo4j-driver";
import { Session } from "neo4j-driver";
import { v4 as uuidv4 } from "uuid";

/**
 * MorphRepository
 *
 * Manages the persistence of Form Morphs in Neo4j.
 * Morphs represent transformations between different representations
 * while preserving essential structure.
 */
export class MorphRepository {
  private connection: Neo4jConnection;

  constructor(connection: Neo4jConnection) {
    this.connection = connection;
  }

  /**
   * Save a morph definition to Neo4j
   *
   * Creates or updates a morph node and its relationships
   */
  async saveMorph(morph: FormMorph): Promise<FormMorph> {
    const session = this.connection.getSession();

    try {
      const txc = session.beginTransaction();

      // Create or update the morph node
      await txc.run(
        `
        MERGE (m:Morph {id: $id})
        SET m.name = $name,
            m.description = $description,
            m.inputType = $inputType,
            m.outputType = $outputType,
            m.transformFn = $transformFn,
            m.updated = datetime()
            
        FOREACH (__ IN CASE WHEN $config IS NOT NULL THEN [1] ELSE [] END | 
          SET m.config = $config)
          
        FOREACH (__ IN CASE WHEN $meta IS NOT NULL THEN [1] ELSE [] END | 
          SET m.meta = $meta)
          
        RETURN m
      `,
        {
          id: morph.id,
          name: morph.name || morph.id,
          description: morph.description || "",
          inputType: morph.inputType,
          outputType: morph.outputType,
          transformFn: morph.transformFn,
          config: morph.config ? JSON.stringify(morph.config) : null,
          meta: morph.meta ? JSON.stringify(morph.meta) : null,
        }
      );

      // Handle implementation details
      if (morph.implementation) {
        await txc.run(
          `
          MATCH (m:Morph {id: $id})
          SET m.implementation = $implementation
          RETURN m
        `,
          {
            id: morph.id,
            implementation: JSON.stringify(morph.implementation),
          }
        );
      }

      // Handle composition structure
      if (morph.composition) {
        await txc.run(
          `
          MATCH (m:Morph {id: $id})
          SET m.compositionType = $compositionType,
              m.compositionStrategy = $compositionStrategy
          RETURN m
        `,
          {
            id: morph.id,
            compositionType: morph.composition.type,
            compositionStrategy:
              morph.composition.compositionType || "sequential",
          }
        );

        // If it's a composite morph, handle component morph references
        if (morph.composition.morphs && morph.composition.morphs.length > 0) {
          // First delete old component relationships
          await txc.run(
            `
            MATCH (m:Morph {id: $id})-[r:INCLUDES_MORPH]->(:Morph)
            DELETE r
            RETURN m
          `,
            { id: morph.id }
          );

          // Create new relationships for each component morph
          for (let i = 0; i < morph.composition.morphs.length; i++) {
            const componentId = morph.composition.morphs[i];

            await txc.run(
              `
              MATCH (m:Morph {id: $id})
              MATCH (comp:Morph {id: $componentId})
              MERGE (m)-[:INCLUDES_MORPH {order: $order}]->(comp)
              RETURN comp
            `,
              {
                id: morph.id,
                componentId: componentId,
                order: i,
              }
            );
          }
        }
      }

      await txc.commit();

      return morph;
    } catch (error) {
      console.error(`Error saving morph to Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Save a morph pipeline to Neo4j
   *
   * Creates or updates a pipeline and its component morphs
   */
  async saveMorphPipeline(
    pipeline: FormMorphPipeline
  ): Promise<FormMorphPipeline> {
    const session = this.connection.getSession();

    try {
      const txc = session.beginTransaction();

      // Create or update the pipeline node
      await txc.run(
        `
        MERGE (p:MorphPipeline {id: $id})
        SET p.name = $name,
            p.description = $description,
            p.inputType = $inputType,
            p.outputType = $outputType,
            p.optimized = $optimized,
            p.updated = datetime()
            
        FOREACH (__ IN CASE WHEN $config IS NOT NULL THEN [1] ELSE [] END | 
          SET p.config = $config)
          
        FOREACH (__ IN CASE WHEN $meta IS NOT NULL THEN [1] ELSE [] END | 
          SET p.meta = $meta)
          
        RETURN p
      `,
        {
          id: pipeline.id,
          name: pipeline.name || pipeline.id,
          description: pipeline.description || "",
          inputType: pipeline.inputType,
          outputType: pipeline.outputType,
          optimized: pipeline.optimized || false,
          config: pipeline.config ? JSON.stringify(pipeline.config) : null,
          meta: pipeline.meta ? JSON.stringify(pipeline.meta) : null,
        }
      );

      // Clear existing pipeline steps
      await txc.run(
        `
        MATCH (p:MorphPipeline {id: $id})-[r:PIPELINE_STEP]->(:Morph)
        DELETE r
        RETURN p
      `,
        { id: pipeline.id }
      );

      // Create relationships for each morph in the pipeline
      for (let i = 0; i < pipeline.morphs.length; i++) {
        const morphId = pipeline.morphs[i];

        await txc.run(
          `
          MATCH (p:MorphPipeline {id: $id})
          MATCH (m:Morph {id: $morphId})
          MERGE (p)-[:PIPELINE_STEP {order: $order}]->(m)
          RETURN m
        `,
          {
            id: pipeline.id,
            morphId: morphId,
            order: i,
          }
        );
      }

      await txc.commit();

      return pipeline;
    } catch (error) {
      console.error(`Error saving morph pipeline to Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get a morph by ID
   *
   * Retrieves a complete morph definition from Neo4j
   */
  async getMorphById(id: string): Promise<FormMorph | null> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      const result = await session.run(
        `
        MATCH (m:Morph {id: $id})
        RETURN m
      `,
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const morphNode = result.records[0].get("m").properties;

      // Parse configuration if it exists
      let config = undefined;
      if (morphNode.config) {
        try {
          config = JSON.parse(morphNode.config);
        } catch (e) {
          console.error(`Error parsing morph config: ${e}`);
        }
      }

      // Parse metadata if it exists
      let meta = undefined;
      if (morphNode.meta) {
        try {
          meta = JSON.parse(morphNode.meta);
        } catch (e) {
          console.error(`Error parsing morph meta: ${e}`);
        }
      }

      // Parse implementation if it exists
      let implementation = undefined;
      if (morphNode.implementation) {
        try {
          implementation = JSON.parse(morphNode.implementation);
        } catch (e) {
          console.error(`Error parsing morph implementation: ${e}`);
        }
      }

      // Get composition structure for composite morphs
      let composition = undefined;
      if (morphNode.compositionType) {
        // Get component morphs
        const componentsResult = await session.run(
          `
          MATCH (m:Morph {id: $id})-[r:INCLUDES_MORPH]->(comp:Morph)
          WITH comp, r.order as morphOrder
          ORDER BY morphOrder
          RETURN comp.id as morphId
        `,
          { id }
        );

        const morphs = componentsResult.records.map((record) =>
          record.get("morphId")
        );

        composition = {
          type: morphNode.compositionType,
          morphs: morphs,
          compositionType: morphNode.compositionStrategy || "sequential",
        };
      }

      // Build the complete morph object
      const morph: FormMorph = {
        id: morphNode.id,
        name: morphNode.name,
        description: morphNode.description,
        inputType: morphNode.inputType,
        outputType: morphNode.outputType,
        transformFn: morphNode.transformFn,
        config,
        meta,
        implementation,
        composition,
      };

      // Validate with schema
      return FormMorphSchema.parse(morph);
    } catch (error) {
      console.error(`Error getting morph from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get a pipeline by ID
   *
   * Retrieves a complete pipeline definition from Neo4j
   */
  async getPipelineById(id: string): Promise<FormMorphPipeline | null> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      const result = await session.run(
        `
        MATCH (p:MorphPipeline {id: $id})
        RETURN p
      `,
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const pipelineNode = result.records[0].get("p").properties;

      // Parse configuration if it exists
      let config = undefined;
      if (pipelineNode.config) {
        try {
          config = JSON.parse(pipelineNode.config);
        } catch (e) {
          console.error(`Error parsing pipeline config: ${e}`);
        }
      }

      // Parse metadata if it exists
      let meta = undefined;
      if (pipelineNode.meta) {
        try {
          meta = JSON.parse(pipelineNode.meta);
        } catch (e) {
          console.error(`Error parsing pipeline meta: ${e}`);
        }
      }

      // Get morph steps in the pipeline
      const stepsResult = await session.run(
        `
        MATCH (p:MorphPipeline {id: $id})-[r:PIPELINE_STEP]->(m:Morph)
        WITH m, r.order as stepOrder
        ORDER BY stepOrder
        RETURN m.id as morphId
      `,
        { id }
      );

      const morphs = stepsResult.records.map((record) => record.get("morphId"));

      // Build the complete pipeline object
      const pipeline: FormMorphPipeline = {
        id: pipelineNode.id,
        name: pipelineNode.name,
        description: pipelineNode.description,
        morphs,
        inputType: pipelineNode.inputType,
        outputType: pipelineNode.outputType,
        optimized: pipelineNode.optimized,
        config,
        meta,
      };

      return pipeline;
    } catch (error) {
      console.error(`Error getting morph pipeline from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Find morphs by criteria
   */
  async findMorphs(
    criteria: {
      inputType?: string;
      outputType?: string;
      name?: string;
    } = {}
  ): Promise<FormMorph[]> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      let query = `
        MATCH (m:Morph)
        WHERE 1=1
      `;

      const params: Record<string, any> = {};

      if (criteria.inputType) {
        query += ` AND m.inputType = $inputType`;
        params.inputType = criteria.inputType;
      }

      if (criteria.outputType) {
        query += ` AND m.outputType = $outputType`;
        params.outputType = criteria.outputType;
      }

      if (criteria.name) {
        query += ` AND m.name CONTAINS $name`;
        params.name = criteria.name;
      }

      query += ` RETURN m.id as id`;

      const result = await session.run(query, params);

      // Get complete morph objects
      const morphs: FormMorph[] = [];

      for (const record of result.records) {
        const morphId = record.get("id");
        const morph = await this.getMorphById(morphId);

        if (morph) {
          morphs.push(morph);
        }
      }

      return morphs;
    } catch (error) {
      console.error(`Error finding morphs in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Find pipelines by criteria
   */
  async findPipelines(
    criteria: {
      inputType?: string;
      outputType?: string;
      name?: string;
      includingMorph?: string;
    } = {}
  ): Promise<FormMorphPipeline[]> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      let query = `
        MATCH (p:MorphPipeline)
        WHERE 1=1
      `;

      const params: Record<string, any> = {};

      if (criteria.inputType) {
        query += ` AND p.inputType = $inputType`;
        params.inputType = criteria.inputType;
      }

      if (criteria.outputType) {
        query += ` AND p.outputType = $outputType`;
        params.outputType = criteria.outputType;
      }

      if (criteria.name) {
        query += ` AND p.name CONTAINS $name`;
        params.name = criteria.name;
      }

      if (criteria.includingMorph) {
        query += ` AND (p)-[:PIPELINE_STEP]->(:Morph {id: $morphId})`;
        params.morphId = criteria.includingMorph;
      }

      query += ` RETURN p.id as id`;

      const result = await session.run(query, params);

      // Get complete pipeline objects
      const pipelines: FormMorphPipeline[] = [];

      for (const record of result.records) {
        const pipelineId = record.get("id");
        const pipeline = await this.getPipelineById(pipelineId);

        if (pipeline) {
          pipelines.push(pipeline);
        }
      }

      return pipelines;
    } catch (error) {
      console.error(`Error finding pipelines in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Record a morph execution result in Neo4j
   *
   * This creates a historical record of morph applications
   */
  async recordMorphExecution(
    morphId: string,
    input: any,
    output: any,
    success: boolean,
    contextId?: string,
    error?: { message: string; code?: string; details?: any }
  ): Promise<string> {
    const session = this.connection.getSession();

    try {
      const executionId = uuidv4();
      const timestamp = new Date().toISOString();

      await session.run(
        `
        MATCH (m:Morph {id: $morphId})
        
        CREATE (exec:MorphExecution {
          id: $execId,
          timestamp: datetime($timestamp),
          success: $success,
          inputType: m.inputType,
          outputType: m.outputType
        })
        
        SET exec.inputSnapshot = $inputSnapshot,
            exec.outputSnapshot = $outputSnapshot
            
        FOREACH (__ IN CASE WHEN $error IS NOT NULL THEN [1] ELSE [] END | 
          SET exec.error = $error)
          
        MERGE (m)-[:HAS_EXECUTION]->(exec)
        
        FOREACH (__ IN CASE WHEN $contextId IS NOT NULL THEN [1] ELSE [] END | 
          MERGE (c:Context {id: $contextId})
          MERGE (exec)-[:IN_CONTEXT]->(c)
        )
        
        RETURN exec
      `,
        {
          morphId: morphId,
          execId: executionId,
          timestamp: timestamp,
          success: success,
          inputSnapshot: this.createSnapshot(input),
          outputSnapshot: this.createSnapshot(output),
          error: error ? JSON.stringify(error) : null,
          contextId: contextId,
        }
      );

      return executionId;
    } catch (error) {
      console.error(`Error recording morph execution in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create a snapshot of data for storage
   *
   * This creates a simplified version of complex data for efficient storage
   */
  private createSnapshot(data: any): string {
    if (data === undefined || data === null) {
      return JSON.stringify(null);
    }

    // For objects that are too large, create a summarized version
    if (typeof data === "object") {
      const isArray = Array.isArray(data);
      const entries = isArray ? data : Object.entries(data);

      if (entries.length > 20) {
        if (isArray) {
          // For large arrays, keep first and last few items
          const preview = [
            ...data.slice(0, 5),
            { _summary: `[${entries.length - 10} additional items]` },
            ...data.slice(-5),
          ];
          return JSON.stringify(preview);
        } else {
          // For large objects, keep a subset of keys
          const keys = Object.keys(data);
          const preview: Record<string, any> = {}; // Explicitly type the preview object

          // Add first 5 keys
          keys.slice(0, 5).forEach((key: string) => {
            preview[key] = data[key];
          });

          // Add summary
          preview["_summary"] = `{${keys.length - 10} additional properties}`;

          // Add last 5 keys
          keys.slice(-5).forEach((key: string) => {
            preview[key] = data[key];
          });

          return JSON.stringify(preview);
        }
      }
    }

    // Just stringify regular data
    try {
      return JSON.stringify(data);
    } catch (e) {
      return JSON.stringify({ _error: "Data could not be serialized" });
    }
  }

  /**
   * Delete a morph by ID
   */
  async deleteMorph(id: string): Promise<boolean> {
    const session = this.connection.getSession();

    try {
      const txc = session.beginTransaction();

      // Check if morph is used in any pipelines
      const pipelineCheckResult = await txc.run(
        `
        MATCH (p:MorphPipeline)-[:PIPELINE_STEP]->(m:Morph {id: $id})
        RETURN p.id as pipelineId, p.name as pipelineName
        LIMIT 1
      `,
        { id }
      );

      // If used in pipelines, prevent deletion
      if (pipelineCheckResult.records.length > 0) {
        const record = pipelineCheckResult.records[0];
        const pipelineId = record.get("pipelineId");
        const pipelineName = record.get("pipelineName");

        await txc.rollback();
        throw new Error(
          `Cannot delete morph: it is used in pipeline "${pipelineName}" (${pipelineId})`
        );
      }

      // Proceed with deletion
      await txc.run(
        `
        MATCH (m:Morph {id: $id})
        OPTIONAL MATCH (m)-[:INCLUDES_MORPH]->(comp:Morph)
        OPTIONAL MATCH (m)-[:HAS_EXECUTION]->(exec:MorphExecution)
        
        // Delete relationships but keep executions and component morphs
        DETACH DELETE m
        
        RETURN count(*) as deleted
      `,
        { id }
      );

      await txc.commit();

      return true;
    } catch (error) {
      console.error(`Error deleting morph from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Delete a pipeline by ID
   */
  async deletePipeline(id: string): Promise<boolean> {
    const session = this.connection.getSession();

    try {
      const txc = session.beginTransaction();

      // Delete the pipeline but keep the component morphs
      await txc.run(
        `
        MATCH (p:MorphPipeline {id: $id})
        DETACH DELETE p
        RETURN count(*) as deleted
      `,
        { id }
      );

      await txc.commit();

      return true;
    } catch (error) {
      console.error(`Error deleting pipeline from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Analyze morph usage in the system
   *
   * Returns statistics about how morphs are being used
   */
  async analyzeMorphUsage(): Promise<{
    totalMorphs: number;
    totalPipelines: number;
    mostUsedMorphs: Array<{ id: string; name: string; usageCount: number }>;
    recentExecutions: Array<{
      id: string;
      morphId: string;
      timestamp: string;
      success: boolean;
    }>;
  }> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      // Get total counts
      const countsResult = await session.run(`
        MATCH (m:Morph)
        WITH count(m) as morphCount
        MATCH (p:MorphPipeline)
        RETURN morphCount, count(p) as pipelineCount
      `);

      const totalMorphs = countsResult.records[0].get("morphCount").toNumber();
      const totalPipelines = countsResult.records[0]
        .get("pipelineCount")
        .toNumber();

      // Get most used morphs
      const usageResult = await session.run(`
        MATCH (m:Morph)<-[:PIPELINE_STEP]-(p:MorphPipeline)
        WITH m, count(p) as usageCount
        ORDER BY usageCount DESC
        LIMIT 5
        RETURN m.id as id, m.name as name, usageCount
      `);

      const mostUsedMorphs = usageResult.records.map((record) => ({
        id: record.get("id"),
        name: record.get("name"),
        usageCount: record.get("usageCount").toNumber(),
      }));

      // Get recent executions
      const executionsResult = await session.run(`
        MATCH (exec:MorphExecution)<-[:HAS_EXECUTION]-(m:Morph)
        WITH exec, m
        ORDER BY exec.timestamp DESC
        LIMIT 10
        RETURN exec.id as id, m.id as morphId, 
               toString(exec.timestamp) as timestamp, 
               exec.success as success
      `);

      const recentExecutions = executionsResult.records.map((record) => ({
        id: record.get("id"),
        morphId: record.get("morphId"),
        timestamp: record.get("timestamp"),
        success: record.get("success"),
      }));

      return {
        totalMorphs,
        totalPipelines,
        mostUsedMorphs,
        recentExecutions,
      };
    } catch (error) {
      console.error(`Error analyzing morph usage in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
}
