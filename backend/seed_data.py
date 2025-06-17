import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime
from passlib.context import CryptContext
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from enum import Enum

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

# Define models (simplified for seeding)
class SizeEnum(str, Enum):
    XS = "XS"
    S = "S"
    M = "M"
    L = "L"
    XL = "XL"
    XXL = "XXL"

class ProductVariant(BaseModel):
    color: str
    size: SizeEnum
    stock_quantity: int
    sku: str

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str
    base_price: float
    bulk_price: float
    gsm: Optional[str] = None
    material: str = "100% Cotton"
    variants: List[ProductVariant]
    images: List[str]
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SizeChart(BaseModel):
    colors: List[str]
    sizes: List[str]
    chart_code: str

class PricingRule(BaseModel):
    bulk_threshold: int
    bulk_price: float
    regular_price: float
    bulk_label: str
    regular_label: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class UserInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    hashed_password: str

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_database():
    """Seed the database with initial data."""
    
    print("🌱 Starting database seeding...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.categories.delete_many({})
    await db.products.delete_many({})
    await db.carts.delete_many({})
    await db.orders.delete_many({})
    await db.payment_transactions.delete_many({})
    
    print("🗑️  Cleared existing data")
    
    # Create admin user
    admin_user = UserInDB(
        email="admin@dribble-sports.com",
        full_name="DRIBBLE Admin",
        phone="+91 9876543210",
        is_admin=True,
        hashed_password=get_password_hash("admin123")
    )
    await db.users.insert_one(admin_user.dict())
    
    # Create regular test user
    test_user = UserInDB(
        email="test@dribble-sports.com",
        full_name="Test User",
        phone="+91 9876543211",
        is_admin=False,
        hashed_password=get_password_hash("test123")
    )
    await db.users.insert_one(test_user.dict())
    
    print("👤 Created admin and test users")
    
    # Create categories with exact colors from original site
    categories = [
        Category(name="Oversize 210gsm", description="Premium oversized t-shirts", color="bg-red-500", sort_order=1),
        Category(name="Oversize 240gsm", description="Heavy gauge oversized t-shirts", color="bg-orange-500", sort_order=2),
        Category(name="Kids Kneck", description="Kids neck t-shirts", color="bg-yellow-500", sort_order=3),
        Category(name="Oversize 190gsm", description="Light weight oversized t-shirts", color="bg-green-500", sort_order=4),
        Category(name="Tue Bio Kneck", description="Tue Bio neck t-shirts", color="bg-blue-500", sort_order=5),
        Category(name="Bio Kneck", description="Bio neck t-shirts", color="bg-purple-500", sort_order=6),
        Category(name="Polo Shirts", description="Classic polo shirts", color="bg-pink-500", sort_order=7),
        Category(name="Sublimation", description="Sublimation t-shirts", color="bg-indigo-500", sort_order=8),
        Category(name="Premium Polo", description="Premium polo shirts", color="bg-red-600", sort_order=9),
        Category(name="Cotton Polo", description="Cotton polo shirts", color="bg-orange-600", sort_order=10),
        Category(name="Hoodie 320gsm", description="Heavy weight hoodies", color="bg-yellow-600", sort_order=11),
        Category(name="Hoodie 270gsm", description="Medium weight hoodies", color="bg-green-600", sort_order=12),
        Category(name="Sweatshirt", description="Comfortable sweatshirts", color="bg-blue-600", sort_order=13),
        Category(name="Varsity", description="Varsity jackets", color="bg-purple-600", sort_order=14),
        Category(name="Dropship Hoodie 430gsm", description="Dropship hoodies", color="bg-pink-600", sort_order=15),
        Category(name="Shorts", description="Sports shorts", color="bg-indigo-600", sort_order=16),
        Category(name="Gym vest", description="Gym vests", color="bg-red-700", sort_order=17),
        Category(name="Activework OS", description="Activework oversized", color="bg-orange-700", sort_order=18),
        Category(name="Activework BF", description="Activework boyfriend fit", color="bg-yellow-700", sort_order=19),
    ]
    
    for category in categories:
        await db.categories.insert_one(category.dict())
    
    print("📂 Created product categories")
    
    # Create products with exact replica data
    products = [
        Product(
            name="Oversized Drop-shoulder, 210gsm, Terry cotton/Longjohit Heavy Gauge, 100% Cotton",
            description="Super fine stitched Premium Quality Red Lable Fabric",
            category="Oversize 210gsm",
            base_price=319.0,
            bulk_price=279.0,
            gsm="210gsm",
            material="100% Cotton Terry",
            variants=[
                ProductVariant(color="Black", size=SizeEnum.S, stock_quantity=50, sku="DRB-OS-210-BLK-S"),
                ProductVariant(color="Black", size=SizeEnum.M, stock_quantity=100, sku="DRB-OS-210-BLK-M"),
                ProductVariant(color="Black", size=SizeEnum.L, stock_quantity=100, sku="DRB-OS-210-BLK-L"),
                ProductVariant(color="Black", size=SizeEnum.XL, stock_quantity=75, sku="DRB-OS-210-BLK-XL"),
                ProductVariant(color="Black", size=SizeEnum.XXL, stock_quantity=50, sku="DRB-OS-210-BLK-XXL"),
                ProductVariant(color="White", size=SizeEnum.S, stock_quantity=45, sku="DRB-OS-210-WHT-S"),
                ProductVariant(color="White", size=SizeEnum.M, stock_quantity=90, sku="DRB-OS-210-WHT-M"),
                ProductVariant(color="White", size=SizeEnum.L, stock_quantity=95, sku="DRB-OS-210-WHT-L"),
                ProductVariant(color="White", size=SizeEnum.XL, stock_quantity=70, sku="DRB-OS-210-WHT-XL"),
                ProductVariant(color="White", size=SizeEnum.XXL, stock_quantity=40, sku="DRB-OS-210-WHT-XXL"),
                ProductVariant(color="Lavender", size=SizeEnum.M, stock_quantity=30, sku="DRB-OS-210-LAV-M"),
                ProductVariant(color="Lavender", size=SizeEnum.L, stock_quantity=30, sku="DRB-OS-210-LAV-L"),
                ProductVariant(color="Beige", size=SizeEnum.M, stock_quantity=25, sku="DRB-OS-210-BEI-M"),
                ProductVariant(color="Beige", size=SizeEnum.L, stock_quantity=25, sku="DRB-OS-210-BEI-L"),
                ProductVariant(color="Red", size=SizeEnum.M, stock_quantity=20, sku="DRB-OS-210-RED-M"),
                ProductVariant(color="Red", size=SizeEnum.L, stock_quantity=20, sku="DRB-OS-210-RED-L"),
                ProductVariant(color="Sage Green", size=SizeEnum.M, stock_quantity=15, sku="DRB-OS-210-SAG-M"),
                ProductVariant(color="Brown", size=SizeEnum.L, stock_quantity=15, sku="DRB-OS-210-BRN-L"),
                ProductVariant(color="Maroon", size=SizeEnum.M, stock_quantity=10, sku="DRB-OS-210-MAR-M"),
                ProductVariant(color="Orange", size=SizeEnum.L, stock_quantity=10, sku="DRB-OS-210-ORA-L"),
                ProductVariant(color="Navy", size=SizeEnum.M, stock_quantity=60, sku="DRB-OS-210-NVY-M"),
                ProductVariant(color="Navy", size=SizeEnum.L, stock_quantity=60, sku="DRB-OS-210-NVY-L"),
            ],
            images=[
                "https://images.unsplash.com/photo-1716369786631-b8b9c7ac1dc4",
                "https://images.unsplash.com/photo-1604898426743-ed3d1ace7bf6"
            ],
            size_chart=SizeChart(
                colors=["Black", "White", "Lavender", "Beige", "Red", "Sage Green", "Brown", "Maroon", "Orange", "Navy"],
                sizes=["S", "M", "L", "XL", "XXL"],
                chart_code="OS210"
            ),
            pricing_rules=PricingRule(
                bulk_threshold=15,
                bulk_price=279.0,
                regular_price=319.0,
                bulk_label="More than 15pcs",
                regular_label="Less than 15pcs"
            )
        )
    ]
    
    for product in products:
        await db.products.insert_one(product.dict())
    
    print("👕 Created products with variants and stock")
    
    print("✅ Database seeding completed successfully!")
    print("\n📋 Summary:")
    print("- Created admin user: admin@dribble-sports.com (password: admin123)")
    print("- Created test user: test@dribble-sports.com (password: test123)")
    print(f"- Created {len(categories)} product categories")
    print(f"- Created {len(products)} products with multiple variants")
    print("- All products have initial stock quantities")
    print("\n🚀 Ready to start selling!")

if __name__ == "__main__":
    asyncio.run(seed_database())
