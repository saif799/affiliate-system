// ─── src/routes/-data/landing.data.ts ───

export const navLinks = [
  { label: 'المميزات', href: '#features' },
  { label: 'كيف يعمل', href: '#how-it-works' },
  { label: 'التجار', href: '#merchants' },
  { label: 'المسوقون', href: '#affiliates' },
  { label: 'التغطية', href: '#coverage' },
]

export const heroStats = [
  { value: '20K+', label: 'مسوق نشط' },
  { value: '500+', label: 'مورد موثوق' },
  { value: '150K+', label: 'طلبية ناجحة' },
]

export const dashboardKpis = [
  { label: 'الأرباح الصافية', value: '847,240', trend: '↑ 18.4% هذا الشهر', unit: 'دج' },
  { label: 'الطلبيات', value: '1,247', trend: '↑ 12% هذا الشهر' },
  { label: 'معدل التوصيل', value: '87.3%', trend: '↑ ممتاز' },
  { label: 'مسوقون نشطون', value: '43', trend: '↑ 7 جدد هذا الأسبوع' },
]

export const dashboardWilayas = [
  { name: 'الجزائر', orders: 324, pct: 85 },
  { name: 'وهران', orders: 256, pct: 67 },
  { name: 'قسنطينة', orders: 198, pct: 52 },
  { name: 'سطيف', orders: 151, pct: 40 },
]

export const tickerItems = [
  'دفع فوري عبر Baridimob و CCP',
  'حماية كاملة للتاجر من مشاكل التوصيل',
  '58 ولاية مغطاة بالكامل',
  'تتبع الطلبيات لحظة بلحظة',
  'لوحة تحكم عربية 100%',
  'دعم فني على مدار الساعة',
]

export const platformStats = [
  { value: '58', label: 'ولاية مغطاة' },
  { value: '150K+', label: 'طلبية ناجحة' },
  { value: '500+', label: 'مورد موثوق' },
  { value: '20,000+', label: 'مسوق نشط' },
]

export const steps = [
  {
    num: '1',
    title: 'سجّل منتجاتك',
    desc: 'أضف منتجاتك بدقائق — الاسم، الصور، السعر، والمخزون. النظام يحسب العمولات تلقائياً ويحمي سعرك الأدنى.',
  },
  {
    num: '2',
    title: 'يروّج المسوقون',
    desc: 'آلاف المسوقين يختارون منتجك وينشئون روابط مخصصة. كل بيع يُحسب تلقائياً لصاحبه بدون نزاع.',
  },
  {
    num: '3',
    title: 'اقبض أرباحك',
    desc: 'بمجرد توصيل الطلبية وتأكيدها، تصل أرباحك مباشرة — Baridimob أو CCP أو تحويل بنكي حسب اختيارك.',
  },
]

export const merchantFeatures = [
  'لوحة تحكم عربية متكاملة مع تتبع الطلبيات',
  'حماية السعر الأدنى — لا أحد يحرق سعرك',
  'تقارير مفصلة لكل ولاية ومسوق',
  'إدارة المرتجعات بشفافية كاملة',
  'تحميل فيديوهات إعلانية عبر Google Drive',
]

export const affiliateFeatures = [
  'حرية مطلقة في اختيار المنتجات',
  'أرباح مضمونة عبر Baridimob و CCP',
  'روابط تتبع مع SubID لكل حملة',
  'فيديوهات وصور جاهزة للنشر',
  'لوحة تحكم تُظهر أرباحك لحظة بلحظة',
]

export const wilayas = [
  { name: 'الجزائر', active: true },
  { name: 'وهران', active: true },
  { name: 'قسنطينة', active: true },
  { name: 'سطيف', active: true },
  { name: 'عنابة', active: true },
  { name: 'سيدي بلعباس', active: true },
  { name: 'تلمسان', active: true },
  { name: 'بجاية', active: true },
  { name: 'تيزي وزو', active: true },
  { name: 'بسكرة', active: true },
  { name: 'باتنة', active: true },
  { name: 'برج بوعريريج', active: true },
  { name: 'المدية', active: false },
  { name: 'البويرة', active: false },
  { name: 'مستغانم', active: false },
  { name: 'الأغواط', active: false },
  { name: 'عين الدفلى', active: false },
  { name: 'غليزان', active: false },
  { name: 'ورقلة', active: false },
  { name: 'الأوراس', active: false },
]

// iconId يُحيل إلى مكوّن SVG في CommissionsSection
export const commissions = [
  { iconId: 'fashion',     category: 'الملابس والموضة',   rate: '15–25%', barPct: 80 },
  { iconId: 'beauty',      category: 'التجميل والعناية',  rate: '20–30%', barPct: 90 },
  { iconId: 'electronics', category: 'الإلكترونيات',      rate: '8–15%',  barPct: 55 },
  { iconId: 'home',        category: 'المنزل والديكور',   rate: '12–22%', barPct: 70 },
  { iconId: 'food',        category: 'الغذاء والصحة',     rate: '18–28%', barPct: 85 },
  { iconId: 'gift',        category: 'الهدايا والمتفرقات', rate: '15–20%', barPct: 65 },
]

export const testimonials = [
  {
    text: 'في ظرف شهرين من الانضمام، تضاعفت مبيعاتي ثلاث مرات. لوحة التحكم واضحة جداً وكل شيء بالعربية.',
    name: 'كمال بن علي',
    role: 'تاجر · وهران',
    initial: 'ك.ع',
    avatarBg: 'from-violet-600 to-violet-800',
    tag: 'تاجر موثوق',
    tagColor: 'text-violet-700 bg-violet-50 border-violet-200',
  },
  {
    text: 'كمسوق، DzDrop أعطتني الحرية الكاملة. أختار ما يناسب جمهوري وأقبض عمولتي مباشرة عبر Baridimob.',
    name: 'سلمى عيسى',
    role: 'مسوقة رقمية · سطيف',
    initial: 'س.ع',
    avatarBg: 'from-amber-500 to-yellow-600',
    tag: 'مسوقة نشطة',
    tagColor: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    text: 'أخيراً منصة جزائرية تفهم واقعنا. COD مدعوم، التوصيل لكل الولايات، والدعم الفني يرد بسرعة.',
    name: 'يوسف مزياني',
    role: 'تاجر · قسنطينة',
    initial: 'ي.م',
    avatarBg: 'from-emerald-500 to-teal-600',
    tag: 'تاجر موثوق',
    tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
]

export const footerCols = [
  {
    title: 'المنصة',
    links: ['كيفية العمل', 'الأسعار والعمولات', 'التغطية الجغرافية', 'المدونة'],
  },
  {
    title: 'قانوني',
    links: ['شروط الخدمة', 'سياسة الخصوصية', 'سياسة الاسترجاع', 'الاتفاقيات'],
  },
  {
    title: 'مساعدة',
    links: ['الأسئلة الشائعة', 'التواصل معنا', 'دعم التجار', 'دعم المسوقين'],
  },
]