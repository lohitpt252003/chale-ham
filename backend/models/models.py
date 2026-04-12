from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class User(BaseModel):
    email: EmailStr
    name: str
    picture: Optional[str] = None
    is_active: bool = True
    is_admin: bool = False
    last_login: Optional[datetime] = None

class Person(BaseModel):
    name: str
    email: EmailStr

class Expense(BaseModel):
    id: Optional[str] = None
    paid_by: str  # email
    amount: float
    description: str
    notes: Optional[str] = None
    category: Optional[str] = "general"
    date: str
    split_among: List[str]  # list of emails

class ExpenseUpdate(BaseModel):
    paid_by: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    split_among: Optional[List[str]] = None

class Settlement(BaseModel):
    id: Optional[str] = None
    from_email: str
    to_email: str
    amount: float
    note: Optional[str] = None
    settled_at: Optional[str] = None

class Trip(BaseModel):
    name: str
    people: List[Person] = []
    expenses: List[Expense] = []
