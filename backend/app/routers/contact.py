from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.contact import ContactRequest

router = APIRouter()


class ContactForm(BaseModel):
    name: str
    email: EmailStr
    message: str


@router.post("/contact")
def submit_contact(form: ContactForm, db: Session = Depends(get_db)):
    if len(form.message.strip()) < 10:
        raise HTTPException(status_code=422, detail="Message too short")

    record = ContactRequest(
        name=form.name.strip(),
        email=form.email.lower().strip(),
        message=form.message.strip(),
    )
    try:
        db.add(record)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[contact] DB write failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to save message. Please try again.")
    return {"success": True, "message": "Thanks! We'll get back to you shortly."}
