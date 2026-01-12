#!/usr/bin/env node
/**
 * Test script for Ideation Engine v2
 * 
 * Usage:
 *   node scripts/test-ideation-engine.js
 *   node scripts/test-ideation-engine.js --skip-images
 *   node scripts/test-ideation-engine.js --idea "your custom idea"
 */

import dotenv from 'dotenv';
dotenv.config();

// Validate environment
if (!process.env.GOOGLE_API_KEY) {
  console.error('❌ GOOGLE_API_KEY not set in environment');
  process.exit(1);
}

// Parse args
const args = process.argv.slice(2);
const skipImages = args.includes('--skip-images');
const ideaIdx = args.indexOf('--idea');
const customIdea = ideaIdx !== -1 ? args[ideaIdx + 1] : null;

const testIdea = customIdea || 'A mobile app for tracking daily water intake with smart reminders';

console.log('═══════════════════════════════════════════════════════════');
console.log('  Ideation Engine v2 Test');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Idea: ${testIdea}`);
console.log(`Skip images: ${skipImages}`);
console.log('');

async function runTest() {
  try {
    // Import engine
    const { runIdeationPipeline, ENGINE_VERSION } = await import('../lib/engine/index.js');
    console.log(`Engine version: ${ENGINE_VERSION}`);
    console.log('');

    // Run pipeline with progress tracking
    console.log('Starting pipeline...');
    console.log('─────────────────────────────────────────────────────────────');

    const startTime = Date.now();
    
    const result = await runIdeationPipeline(
      {
        idea: testIdea,
        context: {
          platform: 'mobile',
          industry: 'health',
          tone: 'friendly',
          targetAudience: 'health-conscious adults'
        }
      },
      {
        skipImages,
        useCache: false, // Don't cache for testing
        onProgress: (progress, message) => {
          const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
          process.stdout.write(`\r[${bar}] ${progress}% - ${message.substring(0, 50).padEnd(50)}`);
        }
      }
    );

    console.log('\n');
    console.log('─────────────────────────────────────────────────────────────');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Pipeline completed in ${duration}s`);
    console.log(`Status: ${result.status}`);
    console.log(`Total cost: $${(result.total_cost || 0).toFixed(6)}`);
    
    if (result.errors?.length > 0) {
      console.log(`\n⚠️ Errors (${result.errors.length}):`);
      result.errors.forEach(e => console.log(`  - ${e.stage}: ${e.error}`));
    }

    // Print results summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Results Summary');
    console.log('═══════════════════════════════════════════════════════════');

    if (result.stages.research_brief) {
      console.log('\n📊 Research Brief:');
      console.log(`  Summary: ${result.stages.research_brief.summary?.substring(0, 100)}...`);
      console.log(`  Insights: ${result.stages.research_brief.insights?.length || 0} items`);
    }

    if (result.stages.product_concept) {
      const concept = result.stages.product_concept;
      console.log('\n💡 Product Concept:');
      console.log(`  Name: ${concept.name}`);
      console.log(`  Tagline: ${concept.tagline}`);
      console.log(`  Features: ${concept.features?.length || 0} items`);
      console.log(`  Tech Stack: ${concept.tech_stack?.frontend} / ${concept.tech_stack?.backend}`);
    }

    if (result.stages.screen_specs) {
      console.log('\n📱 Screen Specs:');
      result.stages.screen_specs.screens?.forEach(s => {
        console.log(`  ${s.screen_id}. ${s.name} - ${s.elements?.length || 0} elements`);
      });
    }

    if (result.images?.length > 0) {
      const successful = result.images.filter(i => i.success).length;
      console.log(`\n🖼️ Images: ${successful}/${result.images.length} generated`);
    }

    if (result.stages.mockup_scene) {
      console.log('\n🎨 Mockup Scene:');
      console.log(`  Layout: ${result.stages.mockup_scene.composition_grid?.layout_type}`);
      console.log(`  Style: ${result.stages.mockup_scene.project_settings?.style_preset}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('Cost Breakdown:');
    Object.entries(result.cost_breakdown || {}).forEach(([stage, cost]) => {
      if (cost > 0) {
        console.log(`  ${stage}: $${cost.toFixed(6)}`);
      }
    });

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTest();
