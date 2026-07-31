# Student Support Pipeline Revision: Enrollment to Graduation

Transform the Student Support system into a comprehensive journey-centric pipeline that tracks students from enrollment to graduation, providing proactive support tools and enabling admin interventions at critical milestones.

## Overview

**Approach**: Hybrid redesign that maintains support ticketing while adding journey-based tracking, resource access, and differentiated support for undergraduate vs. postgraduate students.

**Key Components**:
- Student journey timeline with milestone tracking
- Proactive support tools (scholarships, grants, library, advisors)
- Admin intervention dashboard with predictive analytics
- Differentiated support for undergrad vs. postgrad students
- Enhanced ticketing system integrated with journey tracking

---

## 1. Database Schema Changes

### New Tables to Create

#### `student_journey_milestones`
Track key milestones in student lifecycle:
- `id`, `student_id`, `milestone_type` (enrollment, year_completion, probation, graduation, etc.)
- `milestone_date`, `status` (pending, completed, at_risk, missed)
- `notes`, `created_at`, `updated_at`

#### `student_advisors`
Assign advisors to students:
- `id`, `student_id`, `advisor_id` (FK to users), `assignment_date`
- `advisor_type` (academic, financial, research, thesis)
- `is_active`, `notes`

#### `library_resources`
Catalog of library resources and links:
- `id`, `institution_id`, `resource_name`, `resource_type` (database, journal, book_catalog, study_space)
- `url`, `description`, `access_instructions`, `is_active`

#### `support_resource_links`
Quick access links for students:
- `id`, `institution_id`, `resource_category` (library, advisor, financial_aid, counseling, career)
- `title`, `description`, `url`, `contact_email`, `phone`, `office_hours`
- `program_level_filter` (all, undergraduate, postgraduate, phd)

#### `student_interventions` (enhance existing)
Already exists in models.py - will enhance with:
- Add `intervention_category` (academic, financial, attendance, mental_health, research)
- Add `success_metric`, `completion_date`, `effectiveness_rating`

#### `student_risk_scores`
Predictive risk scoring:
- `id`, `student_id`, `risk_score` (0-100), `risk_level` (low, medium, high, critical)
- `risk_factors` (JSON: {gpa_drop, fee_arrears, low_attendance, no_advisor_contact})
- `calculated_at`, `intervention_recommended`

#### `postgrad_support`
Additional support for postgraduate students:
- `id`, `student_id`, `research_area`, `thesis_advisor_id`
- `thesis_status` (proposal, research, writing, submitted, defended)
- `conference_attendance` (JSON array), `publications` (JSON array)
- `grant_applications` (JSON array)

### Tables to Modify

#### `support_tickets` (existing)
Add columns:
- `journey_milestone_id` (FK to milestones) - link tickets to journey stages
- `auto_generated` (boolean) - flag system-generated tickets
- `intervention_id` (FK to student_interventions)

#### `students` (existing)
Add columns:
- `current_milestone`, `risk_level`, `last_advisor_contact_date`
- `program_level` (undergraduate, masters, phd)

---

## 2. Backend API Development

### New Route Files

#### `/backend/app/routes/student_journey.py`
**Student Journey Endpoints**:
- `GET /api/student-journey/my-journey` - Get student's journey timeline
- `GET /api/student-journey/milestones` - List milestones with status
- `GET /api/student-journey/progress/{student_id}` - Admin view of student progress
- `POST /api/student-journey/milestones/{id}/complete` - Mark milestone complete

#### `/backend/app/routes/student_support.py`
**Enhanced Support Endpoints**:
- `GET /api/student-support/resources` - Get support resources (filtered by program level)
- `GET /api/student-support/library-resources` - Library catalog links
- `GET /api/student-support/my-advisor` - Get assigned advisor info
- `POST /api/student-support/request-advisor-meeting` - Request advisor contact
- `GET /api/student-support/scholarships/opportunities` - Available scholarships
- `GET /api/student-support/grants/opportunities` - Research grants (postgrad only)

