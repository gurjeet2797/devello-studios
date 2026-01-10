/**
 * Organization Schema Components for SEO
 * Provides JSON-LD structured data for Devello Inc and subsidiaries
 */

import { DEVELLO_INC_SCHEMA, getSubsidiarySchema } from '../../lib/seoConfig';

/**
 * Devello Inc Parent Corporation Schema
 * Use on develloinc.com pages
 */
export function DevelloIncSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(DEVELLO_INC_SCHEMA) }}
    />
  );
}

/**
 * Subsidiary Organization Schema
 * Use on subsidiary domain pages (Studios, Tech, Construction, Shop)
 * @param {string} name - Organization name
 * @param {string} url - Organization URL
 */
export function SubsidiarySchema({ name, url }) {
  const schema = getSubsidiarySchema(name, url);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Combined schema for pages that need both parent and subsidiary
 * Useful for pages that want to show both relationships
 */
export function CombinedOrganizationSchema({ subsidiaryName, subsidiaryUrl, additionalSchema = null }) {
  const schemas = [
    DEVELLO_INC_SCHEMA,
    getSubsidiarySchema(subsidiaryName, subsidiaryUrl)
  ];
  
  if (additionalSchema) {
    schemas.push(additionalSchema);
  }
  
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
