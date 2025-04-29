import { NeoExtension, NeoComponentId } from "../extension";
import { Neo4jConnection } from "./neo4j/connection";
import { FormDefinitionRepository } from "./neo4j/repositories/schema";
import { FormRepository } from "./neo4j/repositories/form";
import { ContextRepository } from "./neo4j/repositories/context";
import { MorphRepository } from "./neo4j/repositories/morph";
import { EntityRepository } from "./neo4j/repositories/entity";
import { RelationRepository } from "./neo4j/repositories/relation";
import { NeoEvent } from "../event";

export class Neo4jExtension implements NeoExtension {
  id: NeoComponentId = {
    id: "neo4j-extension",
    type: "neo:extension:database",
    name: "Neo4j Graph Database",
  };
  type: string = "neo4j";
  description: string = "Neo4j Graph Database Extension";
  version: string = "1.0.0";
  handleEvent: (event: NeoEvent) => void;
  
  private connection: Neo4jConnection;

  // Repositories
  public formDefRepo: FormDefinitionRepository;
  public formRepo: FormRepository;
  public contextRepo: ContextRepository;
  public morphRepo: MorphRepository;
  public entityRepo: EntityRepository;
  public relationRepo: RelationRepository;

  // Core reference
  private core: any;

  /**
   * Constructor - initialize connection and repositories
   * Note: This doesn't connect to the database yet - that happens in initialize()
   */
  constructor() {
    // Create connection instance (not connected yet)
    this.connection = new Neo4jConnection({
      uri: process.env.NEO4J_URI || "neo4j://localhost:7687",
      username: process.env.NEO4J_USER || "neo4j",
      password: process.env.NEO4J_PASSWORD || "password",
    });

    // Initialize repositories with connection instance
    this.formDefRepo = new FormDefinitionRepository(this.connection);
    this.formRepo = new FormRepository(this.connection);
    this.contextRepo = new ContextRepository(this.connection);
    this.morphRepo = new MorphRepository(this.connection);
    this.entityRepo = new EntityRepository(this.connection);
    this.relationRepo = new RelationRepository(this.connection);
    
    // Initialize event handler
    this.handleEvent = this.processEvent.bind(this);
  }

  /**
   * Initialize the Neo4j extension - connect to the database
   */
  async initialize(core: any): Promise<void> {
    this.core = core;

    // Connect to Neo4j database
    await this.connection.initialize();

    // Set up event listeners
    this.setupEventListeners();

    this.core.logger.info("Neo4j Extension initialized successfully");
  }
  
  /**
   * Process events from the core
   */
  private processEvent(event: NeoEvent): void {
    // Process incoming events from the core
    // This can be expanded to handle different event types
    this.core?.logger?.debug(`Neo4j Extension received event: ${event.type}`);
    
    // Additional event handling logic can be added here
  }