#### `/backend/app/routes/admin_interventions.py`
**Admin Intervention Tracking**:
- `GET /api/interventions/at-risk-students` - List students flagged for intervention
- `GET /api/interventions/student/{student_id}/history` - Intervention history
- `POST /api/interventions/create` - Create intervention record
- `PATCH /api/interventions/{id}/update` - Update intervention status
- `GET /api/interventions/analytics` - Intervention effectiveness metrics
- `GET /api/interventions/risk-scores` - Risk score dashboard
- `POST /api/interventions/calculate-risk` - Trigger risk calculation

### Enhanced Existing Routes

#### `/backend/app/routes/sis_lms.py`
Add to existing `/my-profile` endpoint:
- Include journey milestones
- Include assigned advisor
- Include risk score and flags
- Include available support resources

---

## 3. Frontend - Student Portal

### 3.1 Redesigned Support Dashboard (`/student/support/page.jsx`)

**Layout Structure**:
```
┌─────────────────────────────────────────────────────┐
│  Student Support Hub                                │
│  "Your journey from enrollment to graduation"      │
├─────────────────────────────────────────────────────┤
│  [Journey Timeline Component]                       │
│  ● Enrollment → Year 1 → Year 2 → Year 3 → Grad   │
│    (visual progress bar with milestone markers)     │
├─────────────────────────────────────────────────────┤
│  Quick Access Cards (2x3 grid)                      │
│  ┌──────────┬──────────┬──────────┐               │
│  │Scholarships│ Library  │ Advisor  │               │
│  ├──────────┼──────────┼──────────┤               │
│  │  Grants   │ Support  │Financial │               │
│  │(Postgrad) │ Tickets  │   Aid    │               │
│  └──────────┴──────────┴──────────┘               │
├─────────────────────────────────────────────────────┤
│  Active Alerts & Notifications                      │
│  - Fee payment due in 10 days                       │
│  - Scholarship application deadline approaching     │
├─────────────────────────────────────────────────────┤
│  My Support Tickets (existing component)            │
└─────────────────────────────────────────────────────┘
```

**New Components to Create**:

1. **`JourneyTimeline.jsx`**
   - Visual timeline from enrollment to expected graduation
   - Milestone markers (enrollment, year completions, probation periods, graduation)
   - Color-coded status (completed: green, current: blue, at-risk: red, upcoming: gray)
   - Click milestone to see details and related interventions

2. **`SupportResourceCard.jsx`**
   - Reusable card for each support category
   - Icon, title, description, action button
   - Badge showing new opportunities or pending items
   - Conditional rendering based on program level

3. **`ScholarshipOpportunities.jsx`**
   - List of available scholarships with eligibility matching
   - Filter by: amount, deadline, eligibility
   - "Apply" button that opens application form
   - Track application status

4. **`GrantOpportunities.jsx`** (Postgrad only)
   - Research grants, conference funding, publication support
   - Application tracking
   - Link to grant management system

5. **`AdvisorContact.jsx`**
   - Display assigned advisor(s) with contact info
   - Last contact date
   - "Request Meeting" button
   - Office hours and location

6. **`LibraryResources.jsx`**
   - Categorized links to library resources
   - Quick search for databases, journals
   - Study space booking link
   - Research support contacts

7. **`AlertsNotifications.jsx`**
   - Proactive alerts (fee due, low GPA, scholarship deadlines)
   - Dismissible notifications
   - Priority-based sorting

### 3.2 New Pages

#### `/student/support/journey/page.jsx`
Detailed journey view with:
- Full timeline visualization
- Milestone details and requirements
- Progress metrics (credits completed, GPA trend)
- Intervention history (if any)

#### `/student/support/resources/page.jsx`
Comprehensive resource directory:
- Tabbed interface: Library | Advisors | Financial Aid | Counseling | Career Services
- Search and filter functionality
- Contact information and links

---

## 4. Frontend - Admin/Staff Portal

### 4.1 New Admin Dashboard (`/staff/interventions/page.jsx`)

**Layout Structure**:
```
┌─────────────────────────────────────────────────────┐
│  Student Intervention Dashboard                     │
├─────────────────────────────────────────────────────┤
│  Risk Score Overview                                │
│  [Critical: 12] [High: 45] [Medium: 89] [Low: 234] │
├─────────────────────────────────────────────────────┤
│  At-Risk Students Table                             │
│  Name | Risk Score | Factors | Last Contact | Action│
│  Filter: Risk Level | Program | Cohort               │
├─────────────────────────────────────────────────────┤
│  Intervention Analytics                             │
│  - Success rate by intervention type                │
│  - Response time metrics                            │
│  - Student outcome trends                           │
└─────────────────────────────────────────────────────┘
```

