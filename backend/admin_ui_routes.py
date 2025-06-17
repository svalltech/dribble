from fastapi import APIRouter, Depends, HTTPException, Request, Form
from fastapi.responses import HTMLResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any
from models import *
from auth import require_admin
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Admin UI router
admin_ui_router = APIRouter(prefix="/admin-ui", tags=["admin-ui"])

# HTML Templates for Admin UI
def render_admin_layout(title: str, content: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title} - DRIBBLE Admin</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            .admin-sidebar {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }}
        </style>
    </head>
    <body class="bg-gray-100">
        <div class="flex min-h-screen">
            <!-- Sidebar -->
            <div class="admin-sidebar w-64 text-white p-6">
                <h1 class="text-2xl font-bold mb-8">DRIBBLE Admin</h1>
                <nav class="space-y-2">
                    <a href="/admin-ui/dashboard" class="block px-4 py-2 rounded hover:bg-white/10 transition-colors">📊 Dashboard</a>
                    <a href="/admin-ui/categories" class="block px-4 py-2 rounded hover:bg-white/10 transition-colors">📂 Categories</a>
                    <a href="/admin-ui/products" class="block px-4 py-2 rounded hover:bg-white/10 transition-colors">👕 Products</a>
                    <a href="/admin-ui/orders" class="block px-4 py-2 rounded hover:bg-white/10 transition-colors">📦 Orders</a>
                    <a href="/admin-ui/customers" class="block px-4 py-2 rounded hover:bg-white/10 transition-colors">👥 Customers</a>
                    <a href="/admin-ui/settings" class="block px-4 py-2 rounded hover:bg-white/10 transition-colors">⚙️ Settings</a>
                </nav>
            </div>
            
            <!-- Main Content -->
            <div class="flex-1 p-8">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    {content}
                </div>
            </div>
        </div>
    </body>
    </html>
    """

@admin_ui_router.get("/dashboard", response_class=HTMLResponse)
async def admin_dashboard(
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Admin dashboard with statistics."""
    
    # Get statistics
    total_products = await database.products.count_documents({"is_active": True})
    total_categories = await database.categories.count_documents({"is_active": True})
    total_orders = await database.orders.count_documents({})
    total_customers = await database.users.count_documents({"is_admin": False})
    
    content = f"""
    <h1 class="text-3xl font-bold mb-8 text-gray-800">Dashboard</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-blue-500 text-white p-6 rounded-lg">
            <h3 class="text-lg font-semibold">Total Products</h3>
            <p class="text-3xl font-bold">{total_products}</p>
        </div>
        <div class="bg-green-500 text-white p-6 rounded-lg">
            <h3 class="text-lg font-semibold">Categories</h3>
            <p class="text-3xl font-bold">{total_categories}</p>
        </div>
        <div class="bg-orange-500 text-white p-6 rounded-lg">
            <h3 class="text-lg font-semibold">Total Orders</h3>
            <p class="text-3xl font-bold">{total_orders}</p>
        </div>
        <div class="bg-purple-500 text-white p-6 rounded-lg">
            <h3 class="text-lg font-semibold">Customers</h3>
            <p class="text-3xl font-bold">{total_customers}</p>
        </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
            <h2 class="text-xl font-bold mb-4">Quick Actions</h2>
            <div class="space-y-3">
                <a href="/admin-ui/products/new" class="block bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition-colors">
                    ➕ Add New Product
                </a>
                <a href="/admin-ui/categories/new" class="block bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 transition-colors">
                    📂 Add New Category
                </a>
                <a href="/admin-ui/orders" class="block bg-orange-600 text-white px-4 py-3 rounded hover:bg-orange-700 transition-colors">
                    📦 View Recent Orders
                </a>
            </div>
        </div>
        
        <div>
            <h2 class="text-xl font-bold mb-4">Recent Activity</h2>
            <div class="bg-gray-50 p-4 rounded">
                <p class="text-gray-600">📈 System running smoothly</p>
                <p class="text-gray-600">🔄 Database last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
                <p class="text-gray-600">✅ All services operational</p>
            </div>
        </div>
    </div>
    """
    
    return render_admin_layout("Dashboard", content)

