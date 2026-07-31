from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, RankingSystem, RankingIndicator, InstitutionRankingData,
    InstitutionRanking
)
from app.schemas import (
    RankingSystemOut, RankingIndicatorOut, InstitutionRankingDataOut,
    InstitutionRankingDataUpdate, InstitutionRankingOut
)

router = APIRouter(prefix="/api/rankings", tags=["Rankings"])


def check_rankings_access(current_user: User):
    """Check if user has access to rankings (institution_admin, vice_chancellor, registrar)"""
    if current_user.account_category != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff can access rankings"
        )
    
    allowed_roles = ["institution_admin", "vice_chancellor", "registrar"]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to access rankings"
        )


@router.get("/systems", response_model=List[RankingSystemOut])
async def get_ranking_systems(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all ranking systems"""
    check_rankings_access(current_user)
    
    systems = db.query(RankingSystem).filter(RankingSystem.is_active == True).all()
    return systems


@router.get("/indicators/{system_id}", response_model=List[RankingIndicatorOut])
async def get_system_indicators(
    system_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all indicators for a specific ranking system"""
    check_rankings_access(current_user)
    
    system = db.query(RankingSystem).filter(RankingSystem.id == system_id).first()
    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ranking system not found"
        )
    
    indicators = db.query(RankingIndicator).filter(
        RankingIndicator.ranking_system_id == system_id,
        RankingIndicator.is_active == True
    ).all()
    
    return indicators


@router.get("/institution/{institution_id}", response_model=dict)
async def get_institution_rankings(
    institution_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get institution's ranking data across all systems"""
    check_rankings_access(current_user)
    
    # Verify user has access to this institution
    if current_user.institution_id != institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access rankings for different institution"
        )
    
    # Get all ranking systems
    systems = db.query(RankingSystem).filter(RankingSystem.is_active == True).all()
    
    result = []
    for system in systems:
        # Get indicators for this system
        indicators = db.query(RankingIndicator).filter(
            RankingIndicator.ranking_system_id == system.id,
            RankingIndicator.is_active == True
        ).all()
        
        # Get institution data for each indicator
        indicators_data = []
        satisfied_count = 0
        total_count = len(indicators)
        
        for indicator in indicators:
            inst_data = db.query(InstitutionRankingData).filter(
                InstitutionRankingData.institution_id == institution_id,
                InstitutionRankingData.indicator_id == indicator.id
            ).first()
            
            satisfies = inst_data.satisfies_indicator if inst_data else False
            if satisfies:
                satisfied_count += 1
            
            indicators_data.append({
                "id": indicator.id,
                "name": indicator.name,
                "code": indicator.code,
                "description": indicator.description,
                "category": indicator.category,
                "weight_percentage": float(indicator.weight_percentage) if indicator.weight_percentage else None,
                "satisfies": satisfies,
                "current_value": float(inst_data.current_value) if inst_data and inst_data.current_value else None,
                "target_value": float(inst_data.target_value) if inst_data and inst_data.target_value else None,
                "notes": inst_data.notes if inst_data else None,
                "last_assessed_date": inst_data.last_assessed_date.isoformat() if inst_data and inst_data.last_assessed_date else None
            })
        
        # Get overall ranking if available
        overall_ranking = db.query(InstitutionRanking).filter(
            InstitutionRanking.institution_id == institution_id,
            InstitutionRanking.ranking_system_id == system.id
        ).order_by(InstitutionRanking.ranking_year.desc()).first()
        
        result.append({
            "system": {
                "id": system.id,
                "name": system.name,
                "code": system.code,
                "description": system.description,
                "website_url": system.website_url,
                "logo_url": system.logo_url
            },
            "indicators": indicators_data,
            "satisfaction_summary": {
                "satisfied_count": satisfied_count,
                "total_count": total_count,
                "satisfaction_percentage": (satisfied_count / total_count * 100) if total_count > 0 else 0
            },
            "overall_ranking": {
                "year": overall_ranking.ranking_year if overall_ranking else None,
                "rank": overall_ranking.overall_rank if overall_ranking else None,
                "score": float(overall_ranking.overall_score) if overall_ranking and overall_ranking.overall_score else None,
                "national_rank": overall_ranking.national_rank if overall_ranking else None,
                "regional_rank": overall_ranking.regional_rank if overall_ranking else None
            } if overall_ranking else None
        })
    
    return {"systems": result}


@router.get("/institution/{institution_id}/system/{system_id}", response_model=dict)
async def get_institution_system_details(
    institution_id: int,
    system_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed ranking data for one system"""
    check_rankings_access(current_user)
    
    if current_user.institution_id != institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access rankings for different institution"
        )
    
    system = db.query(RankingSystem).filter(RankingSystem.id == system_id).first()
    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ranking system not found"
        )
    
    indicators = db.query(RankingIndicator).filter(
        RankingIndicator.ranking_system_id == system_id,
        RankingIndicator.is_active == True
    ).all()
    
    indicators_data = []
    for indicator in indicators:
        inst_data = db.query(InstitutionRankingData).filter(
            InstitutionRankingData.institution_id == institution_id,
            InstitutionRankingData.indicator_id == indicator.id
        ).first()
        
        indicators_data.append({
            "indicator": {
                "id": indicator.id,
                "name": indicator.name,
                "code": indicator.code,
                "description": indicator.description,
                "category": indicator.category,
                "weight_percentage": float(indicator.weight_percentage) if indicator.weight_percentage else None
            },
            "institution_data": {
                "satisfies": inst_data.satisfies_indicator if inst_data else False,
                "current_value": float(inst_data.current_value) if inst_data and inst_data.current_value else None,
                "target_value": float(inst_data.target_value) if inst_data and inst_data.target_value else None,
                "notes": inst_data.notes if inst_data else None,
                "last_assessed_date": inst_data.last_assessed_date.isoformat() if inst_data and inst_data.last_assessed_date else None
            } if inst_data else None
        })
    
    return {
        "system": {
            "id": system.id,
            "name": system.name,
            "code": system.code,
            "description": system.description,
            "website_url": system.website_url
        },
        "indicators": indicators_data
    }


@router.patch("/institution/{institution_id}/indicator/{indicator_id}")
async def update_indicator_status(
    institution_id: int,
    indicator_id: int,
    update_data: InstitutionRankingDataUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update indicator satisfaction status (admin only)"""
    check_rankings_access(current_user)
    
    if current_user.institution_id != institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update rankings for different institution"
        )
    
    # Check if data exists
    inst_data = db.query(InstitutionRankingData).filter(
        InstitutionRankingData.institution_id == institution_id,
        InstitutionRankingData.indicator_id == indicator_id
    ).first()
    
    if not inst_data:
        # Create new record
        inst_data = InstitutionRankingData(
            institution_id=institution_id,
            indicator_id=indicator_id,
            assessed_by=current_user.id
        )
        db.add(inst_data)
    
    # Update fields
    if update_data.satisfies_indicator is not None:
        inst_data.satisfies_indicator = update_data.satisfies_indicator
    if update_data.current_value is not None:
        inst_data.current_value = update_data.current_value
    if update_data.target_value is not None:
        inst_data.target_value = update_data.target_value
    if update_data.notes is not None:
        inst_data.notes = update_data.notes
    if update_data.last_assessed_date is not None:
        inst_data.last_assessed_date = update_data.last_assessed_date
    else:
        inst_data.last_assessed_date = date.today()
    
    inst_data.assessed_by = current_user.id
    
    db.commit()
    db.refresh(inst_data)
    
    return {"message": "Indicator status updated successfully", "id": inst_data.id}
