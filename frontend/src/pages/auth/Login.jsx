import React, { useContext, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import { FiEye, FiEyeOff, FiUser, FiLock, FiInfo, FiChevronDown } from 'react-icons/fi';

const slideshowImages = ['/login1.jpg', '/login2.jpg', '/login3.jpg'];

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.username, data.password);
      Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ',
        text: 'ยินดีต้อนรับเข้าสู่ระบบติดตามการทำงานโครงการยุทธศาสตร์ มรภ.บุรีรัมย์',
        showConfirmButton: false,
        timer: 1500
      });
      navigate('/');
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบล้มเหลว',
        text: err.response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 font-sans antialiased">
      {/* ── LEFT PANEL: Slideshow & University Name ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[56%] relative overflow-hidden bg-slate-900">
        {/* Background Slideshow Images */}
        {slideshowImages.map((img, idx) => (
          <div
            key={img}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentImageIndex ? 'opacity-100 z-0 scale-100' : 'opacity-0 -z-10 scale-105'
            } transform duration-[3000ms]`}
          >
            <img
              src={img}
              alt={`BRU Scenery ${idx + 1}`}
              className="w-full h-full object-cover filter brightness-[0.8] contrast-[1.05]"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        ))}
        
        {/* Soft elegant gradient overlay to ensure readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-900/30" />

        {/* Branding & Presentation Container */}
        <div className="relative z-10 flex flex-col w-full h-full p-12 xl:p-16 justify-between">
          {/* Top prominent University Header */}
          <div className="flex items-center gap-5 xl:gap-6 w-full">
            <img
              src="/logob.png"
              alt="BRU Logo"
              className="w-18 h-18 xl:w-24 xl:h-24 object-contain filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)] shrink-0"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="space-y-1">
              <h3 className="text-3xl xl:text-4xl 2xl:text-[40px] font-black text-white tracking-wide leading-tight drop-shadow-lg">
                มหาวิทยาลัยราชภัฏบุรีรัมย์
              </h3>
              <p className="text-sm xl:text-base text-purple-200/95 font-extrabold uppercase tracking-wider drop-shadow-md">
                Buriram Rajabhat University
              </p>
            </div>
          </div>

          {/* Open Scenic Area (Unobstructed View) */}
          <div className="flex-1" />

          {/* Bottom Bar: Carousel dots */}
          <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/10 w-full">
            <div className="flex gap-2">
              {slideshowImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                    idx === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Form & System Name ── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 bg-white min-h-screen">
        {/* Mobile top header branding */}
        <div className="lg:hidden flex items-center gap-3.5 pb-4 mb-2 border-b border-slate-100">
          <img
            src="/logob.png"
            alt="BRU Logo"
            className="w-11 h-11 object-contain drop-shadow-sm"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-wide leading-tight">
              มหาวิทยาลัยราชภัฏบุรีรัมย์
            </h3>
            <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider mt-0.5">
              Buriram Rajabhat University
            </p>
          </div>
        </div>

        {/* Empty space for top alignment on desktop */}
        <div className="hidden lg:block"></div>

        {/* Center Form Wrapper */}
        <div className="max-w-md w-full mx-auto my-auto py-4 sm:py-8 space-y-5 sm:space-y-6">
          {/* Prominent System Name & Heading (Centered & Responsive) */}
          <div className="space-y-2.5 sm:space-y-3 text-center">
            <div className="space-y-1">
              <h1 className="text-lg sm:text-2xl xl:text-[26px] font-black text-slate-900 tracking-tight leading-tight sm:whitespace-nowrap">
                ระบบติดตามการทำงานโครงการยุทธศาสตร์
              </h1>
              <p className="text-[10px] sm:text-xs font-bold text-primary tracking-wider uppercase sm:whitespace-nowrap">
                BRU Strategic Performance Tracking System
              </p>
            </div>

            <div className="pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-center">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-950 tracking-tight">
                เข้าสู่ระบบ
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Input: Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 tracking-wide">
                รหัสบุคลากรหรือชื่อผู้ใช้
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiUser className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="username@bru.ac.th"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${
                    errors.username 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                      : 'border-slate-200 focus:border-primary focus:ring-primary-light/50'
                  } rounded-xl focus:outline-none focus:ring-4 text-slate-800 placeholder-slate-400 text-sm font-medium transition-all duration-200`}
                  {...register('username', { required: 'กรุณากรอกชื่อผู้ใช้งาน' })}
                />
              </div>
              {errors.username && (
                <span className="text-xs text-red-500 mt-1 block font-semibold flex items-center gap-1">
                  <FiInfo className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.username.message}</span>
                </span>
              )}
            </div>

            {/* Input: Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 tracking-wide">
                  รหัสผ่าน
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiLock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-3 bg-slate-50 border ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                      : 'border-slate-200 focus:border-primary focus:ring-primary-light/50'
                  } rounded-xl focus:outline-none focus:ring-4 text-slate-800 placeholder-slate-400 text-sm font-medium transition-all duration-200`}
                  {...register('password', { required: 'กรุณากรอกรหัสผ่าน' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4 text-slate-500" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs text-red-500 mt-1 block font-semibold flex items-center gap-1">
                  <FiInfo className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.password.message}</span>
                </span>
              )}
            </div>

            {/* Remember & Forget section */}
            <div className="flex items-center justify-between text-xs select-none font-semibold pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-800 transition-colors">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-primary focus:ring-primary/20 w-4 h-4"
                />
                <span>จดจำการใช้งาน</span>
              </label>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-primary font-bold hover:text-primary-dark transition-colors"
              >
                ลืมรหัสผ่าน?
              </a>
            </div>

            {/* Button: Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-light/50 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  <span>กำลังเข้าสู่ระบบ...</span>
                </div>
              ) : (
                <span>เข้าสู่ระบบ</span>
              )}
            </button>

            {/* Collapsible Demo Accounts Toggle */}
            <div className="pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold text-slate-500 hover:text-primary transition-colors cursor-pointer group"
              >
                <span>🔑 {showDemoAccounts ? 'ซ่อนบัญชีทดสอบระบบ' : 'แสดงบัญชีทดสอบระบบ (Demo Accounts)'}</span>
                <FiChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-transform duration-200 ${showDemoAccounts ? 'rotate-180 text-primary' : ''}`} />
              </button>

              {/* Collapsible Demo Accounts Grid */}
              {showDemoAccounts && (
                <div className="mt-2.5 p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2 animate-fadeIn">
                  <div className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
                    คลิกบทบาทที่ต้องการ เพื่อกรอกข้อมูลอัตโนมัติ:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setValue('username', 'admin@bru.ac.th');
                        setValue('password', 'admin1234');
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-violet-50 text-violet-700 font-bold border border-slate-200/90 hover:border-violet-300 shadow-2xs transition-all text-left flex flex-col cursor-pointer"
                    >
                      <span className="text-[9.5px] text-violet-500 uppercase tracking-wider">👑 ผู้ดูแลระบบ</span>
                      <span className="text-[11px] truncate font-medium">admin@bru.ac.th</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('username', 'president@bru.ac.th');
                        setValue('password', 'admin1234');
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-purple-50 text-purple-700 font-bold border border-slate-200/90 hover:border-purple-300 shadow-2xs transition-all text-left flex flex-col cursor-pointer"
                    >
                      <span className="text-[9.5px] text-purple-500 uppercase tracking-wider">🏛️ อธิการบดี</span>
                      <span className="text-[11px] truncate font-medium">president@bru.ac.th</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('username', 'dean@bru.ac.th');
                        setValue('password', 'admin1234');
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold border border-slate-200/90 hover:border-blue-300 shadow-2xs transition-all text-left flex flex-col cursor-pointer"
                    >
                      <span className="text-[9.5px] text-blue-500 uppercase tracking-wider">🏫 คณบดี</span>
                      <span className="text-[11px] truncate font-medium">dean@bru.ac.th</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('username', 'csbru');
                        setValue('password', 'csbru1');
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 font-bold border border-slate-200/90 hover:border-emerald-300 shadow-2xs transition-all text-left flex flex-col cursor-pointer"
                    >
                      <span className="text-[9.5px] text-emerald-500 uppercase tracking-wider">👨‍🏫 อาจารย์ผู้รับผิดชอบ (วิทคอม)</span>
                      <span className="text-[11px] truncate font-medium">csbru / csbru1</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Academic Project Notice & Footer Metadata */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-1">
          <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            ระบบสารสนเทศนี้พัฒนาขึ้นเพื่อประกอบการศึกษาวิจัยและโครงงานทางวิทยาการคอมพิวเตอร์ ภาคเรียนที่ 1 ปีการศึกษา 2569 มหาวิทยาลัยราชภัฏบุรีรัมย์
          </p>
          <div className="text-[9px] text-slate-400 font-medium">
            © {new Date().getFullYear() + 543} มหาวิทยาลัยราชภัฏบุรีรัมย์ • ระบบติดตามการทำงานโครงการยุทธศาสตร์
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
