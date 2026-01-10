-- Seed Manufacturing Products
-- Run this in Supabase SQL Editor after creating the products table

INSERT INTO products (name, description, slug, price, currency, product_type, status, metadata) VALUES
-- Windows
('Casement Window', 'Energy-efficient casement window with modern design. Perfect for ventilation and natural light.', 'casement-window', 45000, 'usd', 'one_time', 'active', '{"category": "windows", "material": "vinyl", "size": "standard"}'::jsonb),
('Double-Hung Window', 'Classic double-hung window design. Easy to clean and maintain with excellent energy efficiency.', 'double-hung-window', 60000, 'usd', 'one_time', 'active', '{"category": "windows", "material": "vinyl", "size": "standard"}'::jsonb),
('Bay Window', 'Elegant bay window that extends outward, creating additional interior space and panoramic views.', 'bay-window', 80000, 'usd', 'one_time', 'active', '{"category": "windows", "material": "vinyl", "size": "large"}'::jsonb),

-- Doors
('Interior Door', 'Solid wood interior door with modern hardware. Available in various finishes.', 'interior-door', 25000, 'usd', 'one_time', 'active', '{"category": "doors", "material": "wood", "type": "interior"}'::jsonb),
('Exterior Door', 'Weather-resistant exterior door with security features. Energy efficient and durable.', 'exterior-door', 65000, 'usd', 'one_time', 'active', '{"category": "doors", "material": "steel", "type": "exterior"}'::jsonb),
('Sliding Door', 'Modern sliding glass door system. Perfect for patios and outdoor access.', 'sliding-door', 95000, 'usd', 'one_time', 'active', '{"category": "doors", "material": "glass", "type": "sliding"}'::jsonb),

-- Hardware
('Door Handle Set', 'Premium door handle set with matching deadbolt. Available in multiple finishes.', 'door-handle-set', 4500, 'usd', 'one_time', 'active', '{"category": "hardware", "type": "handles"}'::jsonb),
('Lock Set', 'Complete lock set with keyed entry. High security and easy installation.', 'lock-set', 12000, 'usd', 'one_time', 'active', '{"category": "hardware", "type": "locks"}'::jsonb),
('Hinges', 'Heavy-duty door hinges. Set of 3 pairs for standard door installation.', 'hinges', 2500, 'usd', 'one_time', 'active', '{"category": "hardware", "type": "hinges"}'::jsonb),

-- Custom Fabrication
('Custom Window', 'Custom fabricated window to your specifications. Contact us for sizing and design options.', 'custom-window', 50000, 'usd', 'service', 'active', '{"category": "custom", "type": "window", "priceRange": "500-2000"}'::jsonb),
('Custom Door', 'Custom fabricated door designed to your exact requirements. Premium materials and craftsmanship.', 'custom-door', 80000, 'usd', 'service', 'active', '{"category": "custom", "type": "door", "priceRange": "800-3000"}'::jsonb)

ON CONFLICT (slug) DO NOTHING;

