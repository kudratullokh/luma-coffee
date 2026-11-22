// Siberian Wellness консультант боти — Cloudflare Workers учун (бепул тариф, карта керак эмас).
// Бир файл: Telegram webhook, D1 база, 3 тил, каталог (мини-апп) буюртмалари, саволлар, менежерлар группаси.
//
// Созлаш (Cloudflare сайтида):
//   1) Workers & Pages → Create → Worker → «Edit code» → шу кодни қўйинг → Deploy.
//   2) Storage & Databases → D1 → Create. Воркер → Settings → Bindings → Add → D1 database, Variable name: DB.
//   3) Воркер → Settings → Variables and Secrets: BOT_TOKEN ва SETUP_CODE (иккаласи ҳам Secret).
//   4) Воркер манзилини очинг, кодни ёзиб «Ботни улаш» тугмасини босинг.
// Ихтиёрий созламалар: MANAGERS_CHAT_ID, CONSULTANT_NAME, WORK_HOURS, CATALOG_URL, CLIENT_REF_LINK,
// BUSINESS_REF_LINK, APP_STORE_URL, GOOGLE_PLAY_URL, ENABLE_ORDERS (1/0).

const TEXTS = {"OZ":{"BTN_PRODUCTS":"Маҳсулотлар","BTN_CATALOG":"Каталог","BTN_DISCOUNT":"Кешбэк билан харид","BTN_ORDER":"Буюртма бериш","BTN_DELIVERY":"Етказиб бериш","BTN_BUSINESS":"Бизнес имконияти","BTN_CONSULTANT":"Консультант","BTN_LANG":"🌐 Тил · Язык","BTN_SEND_PHONE":"Рақамимни юбориш","BTN_SKIP":"Ўтказиб юбориш","BTN_YES":"Ҳа","BTN_NO":"Йўқ","CMD_START":"Бош меню","CMD_LANG":"Тилни ўзгартириш","LANG_SAVED":"Тайёр, энди ўзбекча гаплашамиз.","CATEGORIES":{"health":"Саломатлик","beauty":"Гўзаллик","parfum":"Парфюм","sport":"Спорт","other":"Бошқа"},"WELCOME":"Ассалому алайкум! Мен {name} — Siberian Wellness'нинг мустақил консультантиман.\nМаҳсулот танлашга ёрдам бераман ва кешбэк билан харид қилишни кўрсатаман. Нимадан бошлаймиз?","WELCOME_ANON":"Ассалому алайкум! Мен Siberian Wellness маҳсулотлари бўйича мустақил консультантман.\nМаҳсулот танлашга ёрдам бераман ва кешбэк билан харид қилишни кўрсатаман. Нимадан бошлаймиз?","CHOOSE_CATEGORY":"Қайси бўлим қизиқтиради?","HEALTH_NOTE":"Бу маҳсулотлар дори эмас. Касаллигингиз бўлса, шифокор билан маслаҳатлашинг.","CATEGORY_EMPTY":"Бу бўлимга маҳсулотлар тез орада қўшилади. Саволингиз бўлса, «Консультант» тугмасини босинг.","PRODUCT_CARD":"<b>{name}</b>\n{description}\n\nНарх: {price}\nБалл: {points}","CATEGORY_MORE":"Бу бўлимда яна {count} та маҳсулот бор.","CATEGORY_MORE_APP":"Бу бўлимда яна {count} та маҳсулот бор — ҳаммаси пастдаги «Каталог» тугмасида.","BTN_MORE":"Яна {count} та кўрсатиш","BTN_BUY_WITH_DISCOUNT":"Кешбэк билан олиш","BTN_HELP_CHOOSE":"Менга мосини танланг","CURRENCY":"сўм","HOURS":"соат {start}–{end} оралиғида","HOURS_ANY":"иш вақтида","DISCOUNT_INFO":"Рўйхатдан ўтиш бепул. Ойлик харидингиз 30 баллдан ошса 5%, 50 баллдан — 10%, 100 баллдан — 15% кешбэк оласиз.","DISCOUNT_STEPS":"1) «Рўйхатдан ўтиш» тугмасини босиб, маълумотларингизни киритинг.\n2) Кейин «Рўйхатдан ўтдим» тугмасини босинг.","REF_LINK_MISSING":"Рўйхатдан ўтиш ҳаволаси ҳали қўшилмаган. «Консультант» тугмасини босиб ёзинг — ёрдам берамиз.","BTN_REGISTER":"Рўйхатдан ўтиш","BTN_REGISTERED":"Рўйхатдан ўтдим","REGISTERED":"Табриклайман! Энди Buy Siberian иловасини юклаб, шу логин билан киринг. Иловани App Store ёки Google Play'дан «Buy Siberian» деб топасиз.\nБиринчи буюртмада ёрдам берамиз.","ASK_PHONE":"Консультант сиз билан боғланиши учун телефон рақамингизни юборинг (пастдаги тугма).","ASK_PHONE_AGAIN":"Пастдаги «Рақамимни юбориш» тугмасини босинг ёки рақамни +998... шаклида ёзинг.","THANKS_MENU":"Раҳмат! Бош меню пастда.","ASK_REMINDERS":"Ойида бир марта харид ҳақида эслатиб турайми?","REMINDERS_ON":"Яхши, ойида бир марта эслатаман.","REMINDERS_OFF":"Хўп, эслатма юборилмайди.","DELIVERY":"<b>Етказиб бериш</b>\nТошкент: 300 000 сўмдан бепул, камроқ бўлса 20 000 сўм.\nВилоятлар: 700 000 сўмдан бепул, камроқ бўлса 30 000 сўм.","BUSINESS":"Бизнес-партнёр ўз харидидан ва мижозлари харидидан кешбэк олади, жамоа ўсса — гуруҳ бонуси ҳам.\nДаромад сотув ҳажмига боғлиқ ва кафолатланмайди.","BTN_BIZ_TALK":"Батафсил суҳбат","BTN_BIZ_JOIN":"Партнёр бўламан","BIZ_TALK_ASK":"Исмингиз ва қулай вақтни ёзинг — маркетинг режани батафсил тушунтираман.","BIZ_TALK_DONE":"Раҳмат! Тез орада боғланаман.","BIZ_JOIN":"Бизнес-партнёр бўлиб рўйхатдан ўтиш учун тугмани босинг. Рўйхатдан ўтгач, бошланғич қўлланмани юбораман.","BIZ_JOIN_NO_LINK":"Ҳавола тез орада қўшилади — консультант ўзи боғланади.","BTN_BIZ_REGISTER":"Партнёр бўлиб рўйхатдан ўтиш","CONSULTANT_ASK":"Саволингизни ёзинг, {hours} жавоб берамиз.","ASK_ABOUT_PRODUCT":"«{product}» ҳақида саволингизни ёзинг, {hours} жавоб берамиз.","QUESTION_SENT":"Саволингиз консультантга юборилди. Жавоб шу ерга келади.","TEXT_PLEASE":"Илтимос, матн билан ёзинг.","ORDER_ASK_ITEMS":"Қайси маҳсулотлар ва нечтадан керак? Ёзиб юборинг.","ORDER_ASK_PHONE":"Телефон рақамингизни юборинг (пастдаги тугма).","ORDER_ASK_ADDRESS":"Етказиб бериш манзилини ёзинг: шаҳар ёки туман, кўча, уй.","ORDER_ASK_PAYMENT":"Қандай тўлайсиз?","PAYMENTS":{"click":"Click","payme":"Payme","cash":"Нақд"},"REGIONS":{"tashkent":"Тошкент","region":"вилоят"},"APP_ORDER_SUMMARY":"<b>Буюртмангиз:</b>\n{lines}\n\nМаҳсулотлар: {total} сўм, {points} балл\nЕтказиш ({region}): {delivery}\n<b>Жами: {grand} сўм</b>","APP_ORDER_LINE":"{name} × {qty} — {sum} сўм","APP_DELIVERY_FREE":"бепул","APP_ORDER_EMPTY":"Сават бўш экан. Каталогдан маҳсулот танланг.","ORDER_DONE":"Буюртмангиз қабул қилинди. Менежер тез орада боғланиб, нарх ва етказишни тасдиқлайди.","REMINDER":"Ассалому алайкум! Бу ойги харидингизни қилдингизми? Кетма-кет харидлар совға беради. Ёрдам керак бўлса, пастдаги тугмани босинг.","SOURCE_DIRECT":"тўғридан-тўғри","USER_LINE":"<a href=\"tg://user?id={user_id}\">{name}</a> {username}\nТел: {phone} · Манба: {source}","GROUP_REGISTERED":"<b>Янги мижоз рўйхатдан ўтди</b>\n{user}","GROUP_BIZ_TALK":"<b>Бизнес бўйича суҳбат сўради</b>\n{user}\nХабари: {text}","GROUP_BIZ_JOIN":"<b>Партнёр бўлиш ҳаволасини олди</b>\n{user}","GROUP_QUESTION":"<b>Савол</b>\n{user}","GROUP_ABOUT_PRODUCT":"Маҳсулот: {product}","GROUP_ORDER":"<b>Янги буюртма</b>\n{user}\nМаҳсулотлар:\n{items}\nМанзил: {address}\nТўлов: {payment}","APP_GROUP_TOTAL":"Жами: {grand} сўм ({points} балл), етказиш ({region}): {delivery}","GROUP_REPLY_HINT":"Жавоб бериш учун шу хабарга Reply қилиб ёзинг.","GROUP_LATE":"<i>Группа уланмаган пайтда келган ({when}):</i>","GROUP_QUESTION_TEXT":"Саволи: {text}","SETGROUP_FLUSHED":"Группа уланмаган пайтда келган {count} та ариза шу ерга юборилди.","STATS_PENDING":"<b>Группага етказилмаган: {count} та</b> — группа уланганда юборилади.","GROUP_REPLY_SENT":"Юборилди.","GROUP_USER_BLOCKED":"Юборилмади: мижоз ботни блоклаган.","CHAT_ID":"Бу чатнинг ID рақами: <code>{chat_id}</code>\nМенежерлар группаси бўлса, уни .env даги MANAGERS_CHAT_ID га ёзинг.","SETGROUP_DONE":"Шу группа менежерлар группаси бўлди. Энди буюртма ва саволлар шу ерга келади.\nГруппа ID: <code>{chat_id}</code>","SETGROUP_WRONG":"Код нотўғри.","GROUP_HELLO":"Салом! Буюртма ва саволлар шу группага келиши учун бу ерга /setgroup КОД деб ёзинг.\nЁки менга шахсий чатда /setgroup КОД деб ёзиб, шу группани танланг — бу доим ишлайди.","GROUP_ADMIN_OK":"Раҳмат, энди мен админман. Бу группани менежерлар группаси қилиш учун /setgroup КОД деб ёзинг.","SETGROUP_PRIVATE":"Группани улаш учун шу ерга /setgroup КОД деб ёзинг (КОД — созлашдаги SETUP_CODE).","SETGROUP_PICK":"Код тўғри. Энди пастдаги «👥 Группани танлаш» тугмасини босиб, буюртма ва саволлар келадиган группани танланг. Рўйхатда фақат бот қўшилган группалар чиқади.","SETGROUP_BTN_PICK":"👥 Группани танлаш","SETGROUP_LINKED":"Тайёр: «{title}» менежерлар группаси бўлди. Энди буюртма ва саволлар ўша ерга келади.\nГруппа ID: <code>{chat_id}</code>","SETGROUP_CANT_POST":"«{title}» группасига ёза олмадим. Ботни шу группага қўшинг ва яна /setgroup КОД деб ёзинг.","SETGROUP_AGAIN":"Группани улаш учун аввал /setgroup КОД деб ёзинг.","SETGROUP_LIMIT":"Код кўп марта нотўғри ёзилди. Бир соатдан кейин қайта уриниб кўринг.","STATS_TOTAL":"<b>Ботга кирганлар: {users} киши</b>\nБугун: {today} · Охирги 7 кунда: {week}\n«Рўйхатдан ўтдим» деганлар: {registered} · Буюртма: {orders} · Бизнес: {business} · Савол: {questions}","STATS_SINCE":"<i>Ҳисоб {since} дан бери юритиляпти.</i>","STATS_TITLE":"Манба бўйича (қаердан келгани)","STATS_PRIVATE_HINT":"Статистика менежерлар группасида: /stats деб ёзинг.\nШу ерда кўриш учун: /stats КОД (КОД — группани улашда ёзилган рақам).","STATS_LINE":"{source} — {users} киши: {registered} рўйхат, {orders} буюртма, {business} бизнес, {questions} савол","STATS_EMPTY":"Ҳали ҳеч ким келмаган.","REMINDERS_SENT":"Эслатма юборилди: {sent} та ({total} тадан).","PRODUCTS_RELOADED":"Маҳсулотлар янгиланди: {count} та.","PRODUCTS_ERROR":"products.json да хато бор, эски рўйхат қолди: {error}"},"RU":{"BTN_PRODUCTS":"Продукция","BTN_CATALOG":"Каталог","BTN_DISCOUNT":"Покупка с кэшбэком","BTN_ORDER":"Оформить заказ","BTN_DELIVERY":"Доставка","BTN_BUSINESS":"Бизнес-возможность","BTN_CONSULTANT":"Консультант","BTN_LANG":"🌐 Язык · Til","BTN_SEND_PHONE":"Отправить мой номер","BTN_SKIP":"Пропустить","BTN_YES":"Да","BTN_NO":"Нет","CMD_START":"Главное меню","CMD_LANG":"Сменить язык","LANG_SAVED":"Готово, теперь общаемся на русском.","CATEGORIES":{"health":"Здоровье","beauty":"Красота","parfum":"Парфюмерия","sport":"Спорт","other":"Другое"},"WELCOME":"Здравствуйте! Я {name} — независимый консультант Siberian Wellness.\nПомогу выбрать продукцию и покажу, как покупать с кэшбэком. С чего начнём?","WELCOME_ANON":"Здравствуйте! Я независимый консультант по продукции Siberian Wellness.\nПомогу выбрать продукцию и покажу, как покупать с кэшбэком. С чего начнём?","CHOOSE_CATEGORY":"Какой раздел вас интересует?","HEALTH_NOTE":"Эта продукция не является лекарством. Если у вас есть заболевание, посоветуйтесь с врачом.","CATEGORY_EMPTY":"Товары в этот раздел скоро добавим. Если есть вопрос, нажмите «Консультант».","PRODUCT_CARD":"<b>{name}</b>\n{description}\n\nЦена: {price}\nБаллы: {points}","CATEGORY_MORE":"В этом разделе есть ещё товары: {count}.","CATEGORY_MORE_APP":"В этом разделе есть ещё товары: {count}. Все они — в кнопке «Каталог» внизу.","BTN_MORE":"Показать ещё {count}","BTN_BUY_WITH_DISCOUNT":"Купить с кэшбэком","BTN_HELP_CHOOSE":"Подберите мне","CURRENCY":"сум","HOURS":"с {start} до {end}","HOURS_ANY":"в рабочее время","DISCOUNT_INFO":"Регистрация бесплатная. Если покупки за месяц превысят 30 баллов, вы получаете кэшбэк 5%, от 50 баллов — 10%, от 100 баллов — 15%.","DISCOUNT_STEPS":"1) Нажмите «Зарегистрироваться» и заполните данные.\n2) Затем нажмите «Я зарегистрировался».","REF_LINK_MISSING":"Ссылку для регистрации ещё не добавили. Нажмите «Консультант» и напишите — поможем.","BTN_REGISTER":"Зарегистрироваться","BTN_REGISTERED":"Я зарегистрировался","REGISTERED":"Поздравляю! Теперь скачайте приложение Buy Siberian и войдите с этим логином. Оно есть в App Store и Google Play по запросу «Buy Siberian».\nС первым заказом поможем.","ASK_PHONE":"Отправьте номер телефона, чтобы консультант мог с вами связаться (кнопка внизу).","ASK_PHONE_AGAIN":"Нажмите кнопку «Отправить мой номер» внизу или напишите номер в формате +998...","THANKS_MENU":"Спасибо! Главное меню — внизу.","ASK_REMINDERS":"Напоминать раз в месяц о покупке?","REMINDERS_ON":"Хорошо, буду напоминать раз в месяц.","REMINDERS_OFF":"Хорошо, напоминаний не будет.","DELIVERY":"<b>Доставка</b>\nТашкент: бесплатно от 300 000 сум, при меньшей сумме — 20 000 сум.\nРегионы: бесплатно от 700 000 сум, при меньшей сумме — 30 000 сум.","BUSINESS":"Бизнес-партнёр получает кэшбэк со своих покупок и с покупок своих клиентов, а когда команда растёт — ещё и групповой бонус.\nДоход зависит от объёма продаж и не гарантируется.","BTN_BIZ_TALK":"Подробная беседа","BTN_BIZ_JOIN":"Стать партнёром","BIZ_TALK_ASK":"Напишите ваше имя и удобное время — подробно расскажу о маркетинг-плане.","BIZ_TALK_DONE":"Спасибо! Скоро свяжусь с вами.","BIZ_JOIN":"Чтобы зарегистрироваться бизнес-партнёром, нажмите кнопку. После регистрации пришлю стартовое руководство.","BIZ_JOIN_NO_LINK":"Ссылку скоро добавим — консультант свяжется с вами сам.","BTN_BIZ_REGISTER":"Зарегистрироваться партнёром","CONSULTANT_ASK":"Напишите ваш вопрос, ответим {hours}.","ASK_ABOUT_PRODUCT":"Напишите ваш вопрос о «{product}», ответим {hours}.","QUESTION_SENT":"Ваш вопрос отправлен консультанту. Ответ придёт сюда.","TEXT_PLEASE":"Пожалуйста, напишите текстом.","ORDER_ASK_ITEMS":"Какие товары и сколько нужно? Напишите.","ORDER_ASK_PHONE":"Отправьте номер телефона (кнопка внизу).","ORDER_ASK_ADDRESS":"Напишите адрес доставки: город или район, улица, дом.","ORDER_ASK_PAYMENT":"Как будете оплачивать?","PAYMENTS":{"click":"Click","payme":"Payme","cash":"Наличными"},"REGIONS":{"tashkent":"Ташкент","region":"регион"},"APP_ORDER_SUMMARY":"<b>Ваш заказ:</b>\n{lines}\n\nТовары: {total} сум, баллы: {points}\nДоставка ({region}): {delivery}\n<b>Итого: {grand} сум</b>","APP_ORDER_LINE":"{name} × {qty} — {sum} сум","APP_DELIVERY_FREE":"бесплатно","APP_ORDER_EMPTY":"Корзина пуста. Выберите товары в каталоге.","ORDER_DONE":"Ваш заказ принят. Менеджер скоро свяжется с вами, чтобы подтвердить цену и доставку.","REMINDER":"Здравствуйте! Вы уже сделали покупку в этом месяце? Покупки месяц за месяцем приносят подарки. Если нужна помощь, нажмите кнопку ниже."}};
const VERSION = "202611221255";

