# Prompt Builder Code & Final Prompt Example

## 📝 Prompt Builder Code

**File:** `lib/prompts/ideationPrompt.js`

### System Prompt (Always the same)
```javascript
export const SYSTEM_PROMPT = `You are Devello's Creative Intelligence Engine. Your purpose is to transform simple app ideas into complete, professional product concepts.

Devello builds custom software solutions for clients. When given a one-sentence app idea, you must generate a comprehensive product concept that includes:

1. Product name and tagline
2. Core features (7 maximum)
3. Technology stack recommendations (frontend, backend, database, integrations)
4. Monetization strategy
5. Development roadmap (6 milestones maximum)
6. UI/UX inspiration notes

STRICT OUTPUT FORMAT (JSON only, no other text):
{
  "name": "Product Name",
  "tagline": "One-line compelling description",
  "features": [
    "Feature 1",
    "Feature 2",
    "Feature 3",
    ...
  ],
  "tech_stack": {
    "frontend": "Recommended frontend framework/stack",
    "backend": "Recommended backend technology",
    "database": "Recommended database solution",
    "integrations": [
      "Integration 1",
      "Integration 2",
      ...
    ]
  },
  "monetization": "Detailed monetization strategy (2-3 sentences)",
  "roadmap": [
    "Phase 1: Milestone description",
    "Phase 2: Milestone description",
    ...
  ],
  "ui_inspiration": "Brief notes on UI/UX direction and inspiration"
}

CRITICAL RULES:
1. Generate realistic, actionable features based on the idea.
2. Recommend modern, proven technology stacks.
3. Provide practical monetization strategies (subscription, freemium, marketplace, etc.).
4. Create a phased roadmap that shows logical progression.
5. Keep features list to 7 items maximum.
6. Keep roadmap to 6 milestones maximum.
7. Keep integrations list to 6 items maximum.
8. DO NOT include any text outside the JSON structure.
9. Be specific and professional - avoid generic responses.
10. Consider the target audience and platform when making recommendations.`;
```

### User Prompt Builder Function
```javascript
export function buildUserPrompt(prompt, context = {}) {
  const parts = [];
  
  parts.push('=== APP IDEA ===');
  parts.push(prompt);
  parts.push('');
  
  if (context.platform || context.industry || context.tone || context.targetAudience) {
    parts.push('=== ADDITIONAL CONTEXT ===');
    
    if (context.platform) {
      parts.push(`Platform: ${context.platform}`);
    }
    if (context.industry) {
      parts.push(`Industry: ${context.industry}`);
    }
    if (context.targetAudience) {
      parts.push(`Target Audience: ${context.targetAudience}`);
    }
    if (context.tone) {
      parts.push(`Tone/Style: ${context.tone}`);
    }
    parts.push('');
  }
  
  parts.push('=== TASK ===');
  parts.push('Generate a complete product concept following the JSON schema exactly. Make it professional, actionable, and tailored to the idea provided.');
  
  return parts.join('\n');
}
```

### How They're Combined
**File:** `lib/geminiIdeationService.js` (line 45)
```javascript
const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;
```

---

## 🎯 Example: Final Prompt Sent to Gemini

### Example Input:
```javascript
prompt: "I want my business Instagram to look professional"
context: {
  platform: "web",
  industry: "retail",
  targetAudience: "small business owners",
  tone: "professional"
}
```

### Final Prompt (What Gets Sent to Gemini):

```
You are Devello's Creative Intelligence Engine. Your purpose is to transform simple app ideas into complete, professional product concepts.

Devello builds custom software solutions for clients. When given a one-sentence app idea, you must generate a comprehensive product concept that includes:

1. Product name and tagline
2. Core features (7 maximum)
3. Technology stack recommendations (frontend, backend, database, integrations)
4. Monetization strategy
5. Development roadmap (6 milestones maximum)
6. UI/UX inspiration notes

STRICT OUTPUT FORMAT (JSON only, no other text):
{
  "name": "Product Name",
  "tagline": "One-line compelling description",
  "features": [
    "Feature 1",
    "Feature 2",
    "Feature 3",
    ...
  ],
  "tech_stack": {
    "frontend": "Recommended frontend framework/stack",
    "backend": "Recommended backend technology",
    "database": "Recommended database solution",
    "integrations": [
      "Integration 1",
      "Integration 2",
      ...
    ]
  },
  "monetization": "Detailed monetization strategy (2-3 sentences)",
  "roadmap": [
    "Phase 1: Milestone description",
    "Phase 2: Milestone description",
    ...
  ],
  "ui_inspiration": "Brief notes on UI/UX direction and inspiration"
}

CRITICAL RULES:
1. Generate realistic, actionable features based on the idea.
2. Recommend modern, proven technology stacks.
3. Provide practical monetization strategies (subscription, freemium, marketplace, etc.).
4. Create a phased roadmap that shows logical progression.
5. Keep features list to 7 items maximum.
6. Keep roadmap to 6 milestones maximum.
7. Keep integrations list to 6 items maximum.
8. DO NOT include any text outside the JSON structure.
9. Be specific and professional - avoid generic responses.
10. Consider the target audience and platform when making recommendations.

=== APP IDEA ===
I want my business Instagram to look professional

=== ADDITIONAL CONTEXT ===
Platform: web
Industry: retail
Target Audience: small business owners
Tone/Style: professional

=== TASK ===
Generate a complete product concept following the JSON schema exactly. Make it professional, actionable, and tailored to the idea provided.
```

---

## 📋 Example: Minimal Input (No Context)

### Input:
```javascript
prompt: "A fitness app for tracking workouts"
context: {}  // Empty context
```

### Final Prompt:

```
You are Devello's Creative Intelligence Engine. Your purpose is to transform simple app ideas into complete, professional product concepts.

[... SYSTEM_PROMPT ...]

=== APP IDEA ===
A fitness app for tracking workouts

=== TASK ===
Generate a complete product concept following the JSON schema exactly. Make it professional, actionable, and tailored to the idea provided.
```

---

## 🔧 How It Works

1. **System Prompt** - Always included, defines the AI's role and output format
2. **User Prompt Builder** - Dynamically builds based on:
   - User's idea (required)
   - Optional context (platform, industry, tone, targetAudience)
3. **Combined** - System prompt + newline + newline + User prompt
4. **Sent to Gemini** - As a single text string

---

## 📊 Prompt Structure Breakdown

```
┌─────────────────────────────────────┐
│  SYSTEM_PROMPT (Fixed)             │
│  - AI role definition              │
│  - Output format specification     │
│  - Rules and constraints           │
└─────────────────────────────────────┘
              +
┌─────────────────────────────────────┐
│  USER_PROMPT (Dynamic)             │
│  === APP IDEA ===                  │
│  [User's idea text]                │
│                                     │
│  === ADDITIONAL CONTEXT ===        │
│  Platform: [if provided]           │
│  Industry: [if provided]           │
│  Target Audience: [if provided]    │
│  Tone/Style: [if provided]         │
│                                     │
│  === TASK ===                      │
│  [Generation instructions]         │
└─────────────────────────────────────┘
              =
┌─────────────────────────────────────┐
│  FULL_PROMPT (Sent to Gemini)      │
│  [Combined string]                 │
└─────────────────────────────────────┘
```

---

## 💡 Key Points

1. **System Prompt** is static - never changes
2. **User Prompt** is dynamic - built from user input + optional context
3. **Context is optional** - if not provided, those sections are omitted
4. **Final prompt** = System + "\n\n" + User
5. **Sent as single text** to Gemini API
