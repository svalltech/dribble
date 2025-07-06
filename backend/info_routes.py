from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
import uuid

# Import database dependency
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from models import User
from auth import get_current_user_with_db

info_router = APIRouter(prefix="/api/info")

# Models for info routes
class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str
    status: str = "new"  # new, read, replied
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Suggestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: Optional[str] = None
    name: Optional[str] = None
    category: str  # product, website, service, other
    message: str
    priority: str = "medium"  # low, medium, high
    status: str = "new"  # new, reviewed, implemented
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DeliveryZone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    state: str
    city: str
    pincode_range: str
    delivery_days: int
    shipping_cost: float
    is_cod_available: bool = True
    is_express_available: bool = False

class ShippingCalculation(BaseModel):
    pincode: str
    weight: float = 1.0  # kg
    is_express: bool = False

class CompanyInfo(BaseModel):
    about_us: str
    mission: str
    vision: str
    founded_year: str
    location: str
    contact_email: str
    contact_phone: str
    whatsapp: str
    business_hours: str

# ============================================================================
# DELIVERY DETAILS ROUTES
# ============================================================================

@info_router.get("/delivery-details")
async def get_delivery_details(database: AsyncIOMotorDatabase = Depends(get_database)):
    """Get delivery zones and policies"""
    try:
        zones = await database.delivery_zones.find({"is_active": True}).to_list(length=100)
        
        # If no zones exist, create default zones
        if not zones:
            default_zones = [
                {
                    "id": str(uuid.uuid4()),
                    "state": "Maharashtra", 
                    "city": "Mumbai",
                    "pincode_range": "400001-400097",
                    "delivery_days": 2,
                    "shipping_cost": 50.0,
                    "is_cod_available": True,
                    "is_express_available": True
                },
                {
                    "id": str(uuid.uuid4()),
                    "state": "Karnataka", 
                    "city": "Bangalore",
                    "pincode_range": "560001-560097", 
                    "delivery_days": 3,
                    "shipping_cost": 75.0,
                    "is_cod_available": True,
                    "is_express_available": False
                },
                {
                    "id": str(uuid.uuid4()),
                    "state": "Delhi", 
                    "city": "New Delhi",
                    "pincode_range": "110001-110097",
                    "delivery_days": 2,
                    "shipping_cost": 60.0,
                    "is_cod_available": True,
                    "is_express_available": True
                }
            ]
            await database.delivery_zones.insert_many(default_zones)
            zones = default_zones
        
        return {
            "zones": zones,
            "policies": {
                "free_shipping_threshold": 500,
                "express_delivery_cost": 100,
                "cod_charges": 25,
                "return_policy_days": 7,
                "exchange_policy_days": 15
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SHIPPING CALCULATOR ROUTES  
# ============================================================================

@info_router.post("/shipping-calculator")
async def calculate_shipping(
    calculation: ShippingCalculation,
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Calculate shipping cost based on pincode and weight"""
    try:
        # Find delivery zone by pincode
        zones = await database.delivery_zones.find({"is_active": True}).to_list(length=100)
        
        shipping_cost = 75.0  # Default shipping cost
        delivery_days = 5     # Default delivery days
        is_cod_available = True
        is_express_available = False
        
        # Check if pincode falls in any zone
        for zone in zones:
            if calculation.pincode.startswith(zone.get("pincode_range", "").split("-")[0][:3]):
                shipping_cost = zone["shipping_cost"]
                delivery_days = zone["delivery_days"]
                is_cod_available = zone["is_cod_available"]
                is_express_available = zone["is_express_available"]
                break
        
        # Add weight-based charges
        if calculation.weight > 1.0:
            additional_weight = calculation.weight - 1.0
            shipping_cost += additional_weight * 20  # ₹20 per additional kg
        
        # Express delivery
        express_cost = 0
        if calculation.is_express and is_express_available:
            express_cost = 100
            delivery_days = max(1, delivery_days - 1)
        
        total_cost = shipping_cost + express_cost
        
        return {
            "pincode": calculation.pincode,
            "weight": calculation.weight,
            "base_shipping_cost": shipping_cost,
            "express_cost": express_cost,
            "total_shipping_cost": total_cost,
            "delivery_days": delivery_days,
            "is_cod_available": is_cod_available,
            "is_express_available": is_express_available,
            "free_shipping_threshold": 500
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# LIVE STOCK ROUTES
# ============================================================================

@info_router.get("/live-stock")
async def get_live_stock(database: AsyncIOMotorDatabase = Depends(get_database)):
    """Get real-time stock information"""
    try:
        # Get all products with stock info
        products = await database.products.find({"is_active": True}).to_list(length=100)
        
        stock_summary = []
        total_variants = 0
        in_stock_variants = 0
        low_stock_variants = 0
        out_of_stock_variants = 0
        
        for product in products:
            product_stock = {
                "product_id": product["id"],
                "product_name": product["name"],
                "category": product["category"],
                "variants": []
            }
            
            for variant in product.get("variants", []):
                stock_qty = variant["stock_quantity"]
                total_variants += 1
                
                status = "out_of_stock"
                if stock_qty > 10:
                    status = "in_stock"
                    in_stock_variants += 1
                elif stock_qty > 0:
                    status = "low_stock"
                    low_stock_variants += 1
                else:
                    out_of_stock_variants += 1
                
                product_stock["variants"].append({
                    "color": variant["color"],
                    "size": variant["size"],
                    "stock_quantity": stock_qty,
                    "status": status
                })
            
            stock_summary.append(product_stock)
        
        return {
            "summary": {
                "total_variants": total_variants,
                "in_stock": in_stock_variants,
                "low_stock": low_stock_variants,
                "out_of_stock": out_of_stock_variants,
                "last_updated": datetime.utcnow().isoformat()
            },
            "products": stock_summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# CONTACT ROUTES
# ============================================================================

@info_router.post("/contact")
async def submit_contact_message(
    contact: ContactMessage,
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Submit a contact message"""
    try:
        contact_data = contact.dict()
        await database.contact_messages.insert_one(contact_data)
        
        return {
            "message": "Thank you for your message! We'll get back to you within 24 hours.",
            "ticket_id": contact.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@info_router.get("/contact-info")
async def get_contact_info():
    """Get company contact information"""
    return {
        "company_name": "DRIBBLE",
        "tagline": "bulk t-shirts for Brands & Agency",
        "email": "orders@dribble-sports.com",
        "phone": "+91 98765 43210", 
        "whatsapp": "+91 98765 43210",
        "address": {
            "line1": "123 Business Park",
            "line2": "Sector 15, Industrial Area",
            "city": "Mumbai",
            "state": "Maharashtra", 
            "pincode": "400001",
            "country": "India"
        },
        "business_hours": "Monday - Saturday: 9:00 AM - 6:00 PM",
        "social_media": {
            "instagram": "@dribble_sports",
            "facebook": "DribbleSportsOfficial",
            "linkedin": "dribble-sports"
        }
    }

# ============================================================================
# SUGGESTIONS ROUTES
# ============================================================================

@info_router.post("/suggestions")
async def submit_suggestion(
    suggestion: Suggestion,
    current_user: Optional[User] = Depends(get_current_user_with_db(Depends(get_database))),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Submit a suggestion or feedback"""
    try:
        suggestion_data = suggestion.dict()
        if current_user:
            suggestion_data["user_email"] = current_user.email
            suggestion_data["name"] = current_user.full_name
        
        await database.suggestions.insert_one(suggestion_data)
        
        return {
            "message": "Thank you for your suggestion! We value your feedback.",
            "suggestion_id": suggestion.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# COMPANY INFO ROUTES
# ============================================================================

@info_router.get("/about-us")
async def get_about_us():
    """Get company about us information"""
    return {
        "company_name": "DRIBBLE",
        "tagline": "bulk t-shirts for Brands & Agency",
        "about": "DRIBBLE is India's leading bulk t-shirt manufacturer, specializing in premium quality blank apparel for brands, agencies, and printing businesses. With over 2,86,352 pieces sold last month, we're the trusted choice for bulk orders.",
        "mission": "To provide high-quality, affordable blank apparel that empowers brands and businesses to create amazing custom products.",
        "vision": "To be the #1 bulk apparel manufacturer in India, known for quality, reliability, and customer satisfaction.",
        "founded": "2020",
        "location": "Mumbai, Maharashtra, India",
        "key_features": [
            "Premium quality 100% cotton fabrics",
            "Minimum order quantity: 15 pieces",
            "GSM options: 180gsm, 210gsm, 240gsm",
            "Wide range of colors and sizes",
            "Fast delivery across India",
            "Competitive bulk pricing",
            "Perfect for DTG, Screen, and DTF printing"
        ],
        "certifications": [
            "ISO 9001:2015 Quality Management",
            "OEKO-TEX Standard 100",
            "GOTS Certified Organic Cotton"
        ]
    }

@info_router.get("/pricing-info")
async def get_pricing_info(database: AsyncIOMotorDatabase = Depends(get_database)):
    """Get detailed pricing information"""
    try:
        # Get sample product pricing
        products = await database.products.find({"is_active": True}).limit(5).to_list(length=5)
        
        pricing_tiers = [
            {"min_qty": 15, "max_qty": 49, "discount": "5%", "label": "Bulk Pricing"},
            {"min_qty": 50, "max_qty": 99, "discount": "10%", "label": "Volume Pricing"},
            {"min_qty": 100, "max_qty": 249, "discount": "15%", "label": "Wholesale Pricing"},
            {"min_qty": 250, "max_qty": 499, "discount": "20%", "label": "Corporate Pricing"},
            {"min_qty": 500, "max_qty": None, "discount": "25%", "label": "Enterprise Pricing"}
        ]
        
        return {
            "minimum_order": 15,
            "pricing_tiers": pricing_tiers,
            "sample_products": [
                {
                    "name": product["name"],
                    "category": product["category"],
                    "regular_price": product["base_price"],
                    "bulk_price": product["bulk_price"],
                    "savings": product["base_price"] - product["bulk_price"]
                } for product in products
            ],
            "additional_info": {
                "gst": "18% GST applicable on all orders",
                "shipping": "Free shipping on orders above ₹500",
                "payment_terms": "50% advance, 50% before dispatch for new customers",
                "delivery_time": "3-7 business days depending on location"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add missing import
from pydantic import Field

# Add database dependency function
async def get_database():
    from server import db
    return db