const EXTRA_OZ = {
  REMINDERS_SENT_MORE: "Ҳаммасига бирданига юбориб бўлмайди: давом эттириш учун яна /eslatma деб ёзинг.",
};
const OZ = Object.assign({}, TEXTS.OZ, EXTRA_OZ);
const RU = TEXTS.RU;

const DEFAULTS = {
  CATALOG_URL: "https://kudratullokh.github.io/luma-coffee/siberian/",
  CLIENT_REF_LINK: "https://uz.siberianhealth.com/ru/shop/user/registration/PRIVILEGED_CLIENT/?referral=2626230330",
  BUSINESS_REF_LINK: "https://uz.siberianhealth.com/ru/shop/user/registration/CONSULTANT/?referral=2626230330",
  WORK_HOURS: "соат 9:00–21:00 оралиғида",
  APP_STORE_URL: "https://apps.apple.com/app/id1095272878",
  GOOGLE_PLAY_URL: "",
  CONSULTANT_NAME: "",
  ENABLE_ORDERS: "1",
  MANAGERS_CHAT_ID: "",
  TELEGRAM_API_URL: "https://api.telegram.org",
};

function config(env) {
  const get = (key) => {
    const value = env[key];
    return typeof value === "string" && value.trim() ? value.trim() : DEFAULTS[key] ?? "";
  };
  let catalog = get("CATALOG_URL");
  if (!catalog.endsWith("/")) catalog += "/";
  return {
    token: String(env.BOT_TOKEN || "").trim(),
    setupCode: String(env.SETUP_CODE || "").trim(),
    catalog,
    clientRef: get("CLIENT_REF_LINK"),
    businessRef: get("BUSINESS_REF_LINK"),
    workHours: get("WORK_HOURS"),
    appStore: get("APP_STORE_URL"),
    googlePlay: get("GOOGLE_PLAY_URL"),
    consultantName: get("CONSULTANT_NAME"),
    enableOrders: get("ENABLE_ORDERS") === "1",
    managersDefault: Number(get("MANAGERS_CHAT_ID")) || 0,
    api: get("TELEGRAM_API_URL").replace(/\/+$/, ""),
  };
}

