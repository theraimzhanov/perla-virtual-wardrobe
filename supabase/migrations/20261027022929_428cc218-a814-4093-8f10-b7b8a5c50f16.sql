CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  brand text NOT NULL,
  style text NOT NULL DEFAULT 'Contemporary',
  category text NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.products (name, brand, style, category, image_url) VALUES
  ('Ivory Wrap Dress', 'Maison Ivoire', 'Modern romantic', 'Clothes', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80'),
  ('Pleated Midi Dress', 'Noir Studio', 'Evening minimal', 'Clothes', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80'),
  ('Linen Sundress', 'Riviera Atelier', 'Riviera ease', 'Clothes', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80'),
  ('Cloud Cotton Dress', 'Blanc', 'Everyday modern', 'Clothes', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80'),
  ('Scarlet Slip Dress', 'Noir Studio', 'Statement evening', 'Clothes', 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=800&q=80'),
  ('Botanical Day Dress', 'Rive Gauche', 'Soft botanical', 'Clothes', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80'),
  ('Atelier Rack Edit', 'Forme Studio', 'Curated capsule', 'Clothes', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80'),
  ('Camel Wool Coat', 'Atelier Camel', 'Quiet luxury', 'Clothes', 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80'),
  ('Nordic Knit Sweater', 'Nordhaus', 'Cozy minimal', 'Clothes', 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=800&q=80'),
  ('Essential White Tee', 'Blanc', 'Everyday modern', 'Clothes', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80'),
  ('Relaxed Cotton Tee', 'Studio Nord', 'Casual classic', 'Clothes', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80'),
  ('Field Utility Jacket', 'Rive Gauche', 'Urban utility', 'Clothes', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80'),
  ('Moto Leather Jacket', 'Noir Studio', 'Edge classic', 'Clothes', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80'),
  ('Belted Trench Coat', 'Atelier Camel', 'City classic', 'Clothes', 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=800&q=80'),
  ('Tailored Wool Blazer', 'Maison Ivoire', 'Sharp tailoring', 'Clothes', 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=800&q=80'),
  ('Sand Double Blazer', 'Forme Studio', 'Sculptural chic', 'Clothes', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'),
  ('Vintage Wash Jeans', 'Denim Society', 'Retro denim', 'Clothes', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80'),
  ('Slim Indigo Jeans', 'Denim Society', 'Everyday modern', 'Clothes', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80'),
  ('Ecru Wide Jeans', 'Studio Nord', 'Relaxed tailoring', 'Clothes', 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=800&q=80'),
  ('Pleated Trousers', 'Atelier Camel', 'Quiet luxury', 'Clothes', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80'),
  ('Linen Drawstring Shorts', 'Riviera Atelier', 'Riviera ease', 'Clothes', 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80'),
  ('Satin Bias Skirt', 'Maison Ivoire', 'Modern romantic', 'Clothes', 'https://images.unsplash.com/photo-1592301933927-35b597393c0a?auto=format&fit=crop&w=800&q=80'),
  ('Silk Camisole Top', 'Noir Studio', 'Evening minimal', 'Clothes', 'https://images.unsplash.com/photo-1551489186-cf8726f514f8?auto=format&fit=crop&w=800&q=80'),
  ('Quilted Chain Bag', 'Or Paris', 'Gilded classic', 'Bag', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80'),
  ('Structured Tote', 'Or Paris', 'City classic', 'Bag', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80'),
  ('Mini Top Handle', 'Maison Ivoire', 'Sculptural chic', 'Bag', 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80'),
  ('Canvas Crossbody', 'Studio Nord', 'Everyday modern', 'Bag', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80'),
  ('Voyager Backpack', 'Nordhaus', 'Urban utility', 'Bag', 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80'),
  ('Leather Rucksack', 'Atelier Camel', 'Heritage craft', 'Bag', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'),
  ('Woven Market Bag', 'Riviera Atelier', 'Riviera ease', 'Bag', 'https://images.unsplash.com/photo-1548863227-3af567fc3b27?auto=format&fit=crop&w=800&q=80'),
  ('Felt Fedora', 'Forme Studio', 'Urban sculptural', 'Hat', 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?auto=format&fit=crop&w=800&q=80'),
  ('Corduroy Cap', 'Denim Society', 'Casual classic', 'Hat', 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=800&q=80'),
  ('Straw Boater', 'Riviera Atelier', 'Riviera ease', 'Hat', 'https://images.unsplash.com/photo-1533827432537-70133748f5c8?auto=format&fit=crop&w=800&q=80'),
  ('Wool Bucket Hat', 'Forme Studio', 'Urban sculptural', 'Hat', 'https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?auto=format&fit=crop&w=800&q=80'),
  ('Wide Brim Sun Hat', 'Riviera Atelier', 'Soft botanical', 'Hat', 'https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?auto=format&fit=crop&w=800&q=80'),
  ('Runner Sneaker', 'Blanc', 'Sport minimal', 'Shoes', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80'),
  ('Court Low Sneaker', 'Blanc', 'Everyday modern', 'Shoes', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80'),
  ('Retro High Top', 'Denim Society', 'Retro sport', 'Shoes', 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80'),
  ('Patent Stiletto', 'Noir Studio', 'Statement evening', 'Shoes', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80'),
  ('Satin Evening Heel', 'Maison Ivoire', 'Modern romantic', 'Shoes', 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?auto=format&fit=crop&w=800&q=80'),
  ('Sculpted Pump', 'Or Paris', 'Sculptural chic', 'Shoes', 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80'),
  ('Knit Trainer', 'Nordhaus', 'Sport minimal', 'Shoes', 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80'),
  ('Chunky Sole Sneaker', 'Studio Nord', 'Street modern', 'Shoes', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80'),
  ('Chelsea Boot', 'Atelier Camel', 'City classic', 'Shoes', 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=800&q=80'),
  ('Lace-Up Boot', 'Nordhaus', 'Heritage craft', 'Shoes', 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80');