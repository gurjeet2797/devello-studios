/**
 * FAQ Schema Generator
 * Creates FAQPage structured data for better search visibility
 */

/**
 * Generate FAQ schema
 * @param {Array} faqs - Array of {question, answer} objects
 * @returns {object} FAQPage schema
 */
export function generateFAQSchema(faqs) {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}
