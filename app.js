"use strict";

const app = document.querySelector("#app");
const announcement = document.querySelector("#announcement");
const params = new URLSearchParams(location.search);
if (params.get("mode") === "training") {
    params.set("mode", "guided");
    location.replace("?" + params.toString() + location.hash);
}
const alternateSession = params.get("mode") === "guided";
const storageKey = alternateSession ? "naseem-production-training-v1" : "naseem-production-review-v1";
const caseId = params.get("case") === "B" ? "B" : "A";
const scenario = scenarios[caseId];
const isSheet = params.get("view") === "sheet";
const fmt = new Intl.NumberFormat("en", { maximumFractionDigits: 3, useGrouping: false });
const meters = new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 6, useGrouping: false });
const cases = readCases();
let current = cases[caseId];
let notice = "";

function readCases() {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (saved?.A?.data && saved?.B?.data) return saved;
    } catch {}
    return { A: initialCase("A"), B: initialCase("B") };
}

function persist() {
    try {
        localStorage.setItem(storageKey, JSON.stringify(cases));
    } catch {}
}

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, character =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function number(value) {
    return value === null ? "—" : fmt.format(value);
}

const transitions = {
    submit: { from: 0, to: 1, role: "sales", label: "إرسال للمراجعة الفنية", done: "أُرسلت الطلبية للمراجعة الفنية." },
    technical: { from: 1, to: 2, role: "technical", label: "اعتماد المقاسات", done: "اعتُمدت المقاسات." },
    "technical-return": { from: 1, to: 0, role: "technical", label: "إرجاع إلى المبيعات", done: "أُعيدت الطلبية إلى المبيعات.", reason: true },
    release: { from: 2, to: 3, role: "supervisor", label: "اعتماد المواد وإصدار أمر تجريبي", done: "اعتُمدت المواد وأُصدرت ورقة التصنيع التجريبية." },
    "materials-return": { from: 2, to: 1, role: "supervisor", label: "إرجاع إلى التنسيق الفني", done: "أُعيدت الطلبية إلى التنسيق الفني.", reason: true },
    produce: { from: 3, to: 4, role: "production", label: "تسجيل انتهاء التصنيع", done: "سُجّل انتهاء التصنيع." },
    deliver: { from: 4, to: 5, role: "delivery", label: "تأكيد التوريد", done: "سُجّل توريد الطلبية." }
};
const nextActions = ["submit", "technical", "release", "produce", "deliver"];