// --- Тиллар: uz — лотин, oz — кирилл, ru — рус -----------------------------

const LANGS = ["uz", "oz", "ru"];
const DEFAULT_LANG = "oz";
const LANG_NAMES = { uz: "Oʻzbekcha", oz: "Ўзбекча", ru: "Русский" };
const LANG_PICK = "Tilni tanlang · Тилни танланг · Выберите язык";
// Шу билан бошланадиган матнлар группа/админ учун — доим ўзбекча (кирилл)
const ADMIN = ["GROUP_", "SETGROUP_", "STATS_", "CHAT_ID", "SOURCE_DIRECT", "USER_LINE", "REMINDERS_SENT",
  "PRODUCTS_", "APP_GROUP_TOTAL"];
const LATIN_OVERRIDES = { BTN_LANG: "🌐 Til · Язык" };
const LAT = {
  "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "ё": "yo", "ж": "j", "з": "z", "и": "i", "й": "y", "к": "k",
  "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "x",
  "ц": "s", "ч": "ch", "ш": "sh", "щ": "sh", "ъ": "ʼ", "ы": "i", "ь": "", "э": "e", "ю": "yu", "я": "ya", "ў": "oʻ",
  "қ": "q", "ғ": "gʻ", "ҳ": "h",
};
const isLetter = (c) => !!c && /\p{L}/u.test(c);
const isUpper = (c) => isLetter(c) && c !== c.toLowerCase();
const isLower = (c) => isLetter(c) && c !== c.toUpperCase();

function toLatin(value) {
  const chars = Array.from(value);
  return chars.map((ch, i) => {
    const low = ch.toLowerCase();
    const prev = chars[i - 1] || "";
    const next = chars[i + 1] || "";
    let lat;
    if (low === "е") {
      const wordStart = !prev || !(isLetter(prev) || "ʼ'".includes(prev));
      lat = wordStart || "аеёиоуэюяўъь".includes(prev.toLowerCase()) ? "ye" : "e";
    } else if (low in LAT) {
      lat = LAT[low];
    } else {
      return ch;
    }
    if (ch !== low && lat) {
      const caps = isUpper(next) || (isUpper(prev) && !isLower(next));
      lat = caps ? lat.toUpperCase() : lat[0].toUpperCase() + lat.slice(1);
    }
    return lat;
  }).join("");
}

const latinCache = new Map();
function latin(key) {
  if (key in LATIN_OVERRIDES) return LATIN_OVERRIDES[key];
  if (!latinCache.has(key)) {
    const value = OZ[key];
    latinCache.set(key, typeof value === "string" ? toLatin(value)
      : Object.fromEntries(Object.entries(value).map(([k, v]) => [k, typeof v === "string" ? toLatin(v) : v])));
  }
  return latinCache.get(key);
}

function text(lang, key) {
  const base = OZ[key];
  if (base === undefined) throw new Error(`Матн йўқ: ${key}`);
  if (lang === "oz" || ADMIN.some((prefix) => key.startsWith(prefix))) return base;
  if (lang === "ru") return key in RU ? RU[key] : base;
  return latin(key);
}

const variantCache = new Map();
function variants(key) {  // тугманинг ҳамма тилдаги ёзуви (эски клавиатура бошқа тилда бўлса ҳам ишласин)
  if (!variantCache.has(key)) variantCache.set(key, new Set(LANGS.map((lang) => text(lang, key))));
  return variantCache.get(key);
}
const fmt = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? String(vars[k]) : m));

function langFromCode(code) {
  code = String(code || "").toLowerCase();
  if (code.startsWith("ru")) return "ru";
  if (code.startsWith("uz")) return "uz";
  return DEFAULT_LANG;
}

// --- Ёрдамчилар -------------------------------------------------------------

const SOURCE_RE = /^[A-Za-z0-9_-]{1,64}$/;
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;
const HOURS_RE = /(\d{1,2}[:.]\d{2})\s*[–—-]\s*(\d{1,2}[:.]\d{2})/;
const DELIVERY_RULES = { tashkent: [300000, 20000], region: [700000, 30000] };
const GROUP_REQUEST_ID = 1;
const SETGROUP_WINDOW = 600_000;
const SETGROUP_MAX_FAILS = 5;
const OUTBOX_BATCH = 10;
const REMINDER_BATCH = 20;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);

