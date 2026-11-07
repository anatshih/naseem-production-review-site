"use strict";

const roles = {
    sales: "المبيعات",
    technical: "التنسيق الفني",
    supervisor: "مشرف الإنتاج",
    production: "الإنتاج",
    delivery: "التوريد"
};

const stages = ["مسودة", "مراجعة المقاسات", "مراجعة المواد", "قيد الإنتاج", "منتجة", "تم التوريد"];
const guideTypes = ["عادي", "وسط", "وسط 7.5", "SKB", "دبل صناعي", "فرشاية وسط", "PV7"];
const installations = {
    A: "تركيب داخلي بدون شاشية (A)",
    B: "تركيب داخلي بنصف شاشية (B)",
    C: "تركيب داخلي مع شاشية (C)",
    D: "تركيب خارجي (D)"
};
const customers = { sample: "زبون النسيم التجريبي" };
const doorKinds = { standard: "باب رول عادي", insulated: "باب رول معزول" };
const cheekSizes = [0, 35, 40, 45, 50, 55, 60];
const springTypes = {
    "1.1*60": "1.1*60", "1.0*60": "1.0*60", "1.4*60": "1.4*60",
    "1.2*60": "1.2*60", "1.3*60": "1.3*60", "1.2*55": "1.2*55", "اصغر نوع": "أصغر نوع"
};
const guidesPerDoor = 2;
const fieldHelp = {
    customer: "الزبون المرتبط بهذه الطلبية. اختر زبون النسيم التجريبي أثناء الفحص.",
    notes: "سجّل أي ملاحظة خاصة بالطلبية يراجعها الفريق أو يحتاجها المصنع.",
    kind: "اختر باب رول عاديًا أو معزولًا. يستخدم الحساب نوع الباب لاختيار بعض قطع الإنتاج.",
    installation: "طريقة تركيب الباب في الفتحة. A داخلي بدون شاشية، وB داخلي بنصف شاشية، وC داخلي مع شاشية، وD خارجي.",
    doors: "عدد الأبواب التي تتشارك الصنف والمقاسات والمواصفات في هذا البند.",
    width: "عرض الباب الواحد بالملّيمتر. لطول قص الماسورة خانة مستقلة.",
    height: "ارتفاع الباب الواحد بالملّيمتر. لطول قص المجرى خانة مستقلة.",
    guideType: "نوع المجرى المحدد لهذا الباب حسب مواصفات الإنتاج.",
    guide: "طول قص قطعة مجرى واحدة بالملّيمتر. يُستخدم لحساب قائمة القص وإجمالي الطول للمخزن.",
    pipe: "طول قص الماسورة للباب الواحد بالملّيمتر. استكمله قبل اعتماد المواد.",
    forehead: "ارتفاع جبهة الباب بالملّيمتر. يطرحه الحساب من ارتفاع الباب لحساب الريش.",
    slat: "ارتفاع الريشة الواحدة بالملّيمتر. يقسّم الحساب ارتفاع الباب بعد طرح الجبهة على هذا الرقم.",
    cheek: "مقاس خد الباب حسب مواصفاته. اختر «لا يوجد» إذا كان البند بلا خد.",
    springType: "رمز صنف الزنبرك من قائمة البرنامج القديم. يحدد النوع المستخدم في الباب.",
    springs: "عدد زنبركات النوع الأول للباب الواحد. أدخل صفرًا إذا كان الباب بلا زنبرك.",
    springLength: "طول الزنبرك بالملّيمتر حسب مواصفات التصنيع.",
    secondSpringType: "اختر الصنف الإضافي عندما يحتاج الباب نوعين من الزنبرك.",
    secondSprings: "عدد زنبركات النوع الثاني في الباب الواحد."
};
const partNames = [
    "ريش", "جبهة", "أكلون ريش", "تبشيمة 4 ملم", "تبشيمة 4.8 ملم",
    "خد 35", "خد 40", "خد 45", "خد 50", "خد 55", "خد 60",
    "مجرى", "ماسورة", "زنبرك", "طاسة", "علاقة داخلي", "علاقة خارجي",
    "برغي سكرويت", "برغي ماسورة", "روندلة برغي ماسورة", "سامونة برغي ماسورة",
    "كرسي دنجل", "برغي كرسي", "روندلة برغي كرسي", "سامونة برغي كرسي", "حوض", "جسر جومي"
];

const scenarios = {
    A: { title: "طلبية باب واحد", description: "أدخل طلبية جديدة وتابعها من التسجيل إلى التوريد.", order: "DEMO-01" },
    B: { title: "ثلاثة أبواب متطابقة", description: "اختبر نقص طول قص الماسورة وقارن إجمالي مواد بند متعدد الأبواب.", order: "DEMO-02" }
};

