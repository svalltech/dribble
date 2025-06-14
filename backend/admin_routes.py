from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any
from models import *
from auth import require_admin
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Admin router
admin_router = APIRouter(prefix="/admin", tags=["admin"])

# ============================================================================
# DASHBOARD & ANALYTICS
# ============================================================================

@admin_router.get("/dashboard")
async def get_dashboard_stats(
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)  # Will be injected
):
    """Get dashboard statistics for admin."""
    
    # Get date ranges
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Total orders
    total_orders = await database.orders.count_documents({})
    orders_this_week = await database.orders.count_documents({
        "created_at": {"$gte": datetime.combine(week_ago, datetime.min.time())}
    })
    orders_this_month = await database.orders.count_documents({
        "created_at": {"$gte": datetime.combine(month_ago, datetime.min.time())}
    })
    
    # Revenue statistics
    revenue_pipeline = [
        {"$match": {"payment_status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await database.orders.aggregate(revenue_pipeline).to_list(length=1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Weekly revenue
    weekly_revenue_pipeline = [
        {
            "$match": {
                "payment_status": "completed",
                "created_at": {"$gte": datetime.combine(week_ago, datetime.min.time())}
            }
        },
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    weekly_revenue_result = await database.orders.aggregate(weekly_revenue_pipeline).to_list(length=1)
    weekly_revenue = weekly_revenue_result[0]["total"] if weekly_revenue_result else 0
    
    # Product statistics
    total_products = await database.products.count_documents({"is_active": True})
    low_stock_products = await database.products.count_documents({
        "is_active": True,
        "variants.stock_quantity": {"$lte": 5}
    })
    
    # Top selling products
    top_products_pipeline = [
        {"$match": {"payment_status": "completed"}},
        {"$unwind": "$items"},
        {
            "$group": {
                "_id": "$items.product_id",
                "product_name": {"$first": "$items.product_name"},
                "total_sold": {"$sum": "$items.quantity"},
                "revenue": {"$sum": "$items.total_price"}
            }
        },
        {"$sort": {"total_sold": -1}},
        {"$limit": 5}
    ]
    top_products = await database.orders.aggregate(top_products_pipeline).to_list(length=5)
    
    # Customer statistics
    total_customers = await database.users.count_documents({"is_admin": False})
    new_customers_this_week = await database.users.count_documents({
        "is_admin": False,
        "created_at": {"$gte": datetime.combine(week_ago, datetime.min.time())}
    })
    
    return {
        "orders": {
            "total": total_orders,
            "this_week": orders_this_week,
            "this_month": orders_this_month
        },
        "revenue": {
            "total": total_revenue,
            "this_week": weekly_revenue,
            "average_order_value": total_revenue / total_orders if total_orders > 0 else 0
        },
        "products": {
            "total": total_products,
            "low_stock": low_stock_products,
            "top_selling": top_products
        },
        "customers": {
            "total": total_customers,
            "new_this_week": new_customers_this_week
        }
    }

@admin_router.get("/analytics/sales")
async def get_sales_analytics(
    days: int = 30,
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Get sales analytics for specified period."""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily sales pipeline
    daily_sales_pipeline = [
        {
            "$match": {
                "payment_status": "completed",
                "created_at": {"$gte": start_date}
            }
        },
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "orders": {"$sum": 1},
                "revenue": {"$sum": "$total_amount"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    daily_sales = await database.orders.aggregate(daily_sales_pipeline).to_list(length=days)
    
    return {
        "period_days": days,
        "daily_sales": daily_sales,
        "total_orders": sum(day["orders"] for day in daily_sales),
        "total_revenue": sum(day["revenue"] for day in daily_sales)
    }

# ============================================================================
# PRODUCT MANAGEMENT
# ============================================================================

@admin_router.get("/products", response_model=List[Product])
async def get_all_products(
    include_inactive: bool = False,
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Get all products for admin."""
    
    filter_query = {} if include_inactive else {"is_active": True}
    
    products = await database.products.find(filter_query).sort("created_at", -1).to_list(length=1000)
    return [Product(**product) for product in products]

@admin_router.get("/products/low-stock")
async def get_low_stock_products(
    threshold: int = 5,
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Get products with low stock."""
    
    products = await database.products.find({
        "is_active": True,
        "variants.stock_quantity": {"$lte": threshold}
    }).to_list(length=1000)
    
    low_stock_products = []
    for product in products:
        for variant in product["variants"]:
            if variant["stock_quantity"] <= threshold:
                low_stock_products.append({
                    "product_id": product["id"],
                    "product_name": product["name"],
                    "variant": variant,
                    "stock_quantity": variant["stock_quantity"]
                })
    
    return low_stock_products

@admin_router.put("/products/{product_id}/stock")
async def update_product_stock(
    product_id: str,
    color: str,
    size: SizeEnum,
    new_quantity: int,
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Update product variant stock."""
    
    result = await database.products.update_one(
        {
            "id": product_id,
            "variants": {
                "$elemMatch": {
                    "color": color,
                    "size": size
                }
            }
        },
        {
            "$set": {
                "variants.$.stock_quantity": new_quantity,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product variant not found")
    
    return {"message": "Stock updated successfully"}

# ============================================================================
# ORDER MANAGEMENT
# ============================================================================

@admin_router.get("/orders", response_model=List[Order])
async def get_all_orders(
    status: Optional[OrderStatusEnum] = None,
    limit: int = 100,
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Get all orders for admin."""
    
    filter_query = {}
    if status:
        filter_query["status"] = status
    
    orders = await database.orders.find(filter_query).sort("created_at", -1).limit(limit).to_list(length=limit)
    return [Order(**order) for order in orders]

@admin_router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    new_status: OrderStatusEnum,
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Update order status."""
    
    result = await database.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "status": new_status,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated successfully"}

# ============================================================================
# USER MANAGEMENT
# ============================================================================

@admin_router.get("/users", response_model=List[User])
async def get_all_users(
    limit: int = 100,
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Get all users for admin."""
    
    users = await database.users.find({"is_admin": False}).sort("created_at", -1).limit(limit).to_list(length=limit)
    return [User(**{k: v for k, v in user.items() if k != "hashed_password"}) for user in users]

@admin_router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    is_active: bool,
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Update user status (active/inactive)."""
    
    result = await database.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": is_active}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User status updated successfully"}
