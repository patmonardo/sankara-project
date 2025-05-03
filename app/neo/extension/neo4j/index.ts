import { Neo4jConnection } from "./connection";
import { Neo4jSchemaManager } from "./schema";
import { PropertyRepository } from "./repository/property.";
import { EntityRepository } from "./repository/entity";
import { RelationRepository } from "./repository/relation";
import { FormDefinitionRepository } from "./repository/schema";
import { FormRepository } from "./repository/form";
import { ContextRepository } from "./repository/context";
import { MorphRepository } from "./repository/morph";

/**
 * Neo4j Module - Main entry point for Neo4j integration
 */
export class Neo4jModule {
  private connection: Neo4jConnection;
  private schemaManager!: Neo4jSchemaManager; // Using definite assignment assertion

  // Repositories
  public property!: PropertyRepository;
  public entity!: EntityRepository;
  public relation!: RelationRepository;
  public formDef!: FormDefinitionRepository;
  public form!: FormRepository;
  public context!: ContextRepository;
  public morph!: MorphRepository;

  /**
   * Create Neo4j module
   */
  constructor(config: {
    uri: string;
    username: string;
    password: string;
    database?: string;
  }) {
    this.connection = new Neo4jConnection(config);
    // We'll initialize repositories after connection is established
  }

  /**
   * Initialize Neo4j module
   */
  async initialize(): Promise<void> {
    // Connect to Neo4j
    await this.connection.initialize();

    // Now that we know the connection is established, we can safely get the driver
    // and initialize the schema manager and repositories
    this.schemaManager = new Neo4jSchemaManager(this.connection.getDriver());

    // Initialize repositories
    this.property = new PropertyRepository(this.connection);
    this.entity = new EntityRepository(this.connection);
    this.relation = new RelationRepository(this.connection);
    this.formDef = new FormDefinitionRepository(this.connection);
    this.form = new FormRepository(this.connection);
    this.context = new ContextRepository(this.connection);
    this.morph = new MorphRepository(this.connection);

    // Set up schema
    await this.schemaManager.initializeSchema();

    // Define relationship types
    await this.schemaManager.defineRelationshipTypes();

    // Create property type nodes
    await this.schemaManager.createPropertyTypeNodes();

    // Define constraints for each entity type
    await this.defineConstraints();
  }

  /**
   * Define Neo4j constraints for our entity types
   */
  private async defineConstraints(): Promise<void> {
    const constraints = [
      // Form system constraints
      "CREATE CONSTRAINT IF NOT EXISTS FOR (f:Form) REQUIRE f.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (fd:FormDefinition) REQUIRE fd.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Context) REQUIRE c.id IS UNIQUE",

      // Entity system constraints
      "CREATE CONSTRAINT IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (ed:EntityDefinition) REQUIRE ed.id IS UNIQUE",

      // Property constraints
      "CREATE CONSTRAINT IF NOT EXISTS FOR (p:Property) REQUIRE p.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (pt:PropertyType) REQUIRE pt.name IS UNIQUE",

      // Relationship constraints
      "CREATE CONSTRAINT IF NOT EXISTS FOR (rd:RelationDefinition) REQUIRE rd.id IS UNIQUE",

      // Morphism constraints
      "CREATE CONSTRAINT IF NOT EXISTS FOR (m:Morph) REQUIRE m.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (mp:MorphPipeline) REQUIRE mp.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (me:MorphExecution) REQUIRE me.id IS UNIQUE",

      // Support entities
      "CREATE CONSTRAINT IF NOT EXISTS FOR (t:Tag) REQUIRE t.name IS UNIQUE",
    ];

    const session = this.connection.getSession();

    try {
      for (const constraint of constraints) {
        await session.run(constraint);
      }
    } finally {
      await session.close();
    }
  }

  /**
   * Shutdown Neo4j module
   */
  async shutdown(): Promise<void> {
    await this.connection.close();
  }

  /**
   * Get all repositories as a collection
   */
  public getRepositories() {
    return {
      property: this.property,
      entity: this.entity,
      relation: this.relation,
      formDef: this.formDef,
      form: this.form,
      context: this.context,
      morph: this.morph,
    };
  }
}
