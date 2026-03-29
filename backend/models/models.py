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
    id: str
    paid_by: str  # email
    amount: float
    description: str
    date: str
    split_among: List[str]  # list of emails

class Trip(BaseModel):
    name: str
    people: List[Person] = []
    expenses: List[Expense] = []