function icon(type) {
    const paths = {
        factory: '<path d="M3 21V9l6 4V9l6 4V5h4l2 16H3Z"/><path d="M7 17h1m4 0h1m4 0h1"/>',
        print: '<path d="M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v7H6z"/><path d="M17 11h1"/>',
        doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7m-7 4h7"/>',
        arrow: '<path d="M19 12H5m6-6-6 6 6 6"/>',
        check: '<path d="m5 12 4 4L19 6"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths[type] + "</svg>";
}

function stepCode() {
    if (caseId === "A") {
        return current.stage === 0 ? (current.saved ? "أ٢" : "أ١")
            : ["", "أ٣", "أ٤", "أ٥–أ٦", "أ٧", "أ٧"][current.stage];
    }
    if (current.stage >= 3) return "ب٤";
    if (current.stage === 2) return current.history.length ? "ب٣" : "ب١";
    return current.stage === 1 && current.history.at(-1)?.action === "materials-return" ? "ب٢" : "ب٣";
}

function demoHref(id = caseId, view = "") {
    const link = new URLSearchParams({ case: id });
    if (alternateSession) link.set("mode", "guided");
    if (view) link.set("view", view);
    return "?" + esc(link.toString());
}

function guideHref(fragment = "") {
    return "./guide.html" + demoHref() + fragment;
}

function stepBrief() {
    if (caseId === "A" && current.stage === 5) {
        return `<aside class="step-brief" aria-label="نتيجة الحالة">
            <strong>اكتملت خطوات طلبية الباب الواحد</strong><p>راجع سجل التجربة، ثم انتقل إلى حالة الأبواب الثلاثة.</p>
            <a href="${demoHref("B")}">انتقل إلى الحالة ب</a></aside>`;
    }
    const [title, action, result] = stepInstructions[stepCode()];
    return `<aside class="step-brief" aria-label="إرشادات الخطوة">
        <h3>${title}</h3>
        <p>${action}</p><p><strong>النتيجة المتوقعة</strong> · ${result}</p>
        ${caseId === "A" && current.stage === 0 && !current.saved ? `<details><summary>بيانات المثال للإدخال</summary>
            <p>الزبون التجريبي، باب رول عادي، تركيب داخلي بدون شاشية (A). العرض 2600 والارتفاع 2400 ملم.</p>
            <p>مجرى وسط بطول 2200، ماسورة 2495، جبهة 100 وريشة 100 ملم، ومقاس الخد 35.</p>
            <p>نوع الزنبرك <bdi>1.2*60</bdi>، العدد 2 وطول الزنبرك 3200 ملم.</p></details>` : ""}
    </aside>`;
}

function shell(content) {
    return `<div class="shell">
        <aside class="sidebar">
            <a class="brand" href="./index.html"><span class="brand-icon">${icon("factory")}</span>
                <span><strong>النسيم</strong><small>تجربة برنامج الإنتاج</small></span></a>
            <nav class="nav" aria-label="حالات المراجعة">
                <span class="nav-caption">حالات التجربة</span>
                ${Object.entries(scenarios).map(([id, item]) => `<a class="nav-item" href="${demoHref(id)}" ${id === caseId ? 'aria-current="page"' : ""}>
                    <span class="nav-number">${id === "A" ? "أ" : "ب"}</span>${item.title}</a>`).join("")}
                <a class="nav-item guide-nav" href="${guideHref()}">${icon("doc")} الدليل المطبوع</a>
            </nav>
            <div class="sidebar-footer"><span class="status-dot"></span><span><strong>محاكاة لخطوات محددة</strong><small>بيانات تجريبية</small></span></div>
        </aside>
        <div class="workspace">
            <header class="topbar"><span>النسخة التجريبية</span>
                <a class="button small secondary" href="${guideHref()}">${icon("print")} افتح الدليل</a></header>
            <main id="main" class="content" tabindex="-1">${content}</main>
        </div>
    </div>`;
}

function options(list, selected) {
    return Object.entries(list).map(([key, label]) =>
        `<option value="${esc(key)}"${String(selected) === key ? " selected" : ""}>${esc(label)}</option>`).join("");
}

function withHelp(name, label, control) {
    return `<div class="help-field">
        <div class="help-label"><label for="field-${name}">${label}</label>
            <button class="help-button" type="button" aria-label="شرح ${label}" aria-expanded="false" aria-controls="help-${name}">؟</button></div>
        ${control}
        <span class="field-tooltip" role="tooltip" id="help-${name}">${fieldHelp[name]}</span>
    </div>`;
}

function fieldAttributes(name) {
    return `id="field-${name}" name="${name}" aria-describedby="help-${name}"`;
}

function pick(name, label, list, required = false) {
    return withHelp(name, label, `<select ${fieldAttributes(name)} ${required ? "required" : ""}>
        <option value="">اختر من القائمة</option>${options(list, current.data[name])}</select>`);
}

function numericField(name, label, { required = false, min = 0.001, max = 1000000, step = 0.001 } = {}) {
    return withHelp(name, label, `<input ${fieldAttributes(name)} type="number" dir="ltr" inputmode="${step === 1 ? "numeric" : "decimal"}"
        value="${esc(current.data[name])}" min="${min}" max="${max}" step="${step}" ${required ? "required" : ""}>`);
}

function springField(name, label) {
    const selected = current.data[name];
    const choices = selected && !Object.hasOwn(springTypes, selected)
        ? { ...springTypes, [selected]: selected }
        : springTypes;
    return pick(name, label, choices);
}

function editor() {
    return `<form id="draft-form">
        <p id="form-error" class="error" role="alert" hidden></p>
        <fieldset><legend>بيانات الطلبية</legend><div class="fields two">
            ${pick("customer", "الزبون", customers, true)}
            ${withHelp("notes", "ملاحظات الطلبية", `<textarea ${fieldAttributes("notes")} maxlength="1000" rows="2">${esc(current.data.notes)}</textarea>`)}
        </div></fieldset>
        <fieldset><legend>بند الباب</legend><div class="fields">
            ${pick("kind", "الصنف", doorKinds, true)}
            ${pick("installation", "نوع التركيب في فتحة الباب", installations, true)}
            ${caseId === "B" ? numericField("doors", "عدد الأبواب المتطابقة", { required: true, min: 1, max: 10000, step: 1 }) : ""}
            ${numericField("width", "عرض الباب (ملم)", { required: true })}
            ${numericField("height", "ارتفاع الباب (ملم)", { required: true })}
        </div>${caseId === "A" ? '<p class="fine">العدد في هذه الحالة باب واحد.</p>' : ""}</fieldset>
        <fieldset><legend>مقاسات القص وبيانات المواد</legend><div class="fields">
            ${pick("guideType", "نوع المجرى", Object.fromEntries(guideTypes.map(type => [type, type])))}
            ${numericField("guide", "طول قص المجرى (ملم)")}
            ${numericField("pipe", "طول قص الماسورة (ملم)")}
            ${numericField("forehead", "ارتفاع الجبهة (ملم)", { min: 0 })}
            ${numericField("slat", "ارتفاع الريشة (ملم)")}
            ${pick("cheek", "مقاس الخد", Object.fromEntries(cheekSizes.map(size => [size, size || "لا يوجد"])))}
            ${springField("springType", "نوع الزنبرك الأول")}
            ${numericField("springs", "عدد الزنبركات من النوع الأول لكل باب", { min: 0, max: 10000, step: 1 })}
            ${numericField("springLength", "طول الزنبرك (ملم)")}
        </div>
        <details class="optional-springs" ${current.data.secondSpringType || current.data.secondSprings ? "open" : ""}>
            <summary>إضافة نوع زنبرك ثانٍ (اختياري)</summary>
            <div class="fields two">
                ${springField("secondSpringType", "نوع الزنبرك الثاني")}
                ${numericField("secondSprings", "عدد الزنبركات من النوع الثاني لكل باب", { min: 1, max: 10000, step: 1 })}
            </div>
        </details></fieldset>
        <div class="actions">
            <button class="button ${current.saved ? "secondary" : "primary"}" type="submit">حفظ المسودة</button>
            ${current.saved ? '<button class="button primary" type="submit" value="send">إرسال للمراجعة الفنية</button>' : ""}
        </div>
        <p class="fine">يمكن حفظ المسودة قبل استكمال أطوال القص. تُراجع الحقول المطلوبة قبل إصدار أمر التصنيع.</p>
    </form>`;
}

function springText(data) {
    if (data.springs === null) return "—";
    if (data.springs === 0) return "لا يوجد";
    const first = `<bdi>${esc(data.springType || "النوع غير مسجّل")}</bdi> × <bdi>${data.springs}</bdi>`;
    return data.secondSprings
        ? first + `<br><bdi>${esc(data.secondSpringType)}</bdi> × <bdi>${data.secondSprings}</bdi>`
        : first;
}

function specs(data) {
    const entries = [
        ["الزبون", esc(customers[data.customer] || "—")], ["الصنف والتركيب", esc(doorKinds[data.kind] || "—") + " · " + esc(installations[data.installation] || "—")],
        ["عدد الأبواب", number(data.doors)], ["عرض الباب (ملم)", number(data.width)], ["ارتفاع الباب (ملم)", number(data.height)],
        ["نوع المجرى", esc(data.guideType || "—")], ["طول قص المجرى (ملم)", number(data.guide)], ["طول قص الماسورة (ملم)", number(data.pipe)],
        ["الزنبركات لكل باب", springText(data)], ["طول الزنبرك (ملم)", number(data.springLength)]
    ];
    return `<dl class="specs">${entries.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>`;
}

function materialTable(plan, stock = false) {
    const rows = stock ? plan.rows.filter(row => row.total > 0) : plan.rows;
    return `<div class="table-wrap" tabindex="0" aria-label="جدول كميات المواد"><table>
        <thead><tr><th scope="col">المادة</th><th scope="col">الوحدة</th>
        ${stock ? "" : '<th scope="col">لكل باب</th>'}<th scope="col">إجمالي البند</th></tr></thead>
        <tbody>${rows.map(row => `<tr data-part="${row.id}"><th scope="row">${row.name}</th>
            <td>${row.length ? (stock ? "متر" : "ملم") : "قطعة"}</td>
            ${stock ? "" : `<td class="numeric">${number(row.perDoor)}</td>`}
            <td class="numeric">${stock && row.length ? meters.format(row.total / 1000) : number(row.total)}</td></tr>`).join("")}</tbody>
    </table></div>`;
}

function materials(plan) {
    const data = current.data;
    return `${plan.issues.length ? `<div class="warning"><strong>بيانات مطلوبة قبل الإصدار</strong>
        <ul>${plan.issues.map(issue => `<li>البند 1 · ${issue}</li>`).join("")}</ul></div>` : ""}
        <div class="metric-row">
            <div><span>قائمة قص المجاري</span><strong>${plan.guideCuts ?? "—"} قطعة</strong><small>طول القطعة ${number(current.data.guide)} ملم</small></div>
            <div><span>إجمالي المجاري للمخزن</span><strong>${plan.guideCuts === null ? "—" : meters.format(plan.guideCuts * current.data.guide / 1000)} متر</strong><small>وفق الكمية التجريبية للبند</small></div>
            <div><span>طول قص الماسورة</span><strong>${number(current.data.pipe)} ملم</strong><small>من المقاس المدخل للبند</small></div>
        </div>
        <details class="materials-details calculation-details"><summary>كيف حُسبت الكمية؟</summary>
            ${plan.guideCuts === null ? '<p>يظهر حساب المجاري بعد إدخال طول قص المجرى.</p>' : `<p>عدد قطع المجاري = ${number(data.doors)} أبواب × ${guidesPerDoor} لكل باب = <strong>${plan.guideCuts} قطع</strong>.</p>
                <p>إجمالي طول المجاري = ${plan.guideCuts} × ${number(data.guide)} ملم ÷ 1000 = <strong>${meters.format(plan.guideCuts * data.guide / 1000)} متر</strong>.</p>`}
            ${data.pipe === null ? '<p>يظهر حساب إجمالي الماسورة بعد إدخال طول قصّها.</p>' : `<p>إجمالي طول الماسورة = ${number(data.doors)} × ${number(data.pipe)} ملم ÷ 1000 = <strong>${meters.format(data.doors * data.pipe / 1000)} متر</strong>.</p>`}
        </details>
        <details class="materials-details"><summary>عرض كميات القطع التجريبية</summary>
            <p class="fine">يحسب النموذج الكميات لكل باب. أساس الصرف الفعلي لكل مادة قيد المراجعة.</p>
            ${materialTable(plan)}</details>`;
}

function actionPanel(plan) {
    if (current.stage === 5) return "";
    const action = nextActions[current.stage];
    const next = transitions[action];
    if (current.role !== next.role) {
        return `<p class="callout">لتنفيذ الخطوة، اختر دور «${roles[next.role]}» من خانة الدور التجريبي.</p>`;
    }
    const returning = { 1: "technical-return", 2: "materials-return" }[current.stage];
    const blocked = action === "release" && plan.issues.length > 0;
    return `<form data-action="${action}" class="stage-action">
        ${action === "produce" ? '<label>ملاحظة الإنتاج<textarea name="reason" rows="2" maxlength="1000"></textarea></label>' : ""}
        <button class="button primary" type="submit" ${blocked ? 'disabled aria-describedby="release-blocked"' : ""}>${next.label}</button>
        ${blocked ? `<p class="blocked-reason" id="release-blocked">سبب التوقف في البند 1 · ${plan.issues.join(" ")}</p>` : ""}
        </form>
        ${returning ? `<details class="return-action"><summary>${transitions[returning].label}</summary>
            <form data-action="${returning}"><label>سبب الإرجاع<textarea name="reason" required rows="2" maxlength="1000"></textarea></label>
                <button class="button secondary" type="submit">تأكيد الإرجاع</button></form></details>` : ""}`;
}

function canPrint() {
    return current.stage >= 3 && ["supervisor", "production"].includes(current.role);
}

function review() {
    const plan = current.stage >= 3 ? current.approved : fabricationPlan(current.data);
    const editing = current.stage === 0 && current.role === "sales";
    const worksheetLink = canPrint() ? `<a class="button secondary" href="${demoHref(caseId, "sheet")}">${icon("doc")} فتح ورقة التصنيع A4</a>` : "";
    return shell(`
        <section class="intro"><div><p class="eyebrow">محاكاة مستقلة لخطوات مختارة</p>
            <h1>جرّب دورة طلبية الإنتاج</h1>
            <p>نفّذ الخطوات في الموقع وسجّل ملاحظتك بجانب كل خطوة في الدليل المطبوع.</p></div></section>
        <nav class="case-grid" aria-label="اختر حالة الاختبار">
            ${Object.entries(scenarios).map(([id, item]) => `<a class="case-card" href="${demoHref(id)}" ${id === caseId ? 'aria-current="page"' : ""}>
                <span class="case-mark">${id === "A" ? "أ" : "ب"}</span><span><strong>${item.title}</strong><small>${item.description}</small></span>${icon("arrow")}</a>`).join("")}
        </nav>
        <section class="panel order-panel" aria-labelledby="order-heading">
            <header class="panel-header"><div><div class="order-meta"><bdi>${scenario.order}</bdi><span class="badge">${stages[current.stage]}</span></div>
                <h2 id="order-heading" tabindex="-1">${scenario.title}</h2></div>
                <label class="role">الدور التجريبي<select id="role">${options(roles, current.role)}</select></label></header>
            <ol class="steps" aria-label="مراحل الطلبية">
                ${stages.map((stage, index) => `<li class="${index < current.stage ? "passed" : index === current.stage ? "active" : ""}" ${index === current.stage ? 'aria-current="step"' : ""}>
                    <span>${index < current.stage ? icon("check") : index + 1}</span>${stage}</li>`).join("")}
            </ol>
            <div class="panel-body">
                <p class="step-note"><span>خطوة الدليل</span><strong>${stepCode()}</strong><a href="${guideHref("#case-" + caseId)}">فتح الخطوات</a></p>
                ${stepBrief()}
                ${notice ? `<p class="success">${esc(notice)}</p>` : ""}
                ${editing ? editor() : specs(current.data)}
                ${current.stage >= 2 ? materials(plan) : ""}
                ${worksheetLink ? `<div class="actions sheet-action">${worksheetLink}</div>` : ""}
                ${editing ? "" : actionPanel(plan)}
            </div>
        </section>
        <section class="panel history" aria-labelledby="history-heading"><header class="panel-header"><div><h2 id="history-heading">سجل التجربة</h2></div>
            <button class="button secondary small" type="button" id="reset">إعادة ضبط هذه الحالة</button></header>
            <div class="panel-body">${current.history.length
                ? `<ol>${current.history.map(entry => `<li><strong>${esc(entry.label)}</strong> · ${roles[entry.role]}${entry.reason ? `<small>${esc(entry.reason)}</small>` : ""}</li>`).join("")}</ol>`
                : '<p class="fine">ستظهر هنا الإجراءات التي تنفّذها أثناء المراجعة.</p>'}</div>
        </section>`);
}

function worksheet() {
    const back = `<a class="button secondary" href="${demoHref()}">العودة إلى الحالة</a>`;
    if (!canPrint()) {
        return `<main id="main" class="sheet-page"><section class="panel panel-body"><h1>ورقة التصنيع A4</h1>
            <p>تتاح الورقة لمشرف الإنتاج أو دور الإنتاج بعد اعتماد المواد.</p><div class="actions">${back}</div></section></main>`;
    }
    const { data, approved } = current;
    return `<div class="sheet-page"><nav class="sheet-toolbar" aria-label="إجراءات الطباعة">${back}
        <button class="button primary" id="print" type="button">${icon("print")} طباعة A4</button></nav>
        <main id="main" class="sheet"><header class="print-header"><div><p class="eyebrow">شركة النسيم · قسم الإنتاج</p>
        <h1>ورقة تصنيع الطلبية <bdi>${scenario.order}</bdi></h1><p>مراجعة تجريبية · بند واحد</p></div>
        <span class="badge">اعتماد تجريبي</span></header>
        <section><h2>مواصفات الباب والقص</h2>${specs(data)}</section>
        <section><h2>قائمة قص المجاري</h2><p><strong>${approved.guideCuts}</strong> قطع، طول كل قطعة <bdi>${number(data.guide)}</bdi> ملم.</p></section>
        <section><h2>ملخص المواد للمخزن</h2>${materialTable(approved, true)}</section>
        ${data.notes ? `<section><h2>ملاحظات الطلبية</h2><p>${esc(data.notes)}</p></section>` : ""}
        </main></div>`;
}

function render(focus = false) {
    app.innerHTML = isSheet ? worksheet() : review();
    if (focus) document.querySelector("#order-heading")?.focus();
    announcement.textContent = notice;
}

function saveDraft(form) {
    if (current.role !== "sales" || current.stage !== 0) return false;
    const fields = new FormData(form);
    const numeric = new Set(["doors", "width", "height", "guide", "pipe", "forehead", "slat", "cheek", "springs", "springLength", "secondSprings"]);
    const data = Object.fromEntries([...fields].map(([name, value]) =>
        [name, numeric.has(name) ? (value === "" ? null : Number(value)) : value.trim()]));
    if (caseId === "A") data.doors = 1;
    let error = "";
    if (data.springType && !(data.springs > 0)) error = "أدخل كمية موجبة للنوع الأول.";
    if ((data.secondSprings !== null || data.secondSpringType) && (!data.secondSprings || !data.secondSpringType || !data.springType)) {
        error = "حدّد نوع الزنبرك الأول، ثم أدخل نوع الزنبرك الثاني وكميته معًا.";
    }
    if (error) {
        const message = form.querySelector("#form-error");
        message.hidden = false;
        message.textContent = error;
        return false;
    }
    current.data = data;
    current.saved = true;
    current.history.push({ label: "حفظ المسودة", role: current.role });
    notice = "حُفظت المسودة في هذا المتصفح.";
    persist();
    return true;
}

function move(action, reason = "") {
    const rule = transitions[action];
    if (!rule || current.stage !== rule.from || current.role !== rule.role || !current.saved) return;
    if (rule.reason && !reason) return;
    if (action === "release") {
        const plan = fabricationPlan(current.data);
        if (plan.issues.length) return;
        current.approved = plan;
    }
    current.stage = rule.to;
    current.history.push({ action, label: rule.label, role: current.role, reason });
    notice = rule.done;
    persist();
}

app.addEventListener("invalid", event => {
    const section = event.target.closest(".optional-springs");
    if (section) section.open = true;
}, true);

app.addEventListener("submit", event => {
    event.preventDefault();
    const form = event.target;
    if (form.id === "draft-form") {
        if (!saveDraft(form)) return;
        if (event.submitter?.value === "send") move("submit");
    } else if (form.dataset.action) {
        const reason = String(new FormData(form).get("reason") ?? "").trim();
        if (transitions[form.dataset.action]?.reason && !reason) {
            const field = form.querySelector("textarea");
            field.value = "";
            field.reportValidity();
            return;
        }
        move(form.dataset.action, reason);
    }
    render(true);
});

app.addEventListener("change", event => {
    if (event.target.id !== "role" || !Object.hasOwn(roles, event.target.value)) return;
    current.role = event.target.value;
    notice = "";
    persist();
    render();
    document.querySelector("#role").focus({ preventScroll: true });
});

app.addEventListener("click", event => {
    const help = event.target.closest(".help-button");
    if (help) {
        const field = help.closest(".help-field");
        const open = help.getAttribute("aria-expanded") !== "true";
        help.setAttribute("aria-expanded", String(open));
        field.toggleAttribute("data-help-open", open);
        field.toggleAttribute("data-help-dismissed", !open);
    }
    if (event.target.closest("#print")) window.print();
    if (event.target.closest("#reset") && window.confirm("هل تريد إعادة هذه الحالة إلى بدايتها؟")) {
        current = cases[caseId] = initialCase(caseId);
        notice = "عادت حالة المراجعة إلى بدايتها.";
        persist();
        render(true);
    }
});

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    const field = event.target.closest(".help-field") || app.querySelector(".help-field:hover");
    if (field) {
        field.removeAttribute("data-help-open");
        field.setAttribute("data-help-dismissed", "");
        field.querySelector(".help-button").setAttribute("aria-expanded", "false");
    }
});

for (const eventName of ["pointerout", "focusout"]) {
    app.addEventListener(eventName, event => {
        const field = event.target.closest(".help-field");
        if (field && !field.contains(event.relatedTarget)) field.removeAttribute("data-help-dismissed");
    });
}

render();
