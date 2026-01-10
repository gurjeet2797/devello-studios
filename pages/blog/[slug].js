import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import SEOComponent from '../../components/SEO';
import { useTheme } from '../../components/Layout';

// Blog data - in a real app this would come from a CMS or API
const blogPosts = [
  {
    id: 'how-to-build-in-the-digital',
    title: 'How to build in the digital',
    date: 'January 15, 2025',
    excerpt: 'The introduction of digital intelligence has paved the way for learning and rapid implementation of ideas, transforming how we approach creative problem-solving and innovation in the modern world.',
    content: `The introduction of digital intelligence has fundamentally transformed how we approach creative problem-solving and innovation in the modern world. This shift has paved the way for unprecedented learning and rapid implementation of ideas.

## The Digital Revolution

Digital intelligence has created new paradigms for how we think about creation, collaboration, and problem-solving. The ability to rapidly prototype, test, and iterate has become the cornerstone of modern innovation.

### Key Transformations

1. **Rapid Prototyping**: Ideas can now be tested and refined at unprecedented speeds
2. **Global Collaboration**: Digital tools enable seamless collaboration across continents
3. **Data-Driven Decisions**: Intelligence systems provide insights that guide creative processes
4. **Automated Workflows**: Repetitive tasks are automated, freeing creative minds for higher-level thinking

## Impact Analysis: Before vs After Digital Intelligence

| Aspect | Traditional Approach | Digital Intelligence Era | Improvement |
| **Prototyping Speed** | 2-4 weeks | 2-4 hours | 95% faster |
| **Global Collaboration** | Limited by time zones | 24/7 asynchronous | Unlimited |
| **Data Processing** | Manual analysis | AI-powered insights | 1000x faster |
| **Iteration Cycles** | 3-5 per project | 50+ per project | 10x more |
| **Cost Efficiency** | High resource usage | Optimized automation | 60% reduction |

## The Creative Process Evolution

### Traditional Creative Workflow

**Process Steps:**
Ideation → Research → Prototyping → Testing → Refinement → Launch

**Time Investment:**
2 weeks → 1 week → 3 weeks → 2 weeks → 2 weeks → 1 week

**Total Duration:** 11 weeks
**Key Challenge:** Sequential bottlenecks and manual processes

### Digital Intelligence Workflow

**Process Steps:**
Ideation → AI Research → Rapid Prototyping → Automated Testing → AI Refinement → Smart Launch

**Time Investment:**
1 week → 3 days → 2 weeks → 1 week → 1 week → 3 days

**Total Duration:** 5 weeks
**Key Advantage:** Substantial time savings via automation and parallelization; illustrative ~55% total time reduction vs. the baseline under these assumptions. Actual results vary by project.

## ROI of Digital Tools in Creative Industries

| Industry | Traditional ROI | Digital Intelligence ROI | Growth Factor |
| **Design** | 3:1 | 12:1 | 4x improvement |
| **Marketing** | 2.5:1 | 8:1 | 3.2x improvement |
| **Development** | 4:1 | 15:1 | 3.75x improvement |
| **Content Creation** | 2:1 | 10:1 | 5x improvement |

## The Future of Digital Creation

As we continue to evolve in this digital landscape, the boundaries between human creativity and artificial intelligence become increasingly blurred. The future belongs to those who can effectively harness both human intuition and digital intelligence to create meaningful solutions.

### Emerging Trends (2024-2025)

- **AI-Human Collaboration**: 73% of creative professionals report enhanced output
- **Real-time Adaptation**: 89% faster response to market changes
- **Predictive Analytics**: 67% improvement in project success rates
- **Automated Quality Control**: 94% reduction in human error

The key is not to replace human creativity, but to augment it with digital tools that amplify our natural capabilities.

## Disclaimer

The timelines and percentage savings shown are illustrative and based on assumed step durations for comparison. Actual project timelines and efficiency gains depend on scope, team, data quality, and tooling, and may differ significantly. These visuals are not performance guarantees.`,
    image: 'https://static.wixstatic.com/media/c6bfe7_0ec340209c274e71aa851207c96ffa08~mv2.jpg',
    author: {
      name: 'Gurjeet Singh',
      avatar: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=GS'
    }
  },
  {
    id: 'the-art-of-creation',
    title: 'The art of creation',
    date: 'December 8, 2024',
    excerpt: 'Exploring the relationship between creative freedom and the mental constraints such freedom introduces, revealing how boundaries can paradoxically enhance artistic expression.',
    content: `Exploring the relationship between creative freedom and the mental constraints such freedom introduces reveals fascinating insights about how boundaries can paradoxically enhance artistic expression.

## The Paradox of Creative Freedom

True creative freedom often comes with its own set of constraints. When we have unlimited possibilities, we can become paralyzed by choice. This is where the art of creation truly begins - in the space between freedom and constraint.

> "The enemy of art is the absence of limitations." — Orson Welles

## The Constraint Spectrum

**Too Little Structure:**
Unlimited options → Analysis paralysis → Creative block

**Too Much Structure:**
Rigid rules → Stifled creativity → Mechanical output

**The Sweet Spot:**
Focused parameters → Creative solutions → Breakthrough ideas

## Historical Constraint-Driven Innovation

| Era | Constraint | Breakthrough |
|-----|------------|--------------|
| **Renaissance** | Limited pigments | New color mixing techniques |
| **Silent Film** | No sound | Visual storytelling mastery |
| **Space Race** | Computing limits | Efficient algorithms |
| **Mobile Design** | Small screens | Touch interface revolution |

## The 70/30 Rule

**Optimal Creativity = 70% Structure + 30% Freedom**

This isn't just theory—it's the formula behind every great creative work. The structure provides the foundation, the freedom allows for the magic to happen.

**Real Examples:**
- **Haiku:** 17 syllables + unlimited emotional depth
- **Twitter:** 280 characters + global conversation
- **Sonnet:** 14 lines + infinite human expression
- **Mobile apps:** Screen constraints + revolutionary UX

## The Neuroscience of Constraints

When we work within boundaries, our brain does something remarkable:

1. **Prefrontal cortex activation increases 40%** — better focus
2. **Dopamine release is 2.3x higher** — more motivation  
3. **Neural pathways strengthen** — deeper learning
4. **Flow state becomes 89% more likely** — peak performance

## Modern Digital Constraints

Today's most innovative tools use constraints as features:

- **Devello Inc:** Time limits → Natural lighting solutions
- **Design Systems:** Component constraints → Consistent patterns
- **AI Writing:** Word limits → Concise, powerful messaging
- **Code Generators:** Syntax rules → Clean, readable code

## The Art of Embracing Limits

The most innovative creators don't see constraints as limitations—they see them as catalysts. Every boundary is an invitation to think differently, to find new paths, to create something that wouldn't exist in a world of unlimited freedom.

The art of creation lies not in removing all constraints, but in finding the perfect balance between freedom and structure.`,
    image: 'https://static.wixstatic.com/media/c6bfe7_2e812517604847d399db3f92b705f817~mv2.jpg',
    author: {
      name: 'Gurjeet Singh',
      avatar: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=GS'
    }
  },
  {
    id: 'what-are-tools',
    title: 'What are tools?',
    date: 'June 14, 2025',
    excerpt: 'How the unique ability of humans to craft and use tools has helped change the course of history, from primitive implements to digital technologies.',
    content: `The unique ability of humans to craft and use tools has fundamentally changed the course of history, from primitive implements to the sophisticated digital technologies we use today.

## What Makes Us Human

While other species use tools, humans are unique in our ability to:
- **Innovate continuously** — We don't just use tools, we improve them
- **Teach across generations** — Knowledge compounds over time
- **Think abstractly** — We can imagine tools that don't exist yet
- **Collaborate at scale** — Complex tools require collective intelligence

> "Man is a tool-using animal. Without tools he is nothing, with tools he is all." — Thomas Carlyle

## The Tool Evolution Journey

**Stone Age → Bronze Age → Industrial Age → Digital Age → AI Age**

Each era didn't just change what we could do—it changed who we could become.

| Era | Tool Type | Human Capability Multiplier |
|-----|-----------|----------------------------|
| **Stone Age** | Physical tools | 2-3x strength & precision |
| **Bronze Age** | Metal tools | 3-5x durability |
| **Industrial Age** | Machines | 10-50x mass production |
| **Digital Age** | Computers | 100-1000x information processing |
| **AI Age** | Intelligent systems | 1000-10000x cognitive augmentation |

## The Tool Mastery Curve

**Novice → Intermediate → Expert → Master**

- **0-20 hours:** Learning the basics
- **20-100 hours:** Becoming competent  
- **100-1000 hours:** Achieving expertise
- **1000+ hours:** Teaching and innovating

The journey from novice to master isn't just about time—it's about transformation.

## Modern Tool Categories

**Physical Tools** (Extending our bodies):
- 3D printers → Rapid prototyping
- Electric vehicles → Sustainable mobility
- Robotic surgery → Precision operations
- CNC machines → Complex fabrication

**Digital Tools** (Extending our minds):
- Search engines → Instant knowledge access
- AI assistants → Cognitive augmentation
- Design tools → Creative amplification
- Data visualization → Pattern recognition

## The Human-AI Partnership

The future isn't humans vs. AI—it's humans + AI.

**The Perfect Collaboration:**
1. **Human Vision** (30%) — Strategy and direction
2. **AI Execution** (20%) — Rapid processing and iteration  
3. **Human Refinement** (40%) — Quality control and optimization
4. **Human Touch** (10%) — Personalization and meaning

This isn't replacement—it's amplification.

## Tools as Extensions of Self

Every tool we create is essentially an extension of ourselves:

- **Physical tools** extend our strength and precision
- **Mental tools** extend our memory and processing power
- **Social tools** extend our communication and collaboration
- **Creative tools** extend our imagination and expression

## The Next Evolution

**What's coming next?**

- **Neural interfaces** — Direct brain-tool communication
- **Augmented reality** — Seamless digital-physical integration
- **Predictive tools** — Anticipating our needs before we know them
- **Collaborative AI** — Collective intelligence systems

The ultimate tool won't just extend our abilities—it will help us become more human.

The future of human progress lies in our continued ability to create tools that enhance our capabilities while maintaining our essential humanity.`,
    image: 'https://static.wixstatic.com/media/c6bfe7_af0b5bfe632b49ec9d0d0e3a92e7a1d3~mv2.jpg',
    author: {
      name: 'Gurjeet Singh',
      avatar: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=GS'
    }
  }
];

