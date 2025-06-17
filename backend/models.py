from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class SizeEnum(str, Enum):
    XS = "XS"
    S = "S"
    M = "M"
    L = "L"
    XL = "XL"
    XXL = "XXL"

class OrderStatusEnum(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentStatusEnum(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

# Product Models
class PricingRule(BaseModel):
    bulk_threshold: int = 15  # quantity threshold for bulk pricing
    bulk_price: float
    regular_price: float
    bulk_label: str = "More than 15pcs"
    regular_label: str = "Less than 15pcs"

class SizeChart(BaseModel):
    colors: List[str] = ["Black", "White", "Lavender", "Beige", "Red", "Sage Green", "Brown", "Maroon", "Orange", "Navy"]
    sizes: List[str] = ["S", "M", "L", "XL", "XXL"]
    chart_code: str = "OS210"  # Product code for size chart

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
    size_chart: SizeChart = Field(default_factory=SizeChart)
    pricing_rules: PricingRule = Field(default_factory=lambda: PricingRule(bulk_price=279.0, regular_price=319.0))
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    description: str
    category: str
    base_price: float
    bulk_price: float
    gsm: Optional[str] = None
    material: str = "100% Cotton"
    variants: List[ProductVariant]
    images: List[str]
    size_chart: Optional[SizeChart] = None
    pricing_rules: Optional[PricingRule] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    base_price: Optional[float] = None
    bulk_price: Optional[float] = None
    gsm: Optional[str] = None
    material: Optional[str] = None
    variants: Optional[List[ProductVariant]] = None
    images: Optional[List[str]] = None
    size_chart: Optional[SizeChart] = None
    pricing_rules: Optional[PricingRule] = None
    is_active: Optional[bool] = None

# User Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserInDB(User):
    hashed_password: str

# Address Models
class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    full_name: str
    phone: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False

class AddressCreate(BaseModel):
    full_name: str
    phone: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False

# Cart Models
class CartItem(BaseModel):
    product_id: str
    color: str
    size: SizeEnum
    quantity: int

class Cart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    items: List[CartItem]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CartAdd(BaseModel):
    product_id: str
    color: str
    size: SizeEnum
    quantity: int

# Order Models
class OrderItem(BaseModel):
    product_id: str
    product_name: str
    color: str
    size: SizeEnum
    quantity: int
    unit_price: float
    total_price: float

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    email: str
    phone: str
    items: List[OrderItem]
    subtotal: float
    tax_amount: float
    shipping_amount: float
    total_amount: float
    shipping_address: Address
    billing_address: Optional[Address] = None
    status: OrderStatusEnum = OrderStatusEnum.PENDING
    payment_status: PaymentStatusEnum = PaymentStatusEnum.PENDING
    payment_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    email: EmailStr
    phone: str
    items: List[CartItem]
    shipping_address: AddressCreate
    billing_address: Optional[AddressCreate] = None
    notes: Optional[str] = None

# Payment Models
class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    user_id: Optional[str] = None
    amount: float
    currency: str = "INR"
    payment_method: str  # stripe, razorpay
    session_id: Optional[str] = None
    payment_id: Optional[str] = None
    status: PaymentStatusEnum = PaymentStatusEnum.PENDING
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Category Models
class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    color: str = "bg-gray-500"  # Tailwind CSS color class for navigation button
    is_active: bool = True
    sort_order: int = 0

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    color: str = "bg-gray-500"
    sort_order: int = 0

# Analytics Models
class AnalyticsData(BaseModel):
    date: str
    total_orders: int
    total_revenue: float
    new_customers: int
    top_products: List[Dict[str, Any]]

# Response Models
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class MessageResponse(BaseModel):
    message: str

class OrderSummary(BaseModel):
    subtotal: float
    tax_amount: float
    shipping_amount: float
    total_amount: float
    is_bulk_order: bool