function money(value) {
  const n = Number(value);
  if (value === null || value === undefined || value === "" || !Number.isFinite(n)) return String(value ?? "");
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function pointsText(value) {
  const n = Number(value);
  if (value === null || value === undefined || value === "" || !Number.isFinite(n)) return String(value ?? "");
  return String(Math.round(n * 10) / 10).replace(".", ",");
}

const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");

function tashkentParts(iso) {
  const d = new Date(new Date(iso).getTime() + 5 * 3600_000);
  const p = (n) => String(n).padStart(2, "0");
  return { day: p(d.getUTCDate()), month: p(d.getUTCMonth() + 1), year: d.getUTCFullYear(),
    hour: p(d.getUTCHours()), minute: p(d.getUTCMinutes()) };
}

const fullName = (user) => [user.first_name, user.last_name].filter(Boolean).join(" ");

async function sha256hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const webhookSecret = async (token) => (await sha256hex(`siberian:${token}`)).slice(0, 48);

// --- База (Cloudflare D1, SQLite) -------------------------------------------

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY, first_name TEXT, username TEXT, source TEXT,
    phone TEXT, registered INTEGER NOT NULL DEFAULT 0, reminders INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
    lang TEXT)`,
  `CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, kind TEXT NOT NULL,
    details TEXT, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS relay (group_message_id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, text TEXT NOT NULL,
    created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)`,
  `CREATE TABLE IF NOT EXISTS states (chat_id INTEGER PRIMARY KEY, state TEXT, data TEXT, updated_at TEXT)`,
];
let schemaReady = false;

async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch([...SCHEMA.map((sql) => db.prepare(sql)),
    db.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('started_at', ?)").bind(nowIso())]);
  schemaReady = true;
}

// --- Маҳсулотлар (каталог сайтидаги products.json) ------------------------

let productCache = null;
let productCacheAt = 0;

async function loadProducts(cfg, fresh = false) {
  if (!fresh && productCache && Date.now() - productCacheAt < 600_000) return productCache;
  const response = await fetch(`${cfg.catalog}products.json${fresh ? `?t=${Date.now()}` : ""}`);
  if (!response.ok) throw new Error(`products.json: HTTP ${response.status}`);
  const data = await response.json();
  const list = Array.isArray(data.products) ? data.products : [];
  productCache = new Map(list.map((item) => [String(item.id), item]));
  productCacheAt = Date.now();
  return productCache;
}

// --- Telegram ---------------------------------------------------------------

class TgError extends Error {
  constructor(method, data) {
    super(`${method}: ${data.description || "Telegram хатоси"}`);
    this.code = data.error_code || 0;
    this.params = data.parameters || {};
  }
  get forbidden() { return this.code === 403; }
  get migrateTo() { return this.params.migrate_to_chat_id || 0; }
}

class Bot {
  constructor(env, cfg) {
    this.env = env;
    this.cfg = cfg;
    this.db = env.DB;
    this.lang = DEFAULT_LANG;
    this.storedLang = null;
    this._managers = undefined;
  }

  T(key, vars) { const s = text(this.lang, key); return vars ? fmt(s, vars) : s; }
  UZ(key, vars) { const s = text("oz", key); return vars ? fmt(s, vars) : s; }

  async api(method, params = {}) {
    const response = await fetch(`${this.cfg.api}/bot${this.cfg.token}/${method}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(params),
    });
    let data;
    try { data = await response.json(); } catch { data = { ok: false, error_code: response.status }; }
    if (!data.ok) throw new TgError(method, data);
    return data.result;
  }

  send(chat, body, extra = {}) {
    return this.api("sendMessage", { chat_id: chat, text: body, parse_mode: "HTML", ...extra });
  }

  reply(message, body, extra = {}) {
    return this.send(message.chat.id, body,
      { reply_parameters: { message_id: message.message_id, allow_sending_without_reply: true }, ...extra });
  }

  // --- база ---
  one(sql, ...args) { return this.db.prepare(sql).bind(...args).first(); }
  run(sql, ...args) { return this.db.prepare(sql).bind(...args).run(); }
  async all(sql, ...args) { return (await this.db.prepare(sql).bind(...args).all()).results || []; }

  async meta(key) { const row = await this.one("SELECT value FROM meta WHERE key = ?", key); return row ? row.value : null; }
  setMeta(key, value) { return this.run("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", key, String(value)); }
  delMeta(key) { return this.run("DELETE FROM meta WHERE key = ?", key); }

  async managers() {
    if (this._managers === undefined) this._managers = Number(await this.meta("managers_chat_id")) || this.cfg.managersDefault;
    return this._managers;
  }
  async setManagers(chatId) { this._managers = chatId; await this.setMeta("managers_chat_id", chatId); }

  async touchUser(user, source = null) {
    await this.run(
      `INSERT INTO users (user_id, first_name, username, source, created_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET first_name = excluded.first_name, username = excluded.username,
       source = COALESCE(users.source, excluded.source)`,
      user.id, fullName(user), user.username || null, source, nowIso());
  }
  getUser(id) { return this.one("SELECT * FROM users WHERE user_id = ?", id); }
  setLang(id, lang) { return this.run("UPDATE users SET lang = ? WHERE user_id = ?", lang, id); }
  setPhone(id, phone) { return this.run("UPDATE users SET phone = ? WHERE user_id = ?", phone, id); }
  async setRegistered(id) {
    const result = await this.run("UPDATE users SET registered = 1 WHERE user_id = ? AND registered = 0", id);
    return (result.meta?.changes || 0) > 0;
  }
  setReminders(id, on) { return this.run("UPDATE users SET reminders = ? WHERE user_id = ?", on ? 1 : 0, id); }
  addLead(id, kind, details = "") {
    return this.run("INSERT INTO leads (user_id, kind, details, created_at) VALUES (?, ?, ?, ?)", id, kind, details, nowIso());
  }
  saveRelay(messageId, userId) {
    return this.run("INSERT OR REPLACE INTO relay (group_message_id, user_id) VALUES (?, ?)", messageId, userId);
  }
  async relayUser(messageId) {
    const row = await this.one("SELECT user_id FROM relay WHERE group_message_id = ?", messageId);
    return row ? row.user_id : null;
  }

  async getState(chatId) {
    const row = await this.one("SELECT state, data FROM states WHERE chat_id = ?", chatId);
    return row ? { state: row.state, data: JSON.parse(row.data || "{}") } : { state: null, data: {} };
  }
  setState(chatId, state, data = {}) {
    return this.run("INSERT OR REPLACE INTO states (chat_id, state, data, updated_at) VALUES (?, ?, ?, ?)",
      chatId, state, JSON.stringify(data), nowIso());
  }
  clearState(chatId) { return this.run("DELETE FROM states WHERE chat_id = ?", chatId); }

  // --- клавиатуралар ---
  catalogUrl() {
    const query = new URLSearchParams();
    query.set("v", VERSION);
    query.set("lang", this.lang);
    if (this.cfg.clientRef) query.set("ref", this.cfg.clientRef);
    return `${this.cfg.catalog}?${query}`;
  }

  mainMenu() {
    const rows = [[{ text: this.T("BTN_CATALOG"), web_app: { url: this.catalogUrl() } }, { text: this.T("BTN_DISCOUNT") }]];
    rows.push(this.cfg.enableOrders ? [{ text: this.T("BTN_ORDER") }, { text: this.T("BTN_DELIVERY") }]
      : [{ text: this.T("BTN_DELIVERY") }]);
    rows.push([{ text: this.T("BTN_BUSINESS") }, { text: this.T("BTN_CONSULTANT") }]);
    rows.push([{ text: this.T("BTN_LANG") }]);
    return { keyboard: rows, resize_keyboard: true };
  }

  phoneKeyboard(allowSkip) {
    const rows = [[{ text: this.T("BTN_SEND_PHONE"), request_contact: true }]];
    if (allowSkip) rows.push([{ text: this.T("BTN_SKIP") }]);
    return { keyboard: rows, resize_keyboard: true, one_time_keyboard: true };
  }

  hoursText() {
    const found = HOURS_RE.exec(this.cfg.workHours || "");
    if (found) return this.T("HOURS", { start: found[1], end: found[2] });
    if (this.lang === "ru") return this.T("HOURS_ANY");
    const raw = esc(this.cfg.workHours || this.T("HOURS_ANY"));
    return this.lang === "uz" ? toLatin(raw) : raw;
  }

  welcomeText() {
    return this.cfg.consultantName ? this.T("WELCOME", { name: esc(this.cfg.consultantName) }) : this.T("WELCOME_ANON");
  }

  async describeUser(user) {
    const row = await this.getUser(user.id);
    return this.UZ("USER_LINE", {
      user_id: user.id,
      name: esc(fullName(user)),
      username: user.username ? `@${user.username}` : "",
      phone: esc(row && row.phone ? row.phone : "—"),
      source: esc(row && row.source ? row.source : this.UZ("SOURCE_DIRECT")),
    });
  }

  // --- менежерлар группаси ---
  async toManagers(send) {
    try {
      return await send(await this.managers());
    } catch (error) {
      if (error instanceof TgError && error.migrateTo) {  // группа супергруппага айланган — ID ўзгарган
        await this.setManagers(error.migrateTo);
        return await send(error.migrateTo);
      }
      throw error;
    }
  }

  async notifyManagers(userId, body, queuedText = null) {
    if (!(await this.managers())) {
      await this.run("INSERT INTO outbox (user_id, text, created_at) VALUES (?, ?, ?)", userId, queuedText || body, nowIso());
      return false;
    }
    let sent;
    try {
      sent = await this.toManagers((chat) => this.send(chat, `${body}\n\n<i>${this.UZ("GROUP_REPLY_HINT")}</i>`));
    } catch (error) {
      console.error("Группага юбориб бўлмади:", error.message);
      await this.run("INSERT INTO outbox (user_id, text, created_at) VALUES (?, ?, ?)", userId, queuedText || body, nowIso());
      return false;
    }
    await this.saveRelay(sent.message_id, userId);
    await this.flushOutbox();
    return true;
  }

  async flushOutbox() {
    if (!(await this.managers())) return 0;
    const items = await this.all("SELECT * FROM outbox ORDER BY id LIMIT ?", OUTBOX_BATCH);
    const done = [];
    for (const item of items) {
      const when = tashkentParts(item.created_at);
      const body = `${this.UZ("GROUP_LATE", { when: `${when.day}.${when.month} ${when.hour}:${when.minute}` })}\n${item.text}`
        + `\n\n<i>${this.UZ("GROUP_REPLY_HINT")}</i>`;
      let sent;
      try {
        sent = await this.toManagers((chat) => this.send(chat, body));
      } catch (error) {
        console.error("Навбатдаги аризани юбориб бўлмади:", error.message);
        break;
      }
      done.push(this.db.prepare("INSERT OR REPLACE INTO relay (group_message_id, user_id) VALUES (?, ?)")
        .bind(sent.message_id, item.user_id));
      done.push(this.db.prepare("DELETE FROM outbox WHERE id = ?").bind(item.id));
    }
    if (done.length) await this.db.batch(done);
    return done.length / 2;
  }

  async dropButtons(query) {
    if (!query.message) return;
    try {
      await this.api("editMessageReplyMarkup", { chat_id: query.message.chat.id, message_id: query.message.message_id });
    } catch { /* эски хабар — муҳим эмас */ }
  }
}

