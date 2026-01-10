# Partners Platform Feature - Implementation Plan & Review

## Codebase Review Summary

### Current Architecture
- **Framework**: Next.js with API routes
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: Supabase Auth with Bearer token pattern
- **Admin Access**: Email-based (`sales@devello.us`) via `lib/adminAuth.js`
- **API Pattern**: Consistent Bearer token validation across all endpoints

### Key Findings
1. ✅ No existing partners table in schema - needs to be created
2. ✅ Consistent API authentication pattern exists
3. ✅ Admin dashboard structure in place (`components/admin/AdminLayout.js`)
4. ✅ Navigation component has user dropdown menu (lines 820-866 desktop, 1255-1293 mobile)
5. ✅ AboutPage has "Become a Partner" section (lines 323-426) with button at 394-405
6. ✅ AuthModal component exists and can be enhanced

### Database Schema Review
- Uses Prisma with PostgreSQL
- No partners table currently exists
- Need to add Partner model to `prisma/schema.prisma`

---

## Implementation Plan

### Phase 1: Partners Page & Dashboard ✅ Foundation

#### Step 1.1: Database Schema
**File**: `prisma/schema.prisma`

Add Partner model:
```prisma
model Partner {
  id          String   @id @default(cuid())
  user_id     String   @unique
  user        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  // Application details
  company_name      String
  service_type      String // "construction", "software_dev", "consulting"
  years_experience   Int?
  description       String?
  phone             String?
  portfolio_url     String?
  
  // Status tracking
  status            String @default("pending") // "pending", "approved", "rejected"
  applied_at        DateTime @default(now())
  approved_at       DateTime?
  approved_by       String? // Admin email who approved
  rejected_at       DateTime?
  rejection_reason  String?
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  @@map("partners")
}
```

**Update User model** to add relation:
```prisma
model User {
  // ... existing fields ...
  partner      Partner?
  // ... rest of fields ...
}
```

**Migration**: Run `npx prisma migrate dev --name add_partners_table`

---

#### Step 1.2: API Endpoint - Partner Status
**File**: `pages/api/partners/status.js`

**Purpose**: Check current user's partner status
**Authentication**: Required (Bearer token)
**Returns**: `{ isPartner: boolean, status: string, partnerData: object | null }`

**Implementation Pattern** (following existing API style):
- Validate Bearer token
- Get user from Supabase
- Query partners table by user_id
- Return status and data

---

#### Step 1.3: Partners Page Route
**File**: `pages/partners.js`

**Features**:
- Check authentication (redirect if not logged in)
- Call `/api/partners/status` to check status
- If not approved: redirect to `/about#become-partner`
- If approved: show PartnerDashboard
- Loading state while checking

---

#### Step 1.4: Partner Dashboard Component
**File**: `components/PartnerDashboard.js`

**Features**:
- Welcome section with partner name/company
- Service type badge (Construction/Software Dev/Consulting)
- Basic info display (company, service type, status)
- Placeholder sections for future features
- Styling consistent with existing design system (uses theme from Layout)

---

### Phase 2: Navigation Integration ✅ User Access

#### Step 2.1: Add Partners Portal Button
**File**: `components/Navigation.js`

**Location**: 
- Desktop: After "Account" button (around line 840), before "Sign Out" (line 841)
- Mobile: After "Account" button (around line 1257), before "Sign Out" (line 1277)

**Implementation**:
- Add state to fetch partner status on mount
- Add "Partners Portal" menu item
- Implement routing logic:
  - Approved → `/partners`
  - Not applied → `/about#become-partner` (scroll to section)
  - Pending → Disabled with tooltip "Application Pending"
  - Rejected → Show "Application Rejected" (optional: allow re-apply)

**Button States**:
- Approved: Clickable → routes to `/partners`
- Not Applied: Clickable → routes to `/about#become-partner`
- Pending: Disabled or shows "Pending Approval"
- Rejected: Shows "Application Rejected"

---

### Phase 3: Backend & Application Flow ✅ Complete System

#### Step 3A: Partner Application System

**3A.1: PartnerApplicationModal Component**
**File**: `components/PartnerApplicationModal.js`

**Features**:
- Modal component (similar to AuthModal styling)
- Service type selector (Construction, Software Development, Consulting)
- Dynamic form based on service type
- Form fields:
  - Company name (required)
  - Service type (required)
  - Years of experience (optional)
  - Description (optional, textarea)
  - Phone (optional)
  - Portfolio URL (optional)
- Validation and error handling
- Success/error states

**3A.2: Application API Endpoint**
**File**: `pages/api/partners/apply.js`

**Features**:
- POST endpoint
- Validate user is authenticated
- Check if user already has application (prevent duplicates)
- Insert new record into partners table with status='pending'
- Return success/error response
- Trigger email notification to admin (Phase 3E)

---

