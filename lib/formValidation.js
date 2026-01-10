// Form validation utilities for spam and gibberish detection

/**
 * Checks if text contains mostly random characters (gibberish)
 * @param {string} text - Text to validate
 * @param {number} minWords - Minimum number of words required
 * @param {boolean} isName - If true, uses name-specific validation (more lenient for short names)
 * @returns {boolean} - True if text appears to be gibberish
 */
export function isGibberish(text, minWords = 3, isName = false) {
  if (!text || typeof text !== 'string') return true;
  
  // Remove extra whitespace
  const cleaned = text.trim().replace(/\s+/g, ' ');
  
  // For names, be more lenient with length
  const minLength = isName ? 2 : 10;
  if (cleaned.length < minLength) return true;
  
  // Count words (split by spaces)
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  
  // For names, allow 1-3 words; for other text, require minWords
  if (isName) {
    if (words.length === 0) return true;
    // Names can be 1-3 words, so skip the minWords check
  } else {
    if (words.length < minWords) return true;
  }
  
  // Calculate vowel-to-consonant ratio for the entire text (better for single words)
  const textWithoutSpaces = cleaned.replace(/\s+/g, '');
  const vowels = (textWithoutSpaces.match(/[aeiouAEIOU]/g) || []).length;
  const consonants = (textWithoutSpaces.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length;
  const totalLetters = vowels + consonants;
  
  // If we have letters, check the ratio
  if (totalLetters > 0 && totalLetters >= 8) {
    const vowelRatio = vowels / totalLetters;
    const hasMixedCase = /[a-z]/.test(textWithoutSpaces) && /[A-Z]/.test(textWithoutSpaces);
    
    // Count case changes (indicator of random generation)
    let caseChanges = 0;
    if (hasMixedCase) {
      for (let i = 1; i < textWithoutSpaces.length; i++) {
        const prevIsUpper = textWithoutSpaces[i-1] === textWithoutSpaces[i-1].toUpperCase() && /[A-Z]/.test(textWithoutSpaces[i-1]);
        const currIsUpper = textWithoutSpaces[i] === textWithoutSpaces[i].toUpperCase() && /[A-Z]/.test(textWithoutSpaces[i]);
        if (prevIsUpper !== currIsUpper) caseChanges++;
      }
    }
    
    // Random strings typically have very low vowel ratio (< 0.2)
    // Legitimate text usually has 0.25-0.5 vowel ratio
    // For names, use stricter threshold (0.20) because names should have good vowel distribution
    const threshold = isName ? 0.20 : 0.15;
    if (vowelRatio < threshold) {
      return true; // Very low vowel ratio = likely random
    }
    
    // Additional check: if vowel ratio is borderline (0.20-0.30) and text has excessive case changes, it's suspicious
    if (isName && vowelRatio >= 0.20 && vowelRatio < 0.30 && totalLetters >= 15) {
      // If there are many case changes relative to length (>25%), it's likely random
      if (hasMixedCase && caseChanges > totalLetters * 0.25) {
        return true; // Too many case changes = random pattern
      }
    }
    
    // For names with mixed case and moderate vowel ratio, check for unusual patterns
    if (isName && hasMixedCase && vowelRatio < 0.30 && totalLetters >= 10) {
      // Check if case changes are too frequent (more than 20% of transitions)
      if (caseChanges > totalLetters * 0.20) {
        return true;
      }
    }
  }
  
  // Check for excessive random character patterns in individual words
  // High ratio of consonants to vowels in individual "words"
  const randomPattern = /^[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{5,}$/;
  const randomWordCount = words.filter(w => randomPattern.test(w) && w.length >= 5).length;
  
  // For names, if any word is random and long, it's suspicious
  // For other text, if more than 50% of words are random, it's gibberish
  if (isName) {
    if (randomWordCount > 0 && words.some(w => w.length >= 10)) {
      return true; // Any long random word in a name is suspicious
    }
  } else {
    if (words.length > 0 && randomWordCount / words.length > 0.5) {
      return true;
    }
  }
  
  // Check for excessive repeated characters (e.g., "aaaaa", "xxxxx")
  const repeatedChars = /(.)\1{4,}/;
  if (repeatedChars.test(text)) return true;
  
  // Check for alternating pattern (e.g., "ababab", "abababab")
  // Improved pattern: matches 3+ repetitions of 2-character pattern
  const alternating = /(.)(.)(\1\2){2,}/i;
  if (alternating.test(cleaned)) return true;
  
  // Also check for single character alternating (e.g., "ababab" but also "abababab")
  // This catches patterns like "abababab" (4 repetitions of "ab")
  const singleCharAlternating = /(.)(.)(\1\2){3,}/i;
  if (singleCharAlternating.test(cleaned)) return true;
  
  // Check for simple repeating 2-char pattern at word level (for names)
  if (isName && words.length > 0) {
    for (const word of words) {
      if (word.length >= 6) {
        // Check if word is just repeating 2 characters
        const twoCharPattern = /^(.{1,2})\1{2,}$/i;
        if (twoCharPattern.test(word)) {
          return true;
        }
      }
    }
  }
  
  // Check for keyboard mashing patterns (adjacent keys)
  const keyboardMash = /(qwerty|asdf|zxcv|hjkl|fghj|dfgh)/i;
  if (keyboardMash.test(text)) return true;
  
  // Check for mixed case random patterns (like "iogBYcDIsPFMMyOktn", "yEDZLINAVsIPCfUBQVzjo")
  // If a word has excessive case changes and low vowel ratio, it's likely random
  if (isName && words.length > 0) {
    for (const word of words) {
      if (word.length >= 10) {
        const hasVowels = /[aeiouAEIOU]/.test(word);
        const hasMixedCase = /[a-z]/.test(word) && /[A-Z]/.test(word);
        
        // Count case changes in the word
        let caseChanges = 0;
        if (hasMixedCase) {
          for (let i = 1; i < word.length; i++) {
            const prevIsUpper = word[i-1] === word[i-1].toUpperCase() && /[A-Z]/.test(word[i-1]);
            const currIsUpper = word[i] === word[i].toUpperCase() && /[A-Z]/.test(word[i]);
            if (prevIsUpper !== currIsUpper) caseChanges++;
          }
        }
        
        // Long word with mixed case but no vowels = suspicious
        if (hasMixedCase && !hasVowels) {
          return true;
        }
        
        // Calculate vowel ratio for this word
        const wordVowels = (word.match(/[aeiouAEIOU]/g) || []).length;
        const wordConsonants = (word.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length;
        const wordTotalLetters = wordVowels + wordConsonants;
        
        if (wordTotalLetters > 0) {
          const wordVowelRatio = wordVowels / wordTotalLetters;
          
          // CRITICAL: If word has excessive case changes (>20% of length), it's likely random
          // Real names rarely have more than 1-2 case changes (like "McDonald")
          if (hasMixedCase && caseChanges > word.length * 0.20) {
            return true; // Too many case changes = random pattern
          }
          
          // If word has many case changes (>15% of length) AND low vowel ratio (<25%), it's random
          if (hasMixedCase && caseChanges > word.length * 0.15 && wordVowelRatio < 0.25) {
            return true;
          }
          
          // Long word with very few vowels (< 20% vowel ratio) = suspicious
          if (wordVowelRatio < 0.20 && word.length >= 10) {
            return true;
          }
          
          // Check for unusual consonant clusters (4+ consecutive consonants, rare in real names)
          const consonantClusters = word.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{4,}/g);
          if (consonantClusters && consonantClusters.length > 0 && wordVowelRatio < 0.25) {
            // If we have 4+ consecutive consonants and low vowel ratio, it's suspicious
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

/**
 * Validates a name field
 * @param {string} name - Name to validate
 * @returns {object} - { valid: boolean, error?: string }
 */
export function isValidName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }
  
  const trimmed = name.trim();
  
  // Minimum length check
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  
  // Maximum length check
  if (trimmed.length > 100) {
    return { valid: false, error: 'Name is too long' };
  }
  
  // Check for gibberish (use name-specific validation)
  if (isGibberish(trimmed, 1, true)) {
    return { valid: false, error: 'Name appears to be invalid. Please enter your real name.' };
  }
  
  // Check for only special characters or numbers
  const onlySpecialChars = /^[^a-zA-Z\s]+$/;
  if (onlySpecialChars.test(trimmed)) {
    return { valid: false, error: 'Name must contain letters' };
  }
  
  // Check for excessive special characters
  const specialCharCount = (trimmed.match(/[^a-zA-Z0-9\s]/g) || []).length;
  if (specialCharCount > trimmed.length * 0.3) {
    return { valid: false, error: 'Name contains too many special characters' };
  }
  
  return { valid: true };
}

/**
 * Validates a subject line
 * @param {string} subject - Subject to validate
 * @returns {object} - { valid: boolean, error?: string }
 */
export function isValidSubject(subject) {
  if (!subject || typeof subject !== 'string') {
    return { valid: false, error: 'Subject is required' };
  }
  
  const trimmed = subject.trim();
  
  // Minimum length check
  if (trimmed.length < 3) {
    return { valid: false, error: 'Subject must be at least 3 characters' };
  }
  
  // Maximum length check
  if (trimmed.length > 200) {
    return { valid: false, error: 'Subject is too long' };
  }
  
  // Check for gibberish (subjects can be short, so be lenient)
  if (isGibberish(trimmed, 1, false)) {
    return { valid: false, error: 'Subject appears to be invalid. Please enter a meaningful subject.' };
  }
  
  return { valid: true };
}

/**
 * Validates a message/description field
 * @param {string} message - Message to validate
 * @param {number} minWords - Minimum number of words required
 * @returns {object} - { valid: boolean, error?: string }
 */
export function isValidMessage(message, minWords = 5) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }
  
  const trimmed = message.trim();
  
  // Minimum length check
  if (trimmed.length < 20) {
    return { valid: false, error: `Message must be at least 20 characters` };
  }
  
  // Count words
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length < minWords) {
    return { valid: false, error: `Message must contain at least ${minWords} words` };
  }
  
  // Check for gibberish
  if (isGibberish(trimmed, minWords)) {
    return { valid: false, error: 'Message appears to be invalid. Please provide a meaningful message.' };
  }
  
  return { valid: true };
}

/**
 * Validates email format (enhanced)
 * @param {string} email - Email to validate
 * @returns {object} - { valid: boolean, error?: string }
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmed = email.toLowerCase().trim();
  
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  // Check for suspicious patterns (common in spam)
  const suspiciousPatterns = [
    /^[a-z0-9]{10,}@/, // Very long local part
    /@(test|example|fake|spam)/i, // Common spam domains
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      // Log but don't reject - some legitimate emails might match
      console.warn('[FORM_VALIDATION] Suspicious email pattern detected:', trimmed);
    }
  }
  
  return { valid: true };
}

/**
 * Validates honeypot field (should be empty)
 * @param {string} honeypot - Honeypot field value
 * @returns {object} - { valid: boolean, error?: string }
 */
export function validateHoneypot(honeypot) {
  if (honeypot && honeypot.trim().length > 0) {
    return { valid: false, error: 'Spam detected' };
  }
  return { valid: true };
}

/**
 * Comprehensive form validation
 * @param {object} fields - Form fields to validate
 * @param {object} options - Validation options
 * @returns {object} - { valid: boolean, errors: object }
 */
export function validateFormFields(fields, options = {}) {
  const {
    requireName = true,
    requireEmail = true,
    requireSubject = false,
    requireMessage = true,
    minMessageWords = 5,
    checkHoneypot = true
  } = options;
  
  const errors = {};
  let isValid = true;
  
  // Honeypot check
  if (checkHoneypot && fields.website !== undefined) {
    const honeypotResult = validateHoneypot(fields.website);
    if (!honeypotResult.valid) {
      errors.website = honeypotResult.error;
      isValid = false;
    }
  }
  
  // Name validation
  if (requireName) {
    const nameResult = isValidName(fields.name);
    if (!nameResult.valid) {
      errors.name = nameResult.error;
      isValid = false;
    }
  }
  
  // Email validation
  if (requireEmail) {
    const emailResult = isValidEmail(fields.email);
    if (!emailResult.valid) {
      errors.email = emailResult.error;
      isValid = false;
    }
  }
  
  // Subject validation
  if (requireSubject && fields.subject !== undefined) {
    const subjectResult = isValidSubject(fields.subject);
    if (!subjectResult.valid) {
      errors.subject = subjectResult.error;
      isValid = false;
    }
  }
  
  // Message/description validation
  if (requireMessage) {
    const messageField = fields.message || fields.description || fields.businessDescription || fields.projectDescription;
    if (messageField !== undefined) {
      const messageResult = isValidMessage(messageField, minMessageWords);
      if (!messageResult.valid) {
        errors.message = messageResult.error;
        errors.description = messageResult.error;
        isValid = false;
      }
    }
  }
  
  return { valid: isValid, errors };
}
