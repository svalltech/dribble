import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from models import *
from auth import get_password_hash
import uuid

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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
    
    # Create categories
    categories = [
        Category(name="Oversized T-shirts", description="Premium oversized t-shirts for sports", image="https://images.unsplash.com/photo-1716369786631-b8b9c7ac1dc4", sort_order=1),
        Category(name="Polo Shirts", description="Classic polo shirts for athletic wear", image="https://images.unsplash.com/photo-1604898426743-ed3d1ace7bf6", sort_order=2),
        Category(name="Hoodies", description="Comfortable hoodies for training", image="https://images.unsplash.com/photo-1618354691714-7d92150909db", sort_order=3),
        Category(name="Sports Wear", description="Complete sports apparel collection", image="https://images.unsplash.com/photo-1610502778270-c5c6f4c7d575", sort_order=4),
        Category(name="Kids Collection", description="Sports apparel for young athletes", image="https://images.pexels.com/photos/6046231/pexels-photo-6046231.jpeg", sort_order=5),
    ]
    
    for category in categories:
        await db.categories.insert_one(category.dict())
    
    print("📂 Created product categories")
    
    # Create products
    products = [
        Product(
            name="Oversized Sports T-shirt 210gsm",
            description="Premium quality oversized t-shirt made from 100% cotton. Perfect for sports activities and casual wear. Features dropped shoulders and relaxed fit.",
            category="Oversized T-shirts",
            base_price=319.0,
            bulk_price=279.0,
            gsm="210gsm",
            material="100% Cotton Terry",
            variants=[
                ProductVariant(color="Black", size=SizeEnum.S, stock_quantity=50, sku="DRB-OS-210-BLK-S"),
                ProductVariant(color="Black", size=SizeEnum.M, stock_quantity=100, sku="DRB-OS-210-BLK-M"),
                ProductVariant(color="Black", size=SizeEnum.L, stock_quantity=100, sku="DRB-OS-210-BLK-L"),
                ProductVariant(color="Black", size=SizeEnum.XL, stock_quantity=75, sku="DRB-OS-210-BLK-XL"),
                ProductVariant(color="White", size=SizeEnum.S, stock_quantity=45, sku="DRB-OS-210-WHT-S"),
                ProductVariant(color="White", size=SizeEnum.M, stock_quantity=90, sku="DRB-OS-210-WHT-M"),
                ProductVariant(color="White", size=SizeEnum.L, stock_quantity=95, sku="DRB-OS-210-WHT-L"),
                ProductVariant(color="White", size=SizeEnum.XL, stock_quantity=70, sku="DRB-OS-210-WHT-XL"),
                ProductVariant(color="Navy", size=SizeEnum.M, stock_quantity=60, sku="DRB-OS-210-NVY-M"),
                ProductVariant(color="Navy", size=SizeEnum.L, stock_quantity=60, sku="DRB-OS-210-NVY-L"),
            ],
            images=[
                "https://images.unsplash.com/photo-1716369786631-b8b9c7ac1dc4",
                "https://images.unsplash.com/photo-1604898426743-ed3d1ace7bf6"
            ]
        ),
        Product(
            name="Sports Polo Shirt Premium",
            description="Classic polo shirt with modern athletic fit. Made from moisture-wicking fabric perfect for active lifestyle. Available in multiple colors.",
            category="Polo Shirts",
            base_price=459.0,
            bulk_price=399.0,
            gsm="180gsm",
            material="Cotton Blend",
            variants=[
                ProductVariant(color="Black", size=SizeEnum.M, stock_quantity=40, sku="DRB-POLO-PRM-BLK-M"),
                ProductVariant(color="Black", size=SizeEnum.L, stock_quantity=40, sku="DRB-POLO-PRM-BLK-L"),
                ProductVariant(color="White", size=SizeEnum.M, stock_quantity=35, sku="DRB-POLO-PRM-WHT-M"),
                ProductVariant(color="White", size=SizeEnum.L, stock_quantity=35, sku="DRB-POLO-PRM-WHT-L"),
                ProductVariant(color="Navy", size=SizeEnum.M, stock_quantity=30, sku="DRB-POLO-PRM-NVY-M"),
                ProductVariant(color="Navy", size=SizeEnum.L, stock_quantity=30, sku="DRB-POLO-PRM-NVY-L"),
            ],
            images=[
                "https://images.unsplash.com/photo-1618354691714-7d92150909db",
                "https://images.unsplash.com/photo-1610502778270-c5c6f4c7d575"
            ]
        ),
        Product(
            name="Athletic Hoodie 320gsm",
            description="Premium athletic hoodie with kangaroo pocket and adjustable hood. Perfect for training sessions and casual wear.",
            category="Hoodies",
            base_price=899.0,
            bulk_price=799.0,
            gsm="320gsm",
            material="Cotton Fleece",
            variants=[
                ProductVariant(color="Black", size=SizeEnum.M, stock_quantity=25, sku="DRB-HOOD-320-BLK-M"),
                ProductVariant(color="Black", size=SizeEnum.L, stock_quantity=25, sku="DRB-HOOD-320-BLK-L"),
                ProductVariant(color="Black", size=SizeEnum.XL, stock_quantity=20, sku="DRB-HOOD-320-BLK-XL"),
                ProductVariant(color="Grey", size=SizeEnum.M, stock_quantity=20, sku="DRB-HOOD-320-GRY-M"),
                ProductVariant(color="Grey", size=SizeEnum.L, stock_quantity=20, sku="DRB-HOOD-320-GRY-L"),
                ProductVariant(color="Navy", size=SizeEnum.M, stock_quantity=15, sku="DRB-HOOD-320-NVY-M"),
            ],
            images=[
                "https://images.pexels.com/photos/6046231/pexels-photo-6046231.jpeg",
                "https://images.pexels.com/photos/6466466/pexels-photo-6466466.jpeg"
            ]
        ),
        Product(
            name="Sports Training T-shirt 240gsm",
            description="Heavy-duty training t-shirt designed for intense workout sessions. Enhanced durability with superior comfort.",
            category="Sports Wear",
            base_price=379.0,
            bulk_price=329.0,
            gsm="240gsm",
            material="100% Cotton Heavy Gauge",
            variants=[
                ProductVariant(color="Black", size=SizeEnum.S, stock_quantity=30, sku="DRB-TRN-240-BLK-S"),
                ProductVariant(color="Black", size=SizeEnum.M, stock_quantity=50, sku="DRB-TRN-240-BLK-M"),
                ProductVariant(color="Black", size=SizeEnum.L, stock_quantity=50, sku="DRB-TRN-240-BLK-L"),
                ProductVariant(color="White", size=SizeEnum.M, stock_quantity=40, sku="DRB-TRN-240-WHT-M"),
                ProductVariant(color="White", size=SizeEnum.L, stock_quantity=40, sku="DRB-TRN-240-WHT-L"),
                ProductVariant(color="Red", size=SizeEnum.M, stock_quantity=25, sku="DRB-TRN-240-RED-M"),
                ProductVariant(color="Red", size=SizeEnum.L, stock_quantity=25, sku="DRB-TRN-240-RED-L"),
            ],
            images=[
                "https://images.pexels.com/photos/3496992/pexels-photo-3496992.jpeg",
                "https://images.pexels.com/photos/7723554/pexels-photo-7723554.jpeg"
            ]
        ),
        Product(
            name="Kids Sports T-shirt 190gsm",
            description="Comfortable and durable t-shirt designed specifically for young athletes. Soft fabric that's gentle on skin.",
            category="Kids Collection",
            base_price=249.0,
            bulk_price=199.0,
            gsm="190gsm",
            material="100% Cotton Soft",
            variants=[
                ProductVariant(color="Black", size=SizeEnum.S, stock_quantity=40, sku="DRB-KIDS-190-BLK-S"),
                ProductVariant(color="Black", size=SizeEnum.M, stock_quantity=40, sku="DRB-KIDS-190-BLK-M"),
                ProductVariant(color="White", size=SizeEnum.S, stock_quantity=35, sku="DRB-KIDS-190-WHT-S"),
                ProductVariant(color="White", size=SizeEnum.M, stock_quantity=35, sku="DRB-KIDS-190-WHT-M"),
                ProductVariant(color="Blue", size=SizeEnum.S, stock_quantity=30, sku="DRB-KIDS-190-BLU-S"),
                ProductVariant(color="Blue", size=SizeEnum.M, stock_quantity=30, sku="DRB-KIDS-190-BLU-M"),
            ],
            images=[
                "https://images.unsplash.com/photo-1716369786631-b8b9c7ac1dc4",
                "https://images.unsplash.com/photo-1604898426743-ed3d1ace7bf6"
            ]
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
