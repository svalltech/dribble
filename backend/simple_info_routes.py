from fastapi import APIRouter, HTTPException, status
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
import uuid

info_router = APIRouter(prefix="/api/info")

# Simple models for info routes
class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str

class Suggestion(BaseModel):
    category: str  # product, website, service, other
    message: str
    name: Optional[str] = None

class ShippingCalculation(BaseModel):
    pincode: str
    weight: float = 1.0  # kg
    is_express: bool = False

# ============================================================================
# DELIVERY DETAILS ROUTES
# ============================================================================

@info_router.get("/delivery-details")
async def get_delivery_details():
    """Get delivery zones and policies"""
    try:
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
        
        return {
            "zones": default_zones,
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
async def calculate_shipping(calculation: ShippingCalculation):
    """Calculate shipping cost based on pincode and weight"""
    try:
        zones = [
            {"pincode_prefix": "400", "shipping_cost": 50.0, "delivery_days": 2, "is_cod_available": True, "is_express_available": True},
            {"pincode_prefix": "560", "shipping_cost": 75.0, "delivery_days": 3, "is_cod_available": True, "is_express_available": False},
            {"pincode_prefix": "110", "shipping_cost": 60.0, "delivery_days": 2, "is_cod_available": True, "is_express_available": True}
        ]
        
        shipping_cost = 75.0
        delivery_days = 5
        is_cod_available = True
        is_express_available = False
        
        for zone in zones:
            if calculation.pincode.startswith(zone["pincode_prefix"]):
                shipping_cost = zone["shipping_cost"]
                delivery_days = zone["delivery_days"]
                is_cod_available = zone["is_cod_available"]
                is_express_available = zone["is_express_available"]
                break
        
        if calculation.weight > 1.0:
            additional_weight = calculation.weight - 1.0
            shipping_cost += additional_weight * 20
        
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
async def get_live_stock():
    """Get real-time stock information"""
    try:
        # Return sample stock data
        stock_summary = [
            {
                "product_id": "1",
                "product_name": "Oversized Drop-shoulder, 210gsm",
                "category": "Oversize 210gsm",
                "variants": [
                    {"color": "Black", "size": "S", "stock_quantity": 25, "status": "in_stock"},
                    {"color": "Black", "size": "M", "stock_quantity": 50, "status": "in_stock"},
                    {"color": "White", "size": "S", "stock_quantity": 5, "status": "low_stock"},
                    {"color": "White", "size": "M", "stock_quantity": 0, "status": "out_of_stock"},
                ]
            }
        ]
        
        return {
            "summary": {
                "total_variants": 50,
                "in_stock": 22,
                "low_stock": 6,
                "out_of_stock": 22,
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
async def submit_contact_message(contact: ContactMessage):
    """Submit a contact message"""
    try:
        # In a real implementation, this would save to database
        return {
            "message": "Thank you for your message! We'll get back to you within 24 hours.",
            "ticket_id": str(uuid.uuid4())
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
async def submit_suggestion(suggestion: Suggestion):
    """Submit a suggestion or feedback"""
    try:
        # In a real implementation, this would save to database
        return {
            "message": "Thank you for your suggestion! We value your feedback.",
            "suggestion_id": str(uuid.uuid4())
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
async def get_pricing_info():
    """Get detailed pricing information"""
    try:
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
                    "name": "Oversized Drop-shoulder, 210gsm",
                    "category": "Oversize 210gsm",
                    "regular_price": 319,
                    "bulk_price": 299,
                    "savings": 20
                },
                {
                    "name": "Classic Polo Shirt",
                    "category": "Polo Shirts",
                    "regular_price": 450,
                    "bulk_price": 420,
                    "savings": 30
                }
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