import neo4j, { Driver, Session, SessionConfig } from "neo4j-driver";
import { neo4jDriver as defaultDriver } from "@/form/data/neo4j-client";

export interface Neo4jConnectionConfig {
  uri?: string;
  username?: string;
  password?: string;
  useDefaultDriver?: boolean;
}

export class Neo4jConnection {
  public driver?: Driver;
  private config: Neo4jConnectionConfig;
  private initialized: boolean = false;

  constructor(config: Neo4jConnectionConfig = {}) {
    this.config = {
      uri: "neo4j://localhost:7687",
      username: "neo4j",
      password: "password",
      useDefaultDriver: true,
      ...config, // Override defaults with any provided config
    };

    // Use the provided configuration or the default driver
    if (this.config.useDefaultDriver) {
      this.driver = defaultDriver;
    }
    // Otherwise, driver will be created in initialize()
  }

  /**
   * Initialize the connection
   */
  async initialize(): Promise<void> {
    // If using default driver, just mark as initialized
    if (this.config.useDefaultDriver && this.driver) {
      this.initialized = true;
      return;
    }

    // If driver not initialized and not using default, create new driver
    if (!this.driver) {
      try {
        this.driver = neo4j.driver(
          this.config.uri!,
          neo4j.auth.basic(this.config.username!, this.config.password!),
          {
            maxConnectionPoolSize: 50,
            connectionAcquisitionTimeout: 5000,
            disableLosslessIntegers: true,
          }
        );

        // Verify connectivity
        const session = this.driver.session();
        const result = await session.run("RETURN 1 AS n");
        await session.close();
        this.initialized = true;
        console.log("Connected to Neo4j successfully");
      } catch (error: unknown) {
        this.driver = undefined;
        console.error("Failed to connect to Neo4j:", error);
        // Handle error message properly based on type
        let errorMessage = "Unknown error";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === "string") {
          errorMessage = error;
        } else if (error && typeof error === "object" && "toString" in error) {
          errorMessage = error.toString();
        }
      }
    }
  }

  /**
   * Get a Neo4j session
   */
  getSession(config?: SessionConfig): Session {
    if (!this.initialized || !this.driver) {
      throw new Error(
        "Neo4j connection not initialized. Call initialize() first."
      );
    }
    return this.driver.session(config);
  }

  /**
   * Get the underlying driver
   */
  getDriver(): Driver {
    if (!this.initialized || !this.driver) {
      throw new Error(
        "Neo4j connection not initialized. Call initialize() first."
      );
    }
    return this.driver;
  }

  /**
   * Close the Neo4j connection
   */
  async close(): Promise<void> {
    if (this.driver && !this.config.useDefaultDriver) {
      await this.driver.close();
    }
    this.initialized = false;
    if (!this.config.useDefaultDriver) {
      this.driver = undefined;
    }
  }

  /**
   * Check if connection is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
