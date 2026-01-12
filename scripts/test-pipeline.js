#!/usr/bin/env node
/**
 * Quick test script for Ideation Engine v2
 * Run: node scripts/test-pipeline.js
 */

import 'dotenv/config';

// Check environment
if (!process.env.GOOGLE_API_KEY) {
  console.error('❌ GOOGLE_API_KEY not set');
  process.exit(1);
}

console.log('✅ GOOGLE_API_KEY is set');
console.log('');

async function testPipeline() {
  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('  Testing Ideation Engine v2 Pipeline');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    // Import engine
    const { runIdeationPipeline } = await import('../lib/engine/index.js');

    const testIdea = 'A mobile app for tracking daily water intake';
    console.log(`Test idea: "${testIdea}"`);
    console.log('');

    // Run pipeline (skip images for faster testing)
    const startTime = Date.now();
    
    const result = await runIdeationPipeline(
      {
        idea: testIdea,
        context: { platform: 'mobile', industry: 'health' }
      },
      {
        skipImages: true, // Skip images for faster testing
        useCache: false,
        onProgress: (progress, message) => {
          console.log(`[${progress.toString().padStart(3)}%] ${message}`);
        }
      }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Result: ${result.status} in ${duration}s`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    if (result.stages?.product_concept) {
      const c = result.stages.product_concept;
      console.log('Product Concept:');
      console.log(`  Name: ${c.name}`);
      console.log(`  Tagline: ${c.tagline}`);
      console.log(`  Features: ${c.features?.length || 0}`);
      console.log(`  Roadmap: ${c.roadmap?.length || 0} phases`);
    }

    if (result.errors?.length > 0) {
      console.log('');
      console.log('Errors:');
      result.errors.forEach(e => console.log(`  - ${e.stage}: ${e.error}`));
    }

    console.log('');
    console.log('✅ Pipeline test complete!');
    
  } catch (error) {
    console.error('');
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPipeline();
