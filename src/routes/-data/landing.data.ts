// ─── src/routes/-data/landing.data.ts ───
//
// محتوى صفحة الهبوط — مصدر واحد. كل القيم هنا تعكس ما تقدّمه المنصّة فعلاً
// (لا أرقام وهمية ولا ميزات غير موجودة):
//   • سوق منتجات: التاجر يضع سعر الجملة، المسوّق يحدّد سعر بيعه ويربح الفارق.
//   • الدفع عند الاستلام (COD) + شبكة توصيل تغطّي 69 ولاية.
//   • سحب الأرباح عبر CCP و BaridiMob. واجهة عربية بالكامل.

export const navLinks = [
  { label: 'كيف يعمل', href: '#how-it-works' },
  { label: 'التجار', href: '#merchants' },
  { label: 'المسوّقون', href: '#affiliates' },
  { label: 'الحماية', href: '#protection' },
  { label: 'الأرباح', href: '#features' },
  { label: 'التغطية', href: '#coverage' },
]

// إحصاءات الهيرو — قدرات حقيقية بدل أعداد مستخدمين وهمية.
export const heroStats = [
  { value: '69', label: 'ولاية مغطّاة' },
  { value: 'COD', label: 'الدفع عند الاستلام' },
  { value: '0 دج', label: 'رسوم الاشتراك' },
]

// معاينة لوحة التاجر داخل الهيرو — أرقام توضيحية (عيّنة، ليست بيانات حيّة).
export const dashboardKpis = [
  { label: 'الأرباح الصافية', value: '84,200', trend: '↑ مثال توضيحي', unit: 'دج' },
  { label: 'الطلبيات', value: '128', trend: 'هذا الأسبوع' },
  { label: 'معدل التوصيل', value: '87%', trend: '↑ جيّد' },
  { label: 'مسوّقون يروّجون', value: '12', trend: 'لمنتجاتك' },
]

export const dashboardWilayas = [
  { name: 'الجزائر', orders: 32, pct: 85 },
  { name: 'وهران', orders: 25, pct: 67 },
  { name: 'قسنطينة', orders: 19, pct: 52 },
  { name: 'سطيف', orders: 15, pct: 40 },
]

export const tickerItems = [
  'الدفع عند الاستلام (COD) في كل الجزائر',
  'سحب أرباحك عبر BaridiMob و CCP',
  '69 ولاية مغطّاة بشبكة توصيل',
  'تتبّع الطلبيات لحظة بلحظة',
  'لوحة تحكّم عربية بالكامل',
  'المسوّق يحدّد سعر بيعه ويربح الفارق',
  'سجّل مجاناً وابدأ فور الموافقة',
]

export const platformStats = [
  { value: '69', label: 'ولاية مغطّاة' },
  { value: 'COD', label: 'الدفع عند الاستلام' },
  { value: '0 دج', label: 'رسوم اشتراك' },
  { value: '100%', label: 'واجهة عربية' },
]

export const steps = [
  {
    num: '1',
    title: 'التاجر يعرض منتجاته',
    desc: 'يضيف التاجر منتجاته وسعر الجملة والمخزون، فتظهر في سوق المنتجات أمام المسوّقين — بدقائق.',
  },
  {
    num: '2',
    title: 'المسوّق يختار ويبيع',
    desc: 'يختار المسوّق المنتج، يحدّد سعر بيعه، ويصنع رابط تتبّع أو صفحة بيع جاهزة يشاركها مع جمهوره.',
  },
  {
    num: '3',
    title: 'توصيل ودفع عند الاستلام',
    desc: 'يصل الطلب، يُوصَّل للمنزل أو للمكتب بالدفع عند الاستلام، وتُحوَّل أرباح الطرفين عبر CCP أو BaridiMob.',
  },
]

export const merchantFeatures = [
  'لوحة تحكّم عربية مع متابعة دورة حياة كل طلبية',
  'أنت تحدّد سعر الجملة — والمسوّق يضيف هامشه',
  'شبكة توصيل لكل الولايات بالدفع عند الاستلام',
  'تقارير الأرباح لكل مسوّق ومنتج وولاية',
  'إدارة المخزون والمرتجعات بشفافية كاملة',
]

export const affiliateFeatures = [
  'حرية كاملة في اختيار المنتجات وتحديد سعر بيعك',
  'تربح الفارق بين سعرك وسعر الجملة في كل طلبية',
  'روابط تتبّع وصفحات بيع جاهزة لكل منتج',
  'سحب أرباحك عبر BaridiMob و CCP',
  'لوحة تُظهر طلبياتك وأرباحك لحظة بلحظة',
]

// ولايات حقيقية ممثِّلة للتغطية (المجموع 69 ولاية).
export const wilayas = [
  { name: 'الجزائر', active: true },
  { name: 'وهران', active: true },
  { name: 'قسنطينة', active: true },
  { name: 'عنابة', active: true },
  { name: 'سطيف', active: true },
  { name: 'باتنة', active: true },
  { name: 'بجاية', active: true },
  { name: 'تيزي وزو', active: true },
  { name: 'البليدة', active: true },
  { name: 'تلمسان', active: true },
  { name: 'سيدي بلعباس', active: true },
  { name: 'بسكرة', active: true },
  { name: 'تبسة', active: true },
  { name: 'الجلفة', active: true },
  { name: 'ورقلة', active: true },
  { name: 'غرداية', active: true },
  { name: 'مستغانم', active: true },
  { name: 'المسيلة', active: true },
  { name: 'الوادي', active: true },
  { name: 'سكيكدة', active: true },
  { name: 'برج بوعريريج', active: true },
  { name: 'الأغواط', active: true },
  { name: 'بومرداس', active: true },
  { name: 'الشلف', active: true },
]

