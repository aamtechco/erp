import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl card p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
            AAM
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">مرحبا بك في منصة المحاسبة الالكترونية لمكتب أبوالمجد عبدالشافى</h1>
            <p className="text-surface-600 text-sm mt-1">ابدأ بتسجيل الدخول للوصول إلى لوحة التحكم.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link to="/login" className="btn-primary justify-center">
            تسجيل الدخول
          </Link>
        </div>

        <p className="text-xs text-surface-900 mt-6">
          <span className="font-bold">ملاحظة:</span> اذا واجهتك أي مشكلة ، لا تتردد في الاتصال بنا للحصول على المساعدة.
           <br /><br />
          <span className="font-bold">واذا كنت عميل جديد يرجى التواصل معنا للتسجيل فى المنصة</span>
        </p>
      </div>
    </div>
  )
}