// --- Бот мантиғи --------------------------------------------------------------

async function sendDiscount(b, chatId) {
  if (b.cfg.clientRef) {
    await b.send(chatId, `${b.T("DISCOUNT_INFO")}\n\n${b.T("DISCOUNT_STEPS")}`, { reply_markup: { inline_keyboard: [
      [{ text: b.T("BTN_REGISTER"), url: b.cfg.clientRef }],
      [{ text: b.T("BTN_REGISTERED"), callback_data: "registered" }],
    ] } });
  } else {
    await b.send(chatId, `${b.T("DISCOUNT_INFO")}\n\n${b.T("REF_LINK_MISSING")}`);
  }
}

async function startOrder(b, chatId) {
  await b.setState(chatId, "order_items");
  await b.send(chatId, b.T("ORDER_ASK_ITEMS"), { reply_markup: b.mainMenu() });
}

async function finishRegistration(b, user) {
  const { data } = await b.getState(user.id);
  await b.clearState(user.id);
  if (data.first_time) {
    await b.addLead(user.id, "register");
    await b.notifyManagers(user.id, b.UZ("GROUP_REGISTERED", { user: await b.describeUser(user) }));
  }
  await b.send(user.id, b.T("THANKS_MENU"), { reply_markup: b.mainMenu() });
  await b.send(user.id, b.T("ASK_REMINDERS"), { reply_markup: { inline_keyboard: [[
    { text: b.T("BTN_YES"), callback_data: "rem:1" }, { text: b.T("BTN_NO"), callback_data: "rem:0" }]] } });
}

async function relayQuestion(b, message, product) {
  const user = message.from;
  await b.touchUser(user);
  const body = message.text || message.caption || "";
  await b.addLead(user.id, "question", body.slice(0, 1000));
  let header = b.UZ("GROUP_QUESTION", { user: await b.describeUser(user) });
  if (product) header += "\n" + b.UZ("GROUP_ABOUT_PRODUCT", { product: esc(product) });
  const question = esc(body || "(расм ёки файл)");
  const delivered = await b.notifyManagers(user.id, header,
    `${header}\n${b.UZ("GROUP_QUESTION_TEXT", { text: question })}`);
  if (delivered) {
    try {
      const copied = await b.toManagers((chat) => b.api("copyMessage",
        { chat_id: chat, from_chat_id: message.chat.id, message_id: message.message_id }));
      await b.saveRelay(copied.message_id, user.id);
    } catch (error) {
      console.error("Саволни группага нусхалаб бўлмади:", error.message);
    }
  }
  await b.send(message.chat.id, b.T("QUESTION_SENT"), { reply_markup: b.mainMenu() });
}

function reminderKeyboard(b) {
  const rows = [];
  if (b.cfg.enableOrders) rows.push([{ text: b.T("BTN_ORDER"), callback_data: "order" }]);
  rows.push([{ text: b.T("BTN_CONSULTANT"), callback_data: "consult" }]);
  return { inline_keyboard: rows };
}

function paymentKeyboard(b) {
  return { inline_keyboard: [Object.entries(b.T("PAYMENTS")).map(([key, title]) => ({ text: title, callback_data: `pay:${key}` }))] };
}

function langKeyboard() {
  return { inline_keyboard: [LANGS.map((lang) => ({ text: LANG_NAMES[lang], callback_data: `lang:${lang}` }))] };
}

async function checkCode(b, userId, args) {
  const now = Date.now();
  const key = `setgroup_fails:${userId}`;
  const fails = JSON.parse((await b.meta(key)) || "[]").filter((moment) => now - moment < 3600_000);
  if (fails.length >= SETGROUP_MAX_FAILS) return "limit";
  if (b.cfg.setupCode && (args || "").trim() === b.cfg.setupCode) {
    if (fails.length) await b.delMeta(key);
    return "ok";
  }
  fails.push(now);
  await b.setMeta(key, JSON.stringify(fails));
  return "wrong";
}

async function statsText(b) {
  const startedRaw = (await b.meta("started_at")) || nowIso();
  const s = tashkentParts(startedRaw);
  let since = b.UZ("STATS_SINCE", { since: `${s.day}.${s.month}.${s.year} ${s.hour}:${s.minute}` });
  const now = new Date();
  const local = new Date(now.getTime() + 5 * 3600_000);
  const dayStart = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - 5 * 3600_000);
  const iso = (d) => d.toISOString().replace(/\.\d{3}Z$/, "+00:00");
  const [totalsRow, kinds, pending, rows] = await Promise.all([
    b.one("SELECT COUNT(*) AS users, SUM(created_at >= ?) AS today, SUM(created_at >= ?) AS week, "
      + "SUM(registered) AS registered FROM users", iso(dayStart), iso(new Date(now.getTime() - 7 * 86400_000))),
    b.all("SELECT kind, COUNT(*) AS n FROM leads GROUP BY kind"),
    b.one("SELECT COUNT(*) AS n FROM outbox"),
    b.all(`SELECT u.source AS source, COUNT(*) AS users, SUM(u.registered) AS registered,
      SUM((SELECT COUNT(*) FROM leads l WHERE l.user_id = u.user_id AND l.kind = 'order')) AS orders,
      SUM((SELECT COUNT(*) FROM leads l WHERE l.user_id = u.user_id AND l.kind IN ('business_talk', 'business_join'))) AS business,
      SUM((SELECT COUNT(*) FROM leads l WHERE l.user_id = u.user_id AND l.kind = 'question')) AS questions
      FROM users u GROUP BY u.source ORDER BY users DESC`),
  ]);
  if (pending && pending.n) since += "\n" + b.UZ("STATS_PENDING", { count: pending.n });
  if (!totalsRow || !totalsRow.users) return `${b.UZ("STATS_EMPTY")}\n${since}`;
  const count = Object.fromEntries(kinds.map((row) => [row.kind, row.n]));
  const totals = {
    users: totalsRow.users, today: totalsRow.today || 0, week: totalsRow.week || 0,
    registered: totalsRow.registered || 0, orders: count.order || 0,
    business: (count.business_talk || 0) + (count.business_join || 0), questions: count.question || 0,
  };
  const lines = rows.map((row) => b.UZ("STATS_LINE", {
    source: esc(row.source || b.UZ("SOURCE_DIRECT")), users: row.users, registered: row.registered || 0,
    orders: row.orders || 0, business: row.business || 0, questions: row.questions || 0,
  }));
  return `${b.UZ("STATS_TOTAL", totals)}\n${since}\n\n<b>${b.UZ("STATS_TITLE")}</b>\n${lines.join("\n")}`;
}

async function canSeeStats(b, message, args) {
  if (message.chat.type !== "private") return message.chat.id === (await b.managers()) && !!(await b.managers());
  if (b.cfg.setupCode && (args || "").trim() === b.cfg.setupCode) return true;
  const group = await b.managers();
  if (!group) return false;
  try {
    const member = await b.api("getChatMember", { chat_id: group, user_id: message.from.id });
    return ["creator", "administrator", "member"].includes(member.status);
  } catch {
    return false;
  }
}

async function sendReminders(b, message) {
  const cursor = JSON.parse((await b.meta("reminder_cursor")) || "null");
  let after = cursor ? cursor.after : 0;
  let sent = cursor ? cursor.sent : 0;
  const total = cursor ? cursor.total : (await b.one("SELECT COUNT(*) AS n FROM users WHERE reminders = 1")).n;
  const rows = await b.all("SELECT user_id, lang FROM users WHERE reminders = 1 AND user_id > ? ORDER BY user_id LIMIT ?",
    after, REMINDER_BATCH);
  const blocked = [];
  let stopped = false;
  const ownLang = b.lang;
  for (const row of rows) {
    b.lang = LANGS.includes(row.lang) ? row.lang : DEFAULT_LANG;  // ҳар бир мижозга ўз тилида
    try {
      await b.send(row.user_id, b.T("REMINDER"), { reply_markup: reminderKeyboard(b) });
      sent += 1;
    } catch (error) {
      if (error instanceof TgError && error.code === 429) { stopped = true; break; }
      if (error instanceof TgError && error.forbidden) blocked.push(row.user_id);  // ботни блоклаган
    }
    after = row.user_id;
  }
  b.lang = ownLang;
  if (blocked.length) {
    await b.run(`UPDATE users SET reminders = 0 WHERE user_id IN (${blocked.map(() => "?").join(",")})`, ...blocked);
  }
  const finished = !stopped && rows.length < REMINDER_BATCH;
  let reply = b.UZ("REMINDERS_SENT", { sent, total });
  if (finished) {
    await b.delMeta("reminder_cursor");
  } else {
    await b.setMeta("reminder_cursor", JSON.stringify({ after, sent, total }));
    reply += "\n" + b.UZ("REMINDERS_SENT_MORE");
  }
  await b.reply(message, reply);
}