  /**
   * Setup event listeners for synchronizing data with Neo4j
   */
  private setupEventListeners(): void {
    // Listen for form definition events
    this.core.on("formDefinition", (event: any) => {
      if (event.subtype === "created" || event.subtype === "updated") {
        this.formDefRepo
          .saveDefinition(event.content.definition)
          .catch((err) =>
            this.core.logger.error(`Error saving form definition: ${err}`)
          );
      } else if (event.subtype === "deleted") {
        this.formDefRepo
          .deleteDefinition(event.content.id)
          .catch((err) =>
            this.core.logger.error(`Error deleting form definition: ${err}`)
          );
      }
    });

    // Listen for form events
    this.core.on("form", (event: any) => {
      if (event.subtype === "created" || event.subtype === "updated") {
        this.formRepo
          .saveForm(event.content.form)
          .catch((err) => this.core.logger.error(`Error saving form: ${err}`));
      } else if (event.subtype === "deleted") {
        this.formRepo
          .deleteForm(event.content.id)
          .catch((err) =>
            this.core.logger.error(`Error deleting form: ${err}`)
          );
      }
    });

    // Listen for context events
    this.core.on("context", (event: any) => {
      if (event.subtype === "created" || event.subtype === "updated") {
        this.contextRepo
          .saveContext(event.content.context)
          .catch((err) =>
            this.core.logger.error(`Error saving context: ${err}`)
          );
      } else if (event.subtype === "deleted") {
        this.contextRepo
          .deleteContext(event.content.id)
          .catch((err) =>
            this.core.logger.error(`Error deleting context: ${err}`)
          );
      }
    });

    // Listen for morph events
    this.core.on("morph", (event: any) => {
      if (event.subtype === "created" || event.subtype === "updated") {
        this.morphRepo
          .saveMorph(event.content.morph)
          .catch((err) => this.core.logger.error(`Error saving morph: ${err}`));
      } else if (event.subtype === "deleted") {
        this.morphRepo
          .deleteMorph(event.content.id)
          .catch((err) =>
            this.core.logger.error(`Error deleting morph: ${err}`)
          );
      } else if (event.subtype === "executed") {
        this.morphRepo
          .recordMorphExecution(
            event.content.morphId,
            event.content.input,
            event.content.output,
            event.content.success,
            event.content.contextId,
            event.content.error
          )
          .catch((err) =>
            this.core.logger.error(`Error recording morph execution: ${err}`)
          );
      }
    });

    // Listen for morph pipeline events
    this.core.on("morphPipeline", (event: any) => {
      if (event.subtype === "created" || event.subtype === "updated") {
        this.morphRepo
          .saveMorphPipeline(event.content.pipeline)
          .catch((err) =>
            this.core.logger.error(`Error saving morph pipeline: ${err}`)
          );
      } else if (event.subtype === "deleted") {
        this.morphRepo
          .deletePipeline(event.content.id)
          .catch((err) =>
            this.core.logger.error(`Error deleting morph pipeline: ${err}`)
          );
      }
    });
    
    // Listen for entity events
    this.core.on("entity", (event: any) => {
      if (event.subtype === "created" || event.subtype === "updated") {
        this.entityRepo
          .saveEntity(event.content.entity)
          .catch((err) => this.core.logger.error(`Error saving entity: ${err}`));
      } else if (event.subtype === "deleted") {
        this.entityRepo
          .deleteEntity(event.content.id)
          .catch((err) =>
            this.core.logger.error(`Error deleting entity: ${err}`)
          );
      } else if (event.subtype === "definition:created" || event.subtype === "definition:updated") {
        this.entityRepo
          .saveEntityDefinition(event.content.definition)
          .catch((err) => this.core.logger.error(`Error saving entity definition: ${err}`));
      } else if (event.subtype === "definition:deleted") {
        this.entityRepo
          .deleteEntityDefinition(event.content.id)
          .catch((err) =>
            this.core.logger.error(`Error deleting entity definition: ${err}`)
          );
      }
    });
    
    // Listen for relation events
    this.core.on("relation", (event: any) => {
      if (event.subtype === "created" || event.subtype === "updated") {
        this.relationRepo
          .saveRelationInstance(event.content.relation)
          .catch((err) => this.core.logger.error(`Error saving relation: ${err}`));
      } else if (event.subtype === "deleted") {
        this.relationRepo
          .deleteRelationInstance(event.content.id)
          .catch((err) =>
            this.core.logger.error(`Error deleting relation: ${err}`)
          );
      } else if (event.subtype === "instance:created") {
        this.relationRepo
          .createRelationInstance(event.content)
          .catch((err) => this.core.logger.error(`Error creating relation instance: ${err}`));
      } else if (event.subtype === "instance:updated") {
        this.relationRepo
          .updateRelationInstance(event.content.id, event.content.properties)
          .catch((err) => this.core.logger.error(`Error updating relation instance: ${err}`));
      } else if (event.subtype === "instance:deleted") {
        this.relationRepo
          .deleteRelationInstance(event.content.id)
          .catch((err) =>
            this.core.logger.error(`Error deleting relation instance: ${err}`)
          );
      }
    });
  }

  /**
   * Close the Neo4j connection on shutdown
   */
  async shutdown(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
    }
  }
}