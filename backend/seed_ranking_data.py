"""
Seed Ranking Systems and Indicators Data
Populates 6 major ranking systems with their indicators
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import RankingSystem, RankingIndicator
import sys

def seed_ranking_data():
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("Seeding University Ranking Systems and Indicators")
        print("=" * 60)
        
        # 1. CWTS Leiden Rankings
        leiden = db.query(RankingSystem).filter(RankingSystem.code == "LEIDEN").first()
        if not leiden:
            leiden = RankingSystem(
                name="CWTS Leiden Rankings",
                code="LEIDEN",
                description="Bibliometric ranking focusing on scientific performance of universities",
                website_url="https://www.leidenranking.com",
                is_active=True
            )
            db.add(leiden)
            db.flush()
            print("✓ Created CWTS Leiden Rankings system")
        
        leiden_indicators = [
            {"name": "Publication Output", "code": "P", "description": "Total number of publications", "category": "Output", "weight_percentage": 25.0},
            {"name": "Top 10% Publications", "code": "PP_top10", "description": "Proportion of publications in top 10% most cited", "category": "Impact", "weight_percentage": 30.0},
            {"name": "Collaboration Rate", "code": "collab", "description": "Proportion of collaborative publications", "category": "Collaboration", "weight_percentage": 20.0},
            {"name": "International Collaboration", "code": "int_collab", "description": "Proportion of publications with international co-authors", "category": "Collaboration", "weight_percentage": 15.0},
            {"name": "Open Access Publications", "code": "OA", "description": "Proportion of open access publications", "category": "Openness", "weight_percentage": 10.0},
        ]
        
        for ind_data in leiden_indicators:
            existing = db.query(RankingIndicator).filter(
                RankingIndicator.ranking_system_id == leiden.id,
                RankingIndicator.code == ind_data["code"]
            ).first()
            if not existing:
                indicator = RankingIndicator(ranking_system_id=leiden.id, **ind_data)
                db.add(indicator)
        
        # 2. Webometrics
        webometrics = db.query(RankingSystem).filter(RankingSystem.code == "WEBOMETRICS").first()
        if not webometrics:
            webometrics = RankingSystem(
                name="Webometrics Ranking",
                code="WEBOMETRICS",
                description="Web presence and impact of universities worldwide",
                website_url="https://www.webometrics.info",
                is_active=True
            )
            db.add(webometrics)
            db.flush()
            print("✓ Created Webometrics system")
        
        webometrics_indicators = [
            {"name": "Visibility", "code": "visibility", "description": "External inlinks to university website", "category": "Web Presence", "weight_percentage": 50.0},
            {"name": "Transparency/Openness", "code": "transparency", "description": "Top cited papers in Google Scholar", "category": "Openness", "weight_percentage": 10.0},
            {"name": "Excellence", "code": "excellence", "description": "Top 10% most cited papers", "category": "Impact", "weight_percentage": 40.0},
        ]
        
        for ind_data in webometrics_indicators:
            existing = db.query(RankingIndicator).filter(
                RankingIndicator.ranking_system_id == webometrics.id,
                RankingIndicator.code == ind_data["code"]
            ).first()
            if not existing:
                indicator = RankingIndicator(ranking_system_id=webometrics.id, **ind_data)
                db.add(indicator)
        
        # 3. Times Higher Education (THE)
        the = db.query(RankingSystem).filter(RankingSystem.code == "THE").first()
        if not the:
            the = RankingSystem(
                name="Times Higher Education World University Rankings",
                code="THE",
                description="Comprehensive global university rankings",
                website_url="https://www.timeshighereducation.com/world-university-rankings",
                is_active=True
            )
            db.add(the)
            db.flush()
            print("✓ Created THE system")
        
        the_indicators = [
            {"name": "Teaching", "code": "teaching", "description": "Learning environment quality", "category": "Teaching", "weight_percentage": 30.0},
            {"name": "Research Environment", "code": "research_env", "description": "Volume, income and reputation", "category": "Research", "weight_percentage": 29.0},
            {"name": "Research Quality", "code": "research_quality", "description": "Citation impact and strength", "category": "Research", "weight_percentage": 30.0},
            {"name": "International Outlook", "code": "international", "description": "Staff, students and research", "category": "International", "weight_percentage": 7.5},
            {"name": "Industry Income", "code": "industry", "description": "Knowledge transfer", "category": "Industry", "weight_percentage": 3.5},
        ]
        
        for ind_data in the_indicators:
            existing = db.query(RankingIndicator).filter(
                RankingIndicator.ranking_system_id == the.id,
                RankingIndicator.code == ind_data["code"]
            ).first()
            if not existing:
                indicator = RankingIndicator(ranking_system_id=the.id, **ind_data)
                db.add(indicator)
        
        # 4. THE Sub-Saharan Africa
        the_ssa = db.query(RankingSystem).filter(RankingSystem.code == "THE_SSA").first()
        if not the_ssa:
            the_ssa = RankingSystem(
                name="THE Sub-Saharan Africa University Rankings",
                code="THE_SSA",
                description="Regional rankings for Sub-Saharan African universities",
                website_url="https://www.timeshighereducation.com/world-university-rankings/sub-saharan-africa",
                is_active=True
            )
            db.add(the_ssa)
            db.flush()
            print("✓ Created THE SSA system")
        
        the_ssa_indicators = [
            {"name": "Teaching", "code": "teaching", "description": "Learning environment", "category": "Teaching", "weight_percentage": 30.0},
            {"name": "Research", "code": "research", "description": "Volume, income and reputation", "category": "Research", "weight_percentage": 30.0},
            {"name": "Citations", "code": "citations", "description": "Research influence", "category": "Impact", "weight_percentage": 20.0},
            {"name": "International Outlook", "code": "international", "description": "Staff, students and research", "category": "International", "weight_percentage": 10.0},
            {"name": "Industry Income", "code": "industry", "description": "Knowledge transfer", "category": "Industry", "weight_percentage": 10.0},
        ]
        
        for ind_data in the_ssa_indicators:
            existing = db.query(RankingIndicator).filter(
                RankingIndicator.ranking_system_id == the_ssa.id,
                RankingIndicator.code == ind_data["code"]
            ).first()
            if not existing:
                indicator = RankingIndicator(ranking_system_id=the_ssa.id, **ind_data)
                db.add(indicator)
        
        # 5. Shanghai Rankings (ARWU)
        shanghai = db.query(RankingSystem).filter(RankingSystem.code == "ARWU").first()
        if not shanghai:
            shanghai = RankingSystem(
                name="Academic Ranking of World Universities (Shanghai)",
                code="ARWU",
                description="Focus on academic and research performance",
                website_url="https://www.shanghairanking.com",
                is_active=True
            )
            db.add(shanghai)
            db.flush()
            print("✓ Created Shanghai Rankings system")
        
        shanghai_indicators = [
            {"name": "Alumni Awards", "code": "alumni", "description": "Alumni winning Nobel Prizes and Fields Medals", "category": "Quality of Education", "weight_percentage": 10.0},
            {"name": "Staff Awards", "code": "award", "description": "Staff winning Nobel Prizes and Fields Medals", "category": "Quality of Faculty", "weight_percentage": 20.0},
            {"name": "Highly Cited Researchers", "code": "hici", "description": "Highly cited researchers in 21 categories", "category": "Quality of Faculty", "weight_percentage": 20.0},
            {"name": "N&S Publications", "code": "ns", "description": "Papers in Nature and Science", "category": "Research Output", "weight_percentage": 20.0},
            {"name": "International Publications", "code": "pub", "description": "Papers indexed in major citation indexes", "category": "Research Output", "weight_percentage": 20.0},
            {"name": "Per Capita Performance", "code": "pcp", "description": "Per capita academic performance", "category": "Per Capita", "weight_percentage": 10.0},
        ]
        
        for ind_data in shanghai_indicators:
            existing = db.query(RankingIndicator).filter(
                RankingIndicator.ranking_system_id == shanghai.id,
                RankingIndicator.code == ind_data["code"]
            ).first()
            if not existing:
                indicator = RankingIndicator(ranking_system_id=shanghai.id, **ind_data)
                db.add(indicator)
        
        # 6. QS World University Rankings
        qs = db.query(RankingSystem).filter(RankingSystem.code == "QS").first()
        if not qs:
            qs = RankingSystem(
                name="QS World University Rankings",
                code="QS",
                description="Global university rankings based on academic reputation and research",
                website_url="https://www.topuniversities.com/qs-world-university-rankings",
                is_active=True
            )
            db.add(qs)
            db.flush()
            print("✓ Created QS system")
        
        qs_indicators = [
            {"name": "Academic Reputation", "code": "academic_rep", "description": "Survey of academics worldwide", "category": "Reputation", "weight_percentage": 30.0},
            {"name": "Employer Reputation", "code": "employer_rep", "description": "Survey of graduate employers", "category": "Reputation", "weight_percentage": 15.0},
            {"name": "Faculty/Student Ratio", "code": "faculty_student", "description": "Teaching capacity", "category": "Teaching", "weight_percentage": 10.0},
            {"name": "Citations per Faculty", "code": "citations", "description": "Research impact", "category": "Research", "weight_percentage": 20.0},
            {"name": "International Faculty Ratio", "code": "int_faculty", "description": "Proportion of international faculty", "category": "International", "weight_percentage": 5.0},
            {"name": "International Student Ratio", "code": "int_students", "description": "Proportion of international students", "category": "International", "weight_percentage": 5.0},
            {"name": "International Research Network", "code": "int_research", "description": "Collaboration with international institutions", "category": "Research", "weight_percentage": 10.0},
            {"name": "Employment Outcomes", "code": "employment", "description": "Graduate employment rate", "category": "Outcomes", "weight_percentage": 5.0},
        ]
        
        for ind_data in qs_indicators:
            existing = db.query(RankingIndicator).filter(
                RankingIndicator.ranking_system_id == qs.id,
                RankingIndicator.code == ind_data["code"]
            ).first()
            if not existing:
                indicator = RankingIndicator(ranking_system_id=qs.id, **ind_data)
                db.add(indicator)
        
        db.commit()
        
        print("=" * 60)
        print("✅ Ranking data seeded successfully!")
        print("=" * 60)
        
        # Print summary
        systems_count = db.query(RankingSystem).count()
        indicators_count = db.query(RankingIndicator).count()
        print(f"Total Ranking Systems: {systems_count}")
        print(f"Total Indicators: {indicators_count}")
        
    except Exception as e:
        print(f"❌ Error seeding ranking data: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_ranking_data()