#### Step 3B: About Page Integration
**File**: `components/pages/AboutPage.js`

**Changes**:
- Update "Get in Touch" button (line 394-405)
- Logic:
  - User not signed in: "Sign up with Devello" → opens auth modal with `partnerMode=true`
  - User signed in but not partner: "Apply to Become a Partner" → opens PartnerApplicationModal
  - User is approved partner: "Partner Portal" → links to `/partners`
- Add `id="become-partner"` to the "Become a Partner" section header (around line 336) for scroll targeting

---

#### Step 3C: Auth Modal Enhancement
**File**: `components/auth/AuthModal.js`

**Changes**:
- Add optional `partnerMode` prop
- When `partnerMode={true}`:
  - Show indication that signup is for partner application
  - After successful signup, redirect to partner application flow
  - Update modal text to reflect partner context

---

#### Step 3D: Admin Dashboard Integration

**3D.1: Admin Layout Update**
**File**: `components/admin/AdminLayout.js`

**Changes**:
- Add "Partners" to navigation array (around line 65-70)
- Import Handshake icon from lucide-react

**3D.2: Admin Partners Page**
**File**: `pages/admin/partners.js`

**Features**:
- Two tabs/sections:
  - Pending Applications: List of applications awaiting approval
  - Approved Partners: List of active partners
- Partner details view
- Approve/Reject actions
- Search/filter functionality

**3D.3: Admin API Endpoints**

**File**: `pages/api/admin/partners/list.js`
- GET endpoint to fetch all partners
- Filter by status (pending/approved/rejected)
- Admin-only access (check admin email)

**File**: `pages/api/admin/partners/approve.js`
- POST endpoint to approve/reject partner
- Update status, approved_at, approved_by in partners table
- Admin-only access
- Trigger email notifications (Phase 3E)

---

#### Step 3E: Email Notifications
**File**: `lib/sendPartnerEmail.js` (or integrate into existing email utils)

**Functions**:
1. `sendApplicationNotification(partnerData)` - Notify admin of new application
2. `sendApprovalNotification(partnerEmail, partnerData)` - Notify partner of approval
3. `sendRejectionNotification(partnerEmail, reason)` - Notify partner of rejection

**Implementation**:
- Check existing email setup (likely SendGrid based on project structure)
- Create email templates
- Integrate with application submission and approval workflows

---

## Implementation Order (Frontend-First Approach)

### Phase 1: Frontend UI (Start Here)
1. ✅ **Navigation Button** - Add "Partners Portal" to user menu (desktop & mobile)
2. ✅ **Partners Page** - Create `/partners` route with basic structure
3. ✅ **PartnerDashboard Component** - Build UI with placeholder data
4. ✅ **AboutPage Integration** - Update button with placeholder logic

### Phase 2: Backend Foundation
5. ✅ **Database Schema** - Add Partner model to Prisma schema
6. ✅ **Status API** - Create `/api/partners/status.js` endpoint
7. ✅ **Apply API** - Create `/api/partners/apply.js` endpoint

### Phase 3: Frontend-Backend Integration
8. ✅ **Wire Navigation** - Connect button to real API status check
9. ✅ **PartnerApplicationModal** - Build application form component
10. ✅ **Wire AboutPage** - Connect to real application flow
11. ✅ **AuthModal Enhancement** - Add partnerMode prop

### Phase 4: Admin & Notifications
12. ✅ **AdminLayout** - Add Partners section
13. ✅ **Admin Partners Page** - Build admin interface
14. ✅ **Admin API Endpoints** - Create approval/rejection APIs
15. ✅ **Email Notifications** - Set up email workflow

---

## Risk Assessment & Mitigation

### Potential Issues:
1. **Breaking existing auth**: Mitigation - Follow exact same auth pattern as existing APIs
2. **Database migration conflicts**: Mitigation - Test migration locally first
3. **Navigation menu conflicts**: Mitigation - Add button carefully, test all menu states
4. **Admin access bypass**: Mitigation - Use existing `verifyAdminAccess` pattern

### Testing Checklist:
- [ ] Partner status check works for all states (pending, approved, rejected, none)
- [ ] Navigation button appears correctly in desktop and mobile
- [ ] Application form validation works
- [ ] Admin approval/rejection flow works
- [ ] Email notifications sent correctly
- [ ] No existing functionality broken

---

## Dependencies

### External:
- Supabase (already configured)
- Prisma (already configured)
- Email service (SendGrid or similar - need to verify)

### Internal:
- `lib/supabaseClient.js` - Already exists
- `lib/adminAuth.js` - Already exists
- `components/auth/AuthProvider.js` - Already exists
- `components/Layout.js` - For theme context

---

## Notes

- All changes will be made incrementally, one step at a time
- Each step will be tested before moving to next
- No existing functionality will be broken
- Follow existing code patterns and styling conventions
- Use existing theme system for consistent styling

