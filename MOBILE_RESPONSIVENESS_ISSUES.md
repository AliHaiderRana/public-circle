# Mobile Responsiveness Issues

This document lists areas in the public-circle app that are not mobile responsive or need improvement for mobile devices.

## Table of Contents
- [Tables](#tables)
- [Forms](#forms)
- [Select Components](#select-components)
- [Grid Layouts](#grid-layouts)
- [Fixed Width Elements](#fixed-width-elements)
- [Dialogs and Modals](#dialogs-and-modals)
- [Components](#components)

---

## Tables

### 1. Campaign List Table
**File:** `src/pages/dashboard/campaign/list.tsx`
**Issue:** Table has `min-w-[1200px]` which forces horizontal scrolling on mobile
**Line:** 706
```tsx
<Table className="min-w-[1200px]">
```
**Impact:** High - Campaign list is a core feature
**Recommendation:** Implement card-based layout for mobile or make table columns stack vertically

### 2. Contacts List Table (Configurations)
**File:** `src/pages/dashboard/configurations/contacts-list.tsx`
**Issue:** Table has multiple columns with sticky positioning that may not work well on mobile
**Line:** 388-429
**Impact:** High - Contacts management is frequently used
**Recommendation:** Consider mobile card view or horizontal scroll with better UX indicators

### 3. Audience List Table
**File:** `src/pages/dashboard/audience/list.tsx`
**Issue:** Table doesn't have responsive breakpoints or mobile alternative
**Line:** 84-106
**Impact:** Medium - Table may overflow on small screens
**Recommendation:** Add responsive wrapper or mobile card layout

### 4. Filters Table
**File:** `src/pages/dashboard/audience/filters.tsx`
**Issue:** Table lacks mobile responsiveness
**Line:** 108-150
**Impact:** Medium
**Recommendation:** Add mobile-friendly layout

### 5. Contacts List View (Sections)
**File:** `src/sections/contacts/view/contacts-list-view.tsx`
**Issue:** Table has `min-w-[150px]` on table heads and sticky columns that may cause issues
**Line:** 448
**Impact:** High
**Recommendation:** Implement responsive table or card layout for mobile

### 6. Email Configuration Table
**File:** `src/pages/dashboard/configurations/email-configuration.tsx`
**Issue:** Table has `min-w-[150px]` on email addresses and fixed width columns
**Line:** 369, 441
**Impact:** Medium
**Recommendation:** Make email addresses wrap or truncate on mobile

### 7. Campaign Recurring Table
**File:** `src/pages/dashboard/campaign/recurring.tsx`
**Issue:** Table may overflow on mobile devices
**Line:** 379+
**Impact:** Medium
**Recommendation:** Add responsive handling

---

## Forms

### 1. Profile Form
**File:** `src/pages/dashboard/profile.tsx`
**Issue:** Form uses `grid-cols-2` without mobile breakpoint
**Line:** 176
```tsx
<div className="grid grid-cols-2 gap-4">
```
**Impact:** Medium - Form fields will be cramped on mobile
**Recommendation:** Change to `grid-cols-1 md:grid-cols-2`

### 2. Settings Form
**File:** `src/pages/dashboard/settings.tsx`
**Issue:** Form uses `grid-cols-2` without mobile breakpoint
**Line:** 198
```tsx
<div className="grid grid-cols-2 gap-4">
```
**Impact:** Medium
**Recommendation:** Change to `grid-cols-1 md:grid-cols-2`

### 3. Campaign Create/Edit Forms
**File:** `src/pages/dashboard/campaign/create.tsx` and `edit.tsx`
**Issue:** CC/BCC email inputs have `min-w-[200px]` which may cause overflow
**Line:** 682, 715 (create.tsx), 780, 813 (edit.tsx)
```tsx
className="flex-1 min-w-[200px] border-0..."
```
**Impact:** Low-Medium - May cause horizontal scroll
**Recommendation:** Remove min-width or make it responsive

### 4. Contact Merger Form
**File:** `src/sections/contacts/contact-merger.tsx`
**Issue:** Uses `grid-cols-12` which may not be responsive
**Line:** 193
**Impact:** Medium
**Recommendation:** Add responsive breakpoints

### 5. Condition Builder Form
**File:** `src/components/segments/ConditionBuilder.tsx`
**Issue:** Uses `grid-cols-2` without mobile breakpoint
**Line:** 132, 179
**Impact:** Medium
**Recommendation:** Add `grid-cols-1 md:grid-cols-2`

---

## Select Components

### 1. Logs Page Select
**File:** `src/pages/dashboard/logs/list.tsx`
**Issue:** Select has fixed width `w-[180px]` without responsive breakpoint
**Line:** 309
```tsx
<SelectTrigger className="w-[180px]">
```
**Impact:** Low-Medium
**Recommendation:** Use `w-full sm:w-[180px]`

### 2. Logs Details Select
**File:** `src/pages/dashboard/logs/details.tsx`
**Issue:** Select has fixed width `w-[180px]`
**Line:** 444
**Impact:** Low-Medium
**Recommendation:** Make responsive

### 3. Logs Messages Select
**File:** `src/pages/dashboard/logs/messages.tsx`
**Issue:** Select has fixed width `w-[180px]`
**Line:** 997
**Impact:** Low-Medium
**Recommendation:** Make responsive

### 4. Templates Page Select
**File:** `src/pages/dashboard/templates/index.tsx`
**Issue:** Select has fixed width `w-[80px]`
**Line:** 711
**Impact:** Low
**Recommendation:** Consider responsive width

### 5. Campaign List Selects
**File:** `src/pages/dashboard/campaign/list.tsx`
**Issue:** Multiple selects with fixed widths
**Line:** 574, 586, 1095
**Impact:** Medium
**Recommendation:** Make responsive with `w-full sm:w-[...]`

### 6. Contacts Filter Select
**File:** `src/components/contacts/FilterSection.tsx`
**Issue:** Select has fixed width `w-[120px]`
**Line:** 438
**Impact:** Low-Medium
**Recommendation:** Make responsive

### 7. Contact Search Select
**File:** `src/components/contacts/ContactSearch.tsx`
**Issue:** Select has fixed width `w-[200px]`
**Line:** 223
**Impact:** Medium
**Recommendation:** Make responsive

### 8. Segment Filter Builder Select
**File:** `src/components/segments/SegmentFilterBuilder.tsx`
**Issue:** Select has fixed width `w-[300px]`
**Line:** 124
**Impact:** High - May overflow on mobile
**Recommendation:** Use `w-full sm:w-[300px]`

### 9. Dashboard Email Analytics Selects
**File:** `src/components/dashboard/email-analytics-chart.tsx`
**Issue:** Multiple selects with fixed widths
**Line:** 103, 120, 135, 154
**Impact:** Medium
**Recommendation:** Make responsive

---

## Grid Layouts

### 1. Template Select Grid
**File:** `src/pages/dashboard/templates/template-select.tsx`
**Issue:** Grid uses `grid-cols-2` without mobile breakpoint
**Line:** 350
```tsx
<div className="grid grid-cols-2 gap-4 mb-6">
```
**Impact:** Medium
**Recommendation:** Change to `grid-cols-1 sm:grid-cols-2`

### 2. Contacts Filter Grid
**File:** `src/components/contacts/FilterSection.tsx`
**Issue:** Grid uses `grid-cols-2` without mobile breakpoint
**Line:** 566
**Impact:** Medium
**Recommendation:** Add responsive breakpoint

### 3. Contact Search Grid
**File:** `src/sections/contacts/contact-search.tsx`
**Issue:** Grid uses `grid-cols-3` without mobile breakpoint
**Line:** 268
**Impact:** Medium
**Recommendation:** Add responsive breakpoints

### 4. Segment Condition Builder Grid
**File:** `src/components/segments/ConditionBuilder.tsx`
**Issue:** Grid uses `grid-cols-2` without mobile breakpoint
**Line:** 256
**Impact:** Medium
**Recommendation:** Add `grid-cols-1 md:grid-cols-2`

### 5. Campaign Recurring Grid
**File:** `src/pages/dashboard/campaign/recurring.tsx`
**Issue:** Grid uses `md:grid-cols-4` which may be too many columns
**Line:** 286
**Impact:** Low-Medium
**Recommendation:** Consider `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`

### 6. Advanced Scheduling Grid
**File:** `src/components/campaign/AdvancedSchedulingSection.tsx`
**Issue:** Grid uses `grid-cols-2` without mobile breakpoint
**Line:** 84
**Impact:** Medium
**Recommendation:** Add responsive breakpoint

---

## Fixed Width Elements

### 1. Campaign List Table Head
**File:** `src/pages/dashboard/campaign/list.tsx`
**Issue:** Actions column has fixed width `w-[200px]`
**Line:** 808
**Impact:** Medium
**Recommendation:** Use responsive width or auto

### 2. Campaign List Table Cells
**File:** `src/pages/dashboard/campaign/list.tsx`
**Issue:** Table cells have `max-w-[200px]` which may truncate content
**Line:** 877, 880
**Impact:** Low-Medium
**Recommendation:** Consider better mobile handling

### 3. Contact Table Row
**File:** `src/components/contacts/ContactTableRow.tsx`
**Issue:** Has `max-w-[200px]` which may cause issues
**Line:** 89
**Impact:** Medium
**Recommendation:** Review mobile behavior

### 4. Email Configuration Min Width
**File:** `src/pages/dashboard/configurations/email-configuration.tsx`
**Issue:** Email address span has `min-w-[150px]`
**Line:** 369
**Impact:** Medium
**Recommendation:** Remove or make responsive

### 5. Contacts List Pagination Buttons
**File:** `src/pages/dashboard/configurations/contacts-list.tsx`
**Issue:** Buttons have `min-w-[100px]` which may cause overflow
**Line:** 471, 484
**Impact:** Low
**Recommendation:** Remove min-width or make responsive

### 6. Template Preview Drawer
**File:** `src/components/template-editor/TemplatePreviewDrawer.tsx`
**Issue:** Has `min-w-[200px]` on button container
**Line:** 167
**Impact:** Low-Medium
**Recommendation:** Make responsive

---

## Dialogs and Modals

### 1. Account Restriction Dialog
**File:** `src/components/campaign/AccountRestrictionDialog.tsx`
**Issue:** Dialog has `sm:max-w-[500px]` which may be too wide for small screens
**Line:** 73
**Impact:** Low-Medium
**Recommendation:** Ensure proper padding on mobile

### 2. Apple Relay Verification Modal
**File:** `src/components/apple-relay/apple-relay-verification-modal.tsx`
**Issue:** Dialog has `sm:max-w-[500px]`
**Line:** 58
**Impact:** Low-Medium
**Recommendation:** Review mobile layout

### 3. Unsaved Changes Dialog
**File:** `src/components/template-editor/UnsavedChangesDialog.tsx`
**Issue:** Dialog has `sm:max-w-[425px]`
**Line:** 32
**Impact:** Low
**Recommendation:** Ensure proper mobile spacing

### 4. Segment Count Dialog
**File:** `src/pages/dashboard/campaign/list.tsx`
**Issue:** Dialog has `max-w-2xl` which may be too wide
**Line:** 1259
**Impact:** Medium
**Recommendation:** Add mobile-specific max-width

### 5. View Contact Dialog
**File:** `src/components/contacts/ViewContactDialog.tsx`
**Issue:** Pre element has `max-w-md` which may cause horizontal scroll
**Line:** 61
**Impact:** Low-Medium
**Recommendation:** Ensure proper word wrapping

---

## Components

### 1. Dashboard Sidebar
**File:** `src/layouts/dashboard/sidebar.tsx`
**Issue:** Sidebar has fixed width `w-64` (256px) - handled via mobile sheet, but verify mobile menu works well
**Line:** 265
**Impact:** Low - Mobile menu exists but should be tested
**Recommendation:** Test mobile menu functionality thoroughly

### 2. Dashboard Header
**File:** `src/layouts/dashboard/header.tsx`
**Issue:** Header has max-width constraint that may need adjustment
**Line:** 62
**Impact:** Low - Generally responsive but verify spacing
**Recommendation:** Test on various mobile screen sizes

### 3. Template Editor
**File:** `src/components/template-editor/EmailTemplateEditor.tsx`
**Issue:** Editor container uses viewport height calculations that may not work well on mobile
**Line:** 400-403
**Impact:** Medium - Editor is critical feature
**Recommendation:** Test editor on mobile devices and adjust height calculations

### 4. Processing Modal
**File:** `src/components/ui/processing-modal.tsx`
**Issue:** Modal has fixed widths `w-[320px] sm:w-[360px]` which may need adjustment
**Line:** 55, 182
**Impact:** Low
**Recommendation:** Ensure proper spacing on very small screens

### 5. Nav Tour Component
**File:** `src/components/tour/nav-tour.tsx`
**Issue:** Has fixed width `width: '180px'` in style
**Line:** 153
**Impact:** Low
**Recommendation:** Make responsive

### 6. Subscription Status Alert
**File:** `src/components/subscription-status-alert.tsx`
**Issue:** Should verify mobile layout
**Impact:** Medium - Important for user awareness
**Recommendation:** Test on mobile devices

---

## General Recommendations

1. **Table Strategy:** Consider implementing a card-based layout for mobile views on all table-heavy pages
2. **Form Strategy:** Always use responsive grid classes like `grid-cols-1 md:grid-cols-2` instead of fixed `grid-cols-2`
3. **Select Strategy:** Use `w-full sm:w-[fixed-width]` pattern for all select components
4. **Testing:** Test all pages on actual mobile devices (iPhone SE, iPhone 12/13, Android phones)
5. **Breakpoints:** Ensure consistent use of Tailwind breakpoints (sm: 640px, md: 768px, lg: 1024px)
6. **Horizontal Scroll:** If horizontal scroll is necessary, add visual indicators and ensure it's intentional
7. **Touch Targets:** Ensure all interactive elements meet minimum touch target size (44x44px)

---

## Priority Levels

- **High:** Core features that are frequently used (Campaign List, Contacts List)
- **Medium:** Important features that may cause UX issues (Forms, Selects, Tables)
- **Low:** Minor issues that don't significantly impact functionality

---

## Notes

- Most pages have `overflow-x-auto` wrappers which help but don't solve UX issues
- The dashboard layout generally handles mobile well with the sheet-based sidebar
- Many components use responsive classes but may need refinement
- Consider implementing a mobile-first approach for new features
