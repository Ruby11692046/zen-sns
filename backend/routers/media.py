from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from database import get_db
from models import Media

router = APIRouter(prefix="/media", tags=["media"])

@router.get("/{filename}")
def get_media(filename: str, db: Session = Depends(get_db)):
    """
    データベースの `media` テーブルから該当のバイナリを取得し、
    適切な MIME タイプでクライアントへ直接配信する。
    """
    media = db.query(Media).filter(Media.filename == filename).first()
    if not media:
        raise HTTPException(
            status_code=404,
            detail="Media file not found in database"
        )
    
    # データベースのバイナリデータを適切な MIME タイプで返却
    return Response(content=media.data, media_type=media.mime_type)