**Components to Create**:

1. **`RiskScoreDashboard.jsx`**
   - Summary cards by risk level
   - Trend charts (risk score distribution over time)
   - Drill-down to student list

2. **`AtRiskStudentsTable.jsx`**
   - Sortable, filterable table
   - Risk factors displayed as chips
   - Quick action buttons (assign advisor, create intervention, contact student)
   - Export to CSV

3. **`StudentJourneyView.jsx`** (Admin version)
   - Complete journey timeline for selected student
   - All interventions and outcomes
   - Risk score history
   - Advisor notes and contact log

4. **`InterventionForm.jsx`**
   - Create/edit intervention records
   - Select intervention type and category
   - Assign staff member
   - Set follow-up dates
   - Track outcomes

5. **`InterventionAnalytics.jsx`**
   - Success metrics by intervention type
   - Time-to-resolution charts
   - Student retention correlation
   - Predictive recommendations

6. **`RiskCalculationEngine.jsx`**
   - Manual trigger for risk recalculation
   - View risk factors and weights
   - Adjust risk thresholds

### 4.2 Enhanced Student Detail View

Add to existing `/staff/students/{id}` page:
- Journey timeline tab
- Risk score and factors
- Intervention history
- Advisor assignment section
- Quick intervention creation

---

## 5. Business Logic & Algorithms

### 5.1 Risk Score Calculation

**Algorithm** (runs nightly via cron job):
```python
def calculate_student_risk_score(student):
    risk_score = 0
    risk_factors = {}
    
    # GPA Factor (0-30 points)
    if student.gpa < 2.0:
        risk_score += 30
        risk_factors['gpa_critical'] = True
    elif student.gpa < 2.5:
        risk_score += 20
        risk_factors['gpa_low'] = True
    
    # Fee Arrears (0-25 points)
    balance_due = get_fee_balance(student)
    if balance_due > 100000:
        risk_score += 25
        risk_factors['fee_arrears_high'] = True
    elif balance_due > 50000:
        risk_score += 15
        risk_factors['fee_arrears_medium'] = True
    
    # Attendance (0-20 points)
    attendance_rate = get_attendance_rate(student)
    if attendance_rate < 50:
        risk_score += 20
        risk_factors['attendance_critical'] = True
    elif attendance_rate < 70:
        risk_score += 10
        risk_factors['attendance_low'] = True
    
    # Advisor Contact (0-15 points)
    days_since_contact = get_days_since_advisor_contact(student)
    if days_since_contact > 90:
        risk_score += 15
        risk_factors['no_advisor_contact'] = True
    
    # Open Support Tickets (0-10 points)
    open_tickets = count_open_tickets(student)
    if open_tickets >= 3:
        risk_score += 10
        risk_factors['multiple_support_issues'] = True
    
    # Determine risk level
    if risk_score >= 70:
        risk_level = 'critical'
    elif risk_score >= 50:
        risk_level = 'high'
    elif risk_score >= 30:
        risk_level = 'medium'
    else:
        risk_level = 'low'
    
    return risk_score, risk_level, risk_factors
```

### 5.2 Automated Alert Generation

**Triggers**:
- GPA drops below 2.5 → Create alert + assign academic advisor
- Fee balance exceeds 50,000 → Create alert + notify financial aid office
- Attendance below 70% → Create alert + notify student services
- Scholarship deadline in 7 days → Notify eligible students
- No advisor contact in 60 days → Notify student and advisor

### 5.3 Milestone Progression Logic

**Automatic Milestone Updates**:
- Enrollment milestone: Created on student creation
- Year completion: Triggered when credits_completed >= year_threshold
- Probation: Triggered when GPA < minimum_gpa for 2 consecutive semesters
- Graduation eligibility: Triggered when credits_completed >= credits_required AND gpa >= minimum_gpa

---

## 6. Implementation Phases

### Phase 1: Database & Backend Foundation (Week 1)
- [ ] Create new database tables (migrations)
- [ ] Add columns to existing tables
- [ ] Create Pydantic schemas for new models
- [ ] Implement student_journey.py routes
- [ ] Implement student_support.py routes
- [ ] Implement admin_interventions.py routes
- [ ] Create risk calculation script

