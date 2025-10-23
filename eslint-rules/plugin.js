/**
 * Custom ESLint rules for the Angular application
 * Enforces project-specific conventions
 */

module.exports = {
  rules: {
    'app-button-import': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce ButtonDirective import when using appButton directive',
          category: 'Angular',
          recommended: true
        },
        fixable: 'code',
        schema: []
      },
      create(context) {
        return {
          'Property[key.name="appButton"]'(node) {
            const sourceCode = context.getSourceCode();
            const program = sourceCode.ast;
            
            // Check if ButtonDirective is imported
            const hasButtonDirectiveImport = program.body.some(statement => 
              statement.type === 'ImportDeclaration' &&
              statement.specifiers.some(spec => 
                spec.imported && spec.imported.name === 'ButtonDirective'
              )
            );

            if (!hasButtonDirectiveImport) {
              context.report({
                node,
                message: 'ButtonDirective must be imported when using appButton directive',
                fix(fixer) {
                  // Add import at the top of the file
                  const firstImport = program.body.find(node => node.type === 'ImportDeclaration');
                  if (firstImport) {
                    return fixer.insertTextBefore(
                      firstImport,
                      "import { ButtonDirective } from '@app/shared/directives/button.directive';\n"
                    );
                  }
                }
              });
            }
          }
        };
      }
    },

    'signal-naming-convention': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Enforce consistent signal naming conventions',
          category: 'Angular Signals',
          recommended: true
        },
        fixable: 'code',
        schema: [
          {
            type: 'object',
            properties: {
              'exported': {
                type: 'string',
                enum: ['Signal', 'none'],
                default: 'Signal'
              },
              'private': {
                type: 'string', 
                enum: ['underscore', 'none'],
                default: 'underscore'
              },
              'computed': {
                type: 'string',
                enum: ['descriptive', 'Computed'],
                default: 'descriptive'
              }
            },
            additionalProperties: false
          }
        ]
      },
      create(context) {
        const options = context.options[0] || {};
        const exportedSuffix = options.exported || 'Signal';
        const privatePrefix = options.private || 'underscore';
        const computedNaming = options.computed || 'descriptive';

        function checkSignalNaming(node, name, isExported, isPrivate, isComputed) {
          const messages = [];

          // Check exported signals
          if (isExported && exportedSuffix === 'Signal' && !name.endsWith('Signal')) {
            messages.push(`Exported signal '${name}' should end with 'Signal'`);
          }

          // Check private signals
          if (isPrivate && privatePrefix === 'underscore' && !name.startsWith('_')) {
            messages.push(`Private signal '${name}' should start with underscore '_'`);
          }

          // Check computed signals
          if (isComputed && computedNaming === 'descriptive') {
            if (name.includes('Computed') || name.includes('computed')) {
              messages.push(`Computed signal '${name}' should use descriptive naming instead of 'Computed' suffix`);
            }
          }

          if (messages.length > 0) {
            context.report({
              node,
              message: messages.join('; ')
            });
          }
        }

        return {
          'VariableDeclarator[init.callee.name="signal"]'(node) {
            if (node.id.type === 'Identifier') {
              const name = node.id.name;
              const isPrivate = name.startsWith('_');
              const isExported = false; // Will be checked in ExportNamedDeclaration
              checkSignalNaming(node, name, isExported, isPrivate, false);
            }
          },

          'VariableDeclarator[init.callee.name="computed"]'(node) {
            if (node.id.type === 'Identifier') {
              const name = node.id.name;
              const isPrivate = name.startsWith('_');
              const isExported = false; // Will be checked in ExportNamedDeclaration
              checkSignalNaming(node, name, isExported, isPrivate, true);
            }
          },

          'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[init.callee.name="signal"]'(node) {
            if (node.id.type === 'Identifier') {
              const name = node.id.name;
              checkSignalNaming(node, name, true, false, false);
            }
          },

          'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[init.callee.name="computed"]'(node) {
            if (node.id.type === 'Identifier') {
              const name = node.id.name;
              checkSignalNaming(node, name, true, false, true);
            }
          }
        };
      }
    },

    'signals-over-rxjs': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer signals over RxJS for local component state',
          category: 'Angular Signals',
          recommended: true
        },
        schema: []
      },
      create(context) {
        return {
          'VariableDeclarator[init.callee.name="BehaviorSubject"]'(node) {
            context.report({
              node,
              message: 'Consider using signal() instead of BehaviorSubject for local component state'
            });
          },

          'VariableDeclarator[init.callee.name="Subject"]'(node) {
            if (node.id.name.includes('state') || node.id.name.includes('State')) {
              context.report({
                node,
                message: 'Consider using signal() instead of Subject for local state management'
              });
            }
          }
        };
      }
    },

    'prefer-barrel-imports': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer barrel exports over deep relative imports when available',
          category: 'Import Management',
          recommended: true
        },
        fixable: 'code',
        schema: []
      },
      create(context) {
        // Map of deep import paths to their barrel equivalent
        const barrelMappings = {
          // Core services
          '/core/services/theme.service': '/core/services',
          '/core/services/device.service': '/core/services',
          '/core/services/grid-loader.service': '/core/services',
          '/core/services/grid-data.service': '/core/services',
          
          // Core auth
          '/core/auth/services/auth.service': '/core/auth',
          '/core/auth/services/auth.service.mock': '/core/auth',
          '/core/auth/services/multi-tab-sync.service': '/core/auth',
          '/core/auth/guards/': '/core/auth',
          '/core/auth/stores/': '/core/auth',
          '/core/auth/models/': '/core/auth',
          '/core/auth/interceptors/': '/core/auth',
          '/core/auth/directives/': '/core/auth',
          
          // Shared components
          '/shared/components/responsive-grid/responsive-grid.component': '/shared/components',
          
          // Shared directives
          '/shared/directives/button.directive': '/shared/directives',
          
          // Core tokens
          '/core/tokens/local.storage.token': '/core/tokens',
          
          // Core utils
          '/core/utils/theme.utils': '/core/utils'
        };

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            
            // Only check relative imports
            if (!importPath.startsWith('.')) return;
            
            // Check if this is a deep relative import (more than 2 levels up)
            const upLevels = (importPath.match(/\.\.\//g) || []).length;
            if (upLevels <= 2) return;
            
            // Check if there's a barrel export alternative
            for (const [deepPath, barrelPath] of Object.entries(barrelMappings)) {
              if (importPath.includes(deepPath)) {
                const suggestedPath = importPath.replace(
                  new RegExp(`(.*/)?${deepPath.replace(/\//g, '\\/')}`),
                  `$1${barrelPath}`
                );
                
                context.report({
                  node,
                  message: `Prefer barrel import '${suggestedPath}' over deep relative import`,
                  fix(fixer) {
                    return fixer.replaceText(node.source, `'${suggestedPath}'`);
                  }
                });
                break;
              }
            }
          }
        };
      }
    },

    'component-max-lines': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Enforce maximum line count for components to encourage SRP',
          category: 'Angular Architecture',
          recommended: true
        },
        schema: [
          {
            type: 'object',
            properties: {
              'max': {
                type: 'number',
                default: 200
              },
              'skipBlankLines': {
                type: 'boolean',
                default: true
              }
            },
            additionalProperties: false
          }
        ]
      },
      create(context) {
        const options = context.options[0] || {};
        const maxLines = options.max || 200;
        const skipBlankLines = options.skipBlankLines !== false;

        return {
          'ClassDeclaration > Decorator[expression.callee.name="Component"]'(node) {
            const sourceCode = context.getSourceCode();
            const classNode = node.parent;
            
            // Count lines in the component class
            const startLine = classNode.loc.start.line;
            const endLine = classNode.loc.end.line;
            let lineCount = endLine - startLine + 1;
            
            if (skipBlankLines) {
              const text = sourceCode.text.split('\n');
              const componentLines = text.slice(startLine - 1, endLine);
              lineCount = componentLines.filter(line => line.trim().length > 0).length;
            }

            if (lineCount > maxLines) {
              context.report({
                node: classNode,
                message: `Component has ${lineCount} lines, exceeding limit of ${maxLines}. Consider splitting into smaller components.`
              });
            }
          }
        };
      }
    },

    'no-business-logic-in-components': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prevent business logic in components - prefer services/stores',
          category: 'Angular Architecture',
          recommended: true
        },
        schema: []
      },
      create(context) {
        let isInComponent = false;

        return {
          'ClassDeclaration > Decorator[expression.callee.name="Component"]'() {
            isInComponent = true;
          },
          'ClassDeclaration:exit'() {
            isInComponent = false;
          },
          // Detect HTTP calls like service.post(), this.http.get(), etc.
          'CallExpression[callee.property.name=/^(post|get|put|delete|patch)$/]'(node) {
            if (isInComponent) {
              const callee = node.callee;
              const objectName = callee.object?.name || callee.object?.property?.name;
              
              // Skip form controls (.get() method) and common false positives
              if (objectName === 'form' || 
                  objectName === 'registerForm' || 
                  objectName === 'itemForm' ||
                  objectName === 'control' ||
                  callee.object?.type === 'CallExpression') {
                return;
              }
              
              // Only flag actual HTTP client calls
              if (objectName === 'http' || 
                  objectName === 'httpClient' ||
                  callee.object?.property?.name === 'subscribe') {
                context.report({
                  node,
                  message: 'Avoid direct HTTP calls in components. Use services or stores for business logic.'
                });
              }
            }
          },
          // Detect store operations that might be business logic
          'CallExpression[callee.property.name="subscribe"]'(node) {
            if (isInComponent) {
              const callee = node.callee;
              if (callee.object?.property?.name === 'delete' || 
                  callee.object?.property?.name === 'create' ||
                  callee.object?.property?.name === 'update') {
                context.report({
                  node,
                  message: 'Consider moving complex business operations to services. Components should focus on presentation.'
                });
              }
            }
          }
        };
      }
    }
  }
};