function parseCommand(message, botUsername) {
  const found = /^\/([A-Za-z0-9_]{1,32})(?:@([A-Za-z0-9_]+))?(?:\s+([\s\S]*))?$/.exec(message.text || "");
  if (!found) return null;
  if (found[2] && botUsername && found[2].toLowerCase() !== botUsername.toLowerCase()) return null;  // бошқа бот учун
  return { name: found[1].toLowerCase(), args: (found[3] || "").trim() };
}

async function onMessage(b, message) {
  const chat = message.chat;
  const isPrivate = chat.type === "private";
  const user = message.from || {};

  if (message.migrate_to_chat_id) {  // Telegram группани супергруппага айлантирди — ID ўзгарди
    if (chat.id === (await b.managers())) await b.setManagers(message.migrate_to_chat_id);
    return;
  }

  const command = message.text && message.text.startsWith("/") ? parseCommand(message, await b.meta("bot_username")) : null;
  const cmd = command ? command.name : "";

  if (isPrivate && cmd === "start") {
    await b.clearState(chat.id);
    const firstTime = b.storedLang === null;
    const source = command.args && SOURCE_RE.test(command.args) ? command.args : null;
    await b.touchUser(user, source);
    if (firstTime) {  // аввал тил танлаш, остида Telegram тилидаги салом
      await b.setLang(user.id, b.lang);
      await b.send(chat.id, LANG_PICK, { reply_markup: langKeyboard() });
    }
    await b.send(chat.id, b.welcomeText(), { reply_markup: b.mainMenu() });
    return;
  }
  if (isPrivate && (cmd === "lang" || variants("BTN_LANG").has(message.text))) {
    await b.clearState(chat.id);
    await b.send(chat.id, LANG_PICK, { reply_markup: langKeyboard() });
    return;
  }
  if (cmd === "id") {
    await b.reply(message, b.UZ("CHAT_ID", { chat_id: chat.id }));
    return;
  }
  if (cmd === "setgroup") {
    if (isPrivate && !command.args) {
      await b.send(chat.id, b.UZ("SETGROUP_PRIVATE"));
      return;
    }
    const who = user.id || chat.id;
    const result = await checkCode(b, who, command.args);
    if (result !== "ok") {
      const answer = b.UZ(result === "limit" ? "SETGROUP_LIMIT" : "SETGROUP_WRONG");
      await (isPrivate ? b.send(chat.id, answer) : b.reply(message, answer));
      return;
    }
    if (isPrivate) {
      await b.clearState(chat.id);
      await b.setMeta(`setgroup_until:${who}`, Date.now() + SETGROUP_WINDOW);
      await b.send(chat.id, b.UZ("SETGROUP_PICK"), { reply_markup: { keyboard: [[{
        text: b.UZ("SETGROUP_BTN_PICK"),
        request_chat: { request_id: GROUP_REQUEST_ID, chat_is_channel: false, bot_is_member: true, request_title: true },
      }]], resize_keyboard: true, one_time_keyboard: true } });
      return;
    }
    await b.setManagers(chat.id);
    await b.reply(message, b.UZ("SETGROUP_DONE", { chat_id: chat.id }));
    const flushed = await b.flushOutbox();
    if (flushed) await b.send(chat.id, b.UZ("SETGROUP_FLUSHED", { count: flushed }));
    return;
  }
  if (isPrivate && message.chat_shared) {
    const shared = message.chat_shared;
    if (shared.request_id !== GROUP_REQUEST_ID) return;
    const until = Number(await b.meta(`setgroup_until:${user.id}`)) || 0;
    if (until < Date.now()) {
      await b.send(chat.id, b.UZ("SETGROUP_AGAIN"), { reply_markup: b.mainMenu() });
      return;
    }
    let groupId = shared.chat_id;
    const title = esc(shared.title || String(groupId));
    try {
      try {
        await b.send(groupId, b.UZ("SETGROUP_DONE", { chat_id: groupId }));
      } catch (error) {
        if (!(error instanceof TgError && error.migrateTo)) throw error;
        groupId = error.migrateTo;  // группа супергруппага айланган
        await b.send(groupId, b.UZ("SETGROUP_DONE", { chat_id: groupId }));
      }
    } catch (error) {
      console.error("Танланган группага ёзиб бўлмади:", error.message);
      await b.send(chat.id, b.UZ("SETGROUP_CANT_POST", { title }), { reply_markup: b.mainMenu() });
      return;
    }
    await b.delMeta(`setgroup_until:${user.id}`);
    await b.setManagers(groupId);
    const flushed = await b.flushOutbox();
    if (flushed) await b.toManagers((group) => b.send(group, b.UZ("SETGROUP_FLUSHED", { count: flushed })));
    await b.send(chat.id, b.UZ("SETGROUP_LINKED", { title, chat_id: await b.managers() }), { reply_markup: b.mainMenu() });
    return;
  }
  if (cmd === "stats") {
    if (!(await canSeeStats(b, message, command.args))) {
      if (isPrivate) await b.send(chat.id, b.UZ("STATS_PRIVATE_HINT"));
      return;
    }
    await b.send(chat.id, await statsText(b));
    return;
  }
  const group = await b.managers();
  const inManagers = !!group && chat.id === group;
  if (inManagers && cmd === "eslatma") {
    await sendReminders(b, message);
    return;
  }
  if (inManagers && cmd === "reload") {
    try {
      const fresh = await loadProducts(b.cfg, true);
      await b.reply(message, b.UZ("PRODUCTS_RELOADED", { count: fresh.size }));
    } catch (error) {
      await b.reply(message, b.UZ("PRODUCTS_ERROR", { error: esc(error.message) }));
    }
    return;
  }
  if (inManagers && message.reply_to_message) {  // менежер жавоби → мижозга
    const userId = await b.relayUser(message.reply_to_message.message_id);
    if (userId === null) return;
    try {
      await b.api("copyMessage", { chat_id: userId, from_chat_id: chat.id, message_id: message.message_id });
    } catch (error) {
      if (error instanceof TgError && error.forbidden) {
        await b.reply(message, b.UZ("GROUP_USER_BLOCKED"));
        return;
      }
      throw error;
    }
    await b.reply(message, b.UZ("GROUP_REPLY_SENT"));
    return;
  }
  if (!isPrivate) return;

  // Асосий меню тугмалари — ҳар қандай қадамда ишлайди
  const body = message.text;
  if (body !== undefined) {
    if (variants("BTN_PRODUCTS").has(body)) {  // эски клавиатура: янги менюни (каталог тугмаси билан) юборамиз
      await b.clearState(chat.id);
      await b.send(chat.id, b.welcomeText(), { reply_markup: b.mainMenu() });
      return;
    }
    if (variants("BTN_DISCOUNT").has(body)) {
      await b.clearState(chat.id);
      await sendDiscount(b, chat.id);
      return;
    }
    if (variants("BTN_DELIVERY").has(body)) {
      await b.clearState(chat.id);
      await b.send(chat.id, b.T("DELIVERY"));
      return;
    }
    if (variants("BTN_BUSINESS").has(body)) {
      await b.clearState(chat.id);
      await b.send(chat.id, b.T("BUSINESS"), { reply_markup: { inline_keyboard: [
        [{ text: b.T("BTN_BIZ_TALK"), callback_data: "biz_talk" }],
        [{ text: b.T("BTN_BIZ_JOIN"), callback_data: "biz_join" }],
      ] } });
      return;
    }
    if (variants("BTN_CONSULTANT").has(body)) {
      await b.setState(chat.id, "ask");
      await b.send(chat.id, b.T("CONSULTANT_ASK", { hours: b.hoursText() }));
      return;
    }
    if (b.cfg.enableOrders && variants("BTN_ORDER").has(body)) {
      await startOrder(b, chat.id);
      return;
    }
  }

  if (message.web_app_data) {
    await fromCatalog(b, message);
    return;
  }

  const { state, data } = await b.getState(chat.id);
  const phone = message.contact ? message.contact.phone_number
    : body !== undefined && PHONE_RE.test(body) ? body.trim() : null;

  if (state === "reg_phone") {
    if (phone) await b.setPhone(user.id, phone);
    if (phone || (body !== undefined && variants("BTN_SKIP").has(body))) {
      await finishRegistration(b, user);
    } else {
      await b.send(chat.id, b.T("ASK_PHONE_AGAIN"), { reply_markup: b.phoneKeyboard(true) });
    }
    return;
  }
  if (state === "biz") {
    if (body === undefined) {
      await b.send(chat.id, b.T("TEXT_PLEASE"));
      return;
    }
    await b.clearState(chat.id);
    await b.touchUser(user);
    const details = body.slice(0, 1000);
    await b.addLead(user.id, "business_talk", details);
    await b.notifyManagers(user.id, b.UZ("GROUP_BIZ_TALK", { user: await b.describeUser(user), text: esc(details) }));
    await b.send(chat.id, b.T("BIZ_TALK_DONE"), { reply_markup: b.mainMenu() });
    return;
  }
  if (state === "ask") {
    await b.clearState(chat.id);
    await relayQuestion(b, message, data.product || null);
    return;
  }
  if (state === "order_items") {
    if (body === undefined) {
      await b.send(chat.id, b.T("TEXT_PLEASE"));
      return;
    }
    await b.touchUser(user);
    const row = await b.getUser(user.id);
    const next = { ...data, items: body.slice(0, 1000) };
    if (row && row.phone) {
      await b.setState(chat.id, "order_address", next);
      await b.send(chat.id, b.T("ORDER_ASK_ADDRESS"));
    } else {
      await b.setState(chat.id, "order_phone", next);
      await b.send(chat.id, b.T("ORDER_ASK_PHONE"), { reply_markup: b.phoneKeyboard(false) });
    }
    return;
  }
  if (state === "order_phone") {
    if (!phone) {
      await b.send(chat.id, b.T("ASK_PHONE_AGAIN"), { reply_markup: b.phoneKeyboard(false) });
      return;
    }
    await b.touchUser(user);
    await b.setPhone(user.id, phone);
    await b.setState(chat.id, "order_address", data);
    await b.send(chat.id, b.T("ORDER_ASK_ADDRESS"), { reply_markup: b.mainMenu() });
    return;
  }
  if (state === "order_address") {
    if (body === undefined) {
      await b.send(chat.id, b.T("TEXT_PLEASE"));
      return;
    }
    await b.setState(chat.id, "order_payment", { ...data, address: body.slice(0, 500) });
    await b.send(chat.id, b.T("ORDER_ASK_PAYMENT"), { reply_markup: paymentKeyboard(b) });
    return;
  }
  if (state === "order_payment") {
    await b.send(chat.id, b.T("ORDER_ASK_PAYMENT"), { reply_markup: paymentKeyboard(b) });
    return;
  }
  // Бошқа ҳар қандай хабар — консультантга савол
  await relayQuestion(b, message, null);
}

