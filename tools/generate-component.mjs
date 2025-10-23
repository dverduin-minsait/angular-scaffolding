#!/usr/bin/env node

/**
 * Component Generator Script
 * Generates Angular components following project conventions
 * 
 * Usage: node tools/generate-component.mjs <component-name> [--path=custom/path] [--description="Custom description"]
 * Example: node tools/generate-component.mjs user-profile --path=features/auth --description="User profile management component"
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper functions for string transformation
const dasherize = (str) => str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
const classify = (str) => str.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
const camelize = (str) => {
  const classified = classify(str);
  return classified.charAt(0).toLowerCase() + classified.slice(1);
};

// Parse command line arguments
const args = process.argv.slice(2);
const componentName = args[0];

if (!componentName) {
  console.error('❌ Component name is required');
  console.log('Usage: node tools/generate-component.mjs <component-name> [--path=custom/path] [--description="Custom description"]');
  process.exit(1);
}

// Parse optional arguments
const customPath = args.find(arg => arg.startsWith('--path='))?.split('=')[1];
const description = args.find(arg => arg.startsWith('--description='))?.split('=')[1];

// Configuration
const config = {
  name: componentName,
  dasherizedName: dasherize(componentName),
  classifiedName: classify(componentName),
  camelizedName: camelize(componentName),
  description: description || `${classify(componentName)} component`,
  timestamp: new Date().toISOString().split('T')[0]
};

// Determine target path
const basePath = customPath || 'src/app/shared/components';
const componentPath = join(basePath, config.dasherizedName);

console.log(`🚀 Generating component: ${config.classifiedName}Component`);
console.log(`📁 Target path: ${componentPath}`);

// Create directory if it doesn't exist
if (!existsSync(componentPath)) {
  mkdirSync(componentPath, { recursive: true });
  console.log(`📁 Created directory: ${componentPath}`);
}

// Template processing function
const processTemplate = (templatePath, variables) => {
  let content = readFileSync(templatePath, 'utf-8');
  
  // Replace all template variables
  content = content.replace(/<%=\s*classify\(name\)\s*%>/g, variables.classifiedName);
  content = content.replace(/<%=\s*dasherize\(name\)\s*%>/g, variables.dasherizedName);
  content = content.replace(/<%=\s*description\s*\|\|\s*['"]Component description['"]\s*%>/g, variables.description);
  content = content.replace(/<%=\s*new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\s*%>/g, variables.timestamp);
  
  return content;
};

// File templates
const templates = [
  {
    template: 'component.ts.template',
    output: `${config.dasherizedName}.component.ts`
  },
  {
    template: 'component.scss.template', 
    output: `${config.dasherizedName}.component.scss`
  },
  {
    template: 'component.spec.ts.template',
    output: `${config.dasherizedName}.component.spec.ts`
  }
];

// Generate files
templates.forEach(({ template, output }) => {
  try {
    const templatePath = join(__dirname, 'templates', template);
    const outputPath = join(componentPath, output);
    
    if (existsSync(outputPath)) {
      console.log(`⚠️  File already exists: ${output}`);
      return;
    }
    
    const content = processTemplate(templatePath, config);
    writeFileSync(outputPath, content, 'utf-8');
    console.log(`✅ Generated: ${output}`);
  } catch (error) {
    console.error(`❌ Error generating ${output}:`, error.message);
  }
});

// Generate index.ts for barrel export
const indexPath = join(componentPath, 'index.ts');
if (!existsSync(indexPath)) {
  const indexContent = `export { ${config.classifiedName}Component } from './${config.dasherizedName}.component';\n`;
  writeFileSync(indexPath, indexContent, 'utf-8');
  console.log(`✅ Generated: index.ts`);
}

console.log('\\n🎉 Component generation complete!');
console.log('\\n📋 Next steps:');
console.log(`1. Import the component: import { ${config.classifiedName}Component } from '${componentPath.replace('src/app/', '@app/')}'`);
console.log(`2. Add to component imports: imports: [${config.classifiedName}Component]`);
console.log(`3. Use in template: <app-${config.dasherizedName}></app-${config.dasherizedName}>`);
console.log(`4. Run tests: npm test ${config.dasherizedName}.component.spec.ts`);
console.log(`5. Check accessibility: The component includes WCAG AA compliance testing`);

// Offer to add to feature module exports if in features directory
if (basePath.includes('features/')) {
  console.log(`\\n💡 Consider adding to feature module exports if this is a public component`);
}