### Phase 2: Student Portal - Core Journey (Week 2)
- [ ] Create JourneyTimeline component
- [ ] Redesign /student/support/page.jsx with new layout
- [ ] Implement SupportResourceCard components
- [ ] Create AlertsNotifications component
- [ ] Add journey data to student dashboard
- [ ] Create /student/support/journey detail page

### Phase 3: Student Portal - Support Tools (Week 2-3)
- [ ] Implement ScholarshipOpportunities component
- [ ] Implement GrantOpportunities component (postgrad)
- [ ] Implement AdvisorContact component
- [ ] Implement LibraryResources component
- [ ] Create /student/support/resources page
- [ ] Integrate with existing scholarship pages

### Phase 4: Admin Portal - Intervention Dashboard (Week 3)
- [ ] Create /staff/interventions/page.jsx
- [ ] Implement RiskScoreDashboard component
- [ ] Implement AtRiskStudentsTable component
- [ ] Implement InterventionForm component
- [ ] Create StudentJourneyView (admin version)
- [ ] Add intervention tracking to student detail page

### Phase 5: Analytics & Automation (Week 4)
- [ ] Implement InterventionAnalytics component
- [ ] Create automated alert generation service
- [ ] Implement nightly risk score calculation job
- [ ] Create milestone auto-progression logic
- [ ] Add predictive intervention recommendations
- [ ] Build reporting dashboards

### Phase 6: Testing & Refinement (Week 4)
- [ ] Test risk calculation accuracy
- [ ] Test automated alerts
- [ ] Validate milestone progression
- [ ] User acceptance testing with sample students
- [ ] Performance optimization
- [ ] Documentation

---

## 7. Data Migration & Seeding

### Seed Data Needed

1. **Support Resource Links**:
   - Library databases (JSTOR, PubMed, IEEE, etc.)
   - Study space booking system
   - Advisor directory
   - Financial aid office contacts
   - Counseling services
   - Career center

2. **Advisor Assignments**:
   - Assign academic advisors based on program/department
   - Assign financial advisors to students with fee issues
   - Assign thesis advisors to postgrad students

3. **Initial Milestones**:
   - Create enrollment milestone for all active students
   - Calculate current milestone based on credits_completed
   - Backfill year completion milestones

4. **Risk Score Calculation**:
   - Run initial risk calculation for all students
   - Flag high-risk students for immediate review

---

## 8. Key Features Summary

### For Students:
✅ Visual journey timeline from enrollment to graduation  
✅ Proactive alerts for fees, scholarships, academic issues  
✅ One-stop access to scholarships, grants, library, advisors  
✅ Differentiated support for undergrad vs. postgrad  
✅ Enhanced support ticketing linked to journey stages  
✅ Advisor contact information and meeting requests  

### For Admins/Staff:
✅ Risk score dashboard with predictive analytics  
✅ At-risk student identification and tracking  
✅ Intervention management with outcome tracking  
✅ Student journey visualization with intervention history  
✅ Automated alerts for critical milestones  
✅ Analytics on intervention effectiveness  
✅ Case management for high-risk students  

---

## 9. Technical Considerations

### Performance:
- Index risk_score, risk_level, milestone_type for fast queries
- Cache support resource links (rarely change)
- Batch risk calculation to avoid DB overload

### Security:
- Students can only view their own journey/resources
- Staff require appropriate roles to view interventions
- Advisor assignments validated by institution_id

### Scalability:
- Risk calculation runs async (Celery/background job)
- Milestone updates triggered by events, not polling
- Support resources cached at application level

### Integration Points:
- Excel data source (scholarships, grants from existing sheets)
- Email notifications for alerts
- Calendar integration for advisor meetings (future)

---

## 10. Success Metrics

**Student Engagement**:
- % of students accessing support resources monthly
- Scholarship application rate increase
- Advisor contact frequency

**Intervention Effectiveness**:
- % of at-risk students who improve after intervention
- Average time from risk flag to intervention
- Student retention rate improvement

**System Adoption**:
- Support ticket resolution time
- Admin usage of intervention dashboard
- Alert response rate