@admin_ui_router.get("/categories", response_class=HTMLResponse)
async def admin_categories(
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Manage categories with colors for navigation buttons."""
    
    categories = await database.categories.find().sort("sort_order").to_list(length=100)
    
    category_rows = ""
    for cat in categories:
        category_rows += f"""
        <tr class="border-b">
            <td class="px-4 py-3">{cat['name']}</td>
            <td class="px-4 py-3">
                <span class="inline-block w-6 h-6 rounded {cat.get('color', 'bg-gray-500')}"></span>
                {cat.get('color', 'bg-gray-500')}
            </td>
            <td class="px-4 py-3">{cat.get('sort_order', 0)}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-xs {'bg-green-100 text-green-800' if cat.get('is_active') else 'bg-red-100 text-red-800'}">
                    {'Active' if cat.get('is_active') else 'Inactive'}
                </span>
            </td>
            <td class="px-4 py-3">
                <a href="/admin-ui/categories/{cat['id']}/edit" class="text-blue-600 hover:underline mr-2">Edit</a>
                <button onclick="deleteCategory('{cat['id']}')" class="text-red-600 hover:underline">Delete</button>
            </td>
        </tr>
        """
    
    content = f"""
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Manage Categories</h1>
        <a href="/admin-ui/categories/new" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
            ➕ Add New Category
        </a>
    </div>
    
    <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-semibold">Name</th>
                    <th class="px-4 py-3 text-left font-semibold">Button Color</th>
                    <th class="px-4 py-3 text-left font-semibold">Sort Order</th>
                    <th class="px-4 py-3 text-left font-semibold">Status</th>
                    <th class="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody>
                {category_rows}
            </tbody>
        </table>
    </div>
    
    <script>
        function deleteCategory(id) {{
            if (confirm('Are you sure you want to delete this category?')) {{
                fetch(`/api/admin/categories/${{id}}`, {{
                    method: 'DELETE',
                    headers: {{
                        'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
                    }}
                }}).then(() => location.reload());
            }}
        }}
    </script>
    """
    
    return render_admin_layout("Categories", content)

@admin_ui_router.get("/categories/new", response_class=HTMLResponse)
async def new_category_form(current_user: User = Depends(require_admin)):
    """Form to create new category."""
    
    color_options = [
        ("bg-red-500", "Red"),
        ("bg-orange-500", "Orange"),
        ("bg-yellow-500", "Yellow"),
        ("bg-green-500", "Green"),
        ("bg-blue-500", "Blue"),
        ("bg-purple-500", "Purple"),
        ("bg-pink-500", "Pink"),
        ("bg-indigo-500", "Indigo"),
        ("bg-red-600", "Dark Red"),
        ("bg-orange-600", "Dark Orange"),
        ("bg-yellow-600", "Dark Yellow"),
        ("bg-green-600", "Dark Green"),
        ("bg-blue-600", "Dark Blue"),
        ("bg-purple-600", "Dark Purple"),
        ("bg-pink-600", "Dark Pink"),
        ("bg-indigo-600", "Dark Indigo"),
        ("bg-red-700", "Darker Red"),
        ("bg-orange-700", "Darker Orange"),
        ("bg-yellow-700", "Darker Yellow"),
    ]
    
    color_select = "".join([f'<option value="{color}">{label}</option>' for color, label in color_options])
    
    content = f"""
    <h1 class="text-3xl font-bold mb-6 text-gray-800">Add New Category</h1>
    
    <form method="POST" action="/admin-ui/categories/create" class="space-y-6">
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
            <input type="text" name="name" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="e.g., Hoodie 320gsm">
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea name="description" rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional description"></textarea>
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Button Color (for navigation)</label>
            <select name="color" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select a color</option>
                {color_select}
            </select>
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
            <input type="number" name="sort_order" value="0" min="0"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        
        <div class="flex gap-4">
            <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">
                Create Category
            </button>
            <a href="/admin-ui/categories" class="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors">
                Cancel
            </a>
        </div>
    </form>
    """
    
    return render_admin_layout("New Category", content)

@admin_ui_router.post("/categories/create")
async def create_category(
    request: Request,
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Create new category from form data."""
    
    form_data = await request.form()
    
    category = Category(
        name=form_data.get("name"),
        description=form_data.get("description") or None,
        color=form_data.get("color"),
        sort_order=int(form_data.get("sort_order", 0))
    )
    
    await database.categories.insert_one(category.dict())
    
    return HTMLResponse(content="""
    <script>
        alert('Category created successfully!');
        window.location.href = '/admin-ui/categories';
    </script>
    """)

@admin_ui_router.get("/products", response_class=HTMLResponse)
async def admin_products(
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Manage products with size charts and pricing."""
    
    products = await database.products.find({"is_active": True}).limit(20).to_list(length=20)
    
    product_rows = ""
    for product in products:
        product_rows += f"""
        <tr class="border-b">
            <td class="px-4 py-3">
                <div class="font-medium">{product['name'][:50]}...</div>
                <div class="text-sm text-gray-500">{product.get('gsm', '')}</div>
            </td>
            <td class="px-4 py-3">{product['category']}</td>
            <td class="px-4 py-3">
                <div>Regular: ₹{product.get('pricing_rules', {}).get('regular_price', product['base_price'])}</div>
                <div class="text-sm text-green-600">Bulk: ₹{product.get('pricing_rules', {}).get('bulk_price', product['bulk_price'])}</div>
            </td>
            <td class="px-4 py-3">{len(product.get('variants', []))} variants</td>
            <td class="px-4 py-3">
                <a href="/admin-ui/products/{product['id']}/edit" class="text-blue-600 hover:underline mr-2">Edit</a>
                <a href="/admin-ui/products/{product['id']}/sizechart" class="text-green-600 hover:underline mr-2">Size Chart</a>
                <button onclick="deleteProduct('{product['id']}')" class="text-red-600 hover:underline">Delete</button>
            </td>
        </tr>
        """
    
    content = f"""
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Manage Products</h1>
        <a href="/admin-ui/products/new" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
            ➕ Add New Product
        </a>
    </div>
    
    <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-semibold">Product</th>
                    <th class="px-4 py-3 text-left font-semibold">Category</th>
                    <th class="px-4 py-3 text-left font-semibold">Pricing</th>
                    <th class="px-4 py-3 text-left font-semibold">Variants</th>
                    <th class="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody>
                {product_rows}
            </tbody>
        </table>
    </div>
    
    <script>
        function deleteProduct(id) {{
            if (confirm('Are you sure you want to delete this product?')) {{
                fetch(`/api/admin/products/${{id}}`, {{
                    method: 'DELETE',
                    headers: {{
                        'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
                    }}
                }}).then(() => location.reload());
            }}
        }}
    </script>
    """
    
    return render_admin_layout("Products", content)

@admin_ui_router.get("/products/{product_id}/sizechart", response_class=HTMLResponse)
async def edit_product_sizechart(
    product_id: str,
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Edit size chart and pricing for a product."""
    
    product = await database.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    size_chart = product.get("size_chart", {})
    pricing_rules = product.get("pricing_rules", {})
    
    colors = size_chart.get("colors", ["Black", "White", "Lavender", "Beige", "Red", "Sage Green", "Brown", "Maroon", "Orange", "Navy"])
    sizes = size_chart.get("sizes", ["S", "M", "L", "XL", "XXL"])
    
    colors_input = ", ".join(colors)
    sizes_input = ", ".join(sizes)
    
    content = f"""
    <h1 class="text-3xl font-bold mb-6 text-gray-800">Edit Size Chart & Pricing</h1>
    <h2 class="text-xl text-gray-600 mb-6">{product['name']}</h2>
    
    <form method="POST" action="/admin-ui/products/{product_id}/sizechart/update" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                <h3 class="text-lg font-semibold mb-4">Size Chart Configuration</h3>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Chart Code</label>
                    <input type="text" name="chart_code" value="{size_chart.get('chart_code', 'OS210')}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Available Colors (comma-separated)</label>
                    <textarea name="colors" rows="3" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">{colors_input}</textarea>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Available Sizes (comma-separated)</label>
                    <input type="text" name="sizes" value="{sizes_input}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            
            <div>
                <h3 class="text-lg font-semibold mb-4">Pricing Rules</h3>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Bulk Threshold (pieces)</label>
                    <input type="number" name="bulk_threshold" value="{pricing_rules.get('bulk_threshold', 15)}" min="1"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Bulk Price (₹)</label>
                    <input type="number" name="bulk_price" value="{pricing_rules.get('bulk_price', 279)}" step="0.01" min="0"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Regular Price (₹)</label>
                    <input type="number" name="regular_price" value="{pricing_rules.get('regular_price', 319)}" step="0.01" min="0"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Bulk Label</label>
                    <input type="text" name="bulk_label" value="{pricing_rules.get('bulk_label', 'More than 15pcs')}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Regular Label</label>
                    <input type="text" name="regular_label" value="{pricing_rules.get('regular_label', 'Less than 15pcs')}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
        </div>
        
        <div class="flex gap-4">
            <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">
                Update Size Chart & Pricing
            </button>
            <a href="/admin-ui/products" class="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors">
                Back to Products
            </a>
        </div>
    </form>
    """
    
    return render_admin_layout("Edit Size Chart", content)

@admin_ui_router.post("/products/{product_id}/sizechart/update")
async def update_product_sizechart(
    product_id: str,
    request: Request,
    current_user: User = Depends(require_admin),
    database: AsyncIOMotorDatabase = Depends(lambda: None)
):
    """Update size chart and pricing from form data."""
    
    form_data = await request.form()
    
    colors = [color.strip() for color in form_data.get("colors", "").split(",") if color.strip()]
    sizes = [size.strip() for size in form_data.get("sizes", "").split(",") if size.strip()]
    
    update_data = {
        "size_chart": {
            "colors": colors,
            "sizes": sizes,
            "chart_code": form_data.get("chart_code", "OS210")
        },
        "pricing_rules": {
            "bulk_threshold": int(form_data.get("bulk_threshold", 15)),
            "bulk_price": float(form_data.get("bulk_price", 279)),
            "regular_price": float(form_data.get("regular_price", 319)),
            "bulk_label": form_data.get("bulk_label", "More than 15pcs"),
            "regular_label": form_data.get("regular_label", "Less than 15pcs")
        },
        "updated_at": datetime.utcnow()
    }
    
    await database.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    return HTMLResponse(content="""
    <script>
        alert('Size chart and pricing updated successfully!');
        window.location.href = '/admin-ui/products';
    </script>
    """)