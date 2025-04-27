#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { createGraphPipeline } from './pipeline';
import { GraphConfig } from './types';

// Define the program
program
  .name('graph')
  .description('Graph analysis and visualization utility for Forms')
  .version('1.0.0');

// Create a graph from a form
program
  .command('create <formPath>')
  .description('Create a graph from a form definition')
  .option('-o, --output <path>', 'Output path for the graph JSON')
  .option('-t, --test-data', 'Include test data in the graph')
  .option('-p, --prefix <prefix>', 'Label prefix for entities')
  .option('-e, --exclude <fields>', 'Fields to exclude from graph (comma-separated)')
  .action(async (formPath, options) => {
    try {
      console.log(chalk.blue('📊 Creating graph from form...'));
      
      // Read form definition
      const formData = JSON.parse(fs.readFileSync(formPath, 'utf-8'));
      
      // Create config
      const config: GraphConfig = {
        includeTestData: options.testData,
        labelPrefix: options.prefix,
        includeMetadata: true,
        excludeFromGraph: options.exclude?.split(',') || []
      };
      
      // Create pipeline
      const pipeline = createGraphPipeline();
      
      // Create graph
      const graph = pipeline.createGraph(formData, config);
      
      console.log(chalk.green('✓ Graph created successfully'));
      console.log(chalk.gray(`• ${graph.entities.length} entities`));
      console.log(chalk.gray(`• ${graph.relationships.length} relationships`));
      
      // Write output if requested
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));
        console.log(chalk.green(`✓ Graph saved to ${outputPath}`));
      }
    } catch (error) {
      console.error(chalk.red('Error creating graph:'), error);
      process.exit(1);
    }
  });

// Analyze a graph
program
  .command('analyze <graphPath>')
  .description('Analyze a graph')
  .option('-o, --output <path>', 'Output path for analyzed graph')
  .option('-c, --communities', 'Include community detection')
  .option('-m, --measures', 'Include centrality measures')
  .option('-p, --paths', 'Include path analysis')
  .action(async (graphPath, options) => {
    try {
      console.log(chalk.blue('🔍 Analyzing graph...'));
      
      // Read graph
      const graphData = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
      
      // Create config
      const config: GraphConfig = {
        analysis: {
          perform: true,
          includeCommunities: options.communities,
          includeCentrality: options.measures,
          includePaths: options.paths
        }
      };
      
      // Create pipeline
      const pipeline = createGraphPipeline();
      
      // Analyze graph
      const analyzedGraph = pipeline.analyzeGraph(graphData, config.analysis);
      
      console.log(chalk.green('✓ Graph analyzed successfully'));
      console.log(chalk.gray('Analysis results:'));
      
      // Show metrics
      const metrics = analyzedGraph.analysis.metrics;
      console.log(chalk.gray('  Entity counts:'));
      Object.entries(metrics.entityCounts).forEach(([type, count]) => {
        console.log(chalk.gray(`    • ${type}: ${count}`));
      });
      
      console.log(chalk.gray(`  Average connectivity: ${metrics.averageConnectivity.toFixed(2)}`));
      
      // Show communities if present
      if (analyzedGraph.analysis.communities) {
        console.log(chalk.gray(`  Communities detected: ${analyzedGraph.analysis.communities.length}`));
      }
      
      // Write output if requested
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(analyzedGraph, null, 2));
        console.log(chalk.green(`✓ Analyzed graph saved to ${outputPath}`));
      }
    } catch (error) {
      console.error(chalk.red('Error analyzing graph:'), error);
      process.exit(1);
    }
  });

// Visualize a graph
program
  .command('visualize <graphPath>')
  .description('Generate visualization for a graph')
  .option('-o, --output <path>', 'Output path for visualization')
  .option('-l, --layout <type>', 'Layout algorithm (force, circular, hierarchical)', 'force')
  .option('-t, --theme <theme>', 'Visual theme', 'default')
  .option('-c, --highlight-communities', 'Highlight communities in visualization')
  .action(async (graphPath, options) => {
    try {
      console.log(chalk.blue('🎨 Generating visualization...'));
      
      // Read graph
      const graphData = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
      
      // Create config
      const config: GraphConfig = {
        visualization: {
          perform: true,
          layout: options.layout as any,
          theme: options.theme,
          highlightCommunities: options.highlightCommunities
        }
      };
      
      // Create pipeline
      const pipeline = createGraphPipeline();
      
      // Visualize graph
      const visualizedGraph = pipeline.visualizeGraph(graphData, config.visualization);
      
      console.log(chalk.green('✓ Visualization generated successfully'));
      console.log(chalk.gray(`  Layout: ${visualizedGraph.visualization.layout}`));
      
      // Write output if requested
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(visualizedGraph, null, 2));
        console.log(chalk.green(`✓ Visualized graph saved to ${outputPath}`));
      }
    } catch (error) {
      console.error(chalk.red('Error visualizing graph:'), error);
      process.exit(1);
    }
  });

// Process a form through the entire pipeline
program
  .command('process <formPath>')
  .description('Process a form through the entire graph pipeline')
  .option('-o, --output <path>', 'Output path for the processed graph')
  .option('-t, --test-data', 'Include test data in the graph')
  .option('--no-analysis', 'Skip analysis')
  .option('--no-visualization', 'Skip visualization')
  .option('-l, --layout <type>', 'Visualization layout algorithm', 'force')
  .action(async (formPath, options) => {
    try {
      console.log(chalk.blue('🔄 Processing form through graph pipeline...'));
      
      // Read form definition
      const formData = JSON.parse(fs.readFileSync(formPath, 'utf-8'));
      
      // Create config
      const config: GraphConfig = {
        includeTestData: options.testData,
        includeMetadata: true,
        analysis: {
          perform: options.analysis !== false,
          includeCommunities: true,
          includeCentrality: true,
          includePaths: true
        },
        visualization: {
          perform: options.visualization !== false,
          layout: options.layout as any,
          highlightCommunities: true,
          theme: 'default'
        }
      };
      
      // Create pipeline
      const pipeline = createGraphPipeline();
      
      // Process form
      const result = pipeline.processGraph(formData, config);
      
      console.log(chalk.green('✓ Form processed successfully'));
      console.log(chalk.gray(`• ${result.entities.length} entities`));
      console.log(chalk.gray(`• ${result.relationships.length} relationships`));
      
      if (result.analysis) {
        console.log(chalk.gray('• Analysis performed'));
      }
      
      if (result.visualization) {
        console.log(chalk.gray(`• Visualization generated (${result.visualization.layout} layout)`));
      }
      
      // Write output if requested
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(chalk.green(`✓ Processed graph saved to ${outputPath}`));
      }
    } catch (error) {
      console.error(chalk.red('Error processing form:'), error);
      process.exit(1);
    }
  });

// Run the program
program.parse(process.argv);