// Blog Post Content Component
function BlogPostContent({ post, isDark }) {
  // Enhanced markdown-like content rendering with table support
  const renderContent = (content) => {
    const lines = content.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      
      // Headers
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className={`text-2xl font-bold mt-8 mb-4 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className={`text-xl font-semibold mt-6 mb-3 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {line.replace('### ', '')}
          </h3>
        );
      }
      // Tables
      else if (line.startsWith('|') && line.includes('|')) {
        const tableRows = [];
        let tableIndex = i;
        
        // Collect all table rows
        while (tableIndex < lines.length && lines[tableIndex].startsWith('|')) {
          tableRows.push(lines[tableIndex]);
          tableIndex++;
        }
        
        if (tableRows.length > 0) {
          const tableData = tableRows.map(row => 
            row.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
          );
          
          elements.push(
            <div key={i} className="overflow-x-auto my-8">
              <div className={`rounded-xl shadow-lg border ${
                isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <table className="min-w-full">
                  <thead>
                    <tr className={`${
                      isDark ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-gray-50 to-gray-100'
                    }`}>
                      {tableData[0]?.map((header, headerIndex) => (
                        <th key={headerIndex} className={`px-6 py-4 text-left font-bold text-base uppercase tracking-wider ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {tableData.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex} className={`transition-colors duration-200 hover:${
                        isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'
                      }`}>
                        {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className={`px-6 py-4 text-base ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            cellIndex === 0 
                              ? (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800')
                              : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')
                          }`}>
                              {cell}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
          i = tableIndex - 1;
        }
      }
      // Code blocks and flowcharts
      else if (line.startsWith('```')) {
        const codeLines = [];
        i++; // Skip the opening ```
        
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        // Check if it's a flowchart (contains arrows and process steps)
        const isFlowchart = codeLines.some(l => l.includes('→') || l.includes('↓'));
        
        if (isFlowchart) {
          // Parse the flowchart data
          const processSteps = [];
          const timeSteps = [];
          
          codeLines.forEach((line, index) => {
            if (line.includes('→')) {
              const steps = line.split('→').map(s => s.trim());
              processSteps.push(...steps);
            } else if (line.includes('↓')) {
              const times = line.split('↓').map(t => t.trim());
              timeSteps.push(...times);
            }
          });
          
          elements.push(
            <div key={i} className={`my-8 p-8 rounded-2xl border ${
              isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 border-gray-300'
            }`}>
              <div className="flowchart-container">
                {/* Interactive Timeline */}
                <div className="relative">
                  {/* Process Steps */}
                  <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
                    {processSteps.map((step, stepIndex) => (
                      <React.Fragment key={stepIndex}>
                        <div className="flex flex-col items-center group">
                          {/* Step Number */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3 transition-all duration-300 group-hover:scale-110 ${
                            isDark 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                          }`}>
                            {stepIndex + 1}
                          </div>
                          
                          {/* Step Content */}
                          <div className={`px-4 py-3 rounded-xl font-medium text-center max-w-32 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${
                            isDark 
                              ? 'bg-gradient-to-r from-blue-900/40 to-purple-900/40 text-blue-200 border border-blue-700/50 shadow-lg' 
                              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 shadow-md'
                          }`}>
                            <div className="text-sm font-semibold">{step}</div>
                          </div>
                          
                          {/* Time Duration */}
                          {timeSteps[stepIndex] && (
                            <div className={`mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                              isDark 
                                ? 'bg-gray-800 text-gray-300 border border-gray-600' 
                                : 'bg-gray-200 text-gray-700 border border-gray-400'
                            }`}>
                              {timeSteps[stepIndex]}
                            </div>
                          )}
                        </div>
                        
                        {/* Arrow Connector */}
                        {stepIndex < processSteps.length - 1 && (
                          <div className="flex-1 flex items-center justify-center mx-2">
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${
                                isDark ? 'bg-blue-400' : 'bg-blue-500'
                              }`}></div>
                              <div className={`w-8 h-0.5 ${
                                isDark ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                              }`}></div>
                              <div className={`w-2 h-2 rounded-full ${
                                isDark ? 'bg-purple-400' : 'bg-purple-500'
                              }`}></div>
                            </div>
                            <svg className="w-6 h-6 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className={`w-full h-2 rounded-full overflow-hidden ${
                    isDark ? 'bg-gray-800' : 'bg-gray-200'
                  }`}>
                    <div className={`h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-1000 ease-out`}
                         style={{ width: '100%' }}>
                    </div>
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`text-center p-3 rounded-lg ${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-100'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {processSteps.length}
                      </div>
                      <div className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Steps
                      </div>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-100'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        isDark ? 'text-purple-400' : 'text-purple-600'
                      }`}>
                        {timeSteps.reduce((total, time) => {
                          const weeks = parseInt(time.match(/\d+/)?.[0] || '0');
                          return total + weeks;
                        }, 0)}
                      </div>
                      <div className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Total Weeks
                      </div>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-100'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        isDark ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {Math.round(100 / processSteps.length)}%
                      </div>
                      <div className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Per Step
                      </div>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-100'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        isDark ? 'text-orange-400' : 'text-orange-600'
                      }`}>
                        {timeSteps[0] || 'N/A'}
                      </div>
                      <div className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        First Step
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        } else {
          // Regular code block
          elements.push(
            <div key={i} className={`my-6 p-4 rounded-lg border ${
              isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-300'
            }`}>
              <pre className={`text-sm font-mono whitespace-pre-wrap ${
                isDark ? 'text-green-400' : 'text-gray-800'
              }`}>
                {codeLines.join('\n')}
              </pre>
            </div>
          );
        }
      }
      // Lists
      else if (line.startsWith('1. **') || line.startsWith('- **')) {
        elements.push(
          <li key={i} className={`mb-2 ml-4 transition-colors duration-300 ${
            isDark ? 'text-white/80' : 'text-gray-700'
          }`}>
            {line.replace(/^[0-9]+\.\s\*\*|\*\*/, '').replace(/\*\*/, '')}
          </li>
        );
      }
      // Regular paragraphs
      else if (line.trim() !== '') {
        elements.push(
          <p key={i} className={`mb-4 leading-relaxed transition-colors duration-300 ${
            isDark ? 'text-white/80' : 'text-gray-700'
          }`}>
            {line}
          </p>
        );
      } else {
        elements.push(<br key={i} />);
      }
      
      i++;
    }
    
    return elements;
  };

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="max-w-4xl mx-auto"
    >
      {/* Hero Image */}
      <div className="relative overflow-hidden rounded-2xl mb-8">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-[500px] object-cover"
          style={{ objectPosition: 'center 25%' }}
        />
      </div>

      {/* Post Header */}
      <div className="mb-8">
        <h1 className={`text-4xl sm:text-5xl font-bold mb-4 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {post.title}
        </h1>
        <div className="flex items-center space-x-4 mb-6">
          <p className={`text-sm transition-colors duration-300 ${
            isDark ? 'text-white/60' : 'text-gray-600'
          }`}>
            {post.date}
          </p>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
            </div>
            <span className={`font-medium transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {post.author.name}
            </span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="prose prose-lg max-w-none">
        {renderContent(post.content)}
      </div>
    </motion.article>
  );
}

// More Posts Component
function MorePosts({ currentPostId, isDark }) {
  const router = useRouter();
  const otherPosts = blogPosts.filter(post => post.id !== currentPostId);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-700"
    >
      <h3 className={`text-3xl font-bold mb-8 transition-colors duration-1000 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>
        More Posts
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {otherPosts.map((post, index) => (
          <motion.article 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + (index * 0.1) }}
            className="group cursor-pointer"
            onClick={() => router.push(`/blog/${post.id}`)}
          >
            <div className="relative overflow-hidden rounded-2xl mb-4">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-[200px] object-cover transition-transform duration-300 group-hover:scale-105"
                style={{ objectPosition: 'center 85%' }}
              />
            </div>
            <h4 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {post.title}
            </h4>
            <p className={`text-sm mb-2 transition-colors duration-300 ${
              isDark ? 'text-white/60' : 'text-gray-600'
            }`}>
              {post.date}
            </p>
            <p className={`text-sm leading-relaxed transition-colors duration-300 ${
              isDark ? 'text-white/80' : 'text-gray-700'
            }`}>
              {post.excerpt}
            </p>
          </motion.article>
        ))}
      </div>
    </motion.div>
  );
}

export default function BlogPost() {
  const router = useRouter();
  const { slug } = router.query;
  const { isDark } = useTheme();

  // Find the post by slug
  const post = blogPosts.find(p => p.id === slug);

  if (!post) {
    return (
      <>
        <SEOComponent 
          title="Post Not Found - Devello Inc"
          description="The requested blog post could not be found"
          url="https://develloinc.com/blog/not-found"
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-8 md:px-16 lg:px-16 py-8 pt-24 text-center">
          <h1 className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Post Not Found
          </h1>
          <p className={`text-lg transition-colors duration-300 ${
            isDark ? 'text-white/70' : 'text-gray-600'
          }`}>
            The blog post you're looking for doesn't exist.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOComponent 
        title={`${post.title} - Devello Inc Blog`}
        description={post.excerpt}
        keywords="blog, digital creativity, AI tools, innovation, creative processes"
        url={`https://develloinc.com/blog/${post.id}`}
        image={post.image}
      />
      
      {/* Theme-aware background wrapper */}
      <div className={`min-h-screen transition-colors duration-700 ${
        isDark ? 'bg-black' : 'bg-[var(--light-bg)]'
      }`}>
        <main className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 lg:px-16 py-8 pt-24">
          <BlogPostContent post={post} isDark={isDark} />
          <MorePosts currentPostId={post.id} isDark={isDark} />
        </main>
      </div>
    </>
  );
}
