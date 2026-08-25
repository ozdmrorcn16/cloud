/**
 * العربية - Arapca.
 *
 * DIKKAT: bu dil SAGDAN SOLA (RTL) yazilir. `lib/dil.tsx` bu dil
 * secildiginde React Native'in RTL kipini aciyor; duzenin aynalanmasi
 * isletim sistemi tarafindan yapiliyor.
 */
export default {
  ortak: {
    devam: 'متابعة',
    iptal: 'إلغاء',
    kaydet: 'حفظ',
    tekrarDene: 'إعادة المحاولة',
    yukleniyor: 'جارٍ التحميل…',
    birSorunOldu: 'حدث خطأ ما.',
  },

  karsilama: {
    baslikBirinci: 'أنتم في المكان نفسه.',
    baslikIkinci: 'ما رأيك أن تتعارفوا؟',
    aciklama:
      'سجّل حضورك في المكان الذي أنت فيه وشاهد من يوجد هناك الآن. لا تتم مشاركة موقعك إلا أثناء تسجيل حضورك.',
    onayEtiket: 'أوافق على الشروط',
    onayMetni:
      'لقد قرأت إشعار الخصوصية وأوافق على معالجة بياناتي الشخصية وموقعي على النحو الموضح فيه.',
    metniOku: 'قراءة الإشعار',
    hesapOlustur: 'إنشاء حساب',
    hesabinVarMi: 'لديك حساب بالفعل؟',
    girisYap: 'تسجيل الدخول',
    kucukNot: 'يجب أن يكون عمرك 18 عامًا أو أكثر. لا تتم مشاركة موقعك بشكل دائم.',
    hataOnay: 'يجب الموافقة على الشروط للمتابعة.',
  },

  kayit: {
    baslik: 'أنشئ حسابك',
    altYazi: 'سنتحقق من رقمك. لن يظهر في ملفك الشخصي.',
    telefonEtiket: 'رقم الهاتف',
    telefonYerTutucu: '05XX XXX XX XX',
    dilEtiket: 'اللغة',
    yakinda: 'قريبًا',
    sifreEtiket: 'كلمة المرور',
    sifreYerTutucu: '{{adet}} أحرف على الأقل',
    tekrarEtiket: 'أعد إدخال كلمة المرور',
    tekrarYerTutucu: 'اكتب كلمة المرور نفسها مرة أخرى',
    sifrelerFarkli: 'كلمتا المرور غير متطابقتين بعد.',
    onayEtiket: 'أوافق على الشروط',
    onayMetni:
      'لقد قرأت إشعار الخصوصية وأوافق على معالجة بياناتي الشخصية وموقعي على النحو الموضح فيه.',
    metniOku: 'قراءة الإشعار',
    onayNotu:
      'يُستخدم موقعك فقط أثناء تسجيل حضورك ولا تتم مشاركته بشكل دائم. يمكنك سحب هذه الموافقة من الإعدادات.',
    gonder: 'إنشاء حساب',
    gonderiliyor: 'جارٍ الإرسال…',
    zatenHesap: 'لديك حساب بالفعل؟',
    girisYap: 'تسجيل الدخول',
    hataTelefon: 'أدخل رقم هاتف صالحًا.',
    hataSifreKisa: 'يجب ألا تقل كلمة المرور عن {{adet}} أحرف.',
    hataSifreUyusmuyor: 'كلمتا المرور غير متطابقتين. تحقق من الحقلين.',
    hataOnay: 'يجب الموافقة على الشروط للمتابعة.',
  },

  kisiler: {
    baslik: 'البحث عن أشخاص',
    yerTutucu: 'اسم المستخدم أو الاسم',
    enAzIki: 'اكتب حرفين على الأقل.',
    bulunamadi: 'لم يتم العثور على أحد.',
    ipucu: 'ابحث عن شخص تعرفه باسم المستخدم أو الاسم.',
  },

  giris: {
    telefonYerTutucu: 'رقم الهاتف',
    sifreYerTutucu: 'كلمة المرور',
    gonder: 'تسجيل الدخول',
    gonderiliyor: 'جارٍ تسجيل الدخول…',
    kayitOl: 'إنشاء حساب جديد',
    hataTelefon: 'أدخل رقم هاتف صالحًا.',
    hataBos: 'أدخل رقم هاتفك وكلمة المرور.',
  },
} as const