async function fromCatalog(b, message) {
  const chat = message.chat;
  const user = message.from;
  await b.clearState(chat.id);
  await b.touchUser(user);
  let data;
  try {
    data = JSON.parse(message.web_app_data.data);
  } catch {
    return;
  }
  let products = new Map();
  try {
    products = await loadProducts(b.cfg);
  } catch (error) {
    console.error("Каталогни юклаб бўлмади:", error.message);
  }
  if (data.t === "ask") {
    const item = products.get(String(data.id ?? ""));
    const name = item ? String(item.name || "") : "";
    await b.setState(chat.id, "ask", { product: name });
    await b.send(chat.id, name ? b.T("ASK_ABOUT_PRODUCT", { product: esc(name), hours: b.hoursText() })
      : b.T("CONSULTANT_ASK", { hours: b.hoursText() }));
    return;
  }
  if (data.t !== "order") return;
  const lines = [];
  const groupLines = [];
  let total = 0;
  let points = 0;
  for (const entry of (Array.isArray(data.items) ? data.items : []).slice(0, 60)) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const qty = Math.max(1, Math.min(99, Math.trunc(Number(entry[1]))));
    if (!Number.isFinite(qty)) continue;
    const item = products.get(String(entry[0]));
    if (!item || typeof item.price !== "number") continue;
    const lineSum = Math.trunc(item.price) * qty;
    total += lineSum;
    points += Number(item.points || 0) * qty;
    const name = esc(String(item.name || ""));
    lines.push(b.T("APP_ORDER_LINE", { name, qty, sum: money(lineSum) }));
    groupLines.push(b.UZ("APP_ORDER_LINE", { name, qty, sum: money(lineSum) }));
  }
  if (!lines.length) {
    await b.send(chat.id, b.T("APP_ORDER_EMPTY"), { reply_markup: b.mainMenu() });
    return;
  }
  const region = data.r === "region" ? "region" : "tashkent";
  const [freeFrom, fee] = DELIVERY_RULES[region];
  const delivery = total >= freeFrom ? 0 : fee;
  const summary = (L, orderLines) => fmt(L("APP_ORDER_SUMMARY"), {
    lines: orderLines.join("\n"), total: money(total), points: pointsText(points), region: L("REGIONS")[region],
    delivery: delivery ? `${money(delivery)} ${L("CURRENCY")}` : L("APP_DELIVERY_FREE"), grand: money(total + delivery),
  });
  const userT = (key) => b.T(key);
  const uzT = (key) => b.UZ(key);
  await b.send(chat.id, summary(userT, lines));
  if (!b.cfg.enableOrders) {
    await b.notifyManagers(user.id, b.UZ("GROUP_QUESTION", { user: await b.describeUser(user) }) + "\n" + summary(uzT, groupLines));
    await b.addLead(user.id, "question", "каталогдан сават");
    await b.send(chat.id, b.T("QUESTION_SENT"), { reply_markup: b.mainMenu() });
    return;
  }
  const deliveryText = delivery ? `${money(delivery)} ${b.UZ("CURRENCY")}` : b.UZ("APP_DELIVERY_FREE");
  const itemsHtml = groupLines.join("\n") + "\n" + b.UZ("APP_GROUP_TOTAL", {
    grand: money(total + delivery), points: pointsText(points), region: b.UZ("REGIONS")[region], delivery: deliveryText });
  const row = await b.getUser(user.id);
  if (row && row.phone) {
    await b.setState(chat.id, "order_address", { items_html: itemsHtml });
    await b.send(chat.id, b.T("ORDER_ASK_ADDRESS"), { reply_markup: b.mainMenu() });
  } else {
    await b.setState(chat.id, "order_phone", { items_html: itemsHtml });
    await b.send(chat.id, b.T("ORDER_ASK_PHONE"), { reply_markup: b.phoneKeyboard(false) });
  }
}

