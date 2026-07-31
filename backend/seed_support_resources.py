"""
Seed Support Resources Data
Populates library resources and support resource links for institutions
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Institution, LibraryResource, SupportResourceLink
import sys

def seed_support_resources():
    db = SessionLocal()
    
    try:
        # Get first institution
        institution = db.query(Institution).first()
        
        if not institution:
            print("No institution found. Please create an institution first.")
            return
        
        print(f"Seeding support resources for: {institution.name}")
        
        # Library Resources
        library_resources = [
            {
                "institution_id": institution.id,
                "resource_name": "JSTOR Digital Library",
                "resource_type": "database",
                "url": "https://www.jstor.org",
                "description": "Access to academic journals, books, and primary sources",
                "access_instructions": "Login with your institutional credentials",
                "is_active": True
            },
            {
                "institution_id": institution.id,
                "resource_name": "IEEE Xplore",
                "resource_type": "database",
                "url": "https://ieeexplore.ieee.org",
                "description": "Engineering and technology research database",
                "access_instructions": "Access via campus network or VPN",
                "is_active": True
            },
            {
                "institution_id": institution.id,
                "resource_name": "PubMed Central",
                "resource_type": "database",
                "url": "https://www.ncbi.nlm.nih.gov/pmc/",
                "description": "Free full-text archive of biomedical and life sciences literature",
                "access_instructions": "Open access - no login required",
                "is_active": True
            },
            {
                "institution_id": institution.id,
                "resource_name": "Library Catalog",
                "resource_type": "book_catalog",
                "url": "https://library.example.edu/catalog",
                "description": "Search and reserve physical books and materials",
                "access_instructions": "Login with student ID",
                "is_active": True
            },
            {
                "institution_id": institution.id,
                "resource_name": "Study Room Booking",
                "resource_type": "study_space",
                "url": "https://library.example.edu/rooms",
                "description": "Reserve group study rooms and individual study spaces",
                "access_instructions": "Book up to 7 days in advance",
                "is_active": True
            },
        ]
        
        for resource_data in library_resources:
            # Check if exists
            existing = db.query(LibraryResource).filter(
                LibraryResource.institution_id == institution.id,
                LibraryResource.resource_name == resource_data["resource_name"]
            ).first()
            
            if not existing:
                resource = LibraryResource(**resource_data)
                db.add(resource)
                print(f"✓ Added library resource: {resource_data['resource_name']}")
            else:
                print(f"- Library resource already exists: {resource_data['resource_name']}")
        
        # Support Resource Links
        support_links = [
            {
                "institution_id": institution.id,
                "resource_category": "library",
                "title": "Library Research Support",
                "description": "Get help with research, citations, and finding resources",
                "url": "https://library.example.edu/research-help",
                "contact_email": "library@example.edu",
                "phone": "+1-555-0100",
                "office_hours": "Mon-Fri: 8AM-8PM, Sat-Sun: 10AM-6PM",
                "program_level_filter": "all",
                "is_active": True
            },
            {
                "institution_id": institution.id,
                "resource_category": "advisor",
                "title": "Academic Advising Office",
                "description": "Schedule meetings with your academic advisor",
                "url": "https://advising.example.edu",
                "contact_email": "advising@example.edu",
                "phone": "+1-555-0101",
                "office_hours": "Mon-Fri: 9AM-5PM",
                "program_level_filter": "all",
                "is_active": True
            },
            {
                "institution_id": institution.id,
                "resource_category": "financial_aid",
                "title": "Financial Aid Office",
                "description": "Assistance with fees, scholarships, and payment plans",
                "url": "https://finaid.example.edu",
                "contact_email": "finaid@example.edu",
                "phone": "+1-555-0102",
                "office_hours": "Mon-Fri: 8:30AM-4:30PM",
                "program_level_filter": "all",
                "is_active": True
            },
            {
                "institution_id": institution.id,
                "resource_category": "counseling",
                "title": "Student Counseling Services",
                "description": "Mental health support and wellness programs",
                "url": "https://counseling.example.edu",
                "contact_email": "counseling@example.edu",
                "phone": "+1-555-0103",
                "office_hours": "Mon-Fri: 8AM-6PM, 24/7 Crisis Line",
                "program_level_filter": "all",
                "is_active": True
            },
            {
                "institution_id": institution.id,
                "resource_category": "career",
                "title": "Career Development Center",
                "description": "Career counseling, resume help, and job placement",
                "url": "https://careers.example.edu",
                "contact_email": "careers@example.edu",
                "phone": "+1-555-0104",
                "office_hours": "Mon-Fri: 9AM-5PM",
                "program_level_filter": "all",
                "is_active": True
            },
            {
                "institution_id": institution.id,
                "resource_category": "advisor",
                "title": "Thesis Advisory Support",
                "description": "Specialized support for postgraduate thesis students",
                "url": "https://gradschool.example.edu/thesis",
                "contact_email": "gradschool@example.edu",
                "phone": "+1-555-0105",
                "office_hours": "Mon-Fri: 10AM-4PM",
                "program_level_filter": "postgraduate",
                "is_active": True
            },
            {
                "institution_id": institution.id,
                "resource_category": "library",
                "title": "Research Data Management",
                "description": "Support for managing research data and publications",
                "url": "https://library.example.edu/research-data",
                "contact_email": "research-support@example.edu",
                "phone": "+1-555-0106",
                "office_hours": "Mon-Fri: 9AM-5PM",
                "program_level_filter": "postgraduate",
                "is_active": True
            },
        ]
        
        for link_data in support_links:
            # Check if exists
            existing = db.query(SupportResourceLink).filter(
                SupportResourceLink.institution_id == institution.id,
                SupportResourceLink.title == link_data["title"]
            ).first()
            
            if not existing:
                link = SupportResourceLink(**link_data)
                db.add(link)
                print(f"✓ Added support link: {link_data['title']}")
            else:
                print(f"- Support link already exists: {link_data['title']}")
        
        db.commit()
        print("\n✅ Support resources seeded successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding support resources: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_support_resources()