const stepInstructions = {
    "أ١": ["تسجيل طلبية باب واحد", "اختر دور المبيعات وأدخل بيانات المثال، ثم احفظ المسودة.", "تظهر رسالة الحفظ وتبقى القيم ظاهرة في المسودة."],
    "أ٢": ["تسليم الطلبية للمراجعة", "راجع القيم المحفوظة واضغط «إرسال للمراجعة الفنية».", "تنتقل الطلبية إلى مراجعة المقاسات."],
    "أ٣": ["مراجعة المقاسات", "اختر دور التنسيق الفني، وراجع عرض الباب وارتفاعه وأطوال القص، ثم اعتمد المقاسات.", "تنتقل الطلبية إلى مراجعة المواد."],
    "أ٤": ["مراجعة المواد", "اختر دور مشرف الإنتاج. راجع قائمة القص وشرح الحساب، ثم اعتمد المواد.", "تصبح الطلبية قيد الإنتاج وتتاح ورقة A4."],
    "أ٥–أ٦": ["قراءة ورقة التصنيع وتسجيل الإنتاج", "افتح ورقة A4 وراجع مواصفات القص. عُد إلى الطلبية واختر دور الإنتاج، ثم سجّل انتهاء التصنيع.", "تظهر حالة «منتجة» ويمكن قراءة ملاحظتك في السجل."],
    "أ٧": ["تسجيل التوريد", "اختر دور التوريد واضغط «تأكيد التوريد».", "تظهر حالة «تم التوريد» في الطلبية."],
    "ب١": ["التعرّف على سبب توقف الإصدار", "اقرأ التنبيه بجانب زر الإصدار وحدّد رقم البند والحقل المطلوب.", "يشير التنبيه إلى طول قص الماسورة في البند 1."],
    "ب٢": ["إرجاع الطلبية للتصحيح", "أعدها من مشرف الإنتاج إلى التنسيق الفني، ثم من التنسيق الفني إلى المبيعات، مع كتابة سبب الإرجاع.", "يظهر سببا الإرجاع في السجل ويمكن تعديل المسودة بدور المبيعات."],
    "ب٣": ["تصحيح المقاس وإعادة الاعتماد", "أدخل طول قص الماسورة 2495 ملم واحفظ المسودة وأرسلها. اعتمد المقاسات ثم المواد باستخدام الدور المناسب لكل خطوة.", "يختفي تنبيه طول الماسورة ويتفعّل الإصدار عند اكتمال البيانات."],
    "ب٤": ["مطابقة القص مع ملخص المخزن", "قارن شرح حساب المواد وورقة A4. سجّل الفرق بين طول القطعة الواحدة وإجمالي الطول.", "تظهر 6 قطع مجرى بطول 2200 ملم للقطعة، وإجمالي 13.20 مترًا."]
};

function initialCase(caseId) {
    const prepared = caseId === "B";
    return {
        stage: prepared ? 2 : 0,
        saved: prepared,
        role: prepared ? "supervisor" : "sales",
        data: {
            customer: prepared ? "sample" : "", kind: prepared ? "insulated" : "",
            installation: prepared ? "B" : "", doors: prepared ? 3 : 1,
            width: prepared ? 2600 : null, height: prepared ? 2400 : null,
            guideType: prepared ? "وسط" : "", guide: prepared ? 2200 : null, pipe: null,
            forehead: prepared ? 100 : null, slat: prepared ? 100 : null, cheek: prepared ? 35 : null,
            springType: prepared ? "1.2*60" : "", springs: prepared ? 2 : null, springLength: prepared ? 3200 : null,
            secondSpringType: prepared ? "1.3*60" : "", secondSprings: prepared ? 1 : null, notes: ""
        },
        approved: null,
        history: []
    };
}

function fabricationPlan(data) {
    const issues = [];
    if (data.installation === "D") issues.push("قاعدة العلاقة للتركيب الخارجي قيد التحقق.");
    let slats = null;
    if (data.forehead === null || !(data.slat > 0)) {
        issues.push("أدخل ارتفاع الجبهة وارتفاع الشريحة.");
    } else if (data.forehead >= data.height) {
        issues.push("ارتفاع الجبهة يجب أن يكون أقل من ارتفاع الباب.");
    } else {
        const ratio = (data.height - data.forehead) / data.slat;
        if (Math.abs(ratio - Math.round(ratio)) > 1e-9) issues.push("حساب الريش ينتج كسرًا، وقاعدة التقريب قيد التحقق.");
        else slats = Math.round(ratio);
    }
    if (!data.guideType) issues.push("اختر نوع المجرى.");
    if (!(data.guide > 0)) issues.push("أدخل طول قص المجرى الواحد بالملّيمتر.");
    if (!(data.pipe > 0)) issues.push("أدخل طول قص الماسورة بالملّيمتر.");
    if (!cheekSizes.includes(data.cheek)) issues.push("حدّد مقاس الخد أو اختر «لا يوجد».");
    const springCount = data.springs === null ? null : data.springs + (data.secondSprings ?? 0);
    if (springCount === null) issues.push("أدخل عدد الزنبركات، أو أدخل صفرًا إذا كان الباب بلا زنبرك.");
    if (springCount > 0 && !data.springType) issues.push("أدخل نوع الزنبرك الأول.");
    if (springCount > 0 && !(data.springLength > 0)) issues.push("أدخل طول الزنبرك بالملّيمتر.");
    const insulated = data.kind === "insulated";
    const rows = partNames.map((name, index) => {
        const id = index + 1;
        const lengths = [1, 2, 12, 13, 14, 26, 27];
        const byPart = {
            1: data.width, 2: data.width, 3: slats,
            4: insulated ? 0 : slats, 5: insulated && slats !== null ? slats * 2 : insulated ? null : 0,
            12: data.guide === null ? null : guidesPerDoor * data.guide,
            13: data.pipe, 14: springCount === 0 ? 0 : data.springLength,
            15: springCount, 16: data.installation === "D" ? null : springCount,
            17: data.installation === "D" ? null : 0, 18: springCount,
            19: 2, 20: 8, 21: 2, 22: 2, 23: 4, 24: 8, 25: 2, 26: data.width, 27: data.width
        };
        const perDoor = id >= 6 && id <= 11
            ? (data.cheek === null ? null : Number(data.cheek === 35 + 5 * (id - 6)))
            : byPart[id];
        return { id, name, perDoor, total: perDoor === null ? null : perDoor * data.doors, length: lengths.includes(id) };
    });
    return { issues, rows, guideCuts: data.guide > 0 ? data.doors * guidesPerDoor : null };
}
