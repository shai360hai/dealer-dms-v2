-- Demo inventory for Dealer DMS. Run after schema.sql and after you've
-- created at least one staff login (see README) — this only seeds
-- vehicles/flags, not users (Supabase Auth users are created through
-- the dashboard, not SQL).

insert into public.feature_flags (key, enabled, description) values
  ('csv_import', true, 'ייבוא רכבים בקובץ CSV'),
  ('csv_export', true, 'ייצוא מלאי לקובץ CSV'),
  ('financing_calculator', false, 'מחשבון מימון בעמוד הרכב'),
  ('whatsapp_integration', false, 'שליחת פניות ישירות ל-WhatsApp Business API'),
  ('trade_in_valuation', false, 'הערכת שווי רכב טרייד-אין')
on conflict (key) do nothing;

insert into public.vehicles (
  slug, brand, model, trim, year, price, stock_number, vin, mileage, engine,
  horsepower, battery_capacity, driving_range, fuel_type, transmission, drive_type,
  owners, exterior_color, interior_color, description, features, safety_features,
  warranty, service_history, dealer_notes, location, status, published
) values
  (
    'changan-deepal-s07-2026', 'Changan', 'Deepal S07', 'Max AWD', 2026, 189900,
    'DP-S07-0001', 'LS4BJ4B19PA000001', 0, null, 380, '80 kWh', 520,
    'electric', 'automatic', 'awd', 1, 'לבן פנינה', 'שחור/בז׳',
    'דיפאל S07 חדשה לגמרי, קרוסאובר חשמלי בעל טווח נסיעה מוביל בקטגוריה ואבזור ברמה פרימיום.',
    array['גג פנורמי', 'מושבים מחוממים ומאווררים', 'טעינה אלחוטית לטלפון', 'מסך מרכזי 15.6 אינץ׳'],
    array['בקרת שיוט אדפטיבית', 'שמירה אקטיבית בנתיב', '6 כריות אוויר', 'מצלמת 360 מעלות'],
    'אחריות יצרן 6 שנים / 150,000 ק״מ, אחריות סוללה 8 שנים',
    'רכב חדש מהיבואן, ללא היסטוריית טיפולים',
    'רכב תצוגה במשרד חיפה', 'חיפה', 'available', true
  ),
  (
    'changan-deepal-l07-2026', 'Changan', 'Deepal L07', 'EREV Ultra', 2026, 179900,
    'DP-L07-0002', 'LS4BJ4B19PA000002', 0, '1.5L Range Extender', 340, '43 kWh', 1200,
    'plugin_hybrid', 'automatic', 'rwd', 1, 'כחול מטאלי', 'שחור',
    'סדאן EREV המשלבת נסיעה חשמלית שקטה לנסיעות היומיום עם טווח כולל של מעל 1,200 ק״מ.',
    array['מערכת שמע Sony', 'מושב נהג חשמלי עם זיכרון', 'טעינה מהירה DC'],
    array['בלימת חירום אוטומטית', 'בקרת יציבות אלקטרונית', '7 כריות אוויר'],
    'אחריות יצרן 6 שנים / 150,000 ק״מ', 'רכב חדש מהיבואן', null, 'חיפה', 'available', true
  ),
  (
    'changan-deepal-s05-2025', 'Changan', 'Deepal S05', 'Pro', 2025, 149900,
    'DP-S05-0003', 'LS4BJ4B19PA000003', 1200, null, 218, '62.5 kWh', 420,
    'electric', 'automatic', 'fwd', 1, 'אפור גרפיט', 'בז׳',
    'קרוסאובר חשמלי קומפקטי, מאוזן מאוד לנהיגה עירונית, כולל חבילת אבזור בטיחות מלאה.',
    array['מזגן דו-אזורי', 'חיישני חניה קדמיים ואחוריים'],
    array['ESC', '5 כריות אוויר', 'מצלמת רוורס'],
    'אחריות יצרן 6 שנים / 150,000 ק״מ', 'טיפול 10,000 ק״מ בוצע במוסך מורשה',
    'שמור ללקוח — ממתין לחתימה סופית', 'חיפה', 'reserved', true
  ),
  (
    'changan-cs55-plus-2025', 'Changan', 'CS55 Plus', 'Comfort', 2025, 124900,
    'CS55-0004', null, 8500, '1.5T', 181, null, null,
    'petrol', 'automatic', 'fwd', 1, 'לבן', 'שחור',
    'רכב מונע בעלים אחד, במצב מצוין, כולל היסטוריית טיפולים מלאה במוסך מורשה.',
    array['מסך מגע 10.25 אינץ׳', 'Apple CarPlay / Android Auto'],
    array['6 כריות אוויר', 'בקרת שיוט'],
    'יתרת אחריות יצרן עד 2028', '3 טיפולים תקופתיים, כולם במוסך מורשה',
    null, 'חיפה', 'sold', true
  ),
  (
    'changan-uni-t-2026', 'Changan', 'UNI-T', 'Elite', 2026, 139900,
    'UNIT-0005', null, 0, '1.5T', 188, null, null,
    'petrol', 'automatic', 'fwd', 1, 'אדום', 'שחור/אדום',
    'דגם חדש שטרם פורסם באתר — בהמתנה לצילומי סטודיו לפני פרסום.',
    array['גג פנורמי', 'צג דיגיטלי'], array['6 כריות אוויר'],
    'אחריות יצרן 6 שנים / 150,000 ק״מ', null,
    'להמתין לתמונות סטודיו לפני פרסום', 'חיפה', 'available', false
  )
on conflict (slug) do nothing;

insert into public.inquiries (vehicle_id, full_name, phone, email, message)
select id, 'לקוח לדוגמה', '050-1234567', 'example.customer@example.com', 'מעוניין לתאם נסיעת מבחן בסוף השבוע.'
from public.vehicles where slug = 'changan-deepal-s07-2026'
on conflict do nothing;
