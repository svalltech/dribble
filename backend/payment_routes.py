from fastapi import APIRouter, Depends, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
from models import PaymentTransaction, PaymentStatusEnum, User
from auth import get_current_user_dep
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Payment router
payment_router = APIRouter(prefix="/payments", tags=["payments"])

# Initialize payment clients
stripe_client = StripeCheckout(api_key=os.getenv("STRIPE_SECRET_KEY", ""))

# Payment package definitions (server-side only for security)
PAYMENT_PACKAGES = {
    "custom": {"name": "Custom Amount", "description": "Custom payment amount"},
}

@payment_router.post("/stripe/create-session")
async def create_stripe_session(
    request: Request,
    order_id: str,
    amount: float,
    currency: str = "INR",
    current_user: Optional[User] = Depends(get_current_user_dep),
    database: AsyncIOMotorDatabase = Depends(lambda: None)  # Will be injected
):
    """Create Stripe checkout session for an order."""
    try:
        # Get origin URL from request headers
        origin = request.headers.get("origin") or request.headers.get("referer", "").split("?")[0].rstrip("/")
        if not origin:
            raise HTTPException(status_code=400, detail="Origin header required")
        
        # Verify order exists
        order = await database.orders.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Create success and cancel URLs
        success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin}/payment/cancel"
        
        # Create checkout session request
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency=currency,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "order_id": order_id,
                "user_id": current_user.id if current_user else "",
                "payment_method": "stripe"
            }
        )
        
        # Create Stripe session
        session_response = await stripe_client.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        payment_transaction = PaymentTransaction(
            order_id=order_id,
            user_id=current_user.id if current_user else None,
            amount=amount,
            currency=currency,
            payment_method="stripe",
            session_id=session_response.session_id,
            status=PaymentStatusEnum.PENDING,
            metadata=checkout_request.metadata
        )
        
        # Save to database
        await database.payment_transactions.insert_one(payment_transaction.dict())
        
        logger.info(f"Created Stripe session for order {order_id}: {session_response.session_id}")
        
        return {
            "url": session_response.url,
            "session_id": session_response.session_id
        }
        
    except Exception as e:
        logger.error(f"Error creating Stripe session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment session creation failed: {str(e)}")

@payment_router.get("/stripe/status/{session_id}")
async def get_stripe_payment_status(
    session_id: str,
    database: AsyncIOMotorDatabase = Depends(lambda: None)  # Will be injected
):
    """Check Stripe payment status and update database."""
    try:
        # Get payment status from Stripe
        checkout_status = await stripe_client.get_checkout_status(session_id)
        
        # Find payment transaction in database
        payment_transaction = await database.payment_transactions.find_one({"session_id": session_id})
        if not payment_transaction:
            raise HTTPException(status_code=404, detail="Payment transaction not found")
        
        # Update payment status only if not already processed
        new_status = PaymentStatusEnum.PENDING
        if checkout_status.payment_status == "paid":
            new_status = PaymentStatusEnum.COMPLETED
        elif checkout_status.status == "expired":
            new_status = PaymentStatusEnum.FAILED
        
        # Update database only if status changed
        if payment_transaction["status"] != new_status:
            await database.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "status": new_status,
                        "payment_id": checkout_status.metadata.get("payment_intent_id", ""),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # If payment completed, update order status
            if new_status == PaymentStatusEnum.COMPLETED:
                await database.orders.update_one(
                    {"id": payment_transaction["order_id"]},
                    {
                        "$set": {
                            "payment_status": "completed",
                            "status": "confirmed",
                            "payment_id": session_id,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                
                # Update product stock
                order = await database.orders.find_one({"id": payment_transaction["order_id"]})
                if order:
                    for item in order["items"]:
                        await database.products.update_one(
                            {
                                "id": item["product_id"],
                                "variants": {
                                    "$elemMatch": {
                                        "color": item["color"],
                                        "size": item["size"]
                                    }
                                }
                            },
                            {
                                "$inc": {
                                    "variants.$.stock_quantity": -item["quantity"]
                                }
                            }
                        )
        
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount": checkout_status.amount_total / 100,  # Convert from cents
            "currency": checkout_status.currency,
            "order_id": payment_transaction["order_id"]
        }
        
    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment status check failed: {str(e)}")

@payment_router.get("/transactions")
async def get_payment_transactions(
    current_user: User = Depends(get_current_user_dep),
    database: AsyncIOMotorDatabase = Depends(lambda: None)  # Will be injected
):
    """Get payment transactions for current user."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if current_user.is_admin:
        transactions = await database.payment_transactions.find().sort("created_at", -1).to_list(length=100)
    else:
        transactions = await database.payment_transactions.find({"user_id": current_user.id}).sort("created_at", -1).to_list(length=100)
    
    return [PaymentTransaction(**transaction) for transaction in transactions]

@payment_router.get("/transactions/{transaction_id}")
async def get_payment_transaction(
    transaction_id: str,
    current_user: Optional[User] = Depends(get_current_user_dep),
    database: AsyncIOMotorDatabase = Depends(lambda: None)  # Will be injected
):
    """Get specific payment transaction."""
    transaction = await database.payment_transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check permissions
    if current_user and (current_user.is_admin or transaction["user_id"] == current_user.id):
        return PaymentTransaction(**transaction)
    elif not current_user:
        # Allow anonymous access for specific cases
        return PaymentTransaction(**transaction)
    else:
        raise HTTPException(status_code=403, detail="Access denied")