async function onCallback(b, query) {
  const data = query.data || "";
  const user = query.from;
  const answer = () => b.api("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});

  if (data.startsWith("lang:")) {
    await answer();
    const lang = data.slice(5);
    if (!LANGS.includes(lang)) return;
    await b.clearState(user.id);
    await b.touchUser(user);
    await b.setLang(user.id, lang);
    b.lang = lang;  // шу жавобнинг ўзи ҳам янги тилда
    await b.dropButtons(query);
    await b.send(user.id, `${b.T("LANG_SAVED")}\n\n${b.welcomeText()}`, { reply_markup: b.mainMenu() });
    return;
  }
  if (data === "reg") {
    await answer();
    await sendDiscount(b, user.id);
    return;
  }
  if (data === "registered") {
    await answer();
    await b.touchUser(user);
    const firstTime = await b.setRegistered(user.id);
    await b.setState(user.id, "reg_phone", { first_time: firstTime });
    const stores = [];
    if (b.cfg.appStore) stores.push([{ text: "App Store", url: b.cfg.appStore }]);
    if (b.cfg.googlePlay) stores.push([{ text: "Google Play", url: b.cfg.googlePlay }]);
    await b.send(user.id, b.T("REGISTERED"), stores.length ? { reply_markup: { inline_keyboard: stores } } : {});
    const row = await b.getUser(user.id);
    if (row && row.phone) {
      await finishRegistration(b, user);
    } else {
      await b.send(user.id, b.T("ASK_PHONE"), { reply_markup: b.phoneKeyboard(true) });
    }
    return;
  }
  if (data === "rem:1" || data === "rem:0") {
    await answer();
    const on = data === "rem:1";
    await b.touchUser(user);
    await b.setReminders(user.id, on);
    await b.dropButtons(query);
    await b.send(user.id, b.T(on ? "REMINDERS_ON" : "REMINDERS_OFF"));
    return;
  }
  if (data.startsWith("ask:")) {
    await answer();
    let name = "";
    try {
      const item = (await loadProducts(b.cfg)).get(data.slice(4));
      name = item ? String(item.name || "") : "";
    } catch { /* каталог очилмаса — оддий савол */ }
    await b.setState(user.id, "ask", { product: name });
    await b.send(user.id, name ? b.T("ASK_ABOUT_PRODUCT", { product: esc(name), hours: b.hoursText() })
      : b.T("CONSULTANT_ASK", { hours: b.hoursText() }));
    return;
  }
  if (data === "consult") {
    await answer();
    await b.setState(user.id, "ask");
    await b.send(user.id, b.T("CONSULTANT_ASK", { hours: b.hoursText() }));
    return;
  }
  if (data === "biz_talk") {
    await answer();
    await b.setState(user.id, "biz");
    await b.send(user.id, b.T("BIZ_TALK_ASK"));
    return;
  }
  if (data === "biz_join") {
    await answer();
    await b.touchUser(user);
    await b.addLead(user.id, "business_join");
    if (b.cfg.businessRef) {
      await b.send(user.id, b.T("BIZ_JOIN"), { reply_markup: { inline_keyboard: [
        [{ text: b.T("BTN_BIZ_REGISTER"), url: b.cfg.businessRef }]] } });
    } else {
      await b.send(user.id, b.T("BIZ_JOIN_NO_LINK"));
    }
    await b.notifyManagers(user.id, b.UZ("GROUP_BIZ_JOIN", { user: await b.describeUser(user) }));
    return;
  }
  if (data === "order") {
    await answer();
    if (b.cfg.enableOrders) await startOrder(b, user.id);
    return;
  }
  if (data.startsWith("pay:")) {
    await answer();
    const { state, data: saved } = await b.getState(user.id);
    const method = b.UZ("PAYMENTS")[data.slice(4)];  // группага ўзбекча
    if (state !== "order_payment" || !method) return;
    await b.clearState(user.id);
    await b.touchUser(user);
    const items = saved.items || "";
    const address = saved.address || "";
    await b.addLead(user.id, "order", `${items || "каталогдан"} | ${address} | ${method}`);
    await b.dropButtons(query);
    await b.notifyManagers(user.id, b.UZ("GROUP_ORDER", {
      user: await b.describeUser(user), items: saved.items_html || esc(items),
      address: esc(address), payment: esc(method) }));
    await b.send(user.id, b.T("ORDER_DONE"), { reply_markup: b.mainMenu() });
    return;
  }
  await answer();  // эски тугмалар (масалан, чатдаги каталог) — жим
}

async function onMyChatMember(b, update) {
  const chat = update.chat;
  if (chat.type === "private" || chat.id === (await b.managers())) return;
  const before = update.old_chat_member.status;
  const after = update.new_chat_member.status;
  const member = (status) => ["creator", "administrator", "member", "restricted"].includes(status);
  let say = null;
  if (after === "administrator" && before !== "administrator" && before !== "creator") say = "GROUP_ADMIN_OK";
  else if (!member(before) && member(after)) say = "GROUP_HELLO";
  if (!say) return;
  try {
    await b.send(chat.id, b.UZ(say));
  } catch (error) {
    console.error("Группага ёзиб бўлмади:", error.message);
  }
}

async function handleUpdate(update, env, cfg) {
  const b = new Bot(env, cfg);
  await ensureSchema(b.db);
  const user = (update.message || update.callback_query || update.my_chat_member || {}).from;
  if (user && !user.is_bot) {
    const row = await b.one("SELECT lang FROM users WHERE user_id = ?", user.id);
    b.storedLang = row && row.lang ? row.lang : null;
    b.lang = LANGS.includes(b.storedLang) ? b.storedLang : langFromCode(user.language_code);
  }
  if (update.message) await onMessage(b, update.message);
  else if (update.callback_query) await onCallback(b, update.callback_query);
  else if (update.my_chat_member) await onMyChatMember(b, update.my_chat_member);
}

// --- Созлаш саҳифаси ----------------------------------------------------------

function page(title, inner) {
  return new Response(`<!doctype html><html lang="uz"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
body{margin:0;padding:20px;background:#EEF4F5;color:#0C1618;font:17px/1.5 -apple-system,system-ui,sans-serif}
main{max-width:460px;margin:0 auto;background:#fff;border-radius:18px;padding:22px}
h1{font-size:22px;margin:0 0 12px}ul{padding:0;list-style:none}li{margin:6px 0}
label{display:block;margin-top:14px;font-weight:600}
input{box-sizing:border-box;width:100%;font:inherit;padding:12px;margin-top:6px;border:1px solid #9BB3B8;border-radius:12px}
button{width:100%;margin-top:14px;padding:14px;font:inherit;font-weight:700;color:#fff;background:#0C4A57;border:0;border-radius:14px}
.ok{color:#14682E}.bad{color:#B3261E}small{color:#557}
</style><main>${inner}</main></html>`, { headers: { "content-type": "text/html; charset=utf-8" } });
}

function statusList(env, cfg) {
  const row = (ok, good, bad) => `<li class="${ok ? "ok" : "bad"}">${ok ? "✅" : "❌"} ${ok ? good : bad}</li>`;
  return `<ul>${row(!!cfg.token, "BOT_TOKEN бор", "BOT_TOKEN қўшилмаган (Settings → Variables and Secrets)")}
${row(!!cfg.setupCode, "SETUP_CODE бор", "SETUP_CODE қўшилмаган (Settings → Variables and Secrets)")}
${row(!!env.DB, "D1 база уланган (DB)", "D1 база уланмаган (Settings → Bindings → D1 database, номи DB)")}</ul>`;
}

async function setupPage(request, env, cfg) {
  const ready = cfg.token && cfg.setupCode && env.DB;
  if (request.method !== "POST") {
    return page("Siberian бот", `<h1>Siberian бот</h1>${statusList(env, cfg)}${ready ? `
<form method="post" action="/setup"><label>SETUP_CODE<input name="code" inputmode="numeric" autocomplete="off" required></label>
<button>Ботни улаш</button></form>` : "<p>Аввал қизил белгиланганларни тўғриланг ва саҳифани янгиланг.</p>"}
<p><small>Версия ${esc(VERSION)}</small></p>`);
  }
  if (!ready) return page("Siberian бот", `<h1>Ҳали тайёр эмас</h1>${statusList(env, cfg)}`);
  const form = await request.formData();
  const b = new Bot(env, cfg);
  await ensureSchema(b.db);
  const now = Date.now();
  const fails = JSON.parse((await b.meta("setup_fails")) || "[]").filter((moment) => now - moment < 3600_000);
  if (fails.length >= 10) {
    return page("Кейинроқ", `<h1 class="bad">Кўп марта нотўғри код киритилди</h1><p>Бир соатдан кейин қайта уриниб кўринг.</p>`);
  }
  if (String(form.get("code") || "").trim() !== cfg.setupCode) {
    fails.push(now);
    await b.setMeta("setup_fails", JSON.stringify(fails));
    return page("Код нотўғри", `<h1 class="bad">Код нотўғри</h1><p>SETUP_CODE га ёзган кодингизни киритинг.</p>
<p><a href="/">Орқага</a></p>`);
  }
  try {
    const me = await b.api("getMe");
    const origin = new URL(request.url).origin;
    await b.api("setWebhook", { url: `${origin}/telegram`, secret_token: await webhookSecret(cfg.token),
      allowed_updates: ["message", "callback_query", "my_chat_member"], max_connections: 5 });
    for (const [lang, code] of [["oz", null], ["ru", "ru"], ["uz", "uz"]]) {
      const params = { commands: [{ command: "start", description: text(lang, "CMD_START") },
        { command: "lang", description: text(lang, "CMD_LANG") }], scope: { type: "all_private_chats" } };
      if (code) params.language_code = code;
      await b.api("setMyCommands", params);
    }
    await b.setMeta("bot_username", me.username || "");
    const group = await b.managers();
    return page("Бот уланди", `<h1 class="ok">✅ Бот уланди</h1>
<p>Telegram'да <a href="https://t.me/${esc(me.username)}">@${esc(me.username)}</a> га /start деб ёзинг.</p>
<p>${group ? "Менежерлар группаси уланган." : "Менежерлар группасини улаш: ботга шахсий чатда <b>/setgroup КОД</b> деб ёзиб, группани танланг."}</p>
<p><small>Colab'даги эски ботни бошқа ишга туширманг.</small></p>`);
  } catch (error) {
    const hint = error instanceof TgError && (error.code === 401 || error.code === 404)
      ? "BOT_TOKEN нотўғри: BotFather берган токенни текширинг." : esc(error.message);
    return page("Хато", `<h1 class="bad">Улаб бўлмади</h1><p>${hint}</p><p><a href="/">Орқага</a></p>`);
  }
}

export default {
  async fetch(request, env) {
    const cfg = config(env);
    const url = new URL(request.url);
    if (url.pathname === "/telegram") {
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
      if (!cfg.token || request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== (await webhookSecret(cfg.token))) {
        return new Response("Forbidden", { status: 403 });
      }
      let update;
      try { update = await request.json(); } catch { return new Response("Bad Request", { status: 400 }); }
      try {
        await handleUpdate(update, env, cfg);
      } catch (error) {
        console.error("Хабарни қайта ишлашда хато:", error && error.stack ? error.stack : error);
      }
      return new Response("ok");
    }
    if (url.pathname === "/" || url.pathname === "/setup") return setupPage(request, env, cfg);
    return new Response("Not Found", { status: 404 });
  },
};