// حماية المسوّق — ميزات حقيقية: نسبة الطلب (attribution) عبر كود/رابط التتبّع،
// المحفظة + التسوية بعد التوصيل، نظام النزاعات، تتبّع الطلبيات.
export const affiliateProtections = [
  {
    iconId: 'attribution',
    title: 'طلباتك محميّة ومنسوبة إليك',
    text: 'كل طلبية تأتي من كودك أو رابطك تُسجَّل باسمك تلقائيّاً — لا أحد يسرق بيعك أو عمولتك.',
  },
  {
    iconId: 'wallet',
    title: 'عمولتك مضمونة',
    text: 'أرباحك محفوظة في محفظتك على المنصّة وتُصرف بعد تأكيد توصيل الطلبية.',
  },
  {
    iconId: 'scale',
    title: 'نظام نزاعات عادل',
    text: 'عند أي خلاف على طلبية، تُراجَع الحالة وتُحفظ حقوقك بشفافية كاملة.',
  },
  {
    iconId: 'track',
    title: 'تتبّع حتى التسليم',
    text: 'تابع كل طلباتك لحظة بلحظة من التأكيد حتى تسليمها للزبون.',
  },
]

// حماية التاجر — ميزات حقيقية: سعر الجملة يحدّده هو، لا رسوم على المرتجع/الملغى،
// شبكة توصيل بتتبّع، إدارة مخزون ومرتجعات.
export const merchantProtections = [
  {
    iconId: 'price',
    title: 'سعرك محميّ',
    text: 'أنت تحدّد سعر الجملة — لا يبيع أحد تحت تكلفتك، وهامشك مضمون في كل طلبية موصّلة.',
  },
  {
    iconId: 'return',
    title: 'لا رسوم على المرتجع',
    text: 'الطلبيات المرتجعة أو الملغاة لا تخضع لأي رسوم — لا تدفع إلا عن بيع ناجح.',
  },
  {
    iconId: 'truck',
    title: 'توصيل موثوق وشفّاف',
    text: 'شبكة توصيل تغطّي 69 ولاية مع تتبّع واضح لكل شحنة حتى الاستلام.',
  },
  {
    iconId: 'chart',
    title: 'تحكّم كامل',
    text: 'إدارة المخزون والمرتجعات وتقارير الأرباح لكل مسوّق ومنتج بشفافية.',
  },
]

// أصناف رائجة في سوق المنتجات (للعرض فقط — لا نِسَب عمولة ثابتة؛ الربح هامش يحدّده المسوّق).
export const marketCategories = [
  { iconId: 'fashion', name: 'الملابس والموضة' },
  { iconId: 'beauty', name: 'التجميل والعناية' },
  { iconId: 'electronics', name: 'الإلكترونيات' },
  { iconId: 'home', name: 'المنزل والديكور' },
  { iconId: 'food', name: 'الغذاء والصحة' },
  { iconId: 'gift', name: 'الهدايا والمتفرّقات' },
]

// مثال توضيحي لحساب ربح المسوّق (هامش مفتوح = سعر البيع − سعر الجملة − رسوم المنصة).
export const marginExample = {
  sellPrice: 3200, // سعر بيع المسوّق (يحدّده بنفسه)
  wholesale: 2000, // سعر الجملة (يضعه التاجر)
  fee: 50, // رسوم المنصة للمسوّق
  get profit() {
    return this.sellPrice - this.wholesale - this.fee
  },
}

// لماذا DzAffilio — قيم حقيقية بدل شهادات مُختلَقة.
export const whyUs = [
  {
    iconId: 'cod',
    title: 'الدفع عند الاستلام',
    desc: 'يدفع الزبون نقداً عند استلام طلبه — الطريقة الأكثر ثقة في السوق الجزائري.',
  },
  {
    iconId: 'map',
    title: 'تغطية 69 ولاية',
    desc: 'شبكة توصيل تصل كل ولايات الوطن — توصيل للمنزل أو لمكتب الشركة.',
  },
  {
    iconId: 'wallet',
    title: 'سحب عبر CCP و BaridiMob',
    desc: 'حوّل أرباحك إلى حسابك البريدي أو BaridiMob بعد كل تسوية.',
  },
  {
    iconId: 'margin',
    title: 'هامش ربح مفتوح',
    desc: 'المسوّق يحدّد سعر بيعه ويربح الفارق — لا سقف ثابت للعمولة.',
  },
  {
    iconId: 'lang',
    title: 'واجهة عربية بالكامل',
    desc: 'لوحة تحكّم من اليمين لليسار، مصمّمة خصّيصاً للسوق الجزائري.',
  },
  {
    iconId: 'free',
    title: 'تسجيل مجاني',
    desc: 'لا رسوم اشتراك — سجّل كتاجر أو مسوّق وابدأ فور موافقة الإدارة.',
  },
]

export const footerCols = [
  {
    title: 'المنصة',
    links: [
      { label: 'كيف تعمل', href: '#how-it-works' },
      { label: 'للتجار', href: '#merchants' },
      { label: 'للمسوّقين', href: '#affiliates' },
      { label: 'التغطية الجغرافية', href: '#coverage' },
    ],
  },
  {
    title: 'ابدأ الآن',
    links: [
      { label: 'إنشاء حساب', href: '/register' },
      { label: 'تسجيل الدخول', href: '/login' },
      { label: 'سجّل كتاجر', href: '/register?type=merchant' },
      { label: 'سجّل كمسوّق', href: '/register?type=affiliate' },
    ],
  },
  {
    title: 'قانوني',
    links: [
      { label: 'شروط الخدمة', href: '#' },
      { label: 'سياسة الخصوصية', href: '#' },
      { label: 'سياسة الاسترجاع', href: '#' },
    ],
  },
]
